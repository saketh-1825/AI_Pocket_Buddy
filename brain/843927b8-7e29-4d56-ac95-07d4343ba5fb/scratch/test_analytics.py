import os
import sys
import asyncio
from datetime import datetime, timezone
from fastapi import HTTPException

# Add backend directory to path so app can be imported
sys.path.append(os.path.abspath("c:/Users/srs14/Desktop/AI_Pocket_Buddy/backend"))

from app.database import db, create_db_indexes
from app.services.analytics_service import get_analytics_summary, get_start_date_six_months_ago
from app.schemas.analytics_schema import AnalyticsSummaryResponse
from app.routes.analytics import get_summary

# Setup dummy user details
DUMMY_USER_ID = "60b9f0f9b6b5a415a4b51825"
DUMMY_USER = {
    "_id": DUMMY_USER_ID,
    "username": "testuser",
    "email": "testuser@example.com"
}

async def test_analytics_flow():
    expenses_col = db["expenses"]
    
    # 1. Clean up existing dummy test data
    await expenses_col.delete_many({"user_id": DUMMY_USER_ID})
    
    print("--- 1. Testing Idempotent Database Indexes ---")
    await create_db_indexes()
    indexes = await expenses_col.index_information()
    assert "user_id_1_date_-1" in indexes
    assert "user_id_1_category_1" in indexes
    assert "date_-1" in indexes
    print("Indexes verified successfully:", list(indexes.keys()))
    
    print("--- 2. Testing 404 for No Expenses ---")
    try:
        await get_summary(current_user=DUMMY_USER)
        assert False, "Should have raised 404 Exception"
    except HTTPException as e:
        assert e.status_code == 404
        print("Zero expenses 404 status verified successfully.")
    
    print("--- 3. Seeding Test Data ---")
    now = datetime.now(timezone.utc)
    
    # Helper to create datetime at specific month offset
    def get_offset_datetime(offset_months: int) -> datetime:
        y, m = now.year, now.month
        m += offset_months
        while m <= 0:
            m += 12
            y -= 1
        while m > 12:
            m -= 12
            y += 1
        return datetime(y, m, 15, 12, 0, tzinfo=timezone.utc)
        
    test_expenses = [
        # Current Month (index 5)
        {"title": "Lunch", "amount": 1500.0, "category": "Food", "date": get_offset_datetime(0), "user_id": DUMMY_USER_ID},
        {"title": "Taxi", "amount": 500.0, "category": "Transport", "date": get_offset_datetime(0), "user_id": DUMMY_USER_ID},
        
        # Previous Month (index 4)
        {"title": "Groceries", "amount": 1000.0, "category": "Food", "date": get_offset_datetime(-1), "user_id": DUMMY_USER_ID},
        
        # Two Months Ago (index 3) is skipped (0 expenses)
        
        # Three Months Ago (index 2)
        {"title": "Concert", "amount": 4000.0, "category": "Entertainment", "date": get_offset_datetime(-3), "user_id": DUMMY_USER_ID},
        
        # Four Months Ago (index 1)
        {"title": "Utilities", "amount": 1000.0, "category": "Others", "date": get_offset_datetime(-4), "user_id": DUMMY_USER_ID},
        
        # Five Months Ago (index 0)
        {"title": "Coffee", "amount": 500.0, "category": "Food", "date": get_offset_datetime(-5), "user_id": DUMMY_USER_ID},
        
        # Old expense outside 6-month window (should be excluded from monthly_summary, but included in overall stats)
        {"title": "Old laptop", "amount": 50000.0, "category": "Electronics", "date": get_offset_datetime(-7), "user_id": DUMMY_USER_ID}
    ]
    
    # Set default created_at
    for exp in test_expenses:
        exp["created_at"] = datetime.now(timezone.utc)
        
    await expenses_col.insert_many(test_expenses)
    print("Test expenses seeded successfully.")
    
    print("--- 4. Direct Service Verification ---")
    summary = await get_analytics_summary(DUMMY_USER_ID)
    assert summary is not None
    
    # Overall stats assertions (includes the old laptop)
    # total: 1500+500+1000+4000+1000+500+50000 = 58500
    # count: 7
    # avg: 58500 / 7 = 8357.14
    assert summary["total_spent"] == 58500.0
    assert summary["expense_count"] == 7
    assert summary["average_expense"] == round(58500.0 / 7, 2)
    
    # Monthly summaries assertion (exactly 6 months)
    monthly_summary = summary["monthly_summary"]
    assert len(monthly_summary) == 6
    
    # Gaps padding assertion (offset -2 should be 0.0)
    assert monthly_summary[3]["total_spent"] == 0.0
    assert monthly_summary[3]["expense_count"] == 0
    assert monthly_summary[3]["average_expense"] == 0.0
    
    # Current month check
    assert monthly_summary[5]["is_current_month"] is True
    assert monthly_summary[5]["total_spent"] == 2000.0
    
    # Previous month check
    assert monthly_summary[4]["total_spent"] == 1000.0
    assert monthly_summary[4]["is_current_month"] is False
    
    # Category breakdown assertions (ordered by total descending)
    # Electronics is first
    categories = summary["category_breakdown"]
    assert categories[0]["category"] == "Electronics"
    assert categories[0]["total"] == 50000.0
    assert categories[0]["percentage"] == round((50000.0 / 58500.0) * 100, 2)
    
    # KPI Assertions
    # Top Category
    assert summary["top_category"]["category"] == "Electronics"
    assert summary["top_category"]["amount"] == 50000.0
    
    # Highest month (within the last 6 months summary)
    # Highest is March (amount: 4000.0)
    assert summary["highest_month"]["month"] == monthly_summary[2]["month_name"]
    assert summary["highest_month"]["amount"] == 4000.0
    
    # Monthly Change Percentage: from 1000 (May) to 2000 (June) -> +100%
    assert summary["monthly_change_percentage"] == 100.0
    
    # Savings rate should be 0.0
    assert summary["savings_rate"] == 0.0
    
    print("Direct service verification checks passed successfully.")
    
    print("--- 5. Endpoint Validation ---")
    response_model = await get_summary(current_user=DUMMY_USER)
    
    # Validate structure
    assert isinstance(response_model, dict)
    validated_response = AnalyticsSummaryResponse(**response_model)
    assert validated_response.total_spent == 58500.0
    assert validated_response.top_category.category == "Electronics"
    assert validated_response.highest_month.amount == 4000.0
    assert validated_response.monthly_change_percentage == 100.0
    assert validated_response.savings_rate == 0.0
    
    print("API route integration response validated against Pydantic schema successfully.")
    
    # Clean up test data
    await expenses_col.delete_many({"user_id": DUMMY_USER_ID})
    print("Test cleanup completed.")

if __name__ == "__main__":
    asyncio.run(test_analytics_flow())
