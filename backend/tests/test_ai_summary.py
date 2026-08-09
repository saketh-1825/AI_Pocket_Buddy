import pytest
from datetime import datetime, timezone
import app.database

@pytest.mark.asyncio
async def test_ai_summary_no_expenses(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    
    # Ensure there are no expenses or budgets in the database
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    await app.database.db["budgets"].delete_many({"user_id": user_id})
    
    response = await client.get("/insights/ai-summary", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "No expenses found."
    assert data["top_spending_day"] is None
    assert data["top_category"] is None
    assert data["overspending_detected"] is False
    assert data["recommended_saving"] == 0

@pytest.mark.asyncio
async def test_ai_summary_expenses_no_budgets(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Clear and seed expenses but no budgets
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    await app.database.db["budgets"].delete_many({"user_id": user_id})
    
    expense = {
        "user_id": user_id,
        "title": "Starbucks Coffee",
        "amount": 350.0,
        "category": "Food",
        "date": now,
        "created_at": now
    }
    await app.database.db["expenses"].insert_one(expense)
    
    response = await client.get("/insights/ai-summary", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "You haven't created budgets yet" in data["message"]
    assert data["top_spending_day"] is not None
    assert data["top_category"] == "Food"
    assert data["overspending_detected"] is False

@pytest.mark.asyncio
async def test_ai_summary_category_budgets(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Clear and seed expenses + category budgets
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    await app.database.db["budgets"].delete_many({"user_id": user_id})
    
    budget = {
        "user_id": user_id,
        "category": "Food",
        "limit_amount": 200.0,
        "month": now.month,
        "year": now.year,
        "created_at": now,
        "updated_at": now
    }
    await app.database.db["budgets"].insert_one(budget)
    
    expense = {
        "user_id": user_id,
        "title": "Heavy Lunch",
        "amount": 300.0, # exceeds budget of 200
        "category": "Food",
        "date": now,
        "created_at": now
    }
    await app.database.db["expenses"].insert_one(expense)
    
    response = await client.get("/insights/ai-summary", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["overspending_detected"] is True
    assert data["recommended_saving"] == 100
    assert "exceeded your Food budget" in data["message"]

@pytest.mark.asyncio
async def test_ai_summary_overall_monthly_budget(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Clear and seed expenses + overall monthly budget (no category budgets)
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    await app.database.db["budgets"].delete_many({"user_id": user_id})
    
    overall_budget = {
        "user_id": user_id,
        "monthly_budget": 500.0, # overall budget limit
        "month": now.month,
        "year": now.year,
        "created_at": now,
        "updated_at": now
    }
    await app.database.db["budgets"].insert_one(overall_budget)
    
    expenses = [
        {
            "user_id": user_id,
            "title": "T-shirt",
            "amount": 400.0,
            "category": "Shopping",
            "date": now,
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Bus ticket",
            "amount": 200.0, # total 600, exceeds 500 overall budget
            "category": "Transport",
            "date": now,
            "created_at": now
        }
    ]
    await app.database.db["expenses"].insert_many(expenses)
    
    response = await client.get("/insights/ai-summary", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["overspending_detected"] is True
    assert data["recommended_saving"] == 100
    assert "exceeded your overall monthly budget" in data["message"]

