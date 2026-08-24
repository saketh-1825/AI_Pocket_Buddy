import asyncio
from datetime import datetime, timezone, timedelta
from app.database import db
import pprint
from motor.motor_asyncio import AsyncIOMotorClient

async def test_trend_agg():
    user_id = await db["expenses"].find_one()
    if not user_id:
        print("No expenses")
        return
    user_id = user_id["user_id"]
    
    now = datetime.now(timezone.utc)
    start_dt = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    duration_days = (end_dt - start_dt).days + 1
    
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

    result = await db["expenses"].aggregate(pipeline).to_list(None)
    pprint.pprint(result)

if __name__ == "__main__":
    asyncio.run(test_trend_agg())
