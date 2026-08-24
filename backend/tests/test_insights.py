import pytest
from datetime import datetime, timezone, timedelta
import app.database
from app.services.insight_service import InsightService

@pytest.mark.asyncio
async def test_insight_services(test_user):
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    
    # Empty DB
    await app.database.db["expenses"].delete_many({"user_id": user_id})
    await app.database.db["categories"].delete_many({"user_id": user_id})
    
    # Seed Category
    cat_food = await app.database.db["categories"].insert_one({"name": "Food", "normalized_name": "food", "user_id": user_id})
    cat_id = cat_food.inserted_id
    
    # 1. Test Empty State
    words = await InsightService.get_word_cloud(user_id)
    assert words == []
    
    weekly = await InsightService.get_weekly_comparison(user_id)
    assert weekly["this_week"] == 0.0
    
    pattern = await InsightService.get_spending_pattern(user_id)
    assert pattern["most_active_day"] == "N/A"
    
    # 2. Seed Data
    # For weekly comparison, we need data this week and last week
    today = datetime.utcnow()
    current_week_start = (today - timedelta(days=today.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    last_week_start = current_week_start - timedelta(days=7)
    
    mock_expenses = [
        # Last week
        {"user_id": user_id, "amount": 1000.0, "category_id": cat_id, "date": last_week_start + timedelta(hours=1), "title": "Coffee Shop", "description": "Weekly coffee", "created_at": now},
        # This week
        {"user_id": user_id, "amount": 1500.0, "category_id": cat_id, "date": today - timedelta(minutes=5), "title": "Coffee beans", "description": "Good coffee", "created_at": now},
        {"user_id": user_id, "amount": 500.0, "category_id": cat_id, "date": today - timedelta(minutes=10), "title": "Snack", "description": "Evening snack", "created_at": now},
    ]
    await app.database.db["expenses"].insert_many(mock_expenses)
    
    # 3. Test Word Cloud
    words = await InsightService.get_word_cloud(user_id)
    assert len(words) > 0
    assert any(w["text"] == "coffee" for w in words)
    assert any(w["text"] == "shop" for w in words)
    
    # 4. Test Weekly Comparison
    weekly = await InsightService.get_weekly_comparison(user_id)
    assert weekly["this_week"] == 2000.0
    assert weekly["last_week"] == 1000.0
    assert weekly["percentage_change"] == 100.0
    assert weekly["difference"] == 1000.0
    assert weekly["trend"] == "up"
    
    # 5. Test Spending Pattern
    pattern = await InsightService.get_spending_pattern(user_id)
    assert pattern["most_active_day"] != "N/A"
    assert pattern["average_transaction"] == 1000.0  # (1000+1500+500)/3
    assert pattern["favorite_category"] == "Food"
