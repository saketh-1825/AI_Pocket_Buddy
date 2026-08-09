import re
import pandas as pd
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from collections import Counter
from app.database import db
from app.services.pandas_service import PandasAnalyticsService

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
    "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
    "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
    "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
    "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
    "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't",
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
    "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "payment", "paid", "spent", "for", "to", "from", "at", "on", "the", "in", "of", "and"
}

import sys
from fastapi import HTTPException

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii'))
        except Exception:
            print(text.replace("✓", "[Done]").replace("✗", "[Fail]"))

class InsightService:
    @classmethod
    async def get_calendar_heatmap(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Generates a 365-day calendar heatmap.
        Creates a full date range scaffold and merges actual daily spending.
        Computes spending intensity (0-4) using quantile-based pd.qcut on non-zero amounts.
        """
        # Load and prepare data
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
        # Define 365 days date range
        today = datetime.now(timezone.utc).date()
        start_date = today - timedelta(days=364)
        date_range = pd.date_range(start=start_date, end=today, freq="D")
        
        scaffold_df = pd.DataFrame({"date": date_range})
        
        if df.empty:
            scaffold_df["amount"] = 0.0
            scaffold_df["intensity"] = 0
            scaffold_df["date"] = scaffold_df["date"].dt.strftime("%Y-%m-%d")
            return scaffold_df.to_dict("records")
            
        # Sum spending per day
        df["date_only"] = df["date"].dt.date
        daily_spend = df.groupby("date_only")["amount"].sum().reset_index()
        daily_spend.columns = ["date", "amount"]
        daily_spend["date"] = pd.to_datetime(daily_spend["date"])
        
        # Merge scaffold with daily spend
        merged_df = pd.merge(scaffold_df, daily_spend, on="date", how="left")
        merged_df["amount"] = merged_df["amount"].fillna(0.0)
        merged_df["intensity"] = 0
        
        # Calculate intensities for non-zero spending days using pd.qcut
        non_zero_mask = merged_df["amount"] > 0
        non_zero_amounts = merged_df.loc[non_zero_mask, "amount"]
        
        if not non_zero_amounts.empty:
            try:
                # Bin non-zero amounts into 4 categories: 1 (low), 2 (medium), 3 (high), 4 (highest)
                intensities = pd.qcut(non_zero_amounts, q=4, labels=[1, 2, 3, 4], duplicates='drop')
                merged_df.loc[non_zero_mask, "intensity"] = intensities.astype(int)
            except ValueError:
                # Fallback if there are too few unique non-zero values to perform qcut directly
                # Rank non-zero amounts first to break ties, then perform qcut on the ranks
                try:
                    ranks = non_zero_amounts.rank(method='first')
                    intensities = pd.qcut(ranks, q=4, labels=[1, 2, 3, 4], duplicates='drop')
                    merged_df.loc[non_zero_mask, "intensity"] = intensities.astype(int)
                except ValueError:
                    merged_df.loc[non_zero_mask, "intensity"] = 1
                
        # Format date column as string for JSON serialization
        merged_df["date"] = merged_df["date"].dt.strftime("%Y-%m-%d")
        
        return merged_df[["date", "amount", "intensity"]].to_dict("records")

    @classmethod
    async def get_budget_vs_actual(cls, user_id: str, month: int, year: int) -> List[Dict[str, Any]]:
        """
        Retrieves user's category budgets and actual current month expenditures.
        Computes remaining amounts, percentage used, and alert status.
        """
        try:
            # Query ONLY category budgets for this user, month, and year
            budgets_cursor = db["budgets"].find({
                "user_id": user_id,
                "category": {"$exists": True},
                "month": month,
                "year": year
            })
            budgets = await budgets_cursor.to_list(None)
            
            # Filter Category Budgets
            category_budgets = [
                b
                for b in budgets
                if b.get("category")
            ]
            safe_print("✓ Retrieved category budgets")
            
            # Load and prepare expenses dataframe for actual spending calculation
            df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
            df = PandasAnalyticsService.prepare_dataframe(df)
            
            items = []
            for budget in category_budgets:
                category = budget.get("category")
                limit_amount = float(budget.get("limit_amount", 0.0))
                
                # Compute actual spent using the prepared expenses dataframe
                actual_spent = 0.0
                if not df.empty:
                    mask = (df["month"] == month) & (df["year"] == year) & (df["category"].str.lower() == category.lower())
                    actual_spent = float(df.loc[mask, "amount"].sum())
                    
                # Calculations
                remaining = max(0.0, limit_amount - actual_spent)
                percentage_used = round((actual_spent / limit_amount) * 100) if limit_amount > 0 else 0
                
                # Status logic
                if percentage_used <= 60:
                    status = "SAFE"
                elif percentage_used <= 80:
                    status = "WARNING"
                elif percentage_used <= 100:
                    status = "ALMOST EXCEEDED"
                else:
                    status = "OVER BUDGET"
                    
                items.append({
                    "category": category,
                    "budget": limit_amount,
                    "actual": actual_spent,
                    "remaining": remaining,
                    "percentage_used": percentage_used,
                    "status": status
                })
                
            safe_print("✓ Calculated actual expenses")
            safe_print("✓ Budget vs Actual generated successfully")
            return items
            
        except Exception as e:
            safe_print(f"✗ Budget vs Actual failed:\n{str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Budget vs Actual error: {str(e)}"
            )

    @classmethod
    async def get_word_cloud(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Tokenizes and counts word frequencies inside titles and descriptions of user expenses.
        Removes punctuation, stopwords, and numbers. Returns the top 20 words.
        """
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        
        if df.empty:
            return []
            
        words_list = []
        for field in ["title", "description"]:
            if field in df.columns:
                for val in df[field].dropna().astype(str):
                    # Clean symbols and lowercase
                    val_clean = re.sub(r"[^\w\s]", "", val.lower())
                    words = val_clean.split()
                    # Filter out stopwords, short strings, and numeric strings
                    filtered = [w for w in words if w not in STOPWORDS and not w.isdigit() and len(w) > 1]
                    words_list.extend(filtered)
                    
        counter = Counter(words_list)
        top_20 = counter.most_common(20)
        
        return [{"text": word, "value": count} for word, count in top_20]

    @classmethod
    async def get_weekly_comparison(cls, user_id: str) -> Dict[str, Any]:
        """
        Compares total spending of the current calendar week (Monday to Sunday)
        vs. the previous calendar week.
        """
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
        today = datetime.utcnow()
        # Monday of current week
        current_week_start = (today - timedelta(days=today.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        # Monday of last week
        last_week_start = current_week_start - timedelta(days=7)
        # End of last week (Sunday 23:59:59)
        last_week_end = current_week_start - timedelta(microseconds=1)
        
        if df.empty:
            return {
                "this_week": 0.0,
                "last_week": 0.0,
                "percentage_change": 0.0,
                "difference": 0.0,
                "trend": "stable"
            }
            
        # Filter this week
        df_this_week = df[(df["date"] >= current_week_start) & (df["date"] <= today)]
        this_week_sum = float(df_this_week["amount"].sum())
        
        # Filter last week
        df_last_week = df[(df["date"] >= last_week_start) & (df["date"] <= last_week_end)]
        last_week_sum = float(df_last_week["amount"].sum())
        
        if last_week_sum == 0.0:
            percentage_change = 0.0
        else:
            percentage_change = round(((this_week_sum - last_week_sum) / last_week_sum) * 100, 2)
            
        difference = round(this_week_sum - last_week_sum, 2)
        
        if difference > 0:
            trend = "up"
        elif difference < 0:
            trend = "down"
        else:
            trend = "stable"
            
        return {
            "this_week": round(this_week_sum, 2),
            "last_week": round(last_week_sum, 2),
            "percentage_change": percentage_change,
            "difference": difference,
            "trend": trend
        }

    @classmethod
    async def get_spending_pattern(cls, user_id: str) -> Dict[str, Any]:
        """
        Calculates user spending habits:
        - most_active_day: day of week with the most transactions
        - most_active_hour: hour of day with the most transactions
        - average_transaction: average transaction size
        - favorite_category: category with the largest total sum spent
        """
        df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
        df = PandasAnalyticsService.prepare_dataframe(df)
        
        if df.empty:
            return {
                "most_active_day": "N/A",
                "most_active_hour": 0,
                "average_transaction": 0.0,
                "favorite_category": "N/A"
            }
            
        # most_active_day
        most_active_day = df["day_name"].mode()
        most_active_day_str = most_active_day.iloc[0] if not most_active_day.empty else "N/A"
        
        # most_active_hour
        most_active_hour = df["hour"].mode()
        most_active_hour_int = int(most_active_hour.iloc[0]) if not most_active_hour.empty else 0
        
        # average_transaction
        avg_transaction = float(df["amount"].mean())
        
        # favorite_category (highest spending category)
        cat_sums = df.groupby("category")["amount"].sum()
        if not cat_sums.empty:
            favorite_category_str = cat_sums.idxmax()
        else:
            favorite_category_str = "N/A"
            
        return {
            "most_active_day": most_active_day_str,
            "most_active_hour": most_active_hour_int,
            "average_transaction": round(avg_transaction, 2),
            "favorite_category": favorite_category_str
        }
