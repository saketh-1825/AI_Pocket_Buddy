import pytest
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError
import app.database
from app.services.index_manager import IndexManager

@pytest.mark.asyncio
async def test_budget_indexes_prevent_duplicates(test_user):
    user_id = test_user["user_id"]
    month = 6
    year = 2026
    
    # Initialize indexes
    await IndexManager.ensure_indexes()
    
    now = datetime.now(timezone.utc)
    
    # Clean previous just in case
    await app.database.db["budgets"].delete_many({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    # Test 1: Insert Category Budget
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
    await app.database.db["budgets"].insert_one(doc1)
    
    # Test 2: Insert Duplicate Category Budget - Should Raise Error
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
    with pytest.raises(DuplicateKeyError):
        await app.database.db["budgets"].insert_one(doc2)
        
    # Test 3: Insert Overall Monthly Budget
    doc3 = {
        "user_id": user_id,
        "monthly_budget": 50000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await app.database.db["budgets"].insert_one(doc3)
    
    # Test 4: Insert Duplicate Overall Monthly Budget - Should Raise Error
    doc4 = {
        "user_id": user_id,
        "monthly_budget": 60000.0,
        "month": month,
        "year": year,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    with pytest.raises(DuplicateKeyError):
        await app.database.db["budgets"].insert_one(doc4)
