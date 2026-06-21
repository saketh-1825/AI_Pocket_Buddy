from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import db

def get_start_date_six_months_ago() -> datetime:
    """Helper to calculate start date for exactly the last 6 calendar months in UTC."""
    now = datetime.now(timezone.utc)
    year = now.year
    month = now.month
    # To include the current month plus 5 previous months
    start_month = month - 5
    start_year = year
    if start_month <= 0:
        start_month += 12
        start_year -= 1
    return datetime(start_year, start_month, 1, tzinfo=timezone.utc)

async def _run_analytics_aggregation(user_id: str, start_date: datetime) -> dict:
    """Runs a single optimized facet aggregation pipeline on the expenses collection."""
    expenses_col = db["expenses"]
    
    pipeline = [
        {
            "$match": {
                "user_id": user_id
            }
        },
        {
            "$facet": {
                "overall": [
                    {
                        "$group": {
                            "_id": None,
                            "total_spent": {"$sum": "$amount"},
                            "expense_count": {"$sum": 1},
                            "average_expense": {"$avg": "$amount"}
                        }
                    }
                ],
                "monthly_summary": [
                    {
                        "$match": {
                            "date": {"$gte": start_date}
                        }
                    },
                    {
                        "$group": {
                            "_id": {
                                "year": {"$year": "$date"},
                                "month": {"$month": "$date"}
                            },
                            "total_spent": {"$sum": "$amount"},
                            "expense_count": {"$sum": 1},
                            "average_expense": {"$avg": "$amount"}
                        }
                    },
                    {
                        "$sort": {
                            "_id.year": 1,
                            "_id.month": 1
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "year": "$_id.year",
                            "month": "$_id.month",
                            "month_name": {
                                "$arrayElemAt": [
                                    ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                                    "$_id.month"
                                ]
                            },
                            "total_spent": {"$round": ["$total_spent", 2]},
                            "expense_count": "$expense_count",
                            "average_expense": {"$round": ["$average_expense", 2]}
                        }
                    }
                ],
                "category_breakdown": [
                    {
                        "$group": {
                            "_id": "$category",
                            "total": {"$sum": "$amount"}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "categories": { "$push": { "category": "$_id", "total": "$total" } },
                            "grand_total": { "$sum": "$total" }
                        }
                    },
                    {
                        "$unwind": "$categories"
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "category": "$categories.category",
                            "total": {"$round": ["$categories.total", 2]},
                            "percentage": {
                                "$cond": [
                                    { "$eq": ["$grand_total", 0] },
                                    0.0,
                                    { "$round": [{ "$multiply": [{ "$divide": ["$categories.total", "$grand_total"] }, 100] }, 2] }
                                ]
                            }
                        }
                    },
                    {
                        "$sort": {
                            "total": -1
                        }
                    }
                ]
            }
        }
    ]
    
    results = await expenses_col.aggregate(pipeline).to_list(length=1)
    if results:
        return results[0]
    return {
        "overall": [],
        "monthly_summary": [],
        "category_breakdown": []
    }

def _get_monthly_summary(raw_summary: list, start_date: datetime) -> list:
    """Generates template for the last 6 months, merges database data, zero-padding missing months."""
    now = datetime.now(timezone.utc)
    curr_year = now.year
    curr_month = now.month
    
    month_list = []
    y, m = start_date.year, start_date.month
    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    for _ in range(6):
        month_list.append({
            "year": y,
            "month": m,
            "month_name": month_names[m],
            "total_spent": 0.0,
            "expense_count": 0,
            "average_expense": 0.0,
            "budget": None,
            "budget_usage_percentage": None,
            "is_current_month": (y == curr_year and m == curr_month)
        })
        m += 1
        if m > 12:
            m = 1
            y += 1
            
    lookup = {(item["year"], item["month"]): item for item in raw_summary}
    
    for month_data in month_list:
        key = (month_data["year"], month_data["month"])
        if key in lookup:
            raw_item = lookup[key]
            month_data["total_spent"] = float(raw_item["total_spent"])
            month_data["expense_count"] = int(raw_item["expense_count"])
            month_data["average_expense"] = float(raw_item["average_expense"])
            
    return month_list

def _get_category_breakdown(raw_categories: list) -> list:
    """Formats category statistics."""
    formatted = []
    for item in raw_categories:
        formatted.append({
            "category": item["category"],
            "total": float(item["total"]),
            "percentage": float(item["percentage"])
        })
    return formatted

def _get_overall_stats(raw_overall: list) -> dict:
    """Parses overall user database statistics."""
    if not raw_overall:
        return {
            "total_spent": 0.0,
            "expense_count": 0,
            "average_expense": 0.0
        }
    item = raw_overall[0]
    return {
        "total_spent": round(float(item["total_spent"]), 2),
        "expense_count": int(item["expense_count"]),
        "average_expense": round(float(item["average_expense"]), 2)
    }

def _get_kpi_metrics(monthly_summary: list, category_breakdown: list) -> dict:
    """Computes high level metrics: top category, highest spending month, monthly change, savings rate."""
    # 1. Top Category
    top_category = None
    if category_breakdown:
        top = category_breakdown[0]
        top_category = {
            "category": top["category"],
            "amount": float(top["total"]),
            "percentage": float(top["percentage"])
        }
        
    # 2. Highest Month
    highest_month = None
    if monthly_summary:
        max_month = max(monthly_summary, key=lambda x: x["total_spent"])
        if max_month["total_spent"] > 0:
            highest_month = {
                "month": max_month["month_name"],
                "year": int(max_month["year"]),
                "amount": float(max_month["total_spent"])
            }
            
    # 3. Monthly Change Percentage
    # Index 5 is current month, Index 4 is previous month
    monthly_change_percentage = 0.0
    if len(monthly_summary) >= 6:
        curr_month_spent = monthly_summary[5]["total_spent"]
        prev_month_spent = monthly_summary[4]["total_spent"]
        if prev_month_spent > 0:
            monthly_change_percentage = round(((curr_month_spent - prev_month_spent) / prev_month_spent) * 100, 2)
            
    return {
        "top_category": top_category,
        "highest_month": highest_month,
        "monthly_change_percentage": monthly_change_percentage,
        "savings_rate": 0.0
    }

async def get_analytics_summary(user_id: str) -> Optional[dict]:
    """Orchestrates other helper methods to retrieve user analytics summary."""
    start_date = get_start_date_six_months_ago()
    
    # 1. Run the aggregation
    facet_result = await _run_analytics_aggregation(user_id, start_date)
    
    # 2. Check if any overall stats exist
    if not facet_result or not facet_result.get("overall"):
        return None
        
    # 3. Extract overall stats
    overall_stats = _get_overall_stats(facet_result["overall"])
    if overall_stats["expense_count"] == 0:
        return None
        
    # 4. Parse monthly summaries
    monthly_summary = _get_monthly_summary(facet_result["monthly_summary"], start_date)
    
    # 5. Parse category breakdown
    category_breakdown = _get_category_breakdown(facet_result["category_breakdown"])
    
    # 6. Parse KPI metrics
    kpis = _get_kpi_metrics(monthly_summary, category_breakdown)
    
    return {
        "monthly_summary": monthly_summary,
        "category_breakdown": category_breakdown,
        "total_spent": overall_stats["total_spent"],
        "expense_count": overall_stats["expense_count"],
        "average_expense": overall_stats["average_expense"],
        "top_category": kpis["top_category"],
        "highest_month": kpis["highest_month"],
        "monthly_change_percentage": kpis["monthly_change_percentage"],
        "savings_rate": kpis["savings_rate"]
    }
