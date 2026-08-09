import asyncio
from datetime import datetime, timezone
from app.database import db
from app.services.ai_insight_service import AIInsightService

async def main():
    print("==================================================")
    print("Running Automated Verification of AI Summary")
    print("==================================================")
    
    # 1. Find or create a test user
    user = await db["users"].find_one()
    if not user:
        print("[-] No user found in DB to test. Creating dummy user.")
        dummy_user = {
            "email": "test_ai_summary_user@example.com",
            "password_hash": "dummy_hash",
            "name": "AI Summary Tester"
        }
        res = await db["users"].insert_one(dummy_user)
        user_id = str(res.inserted_id)
    else:
        user_id = str(user["_id"])
        print(f"[+] Found user in DB to test: {user_id} ({user.get('email')})")
        
    month = 6
    year = 2026
    
    # Clean previous test entries
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    await db["expenses"].delete_many({
        "user_id": user_id
    })
    
    # --- Part 1: Test user WITH expenses ---
    print("\n--- Test State 1: User with expenses ---")
    now = datetime.now(timezone.utc)
    
    # Seed a category budget for Food: limit_amount = 3100
    food_budget = {
        "user_id": user_id,
        "category": "Food",
        "limit_amount": 3100.0,
        "month": month,
        "year": year,
        "created_at": now,
        "updated_at": now
    }
    await db["budgets"].insert_one(food_budget)
    print("[+] Seeded Food budget with limit_amount=3100")
    
    # Seed Food expenses totaling 4300.0 on Thursday, June 18, 2026
    food_expense = {
        "user_id": user_id,
        "amount": 4300.0,
        "category": "Food",
        "date": "2026-06-18", # Thursday
        "description": "Weekly grocery run",
        "title": "Groceries"
    }
    await db["expenses"].insert_one(food_expense)
    print("[+] Seeded Food expense of 4300 on Thursday, June 18, 2026")
    
    # Execute get_ai_summary
    summary1 = await AIInsightService.get_ai_summary(user_id)
    print(f"[+] AI Summary Output: {summary1}")
    
    # Assertions for Part 1
    assert summary1["top_spending_day"] == "Thursday", f"Expected Thursday, got {summary1['top_spending_day']}"
    assert summary1["top_category"] == "Food", f"Expected Food, got {summary1['top_category']}"
    assert summary1["overspending_detected"] is True, "Expected overspending_detected to be True"
    assert summary1["recommended_saving"] == 1200, f"Expected 1200, got {summary1['recommended_saving']}"
    assert summary1["message"] == "You've exceeded your Food budget.", f"Expected exceed message, got {summary1['message']}"
    print("[+] Part 1 assertions passed successfully!")
    
    # --- Part 2: Test user WITHOUT expenses ---
    print("\n--- Test State 2: User without expenses ---")
    # Clean expenses
    await db["expenses"].delete_many({"user_id": user_id})
    print("[+] Cleaned expenses from database")
    
    # Execute get_ai_summary
    summary2 = await AIInsightService.get_ai_summary(user_id)
    print(f"[+] AI Summary Output: {summary2}")
    
    # Assertions for Part 2
    assert summary2["top_spending_day"] is None, f"Expected None, got {summary2['top_spending_day']}"
    assert summary2["top_category"] is None, f"Expected None, got {summary2['top_category']}"
    assert summary2["overspending_detected"] is False, "Expected overspending_detected to be False"
    assert summary2["recommended_saving"] == 0, f"Expected 0, got {summary2['recommended_saving']}"
    assert summary2["message"] == "No expenses found.", f"Expected 'No expenses found.', got {summary2['message']}"
    print("[+] Part 2 assertions passed successfully!")
    
    # Cleanup after test
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    await db["expenses"].delete_many({
        "user_id": user_id
    })
    print("[+] Database cleaned up successfully.")
    print("==================================================")
    print("[+] ALL AI SUMMARY TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
