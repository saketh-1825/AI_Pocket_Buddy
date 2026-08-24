from datetime import datetime, timezone, timedelta
from typing import Optional
from app.database import db
from app.services.category_service import CategoryService

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
    
    wow_curr_start = now - timedelta(days=7)
    wow_prev_start = now - timedelta(days=14)
    mom_curr_start = now - timedelta(days=30)
    mom_prev_start = now - timedelta(days=60)
    
    query_start = min(prev_start_dt, mom_prev_start)
    query_end = max(end_dt, now)
    
    pipeline = [
        {"$match": {
            "user_id": user_id,
            "date": {"$gte": query_start, "$lte": query_end}
        }},
        {"$facet": {
            "current_range": [
                {"$match": {"date": {"$gte": start_dt, "$lte": end_dt}}},
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }}
            ],
            "previous_range": [
                {"$match": {"date": {"$gte": prev_start_dt, "$lte": prev_end_dt}}},
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                    "total": {"$sum": "$amount"}
                }}
            ],
            "category_totals": [
                {"$match": {"date": {"$gte": start_dt, "$lte": end_dt}}},
                {"$group": {
                    "_id": "$category_id",
                    "total": {"$sum": "$amount"}
                }}
            ],
            "wow_curr": [
                {"$match": {"date": {"$gte": wow_curr_start, "$lte": now}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ],
            "wow_prev": [
                {"$match": {"date": {"$gte": wow_prev_start, "$lt": wow_curr_start}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ],
            "mom_curr": [
                {"$match": {"date": {"$gte": mom_curr_start, "$lte": now}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ],
            "mom_prev": [
                {"$match": {"date": {"$gte": mom_prev_start, "$lt": mom_curr_start}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
        }}
    ]
    
    result = await expenses_col.aggregate(pipeline).to_list(None)
    data = result[0] if result else {}
    
    # Safely extract from facet
    def get_val(arr, field, default=0.0):
        if arr and len(arr) > 0 and field in arr[0]:
            return arr[0][field]
        return default

    # Current Range Stats
    current_range = data.get("current_range", [])
    total_spent = sum(d.get("total", 0.0) for d in current_range)
    average_daily_spend = total_spent / duration_days
    
    # WoW Calculations
    wow_curr = get_val(data.get("wow_curr", []), "total")
    wow_prev = get_val(data.get("wow_prev", []), "total")
    week_over_week = ((wow_curr - wow_prev) / wow_prev * 100) if wow_prev > 0 else 0.0
    
    # MoM Calculations
    mom_curr = get_val(data.get("mom_curr", []), "total")
    mom_prev = get_val(data.get("mom_prev", []), "total")
    month_over_month = ((mom_curr - mom_prev) / mom_prev * 100) if mom_prev > 0 else 0.0
    
    # Trend Chart Points
    current_day_totals = {d["_id"]: d.get("total", 0.0) for d in current_range}
    current_day_counts = {d["_id"]: d.get("count", 0) for d in current_range}
    
    previous_range = data.get("previous_range", [])
    prev_day_totals = {d["_id"]: d.get("total", 0.0) for d in previous_range}
    
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
        
    # Category breakdown
    categories = await CategoryService.get_user_categories(user_id)
    cat_id_to_name = {str(c["id"]): c["name"] for c in categories}
    
    category_totals = {}
    for d in data.get("category_totals", []):
        cat_id = str(d.get("_id", ""))
        cat_name = cat_id_to_name.get(cat_id, "Others")
        category_totals[cat_name] = category_totals.get(cat_name, 0.0) + d.get("total", 0.0)
        
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
