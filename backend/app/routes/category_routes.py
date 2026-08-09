from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.category_schema import CategoryCreate, CategoryResponse
from app.services.category_service import CategoryService
from app.utils.auth import get_current_user
from typing import List

router = APIRouter()

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await CategoryService.get_user_categories(user_id)

@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    category_data = category.model_dump()
    return await CategoryService.create_user_category(user_id, category_data)

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await CategoryService.soft_delete_category(user_id, category_id)

@router.post("/categories/{category_id}/restore")
async def restore_category(category_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await CategoryService.restore_category(user_id, category_id)

@router.patch("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    category_data = category.model_dump()
    return await CategoryService.update_user_category(user_id, category_id, category_data)
