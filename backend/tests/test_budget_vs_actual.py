import pytest
from datetime import datetime, timezone
import app.database
from app.services.insight_service import InsightService

@pytest.mark.asyncio
async def test_budget_vs_actual(client, test_user):
    user_id = test_user["user_id"]
    month = 6
    year = 2026
    now = datetime.now(timezone.utc)
    
    # 1. Insert Test Budgets
    food_budget = {
        "user_id": user_id,
        "category": "Food",
        "limit_amount": 10000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    transport_budget = {
        "user_id": user_id,
        "category": "Transport",
        "limit_amount": 4000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    overall_budget = {
        "user_id": user_id,
        "monthly_budget": 50000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await app.database.db["budgets"].insert_many([food_budget, transport_budget, overall_budget])
    
    # 2. Seed Categories and Expenses
    cat_food = await app.database.db["categories"].insert_one({"name": "Food", "normalized_name": "food", "user_id": user_id})
    cat_transport = await app.database.db["categories"].insert_one({"name": "Transport", "normalized_name": "transport", "user_id": user_id})
    
    mock_expenses = [
        {"user_id": user_id, "amount": 4300.0, "category_id": cat_food.inserted_id, "date": datetime(year, month, 15, tzinfo=timezone.utc), "description": "Grocery", "title": "Food Spend", "created_at": now},
        {"user_id": user_id, "amount": 4200.0, "category_id": cat_transport.inserted_id, "date": datetime(year, month, 20, tzinfo=timezone.utc), "description": "Car repair", "title": "Transport Spend", "created_at": now}
    ]
    await app.database.db["expenses"].insert_many(mock_expenses)
    
    # 3. Invoke endpoint
    response = await client.get(f"/insights/budget-vs-actual?month={month}&year={year}", headers=test_user["headers"])
    assert response.status_code == 200
    
    data = response.json()
    items = data["items"]
    assert data["has_budgets"] is True
    assert len(items) == 2, f"Expected 2 items, got {len(items)}"
    
    food_item = next((item for item in items if item["category"] == "Food"), None)
    assert food_item is not None
    assert food_item["budget"] == 10000.0
    assert food_item["actual"] == 4300.0
    assert food_item["remaining"] == 5700.0
    assert food_item["percentage_used"] == 43.0
    assert food_item["status"] == "SAFE"
    
    transport_item = next((item for item in items if item["category"] == "Transport"), None)
    assert transport_item is not None
    assert transport_item["budget"] == 4000.0
    assert transport_item["actual"] == 4200.0
    assert transport_item["remaining"] == 0.0
    assert transport_item["percentage_used"] == 105.0
    assert transport_item["status"] == "OVER BUDGET"
