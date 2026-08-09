import pandas as pd
from typing import List, Dict, Any
from app.database import db

class PandasAnalyticsService:
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
    def get_category_heatmap(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Generates a pivot table representing the total spending for each day_name vs hour.
        Enforces all 7 days and 24 hours to exist with a fill value of 0.
        """
        if df.empty:
            return []
        
        # Generate pivot table
        heatmap = df.pivot_table(
            index="day_name",
            columns="hour",
            values="amount",
            aggfunc="sum",
            fill_value=0
        )
        
        # Enforce day_name row order and hour column order
        days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        hours_order = list(range(24))
        
        heatmap = heatmap.reindex(index=days_order, columns=hours_order, fill_value=0)
        return heatmap.reset_index().to_dict("records")

    @classmethod
    def get_running_balance(cls, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Sorts the DataFrame by date ascending, computes the cumulative sum of amounts,
        and returns list of records with keys: date, amount, running_balance.
        """
        if df.empty:
            return []
        
        # Sort by date ascending
        df_sorted = df.sort_values(by="date", ascending=True).copy()
        
        # Compute cumulative sum
        df_sorted["running_balance"] = df_sorted["amount"].cumsum()
        
        # Format date back to standard string format
        df_sorted["date"] = df_sorted["date"].dt.strftime("%Y-%m-%d")
        
        result_df = df_sorted[["date", "amount", "running_balance"]]
        return result_df.to_dict("records")

    @classmethod
    def get_ai_summary_dataframe(cls, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Computes structured pandas summaries suitable for feeding into future AI/LangGraph modules.
        """
        if df.empty:
            return {
                "monthly_totals": [],
                "top_categories": [],
                "spending_patterns": [],
                "average_spend": 0.0
            }
        
        monthly_totals = df.groupby(["year", "month"])["amount"].sum().reset_index()
        monthly_totals = monthly_totals.sort_values(by=["year", "month"])
        
        top_categories = df.groupby("category")["amount"].sum().reset_index()
        top_categories = top_categories.sort_values(by="amount", ascending=False)
        
        spending_patterns = df.groupby("day_name")["amount"].agg(["sum", "mean", "count"]).reset_index()
        weekday_map = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        spending_patterns["weekday_num"] = spending_patterns["day_name"].map(weekday_map)
        spending_patterns = spending_patterns.sort_values(by="weekday_num").drop(columns=["weekday_num"])
        
        average_spend = float(df["amount"].mean())
        
        return {
            "monthly_totals": monthly_totals.to_dict("records"),
            "top_categories": top_categories.to_dict("records"),
            "spending_patterns": spending_patterns.to_dict("records"),
            "average_spend": round(average_spend, 2)
        }
