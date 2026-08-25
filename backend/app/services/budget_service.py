from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from bson import ObjectId
from fastapi import HTTPException, status
from app.database import db
import pandas as pd
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate

class BudgetService:
    @staticmethod
    def calculate_budget_progress(spent: float, limit_amount: float) -> float:
        if limit_amount <= 0:
            return 0.0
        return round((spent / limit_amount) * 100, 2)

    @staticmethod
    def calculate_budget_status(progress_percentage: float) -> str:
        if progress_percentage <= 60.0:
            return "SAFE"
        elif progress_percentage <= 80.0:
            return "WARNING"
        elif progress_percentage <= 100.0:
            return "ALMOST EXCEEDED"
        else:
            return "OVER BUDGET"

    @classmethod
    async def load_expenses_dataframe(cls, user_id: str) -> pd.DataFrame:
        """
        Queries MongoDB expenses collection for user_id with an optimized projection,
        converting results into a Pandas DataFrame.
        """
        expenses_col = db["expenses"]
        projection = {
            "_id": 0,
            "user_id": 1,
            "amount": 1,
            "category_id": 1,
            "date": 1,
            "description": 1,
            "title": 1  # Fetch title as well for word frequency
        }
        cursor = expenses_col.find({"user_id": user_id}, projection)
        records = await cursor.to_list(None)
        
        if not records:
            return pd.DataFrame(columns=["user_id", "amount", "category", "date", "description", "title"])
            
        # Resolve category names from category_id
        from app.services.category_service import CategoryService
        categories = await CategoryService.get_user_categories(user_id)
        cat_id_to_name = {c["id"]: c["name"] for c in categories}
        
        for r in records:
            cat_id = str(r.get("category_id", ""))
            r["category"] = cat_id_to_name.get(cat_id, "Others")
            if "category_id" in r:
                del r["category_id"]
        
        df = pd.DataFrame(records)
        for col in ["user_id", "amount", "category", "date", "description", "title"]:
            if col not in df.columns:
                df[col] = None
        return df

    @classmethod
    def prepare_dataframe(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocesses the dataframe by ensuring proper datatypes and extracting
        date components (day_name, hour, month, year, weekday).
        """
        if df.empty:
            for col in ["day_name", "hour", "month", "year", "weekday"]:
                if col not in df.columns:
                    df[col] = pd.Series(dtype='object')
            return df
        
        # Convert date to datetime. Motor may return tz-aware UTC datetimes.
        # We must tz_convert to UTC first, then strip the timezone — NOT tz_localize(None)
        # directly (which would silently drop tz without converting and give wrong values).
        parsed_dates = pd.to_datetime(df["date"])
        if parsed_dates.dt.tz is not None:
            # tz-aware: convert to UTC then strip timezone info
            df["date"] = parsed_dates.dt.tz_convert("UTC").dt.tz_localize(None)
        else:
            # tz-naive: already UTC (Motor < 3.x behavior), no conversion needed
            df["date"] = parsed_dates
        
        # Extract features
        df["day_name"] = df["date"].dt.day_name()
        df["hour"] = df["date"].dt.hour
        df["month"] = df["date"].dt.month
        df["year"] = df["date"].dt.year
        df["weekday"] = df["date"].dt.weekday
        
        # Coerce amount to numeric
        df["amount"] = pd.to_numeric(df["amount"], errors='coerce').fillna(0.0)
        
        return df

    @classmethod
    async def create_budget(cls, user_id: str, budget_data: BudgetCreate) -> Dict[str, Any]:
        # Check for existing budget for user/category/month/year
        existing = await db["budgets"].find_one({
            "user_id": user_id,
            "category": budget_data.category,
            "month": budget_data.month,
            "year": budget_data.year,
            "is_archived": {"$ne": True}
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Budget for category '{budget_data.category}' already exists for {budget_data.month}/{budget_data.year}"
            )
        
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "category": budget_data.category,
            "month": budget_data.month,
            "year": budget_data.year,
            "limit_amount": budget_data.limit_amount,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        result = await db["budgets"].insert_one(doc)
        doc["_id"] = result.inserted_id
        return doc

    @classmethod
    async def get_budget_by_id(cls, user_id: str, budget_id: str) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(budget_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid budget ID format"
            )
            
        budget = await db["budgets"].find_one({"_id": obj_id, "user_id": user_id, "is_archived": {"$ne": True}})
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        # Calculate progress
        df = await cls.load_expenses_dataframe(user_id)
        df = cls.prepare_dataframe(df)
        
        category = budget["category"]
        month = budget["month"]
        year = budget["year"]
        limit_amount = float(budget["limit_amount"])
        
        spent = 0.0
        if not df.empty:
            mask = (df["month"] == month) & (df["year"] == year) & (df["category"].str.lower() == category.lower())
            spent = float(df.loc[mask, "amount"].sum())
            
        progress = cls.calculate_budget_progress(spent, limit_amount)
        status_label = cls.calculate_budget_status(progress)
        
        return {
            "id": str(budget["_id"]),
            "category": category,
            "month": month,
            "year": year,
            "limit_amount": limit_amount,
            "spent_amount": spent,
            "remaining_amount": max(0.0, limit_amount - spent),
            "progress_percentage": progress,
            "status": status_label
        }

    @classmethod
    async def get_budgets_for_month(cls, user_id: str, month: int, year: int) -> List[Dict[str, Any]]:
        cursor = db["budgets"].find({
            "user_id": user_id,
            "month": month,
            "year": year,
            "category": {"$exists": True},
            "is_archived": {"$ne": True}
        })
        budgets = await cursor.to_list(None)
        
        df = await cls.load_expenses_dataframe(user_id)
        df = cls.prepare_dataframe(df)
        
        results = []
        for b in budgets:
            category = b["category"]
            limit_amount = float(b["limit_amount"])
            
            spent = 0.0
            if not df.empty:
                mask = (df["month"] == month) & (df["year"] == year) & (df["category"].str.lower() == category.lower())
                spent = float(df.loc[mask, "amount"].sum())
                
            progress = cls.calculate_budget_progress(spent, limit_amount)
            status_label = cls.calculate_budget_status(progress)
            
            results.append({
                "id": str(b["_id"]),
                "category": category,
                "month": month,
                "year": year,
                "limit_amount": limit_amount,
                "spent_amount": spent,
                "remaining_amount": max(0.0, limit_amount - spent),
                "progress_percentage": progress,
                "status": status_label
            })
            
        return results

    @classmethod
    async def update_budget(cls, user_id: str, budget_id: str, budget_data: BudgetUpdate) -> Dict[str, Any]:
        try:
            obj_id = ObjectId(budget_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid budget ID format"
            )
            
        existing = await db["budgets"].find_one({"_id": obj_id, "user_id": user_id, "is_archived": {"$ne": True}})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        
        update_fields = {}
        if budget_data.limit_amount is not None:
            update_fields["limit_amount"] = budget_data.limit_amount
        # Support legacy updates if target was overall monthly budget
        elif budget_data.monthly_budget is not None:
            update_fields["monthly_budget"] = budget_data.monthly_budget
            
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No field provided for update"
            )
            
        update_fields["updated_at"] = datetime.now(timezone.utc)
        
        await db["budgets"].update_one(
            {"_id": obj_id},
            {"$set": update_fields}
        )
        
        return await cls.get_budget_by_id(user_id, budget_id)

    @classmethod
    async def delete_budget(cls, user_id: str, budget_id: str) -> bool:
        try:
            obj_id = ObjectId(budget_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid budget ID format"
            )
            
        result = await db["budgets"].delete_one({"_id": obj_id, "user_id": user_id})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found"
            )
        return True

    @classmethod
    async def get_budget_alerts(cls, user_id: str) -> List[Dict[str, Any]]:
        now = datetime.now(timezone.utc)
        month = now.month
        year = now.year
        
        budgets = await cls.get_budgets_for_month(user_id, month, year)
        alerts = []
        for b in budgets:
            pct = b["progress_percentage"]
            if pct > 60.0:
                alerts.append({
                    "category": b["category"],
                    "used_percentage": pct,
                    "remaining": b["remaining_amount"],
                    "status": "over" if pct > 100.0 else "warning"
                })
        return alerts

    @classmethod
    async def get_budget_summary(cls, user_id: str, month: int, year: int) -> Dict[str, Any]:
        # Fetch legacy overall budget first
        overall = await db["budgets"].find_one({
            "user_id": user_id,
            "month": month,
            "year": year,
            "monthly_budget": {"$exists": True},
            "is_archived": {"$ne": True}
        })
        
        cat_budgets = await cls.get_budgets_for_month(user_id, month, year)
        
        if overall:
            total_budget = float(overall["monthly_budget"])
        else:
            total_budget = sum(b["limit_amount"] for b in cat_budgets)
            
        df = await cls.load_expenses_dataframe(user_id)
        df = cls.prepare_dataframe(df)
        
        total_spent = 0.0
        if not df.empty:
            mask = (df["month"] == month) & (df["year"] == year)
            total_spent = float(df.loc[mask, "amount"].sum())
            
        remaining = max(0.0, total_budget - total_spent)
        utilization = cls.calculate_budget_progress(total_spent, total_budget)
        status_label = cls.calculate_budget_status(utilization)
        
        # Count warning and over budgets for the dashboard integration
        alert_count = sum(1 for b in cat_budgets if b["progress_percentage"] > 80.0)
        
        return {
            "total_budget": total_budget,
            "total_spent": total_spent,
            "remaining": remaining,
            "utilization_percentage": utilization,
            "status": status_label,
            "alert_count": alert_count
        }
