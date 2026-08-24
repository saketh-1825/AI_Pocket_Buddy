import pytest
from datetime import datetime, timezone, timedelta
import app.database

@pytest.mark.asyncio
async def test_get_trends(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    
    # Seed sample expenses
    now = datetime.now(timezone.utc)
    expenses = [
        {
            "user_id": user_id,
            "title": "Amazon buy",
            "amount": 1200.0,
            "category": "Shopping",
            "description": "Tech gadget purchase",
            "date": now,
            "created_at": now
        }
    ]
    await app.database.db["expenses"].insert_many(expenses)

    
    response = await client.get("/analytics/trends?range=30d", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "total_spent" in data
    assert "trend_chart" in data
    assert "category_breakdown" in data
    assert len(data["trend_chart"]) > 0

@pytest.mark.asyncio
async def test_get_trends_historical_date_range_wow_mom(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Insert expenses today and last week to create WoW
    # We clear expenses first to have a clean WoW calculation
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    expenses = [
        {"user_id": user_id, "amount": 100.0, "category": "Food", "date": now, "created_at": now},
        {"user_id": user_id, "amount": 50.0, "category": "Food", "date": now - timedelta(days=8), "created_at": now}
    ]
    await app.database.db["expenses"].insert_many(expenses)
    
    # Query for a historical date range (e.g. 100 days ago)
    historical_start = (now - timedelta(days=100)).strftime("%Y-%m-%d")
    historical_end = (now - timedelta(days=90)).strftime("%Y-%m-%d")
    
    response = await client.get(f"/analytics/trends?start_date={historical_start}&end_date={historical_end}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["total_spent"] == 0.0 # No expenses in the historical range
    
    # WoW should be correctly calculated based on today's data: (100 - 50) / 50 * 100 = 100.0
    assert data["week_over_week"] == 100.0

@pytest.mark.asyncio
async def test_get_trends_objectid_category_mapping(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    
    from bson import ObjectId
    cat_id = ObjectId()
    await app.database.db["categories"].insert_one({
        "_id": cat_id,
        "user_id": user_id,
        "name": "Groceries",
        "normalized_name": "groceries"
    })
    
    await app.database.db["expenses"].insert_one({
        "user_id": user_id,
        "amount": 250.0,
        "category_id": cat_id, # ObjectId!
        "date": now,
        "created_at": now
    })
    
    response = await client.get("/analytics/trends?range=7d", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    breakdown = data["category_breakdown"]
    
    assert len(breakdown) == 1
    assert breakdown[0]["category"] == "Groceries"
    assert breakdown[0]["total"] == 250.0

