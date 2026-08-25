import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId

# Ensure we use test or actual db
os.environ["MONGO_URL"] = "mongodb+srv://saketh:saketh@cluster0.p71o9.mongodb.net/expense_tracker?retryWrites=true&w=majority&appName=Cluster0"

from app.services.budget_service import BudgetService
from app.database import db

async def test():
    # Find a test user
    user = await db.users.find_one()
    if not user:
        print("No users found.")
        return
    user_id = str(user["_id"])
    print(f"Testing for user: {user_id}")
    
    # 1. Fetch current budget
    now = datetime.now(timezone.utc)
    budgets = await BudgetService.get_budgets_for_month(user_id, now.month, now.year)
    print("Before adding expense:")
    for b in budgets:
        print(f"Category: {b['category']}, Spent: {b['spent_amount']}, Limit: {b['limit_amount']}")
        
    # 2. Add an expense for a category that has a budget
    if not budgets:
        print("No budgets found to test.")
        return
        
    test_budget = budgets[0]
    category_name = test_budget["category"]
    
    # find category id
    from app.services.category_service import CategoryService
    cats = await CategoryService.get_user_categories(user_id)
    cat_id = next((c["id"] for c in cats if c["name"].lower() == category_name.lower()), None)
    
    if not cat_id:
        print("Category not found")
        return
        
    # Add expense
    expense = {
        "user_id": user_id,
        "title": "Test Expense",
        "description": "Test",
        "amount": 100.0,
        "category_id": ObjectId(cat_id),
        "date": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    res = await db.expenses.insert_one(expense)
    print(f"Added expense: {res.inserted_id} for {category_name}")
    
    # 3. Fetch budget again
    budgets = await BudgetService.get_budgets_for_month(user_id, now.month, now.year)
    print("After adding expense:")
    for b in budgets:
        print(f"Category: {b['category']}, Spent: {b['spent_amount']}, Limit: {b['limit_amount']}")
        
    # cleanup
    await db.expenses.delete_one({"_id": res.inserted_id})

if __name__ == "__main__":
    asyncio.run(test())
