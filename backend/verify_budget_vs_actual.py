import asyncio
from datetime import datetime, timezone
from app.database import db
from app.services.insight_service import InsightService

async def main():
    print("==================================================")
    print("Running Automated Verification of Budget Vs Actual")
    print("==================================================")
    
    # 1. Find or create a test user
    user = await db["users"].find_one()
    if not user:
        print("[-] No user found in DB to test. Creating dummy user.")
        dummy_user = {
            "email": "test_insights_user@example.com",
            "password_hash": "dummy_hash",
            "name": "Insights Tester"
        }
        res = await db["users"].insert_one(dummy_user)
        user_id = str(res.inserted_id)
    else:
        user_id = str(user["_id"])
        print(f"[+] Found user in DB to test: {user_id} ({user.get('email')})")
        
    month = 6
    year = 2026
    
    # Clean old test budgets/expenses for this user and month to avoid contamination
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    await db["expenses"].delete_many({
        "user_id": user_id,
        "date": {"$regex": "^2026-06-"}
    })
    
    now = datetime.now(timezone.utc)
    
    # 2. Insert Test Budgets
    print("\n--- Seeding Budgets ---")
    # Food category budget (10000 limit)
    food_budget = {
        "user_id": user_id,
        "category": "Food",
        "limit_amount": 10000.0,
        "month": month,
        "year": year,
        "created_at": now,
        "updated_at": now
    }
    # Transport category budget (4000 limit)
    transport_budget = {
        "user_id": user_id,
        "category": "Transport",
        "limit_amount": 4000.0,
        "month": month,
        "year": year,
        "created_at": now,
        "updated_at": now
    }
    # Overall monthly budget (50000) - should be ignored
    overall_budget = {
        "user_id": user_id,
        "monthly_budget": 50000.0,
        "month": month,
        "year": year,
        "created_at": now,
        "updated_at": now
    }
    
    await db["budgets"].insert_many([food_budget, transport_budget, overall_budget])
    print("[+] Seeded test budgets (Food limit=10000, Transport limit=4000, Overall monthly=50000)")
    
    # 3. Seed Expenses
    print("\n--- Seeding Expenses ---")
    mock_expenses = [
        {"user_id": user_id, "amount": 4300.0, "category": "Food", "date": "2026-06-15", "description": "Grocery & dining", "title": "Food Spend"},
        {"user_id": user_id, "amount": 4200.0, "category": "Transport", "date": "2026-06-20", "description": "Car repair", "title": "Transport Spend"}
    ]
    await db["expenses"].insert_many(mock_expenses)
    print("[+] Seeded mock expenses (Food spent=4300, Transport spent=4200)")
    
    # 4. Invoke service
    print("\n--- Fetching Budget Vs Actual Report ---")
    items = await InsightService.get_budget_vs_actual(user_id, month, year)
    
    # Print results
    print(f"[+] Retrieved {len(items)} items:")
    for item in items:
        print(f"    - Category: {item['category']}")
        print(f"      Budget: {item['budget']}, Actual: {item['actual']}, Remaining: {item['remaining']}")
        print(f"      Percentage Used: {item['percentage_used']}%, Status: {item['status']}")
        
    # 5. Assertions
    # There should be exactly 2 category budgets returned (overall budget ignored)
    assert len(items) == 2, f"Expected 2 items, got {len(items)}"
    
    food_item = next((item for item in items if item["category"] == "Food"), None)
    assert food_item is not None, "Food budget was not returned"
    assert food_item["budget"] == 10000.0
    assert food_item["actual"] == 4300.0
    assert food_item["remaining"] == 5700.0
    assert food_item["percentage_used"] == 43
    assert food_item["status"] == "SAFE"
    
    transport_item = next((item for item in items if item["category"] == "Transport"), None)
    assert transport_item is not None, "Transport budget was not returned"
    assert transport_item["budget"] == 4000.0
    assert transport_item["actual"] == 4200.0
    assert transport_item["remaining"] == 0.0
    assert transport_item["percentage_used"] == 105
    assert transport_item["status"] == "OVER BUDGET"
    
    print("\n[+] All assertions passed successfully!")
    
    # 6. Cleanup
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    await db["expenses"].delete_many({
        "user_id": user_id,
        "date": {"$regex": "^2026-06-"}
    })
    print("[+] Test data cleaned up successfully.")
    print("==================================================")
    print("[+] ALL BUDGET VS ACTUAL TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
