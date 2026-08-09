import asyncio
import datetime
from datetime import datetime as dt_class, timezone
from app.database import db
from app.services.budget_service import BudgetService
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate

async def main():
    print("==================================================")
    print("Running Automated Verification of Budget Service")
    print("==================================================")
    
    # 1. Find or create a test user
    user = await db["users"].find_one()
    if not user:
        print("[-] No user found in DB to test. Creating dummy user.")
        dummy_user = {
            "email": "test_budget_user@example.com",
            "password_hash": "dummy_hash",
            "name": "Budget Tester"
        }
        res = await db["users"].insert_one(dummy_user)
        user_id = str(res.inserted_id)
    else:
        user_id = str(user["_id"])
        print(f"[+] Found user in DB to test: {user_id} ({user.get('email')})")
        
    # Clean old test budgets for this month to avoid duplicates
    now = dt_class.now(timezone.utc)
    month = now.month
    year = now.year
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    # 2. Test status mapping logic
    print("\n--- Testing Budget Service Status Logic ---")
    status_safe = BudgetService.calculate_budget_status(45.0)
    status_warn = BudgetService.calculate_budget_status(75.0)
    status_almost = BudgetService.calculate_budget_status(90.0)
    status_over = BudgetService.calculate_budget_status(110.0)
    
    print(f"[+] Progress 45% -> Status: {status_safe} (Expected: SAFE)")
    print(f"[+] Progress 75% -> Status: {status_warn} (Expected: WARNING)")
    print(f"[+] Progress 90% -> Status: {status_almost} (Expected: ALMOST EXCEEDED)")
    print(f"[+] Progress 110% -> Status: {status_over} (Expected: OVER BUDGET)")
    
    assert status_safe == "SAFE"
    assert status_warn == "WARNING"
    assert status_almost == "ALMOST EXCEEDED"
    assert status_over == "OVER BUDGET"
    
    # 3. Test budget creation
    print("\n--- Testing Budget Creation ---")
    budget_in_1 = BudgetCreate(
        category="Food",
        month=month,
        year=year,
        limit_amount=10000.0
    )
    budget_in_2 = BudgetCreate(
        category="Transport",
        month=month,
        year=year,
        limit_amount=5000.0
    )
    
    b1 = await BudgetService.create_budget(user_id, budget_in_1)
    b2 = await BudgetService.create_budget(user_id, budget_in_2)
    print(f"[+] Category Budget created: {b1['category']} (Limit: Rs. {b1['limit_amount']})")
    print(f"[+] Category Budget created: {b2['category']} (Limit: Rs. {b2['limit_amount']})")
    
    # Check duplicate prevention
    try:
        await BudgetService.create_budget(user_id, budget_in_1)
        print("[-] Error: Duplicate budget creation succeeded but should have failed!")
    except Exception as e:
        print(f"[+] Duplicate budget creation blocked successfully: {str(e)}")
        
    # 4. Add mock expenses to test progress calculation
    print("\n--- Seeding Mock Expenses for Progress Calculations ---")
    start_date = datetime.datetime(year, month, 1, tzinfo=datetime.timezone.utc)
    if month == 12:
        end_date = datetime.datetime(year + 1, 1, 1, tzinfo=datetime.timezone.utc)
    else:
        end_date = datetime.datetime(year, month + 1, 1, tzinfo=datetime.timezone.utc)
        
    # Delete existing month's expenses for accurate test run
    await db["expenses"].delete_many({
        "user_id": user_id,
        "$or": [
            {"date": {"$gte": start_date, "$lt": end_date}},
            {"date": {"$gte": f"{year}-{month:02d}-01", "$lt": f"{year}-{(month+1):02d}-01" if month < 12 else f"{year+1}-01-01"}}
        ]
    })
    
    mock_expenses = [
        {"user_id": user_id, "amount": 3500.0, "category": "Food", "date": f"{year}-{month:02d}-05", "description": "Weekly groceries", "title": "Groceries"},
        {"user_id": user_id, "amount": 800.0, "category": "Food", "date": f"{year}-{month:02d}-10", "description": "Restaurant", "title": "Lunch Out"},
        {"user_id": user_id, "amount": 4200.0, "category": "Transport", "date": f"{year}-{month:02d}-12", "description": "Monthly train pass", "title": "Train Pass"},
    ]
    await db["expenses"].insert_many(mock_expenses)
    print(f"[+] Inserted {len(mock_expenses)} mock expenses for the current month")
    
    # 5. Fetch budgets for month and assert progress calculation
    print("\n--- Testing Budget List and Progress Computations ---")
    list_budgets = await BudgetService.get_budgets_for_month(user_id, month, year)
    print(f"[+] Retrieved {len(list_budgets)} category budgets")
    for b in list_budgets:
        print(f"    - Category: {b['category']}")
        print(f"      Limit: Rs. {b['limit_amount']}, Spent: Rs. {b['spent_amount']}, Remaining: Rs. {b['remaining_amount']}")
        print(f"      Progress: {b['progress_percentage']}%, Status: {b['status']}")
        
        if b['category'] == "Food":
            # Spent: 3500 + 800 = 4300. Progress: 4300 / 10000 * 100 = 43%
            assert b['spent_amount'] == 4300.0
            assert b['progress_percentage'] == 43.0
            assert b['status'] == "SAFE"
        elif b['category'] == "Transport":
            # Spent: 4200. Progress: 4200 / 5000 * 100 = 84%
            assert b['spent_amount'] == 4200.0
            assert b['progress_percentage'] == 84.0
            assert b['status'] == "ALMOST EXCEEDED"
            
    # 6. Test update API
    print("\n--- Testing Budget Update API ---")
    updated = await BudgetService.update_budget(user_id, str(b2["_id"]), BudgetUpdate(limit_amount=4000.0))
    print(f"[+] Category {updated['category']} limit updated to Rs. {updated['limit_amount']}")
    # Spent: 4200. Progress: 4200 / 4000 = 105%. Status: OVER BUDGET
    print(f"    New Spent: Rs. {updated['spent_amount']}, Progress: {updated['progress_percentage']}%, Status: {updated['status']}")
    assert updated['limit_amount'] == 4000.0
    assert updated['progress_percentage'] == 105.0
    assert updated['status'] == "OVER BUDGET"
    
    # 7. Test Alerts Engine
    print("\n--- Testing Budget Alerts Engine ---")
    alerts = await BudgetService.get_budget_alerts(user_id)
    print(f"[+] Alerts detected: {len(alerts)}")
    for a in alerts:
        print(f"    - Category: {a['category']}, Used: {a['used_percentage']}%, Remaining: Rs. {a['remaining']}, Status: {a['status']}")
    
    # Transport should generate alert. Food (43%) should not, as it is <= 60%.
    assert len(alerts) == 1
    assert alerts[0]['category'] == "Transport"
    assert alerts[0]['status'] == "over"
    
    # 8. Test Monthly Summary
    print("\n--- Testing Monthly Summary ---")
    summary = await BudgetService.get_budget_summary(user_id, month, year)
    print(f"[+] Total Monthly Budget: Rs. {summary['total_budget']}")
    print(f"[+] Total Monthly Spent: Rs. {summary['total_spent']}")
    print(f"[+] Remaining Budget: Rs. {summary['remaining']}")
    print(f"[+] Budget Utilization: {summary['utilization_percentage']}%")
    print(f"[+] Status: {summary['status']}, Alert Count: {summary['alert_count']}")
    
    # Total budget = Food (10000) + Transport (4000) = 14000. Total spent = 4300 + 4200 = 8500.
    assert summary['total_budget'] == 14000.0
    assert summary['total_spent'] == 8500.0
    assert summary['utilization_percentage'] == round(8500 / 14000 * 100, 2)
    assert summary['alert_count'] == 1
    
    # 9. Test deletion
    print("\n--- Testing Budget Deletion ---")
    del_res = await BudgetService.delete_budget(user_id, str(b1["_id"]))
    print(f"[+] Budget deletion status: {del_res}")
    assert del_res is True
    
    # Clean up test database mutations
    await db["budgets"].delete_many({"user_id": user_id, "month": month, "year": year})
    await db["expenses"].delete_many({
        "user_id": user_id,
        "$or": [
            {"date": {"$gte": start_date, "$lt": end_date}},
            {"date": {"$gte": f"{year}-{month:02d}-01", "$lt": f"{year}-{(month+1):02d}-01" if month < 12 else f"{year+1}-01-01"}}
        ]
    })
    
    print("\n==================================================")
    print("[+] ALL BUDGET SERVICE VERIFICATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
