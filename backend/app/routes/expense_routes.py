from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database import db
from app.schemas.expense_schema import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse
)
from app.models.expense_model import expense_helper
from app.utils.auth import get_current_user
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()

expense_collection = db["expenses"]

@router.post("/expenses")
async def create_expense(
    expense: ExpenseCreate,
    current_user: dict = Depends(get_current_user)
):

    expense_dict = expense.model_dump()

    expense_dict["user_id"] = str(current_user["_id"])
    expense_dict["created_at"] = datetime.now(timezone.utc)

    result = await expense_collection.insert_one(expense_dict)

    return {
        "message": "Expense created",
        "id": str(result.inserted_id)
    }

@router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    category: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):

    query = {
        "user_id": str(current_user["_id"])
    }

    if category:
        query["category"] = category

    if min_amount or max_amount:
        query["amount"] = {}

        if min_amount:
            query["amount"]["$gte"] = min_amount

        if max_amount:
            query["amount"]["$lte"] = max_amount

    if start_date or end_date:
        query["date"] = {}

        if start_date:
            query["date"]["$gte"] = start_date

        if end_date:
            query["date"]["$lte"] = end_date

    expenses = await expense_collection.find(query).to_list(length=100)

    return [
        expense_helper(expense)
        for expense in expenses
    ]

@router.patch("/expenses/{expense_id}")
async def update_expense(
    expense_id: str,
    expense: ExpenseUpdate,
    current_user: dict = Depends(get_current_user)
):

    existing_expense = await expense_collection.find_one({
        "_id": ObjectId(expense_id),
        "user_id": str(current_user["_id"])
    })

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    update_data = expense.model_dump(exclude_none=True)

    await expense_collection.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": update_data}
    )

    return {
        "message": "Expense updated"
    }

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user)
):

    result = await expense_collection.delete_one({
        "_id": ObjectId(expense_id),
        "user_id": str(current_user["_id"])
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    return {
        "message": "Expense deleted"
    }