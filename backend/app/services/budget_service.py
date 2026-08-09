from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from bson import ObjectId
from fastapi import HTTPException, status
from app.utils.database import db
from app.services.pandas_service import PandasAnalyticsService
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
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
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
        
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
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
            
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
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
