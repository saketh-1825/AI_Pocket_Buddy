import pytest
import app.database
from datetime import datetime, timezone


@pytest.mark.asyncio
async def test_get_analytics_summary(client, test_user):
    headers = test_user["headers"]
    user_id = test_user["user_id"]
    
    # Seed some expenses for the user so summary does not return 404
    now = datetime.now(timezone.utc)
    cat_food = await app.database.db["categories"].insert_one({"name": "Food", "normalized_name": "food", "user_id": user_id})
    cat_transport = await app.database.db["categories"].insert_one({"name": "Transport", "normalized_name": "transport", "user_id": user_id})

    expenses = [
        {
            "user_id": user_id,
            "title": "Grocery Shopping",
            "amount": 2500.0,
            "category_id": cat_food.inserted_id,
            "description": "Weekly grocery run at Supermarket",
            "date": now,
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Uber ride",
            "amount": 450.0,
            "category_id": cat_transport.inserted_id,
            "description": "Office commute",
            "date": now,
            "created_at": now
        }
    ]
    await app.database.db["expenses"].insert_many(expenses)

    
    response = await client.get("/analytics/summary", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "monthly_summary" in data
    assert "category_breakdown" in data
    assert "total_spent" in data
    assert data["total_spent"] == 2950.0
    assert data["expense_count"] == 2
    assert data["top_category"]["category"] == "Food"
