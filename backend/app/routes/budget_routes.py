import sys
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from typing import List, Optional
from datetime import datetime, timezone
from app.utils.auth import get_current_user
from app.utils.database import db
from app.schemas.budget_schema import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetAlertsResponse,
    LegacyBudgetCheckResponse,
    LegacyBudgetUpdate
)
from app.services.budget_service import BudgetService

router = APIRouter()
budget_collection = db["budgets"]

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii'))
        except Exception:
            print(text.replace("✓", "[Done]"))


# --- Legacy Overall Budget Endpoints (for backward compatibility) ---

@router.get("/budget/current", response_model=LegacyBudgetCheckResponse)
async def get_current_budget(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    user_id = str(current_user["_id"])
    
    budget = await budget_collection.find_one({
        "user_id": user_id,
        "month": month,
        "year": year,
        "monthly_budget": {"$exists": True},
        "is_archived": {"$ne": True}
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

@router.patch("/budget/current", response_model=LegacyBudgetCheckResponse)
async def update_current_budget(
    budget_data: LegacyBudgetUpdate,
    current_user: dict = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    user_id = str(current_user["_id"])
    
    existing = await budget_collection.find_one({
        "user_id": user_id,
        "month": month,
        "year": year,
        "monthly_budget": {"$exists": True},
        "is_archived": {"$ne": True}
    })
    
    now_time = datetime.now(timezone.utc)
    if not existing:
        new_budget = {
            "user_id": user_id,
            "monthly_budget": budget_data.monthly_budget,
            "month": month,
            "year": year,
            "is_active": True,
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
                    "is_active": True,
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


# --- New Category Budget CRUD & Alert Endpoints ---

@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_category_budget(
    budget_data: BudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    result = await BudgetService.create_budget(user_id, budget_data)
    # Fetch details with spent amount computed
    return await BudgetService.get_budget_by_id(user_id, str(result["_id"]))

@router.get("/budgets", response_model=List[BudgetResponse])
async def get_category_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    if month is None or year is None:
        now = datetime.now(timezone.utc)
        month = month or now.month
        year = year or now.year
    return await BudgetService.get_budgets_for_month(user_id, month, year)

@router.get("/budgets/alerts", response_model=BudgetAlertsResponse)
async def get_budgets_alerts_endpoint(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)
    month = now.month
    year = now.year
    
    budgets = await BudgetService.get_budgets_for_month(user_id, month, year)
    
    warning_list = []
    over_list = []
    safe_list = []
    
    for b in budgets:
        status_label = b["status"]
        if status_label == "SAFE":
            safe_list.append(b)
        elif status_label in ("WARNING", "ALMOST EXCEEDED"):
            warning_list.append(b)
        elif status_label == "OVER BUDGET":
            over_list.append(b)
            
    return {
        "warning": warning_list,
        "over": over_list,
        "safe": safe_list
    }

# Endpoint for alerts array consumed by notification engines
@router.get("/budgets/active-alerts")
async def get_active_alerts(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await BudgetService.get_budget_alerts(user_id)

@router.get("/budgets/summary")
async def get_monthly_budget_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    if month is None or year is None:
        now = datetime.now(timezone.utc)
        month = month or now.month
        year = year or now.year
    return await BudgetService.get_budget_summary(user_id, month, year)

@router.get("/budgets/{id}", response_model=BudgetResponse)
async def get_single_budget(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    return await BudgetService.get_budget_by_id(user_id, id)

@router.patch("/budgets/{id}", response_model=BudgetResponse)
async def update_category_budget_endpoint(
    id: str,
    budget_data: BudgetUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    return await BudgetService.update_budget(user_id, id, budget_data)

@router.delete("/budgets/{id}")
async def delete_category_budget_endpoint(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    success = await BudgetService.delete_budget(user_id, id)
    return {"success": success, "message": "Budget deleted successfully"}
