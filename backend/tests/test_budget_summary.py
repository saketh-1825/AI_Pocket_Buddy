import pytest
from datetime import datetime, timezone
import app.database

@pytest.mark.asyncio
async def test_get_budget_summary(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Seed a category budget
    budget_doc = {
        "user_id": user_id,
        "category": "Food",
        "limit_amount": 5000.0,
        "month": now.month,
        "year": now.year,
        "created_at": now,
        "updated_at": now
    }
    await app.database.db["budgets"].insert_one(budget_doc)
    
    # Seed an expense under that budget category
    expense_doc = {
        "user_id": user_id,
        "title": "Resto bill",
        "amount": 1500.0,
        "category": "Food",
        "date": now,
        "created_at": now
    }
    await app.database.db["expenses"].insert_one(expense_doc)

    
    response = await client.get(f"/budgets/summary?month={now.month}&year={now.year}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "total_budget" in data
    assert "total_spent" in data
    assert "remaining" in data
    assert "utilization_percentage" in data
    assert data["total_budget"] == 5000.0
    assert data["total_spent"] == 1500.0
    assert data["remaining"] == 3500.0

