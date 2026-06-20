from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.database import db
from app.schemas.category_schema import CategoryCreate, CategoryResponse
from app.utils.auth import get_current_user
from typing import List
from datetime import datetime

router = APIRouter()

category_collection = db["categories"]
expense_collection = db["expenses"]

# Keep track of index initialization
_index_initialized = False

async def ensure_indexes():
    global _index_initialized
    if not _index_initialized:
        try:
            await category_collection.create_index(
                [("user_id", 1), ("normalized_name", 1)],
                unique=True
            )
            _index_initialized = True
        except Exception as e:
            print("Failed to create compound unique index for categories:", e)

def category_helper(category) -> dict:
    return {
        "id": str(category["_id"]),
        "name": category["name"],
        "color": category["color"],
        "icon": category.get("icon", "FiFolder")
    }

# Default categories list (case-insensitive)
DEFAULT_CATEGORY_NAMES = ["food", "transport", "shopping", "entertainment", "health", "others"]

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(current_user: dict = Depends(get_current_user)):
    await ensure_indexes()
    user_id = str(current_user["_id"])
    categories = await category_collection.find({"user_id": user_id}).to_list(length=100)
    
    # If the user has no categories, seed the defaults
    if not categories:
        defaults = [
            {"name": "Food", "color": "Green", "icon": "Food"},
            {"name": "Transport", "color": "Blue", "icon": "Transport"},
            {"name": "Shopping", "color": "Purple", "icon": "Shopping"},
            {"name": "Entertainment", "color": "Orange", "icon": "Entertainment"},
            {"name": "Health", "color": "Pink", "icon": "Health"},
            {"name": "Others", "color": "Gray", "icon": "Others"}
        ]
        for d in defaults:
            d["user_id"] = user_id
            d["normalized_name"] = d["name"].lower().strip()
            d["created_at"] = datetime.utcnow()
        
        await category_collection.insert_many(defaults)
        categories = await category_collection.find({"user_id": user_id}).to_list(length=100)
        
    return [category_helper(cat) for cat in categories]

@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    await ensure_indexes()
    user_id = str(current_user["_id"])
    normalized_name = category.name.lower().strip()
    
    # Check uniqueness case-insensitively
    existing = await category_collection.find_one({
        "user_id": user_id,
        "normalized_name": normalized_name
    })
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Category '{category.name}' already exists."
        )
        
    cat_dict = category.model_dump()
    cat_dict["user_id"] = user_id
    cat_dict["normalized_name"] = normalized_name
    cat_dict["created_at"] = datetime.utcnow()
    
    result = await category_collection.insert_one(cat_dict)
    
    return {
        "message": "Category created",
        "id": str(result.inserted_id)
    }

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: dict = Depends(get_current_user)):
    await ensure_indexes()
    user_id = str(current_user["_id"])
    
    # Find the category to get its name
    cat = await category_collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if not cat:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )
        
    category_name = cat["name"]
    normalized_name = cat.get("normalized_name", category_name.lower().strip())
    
    # Rule: Protect Default Categories
    if normalized_name in DEFAULT_CATEGORY_NAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Default categories cannot be deleted."
        )
        
    # Update all expenses using this category to "Others"
    await expense_collection.update_many(
        {"user_id": user_id, "category": category_name},
        {"$set": {"category": "Others"}}
    )
    
    # Delete category document
    await category_collection.delete_one({"_id": ObjectId(category_id)})
    
    return {
        "message": f"Category '{category_name}' deleted. Matching expenses moved to 'Others'."
    }

@router.patch("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate, current_user: dict = Depends(get_current_user)):
    await ensure_indexes()
    user_id = str(current_user["_id"])
    
    cat = await category_collection.find_one({
        "_id": ObjectId(category_id),
        "user_id": user_id
    })
    
    if not cat:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )
        
    old_name = cat["name"]
    old_normalized = cat.get("normalized_name", old_name.lower().strip())
    new_normalized = category.name.lower().strip()
    
    # Protect Default Categories from updates
    if old_normalized in DEFAULT_CATEGORY_NAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Default categories cannot be renamed or modified."
        )
        
    # Check for duplicates if the name is changing
    if old_normalized != new_normalized:
        existing = await category_collection.find_one({
            "user_id": user_id,
            "normalized_name": new_normalized
        })
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Category '{category.name}' already exists."
            )
            
    # Update matching expenses with new name
    if old_name != category.name:
        await expense_collection.update_many(
            {"user_id": user_id, "category": old_name},
            {"$set": {"category": category.name}}
        )
        
    # Update category details
    await category_collection.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": {
            "name": category.name,
            "color": category.color,
            "icon": category.icon,
            "normalized_name": new_normalized
        }}
    )
    
    return {
        "message": "Category updated successfully"
    }
