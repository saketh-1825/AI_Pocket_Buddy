from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database import db
from app.schemas.budget_schema import BudgetUpdate, BudgetCheckResponse
from app.utils.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter()
budget_collection = db["budgets"]

@router.on_event("startup")
async def create_indexes():
    await budget_collection.create_index(
        [("user_id", 1), ("month", 1), ("year", 1)],
        unique=True
    )

@router.get("/budget/current", response_model=BudgetCheckResponse)
async def get_current_budget(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    user_id = str(current_user["_id"])
    
    budget = await budget_collection.find_one({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    if not budget:
        return {
            "exists": False,
            "month": month,
            "year": year
        }
        
    return {
        "exists": True,
        "monthly_budget": float(budget["monthly_budget"]),
        "month": int(budget["month"]),
        "year": int(budget["year"])
    }

@router.patch("/budget/current", response_model=BudgetCheckResponse)
async def update_current_budget(
    budget_data: BudgetUpdate,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    user_id = str(current_user["_id"])
    
    existing = await budget_collection.find_one({
        "user_id": user_id,
        "month": month,
        "year": year
    })
    
    now_time = datetime.now(timezone.utc)
    if not existing:
        new_budget = {
            "user_id": user_id,
            "monthly_budget": budget_data.monthly_budget,
            "month": month,
            "year": year,
            "created_at": now_time,
            "updated_at": now_time
        }
        await budget_collection.insert_one(new_budget)
    else:
        await budget_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "monthly_budget": budget_data.monthly_budget,
                    "updated_at": now_time
                }
            }
        )
    
    return {
        "exists": True,
        "monthly_budget": float(budget_data.monthly_budget),
        "month": month,
        "year": year
    }

