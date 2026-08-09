import asyncio
from datetime import datetime, timezone, timedelta
from app.database import db

async def main():
    user_id = "6a0c48c40867a97fe45c6fac"
    print(f"Seeding mock data for user: {user_id}")
    
    # 1. Update indexes manually for the budgets collection to support category budgets
    budget_collection = db["budgets"]
    try:
        await budget_collection.drop_index("user_id_1_month_1_year_1")
        print("[+] Dropped old monthly budget index.")
    except Exception:
        pass
    try:
        await budget_collection.drop_index("user_id_1_category_1")
        print("[+] Dropped old category budget index.")
    except Exception:
        pass

    # Unique overall monthly budget for user (where month exists)
    await budget_collection.create_index(
        [("user_id", 1), ("month", 1), ("year", 1)],
        unique=True,
        partialFilterExpression={"month": {"$exists": True}}
    )
    
    # Unique category budget for user (where category exists)
    await budget_collection.create_index(
        [("user_id", 1), ("category", 1)],
        unique=True,
        partialFilterExpression={"category": {"$exists": True}}
    )
    print("[+] Created compound partial indexes for budgets successfully.")
    
    # Clear existing test data for this user to start fresh
    await db["expenses"].delete_many({"user_id": user_id})
    await db["budgets"].delete_many({"user_id": user_id})
    
    now = datetime.now(timezone.utc)
    
    # 2. Seed budgets (Food budget: 10,000, Shopping budget: 5,000)
    budgets = [
        {
            "user_id": user_id,
            "category": "Food",
            "monthly_budget": 10000.0,
            "created_at": now
        },
        {
            "user_id": user_id,
            "category": "Shopping",
            "monthly_budget": 5000.0,
            "created_at": now
        }
    ]
    await db["budgets"].insert_many(budgets)
    print("[+] Seeded category budgets.")

    # 3. Seed expenses
    expenses = [
        # This Week
        {
            "user_id": user_id,
            "title": "Swiggy lunch",
            "amount": 450.0,
            "category": "Food",
            "description": "Lunch ordered from Swiggy app",
            "date": now - timedelta(days=1),
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Amazon keyboard",
            "amount": 1200.0,
            "category": "Shopping",
            "description": "Bought mechanical keyboard from Amazon",
            "date": now - timedelta(days=2),
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Zomato dinner",
            "amount": 1800.0,
            "category": "Food",
            "description": "Dinner at local restaurant",
            "date": now - timedelta(days=3),
            "created_at": now
        },
        # Last Week
        {
            "user_id": user_id,
            "title": "Netflix subscription",
            "amount": 649.0,
            "category": "Entertainment",
            "description": "Premium 4K ultra hd monthly netflix subscription",
            "date": now - timedelta(days=9),
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Supermarket grocery",
            "amount": 8000.0,
            "category": "Food",
            "description": "Monthly grocery shopping at supermarket",
            "date": now - timedelta(days=10),
            "created_at": now
        },
        {
            "user_id": user_id,
            "title": "Fuel refill",
            "amount": 2500.0,
            "category": "Travel",
            "description": "Petrol refill for car",
            "date": now - timedelta(days=15),
            "created_at": now
        },
        # Older
        {
            "user_id": user_id,
            "title": "Rent payment",
            "amount": 15000.0,
            "category": "Others",
            "description": "Monthly apartment rent payment",
            "date": now - timedelta(days=40),
            "created_at": now
        }
    ]
    await db["expenses"].insert_many(expenses)
    print("[+] Seeded mock expenses.")
    
    print("[+] Seeding complete!")

if __name__ == "__main__":
    asyncio.run(main())
