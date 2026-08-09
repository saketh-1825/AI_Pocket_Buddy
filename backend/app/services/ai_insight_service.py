from datetime import datetime, timezone, timedelta
import logging
import sys
import pandas as pd
from app.database import db

logger = logging.getLogger(__name__)

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii'))
        except Exception:
            print(text.replace("✓", "[Done]").replace("✗", "[Fail]"))

class AIInsightService:
    @classmethod
    async def get_ai_summary(cls, user_id: str) -> dict:
        """
        Dynamically analyzes user expenses and budgets to output safe, high-fidelity AI summaries.
        """
        try:
            # 1. Load expenses safely
            expenses_cursor = db["expenses"].find({"user_id": user_id})
            expenses = await expenses_cursor.to_list(None)
            
            if not expenses:
                safe_print("✓ Expenses loaded")
                safe_print("✓ Categories analysed")
                safe_print("✓ Budget analysis completed")
                safe_print("✓ AI Summary generated")
                return {
                    "top_spending_day": None,
                    "top_category": None,
                    "overspending_detected": False,
                    "recommended_saving": 0,
                    "message": "No expenses found."
                }
            
            safe_print("✓ Expenses loaded")
            
            # 2. Category calculations
            category_totals = {}
            for exp in expenses:
                cat = exp.get("category", "Others")
                if not cat:
                    cat = "Others"
                try:
                    amt = float(exp.get("amount", 0.0))
                except (TypeError, ValueError):
                    amt = 0.0
                category_totals[cat] = category_totals.get(cat, 0.0) + amt
                
            if category_totals:
                top_category = max(category_totals, key=category_totals.get)
            else:
                top_category = "Others"
                
            safe_print("✓ Categories analysed")
            
            # 3. Spending day calculation
            day_totals = {}
            for exp in expenses:
                dt_val = exp.get("date")
                if not dt_val:
                    continue
                day_name = None
                if isinstance(dt_val, datetime):
                    day_name = dt_val.strftime("%A")
                elif isinstance(dt_val, str):
                    try:
                        dt = pd.to_datetime(dt_val)
                        day_name = dt.strftime("%A")
                    except Exception:
                        pass
                if day_name:
                    try:
                        amt = float(exp.get("amount", 0.0))
                    except (TypeError, ValueError):
                        amt = 0.0
                    day_totals[day_name] = day_totals.get(day_name, 0.0) + amt
                    
            top_spending_day = max(day_totals, key=day_totals.get) if day_totals else None
            
            # Prepare parsed expenses for budget matching (month/year/category)
            parsed_expenses = []
            for exp in expenses:
                dt_val = exp.get("date")
                if not dt_val:
                    continue
                dt = None
                if isinstance(dt_val, datetime):
                    dt = dt_val
                elif isinstance(dt_val, str):
                    try:
                        dt = pd.to_datetime(dt_val).to_pydatetime()
                    except Exception:
                        pass
                if dt:
                    parsed_expenses.append({
                        "category": exp.get("category", "Others") or "Others",
                        "amount": float(exp.get("amount", 0.0)),
                        "month": dt.month,
                        "year": dt.year
                    })
            
            # 4. Overspending Detection
            budgets_cursor = db["budgets"].find({
                "user_id": user_id
            })
            all_budgets = await budgets_cursor.to_list(None)
            
            category_budgets = [b for b in all_budgets if b.get("category") is not None]
            overall_budgets = [b for b in all_budgets if b.get("monthly_budget") is not None]
            
            overspending_detected = False
            recommended_saving = 0.0
            overspent_category = None
            overspent_diff = 0.0
            
            for b in category_budgets:
                cat = b.get("category")
                limit = float(b.get("limit_amount", 0.0))
                b_month = b.get("month")
                b_year = b.get("year")
                
                # Sum expenses for this specific category and month/year
                actual = sum(
                    exp["amount"]
                    for exp in parsed_expenses
                    if exp["category"].lower() == cat.lower() and exp["month"] == b_month and exp["year"] == b_year
                )
                
                if actual > limit:
                    overspending_detected = True
                    diff = actual - limit
                    if diff > overspent_diff:
                        overspent_diff = diff
                        overspent_category = cat
                    recommended_saving += diff

            for ob in overall_budgets:
                limit = float(ob.get("monthly_budget", 0.0))
                b_month = ob.get("month")
                b_year = ob.get("year")
                
                # Sum all expenses for this month/year
                actual = sum(
                    exp["amount"]
                    for exp in parsed_expenses
                    if exp["month"] == b_month and exp["year"] == b_year
                )
                
                if actual > limit:
                    overspending_detected = True
                    diff = actual - limit
                    if diff > overspent_diff:
                        overspent_diff = diff
                        overspent_category = "Overall Monthly"
                    recommended_saving += diff
            
            safe_print("✓ Budget analysis completed")
            
            # 6. Friendly AI Message
            if not all_budgets:
                message = "You haven't created budgets yet. Set budgets to unlock AI savings recommendations."
            elif overspending_detected:
                if overspent_category == "Overall Monthly":
                    message = "You've exceeded your overall monthly budget."
                else:
                    overspent_cat = overspent_category or top_category
                    message = f"You've exceeded your {overspent_cat} budget."
            else:
                message = "Great job! You are within your budget and saving consistently."

                
            safe_print("✓ AI Summary generated")
            
            return {
                "top_spending_day": top_spending_day,
                "top_category": top_category,
                "overspending_detected": overspending_detected,
                "recommended_saving": int(recommended_saving),
                "message": message
            }
            
        except Exception as e:
            logger.exception(e)
            safe_print(f"✗ AI Summary failed:\n{str(e)}")
            return {
                "top_spending_day": None,
                "top_category": None,
                "overspending_detected": False,
                "recommended_saving": 0,
                "message": "Unable to generate AI summary."
            }
