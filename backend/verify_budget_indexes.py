import asyncio
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError
from app.database import db
from app.routes.budget_routes import create_indexes

async def main():
    print("==================================================")
    print("Running Automated Verification of Budget Indexes")
    print("==================================================")
    
    # Initialize/recreate indexes first
    await create_indexes()
    
    user_id = "test_index_user_abc"
    month = 6
    year = 2026
    
    # 0. Cleanup previous test entries
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    now = datetime.now(timezone.utc)
    
    # Test 1: Insert Category Budget: Food, June 2026
    print("\n[Test 1] Inserting Category Budget: Food, June 2026...")
    doc1 = {
        "user_id": user_id,
        "category": "Food",
        "month": month,
        "year": year,
        "limit_amount": 10000.0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    try:
        await db["budgets"].insert_one(doc1)
        print("[+] Success: Test 1 inserted Food budget.")
    except Exception as e:
        print(f"[-] Failure in Test 1: {str(e)}")
        return
        
    # Test 2: Insert Category Budget: Food, June 2026 again
    print("\n[Test 2] Inserting Category Budget: Food, June 2026 again...")
    doc2 = {
        "user_id": user_id,
        "category": "Food",
        "month": month,
        "year": year,
        "limit_amount": 15000.0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    try:
        await db["budgets"].insert_one(doc2)
        print("[-] Failure: Test 2 inserted duplicate Food budget successfully (expected fail)!")
    except DuplicateKeyError:
        print("[+] Success: Test 2 blocked duplicate Food budget as expected.")
    except Exception as e:
        print(f"[-] Failure in Test 2 (unexpected error): {str(e)}")
        
    # Test 3: Insert Category Budget: Transport, June 2026
    print("\n[Test 3] Inserting Category Budget: Transport, June 2026...")
    doc3 = {
        "user_id": user_id,
        "category": "Transport",
        "month": month,
        "year": year,
        "limit_amount": 5000.0,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    try:
        await db["budgets"].insert_one(doc3)
        print("[+] Success: Test 3 inserted Transport budget.")
    except Exception as e:
        print(f"[-] Failure in Test 3: {str(e)}")
        
    # Test 4: Insert Overall Monthly Budget, June 2026
    print("\n[Test 4] Inserting Overall Monthly Budget, June 2026...")
    doc4 = {
        "user_id": user_id,
        "monthly_budget": 50000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    try:
        await db["budgets"].insert_one(doc4)
        print("[+] Success: Test 4 inserted overall monthly budget.")
    except Exception as e:
        print(f"[-] Failure in Test 4: {str(e)}")
        
    # Test 5: Insert Overall Monthly Budget, June 2026 again
    print("\n[Test 5] Inserting Overall Monthly Budget, June 2026 again...")
    doc5 = {
        "user_id": user_id,
        "monthly_budget": 60000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    try:
        await db["budgets"].insert_one(doc5)
        print("[-] Failure: Test 5 inserted duplicate overall monthly budget successfully (expected fail)!")
    except DuplicateKeyError:
        print("[+] Success: Test 5 blocked duplicate overall monthly budget as expected.")
    except Exception as e:
        print(f"[-] Failure in Test 5 (unexpected error): {str(e)}")
        
    # Cleanup after test
    await db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    print("\n==================================================")
    print("[+] ALL BUDGET INDEX TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
