from datetime import datetime, timezone, timedelta
from typing import Optional
from app.database import db

def parse_date(date_str: str, is_end: bool = False) -> datetime:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if is_end:
            return dt.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc)
        else:
            return dt.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
    except ValueError:
        # Fallback if standard format doesn't match
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.astimezone(timezone.utc)

async def get_analytics_trends(
    user_id: str,
    range_opt: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    expenses_col = db["expenses"]
    now = datetime.now(timezone.utc)
    
    # Define start/end dates for current and previous period based on range_opt
    if range_opt == "7d":
        end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start_dt = (end_dt - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_opt == "30d":
        end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start_dt = (end_dt - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_opt == "90d":
        end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start_dt = (end_dt - timedelta(days=89)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_opt == "custom" or (start_date and end_date):
        start_dt = parse_date(start_date, is_end=False)
        end_dt = parse_date(end_date, is_end=True)
    else:
        # Default preset: 30d
        end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        start_dt = (end_dt - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)

    duration_days = (end_dt - start_dt).days + 1
    if duration_days <= 0:
        duration_days = 1
        
    prev_start_dt = start_dt - timedelta(days=duration_days)
    prev_end_dt = start_dt - timedelta(microseconds=1)
    
    # Query database from min(prev_start_dt, now - 60 days) to end_dt
    query_start = min(prev_start_dt, now - timedelta(days=60))
    
    cursor = expenses_col.find({
        "user_id": user_id,
        "date": {"$gte": query_start, "$lte": end_dt}
    })
    expenses = await cursor.to_list(length=10000)
    
    # Normalize e["date"] to be timezone-aware (UTC) to prevent naive vs aware comparison issues
    for e in expenses:
        if isinstance(e.get("date"), datetime):
            if e["date"].tzinfo is None:
                e["date"] = e["date"].replace(tzinfo=timezone.utc)
            else:
                e["date"] = e["date"].astimezone(timezone.utc)
                
    # Calculate Total Spent, count, daily average in selected range
    current_expenses = [e for e in expenses if start_dt <= e["date"] <= end_dt]
    total_spent = sum(e["amount"] for e in current_expenses)
    expense_count = len(current_expenses)
    average_daily_spend = total_spent / duration_days
    
    # WoW Calculations
    wow_curr_start = now - timedelta(days=7)
    wow_prev_start = now - timedelta(days=14)
    
    wow_curr_spend = sum(e["amount"] for e in expenses if wow_curr_start <= e["date"] <= now)
    wow_prev_spend = sum(e["amount"] for e in expenses if wow_prev_start <= e["date"] < wow_curr_start)
    
    if wow_prev_spend > 0:
        week_over_week = ((wow_curr_spend - wow_prev_spend) / wow_prev_spend) * 100
    else:
        week_over_week = 0.0
        
    # MoM Calculations
    mom_curr_start = now - timedelta(days=30)
    mom_prev_start = now - timedelta(days=60)
    
    mom_curr_spend = sum(e["amount"] for e in expenses if mom_curr_start <= e["date"] <= now)
    mom_prev_spend = sum(e["amount"] for e in expenses if mom_prev_start <= e["date"] < mom_curr_start)
    
    if mom_prev_spend > 0:
        month_over_month = ((mom_curr_spend - mom_prev_spend) / mom_prev_spend) * 100
    else:
        month_over_month = 0.0
        
    # Build Trend Chart Points
    current_day_totals = {}
    current_day_counts = {}
    for e in current_expenses:
        d_str = e["date"].strftime("%Y-%m-%d")
        current_day_totals[d_str] = current_day_totals.get(d_str, 0.0) + e["amount"]
        current_day_counts[d_str] = current_day_counts.get(d_str, 0) + 1
        
    prev_expenses = [e for e in expenses if prev_start_dt <= e["date"] <= prev_end_dt]
    prev_day_totals = {}
    for e in prev_expenses:
        d_str = e["date"].strftime("%Y-%m-%d")
        prev_day_totals[d_str] = prev_day_totals.get(d_str, 0.0) + e["amount"]
        
    trend_chart = []
    for i in range(duration_days):
        current_day = start_dt + timedelta(days=i)
        previous_day = prev_start_dt + timedelta(days=i)
        
        current_day_str = current_day.strftime("%Y-%m-%d")
        previous_day_str = previous_day.strftime("%Y-%m-%d")
        
        trend_chart.append({
            "date": current_day_str,
            "current_period": round(current_day_totals.get(current_day_str, 0.0), 2),
            "previous_period": round(prev_day_totals.get(previous_day_str, 0.0), 2),
            "expense_count": current_day_counts.get(current_day_str, 0)
        })
        
    # Category breakdown for selected range
    from app.services.category_service import CategoryService
    categories = await CategoryService.get_user_categories(user_id)
    cat_id_to_name = {c["id"]: c["name"] for c in categories}

    category_totals = {}
    for e in current_expenses:
        cat_id = str(e.get("category_id", ""))
        cat_name = cat_id_to_name.get(cat_id, "Others")
        category_totals[cat_name] = category_totals.get(cat_name, 0.0) + e["amount"]

    category_breakdown = []
    if total_spent > 0:
        for cat, amt in category_totals.items():
            pct = (amt / total_spent) * 100
            category_breakdown.append({
                "category": cat,
                "total": round(amt, 2),
                "percentage": round(pct, 2)
            })
        category_breakdown.sort(key=lambda x: x["total"], reverse=True)

    return {
        "total_spent": round(total_spent, 2),
        "average_daily_spend": round(average_daily_spend, 2),
        "week_over_week": round(week_over_week, 2),
        "month_over_month": round(month_over_month, 2),
        "trend_chart": trend_chart,
        "category_breakdown": category_breakdown
    }
