import pytest
from datetime import datetime, timezone
import app.database
from app.services.budget_service import BudgetService
from app.schemas.budget_schema import BudgetCreate, BudgetUpdate

@pytest.mark.asyncio
async def test_budget_service_status_logic():
    assert BudgetService.calculate_budget_status(45.0) == "SAFE"
    assert BudgetService.calculate_budget_status(75.0) == "WARNING"
    assert BudgetService.calculate_budget_status(90.0) == "ALMOST EXCEEDED"
    assert BudgetService.calculate_budget_status(110.0) == "OVER BUDGET"

@pytest.mark.asyncio
async def test_budget_service_crud_and_alerts(test_user):
    user_id = test_user["user_id"]
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    
    # 1. Test budget creation
    budget_in_1 = BudgetCreate(category="Food", month=month, year=year, limit_amount=10000.0)
    budget_in_2 = BudgetCreate(category="Transport", month=month, year=year, limit_amount=5000.0)
    
    b1 = await BudgetService.create_budget(user_id, budget_in_1)
    b2 = await BudgetService.create_budget(user_id, budget_in_2)
    
    assert b1["category"] == "Food"
    assert b2["category"] == "Transport"
    
    # Check duplicate prevention
    with pytest.raises(Exception):
        await BudgetService.create_budget(user_id, budget_in_1)
        
    # 2. Add mock expenses
    cat_food = await app.database.db["categories"].insert_one({"name": "Food", "normalized_name": "food", "user_id": user_id})
    cat_transport = await app.database.db["categories"].insert_one({"name": "Transport", "normalized_name": "transport", "user_id": user_id})
    
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    mock_expenses = [
        {"user_id": user_id, "amount": 3500.0, "category_id": cat_food.inserted_id, "date": start_date, "title": "Groceries", "created_at": now},
        {"user_id": user_id, "amount": 800.0, "category_id": cat_food.inserted_id, "date": start_date, "title": "Lunch Out", "created_at": now},
        {"user_id": user_id, "amount": 4200.0, "category_id": cat_transport.inserted_id, "date": start_date, "title": "Train Pass", "created_at": now},
    ]
    await app.database.db["expenses"].insert_many(mock_expenses)
    
    # 3. Test budget list and progress
    list_budgets = await BudgetService.get_budgets_for_month(user_id, month, year)
    assert len(list_budgets) == 2
    for b in list_budgets:
        if b['category'] == "Food":
            assert b['spent_amount'] == 4300.0
            assert b['progress_percentage'] == 43.0
            assert b['status'] == "SAFE"
        elif b['category'] == "Transport":
            assert b['spent_amount'] == 4200.0
            assert b['progress_percentage'] == 84.0
            assert b['status'] == "ALMOST EXCEEDED"
            
    # 4. Test Update API
    updated = await BudgetService.update_budget(user_id, str(b2["_id"]), BudgetUpdate(limit_amount=4000.0))
    assert updated['limit_amount'] == 4000.0
    assert updated['progress_percentage'] == 105.0
    assert updated['status'] == "OVER BUDGET"
    
    # 5. Test Alerts Engine
    alerts = await BudgetService.get_budget_alerts(user_id)
    assert len(alerts) == 1
    assert alerts[0]['category'] == "Transport"
    assert alerts[0]['status'] == "over"
    
    # 6. Test deletion
    del_res = await BudgetService.delete_budget(user_id, str(b1["_id"]))
    assert del_res is True
