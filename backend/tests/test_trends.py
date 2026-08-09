import pytest
from datetime import datetime, timezone
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
