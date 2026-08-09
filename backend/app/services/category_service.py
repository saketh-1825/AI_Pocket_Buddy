import logging
from datetime import datetime, timezone
from bson import ObjectId
from app.database import db
from fastapi import HTTPException, status

logger = logging.getLogger("category_service")

category_collection = db["categories"]
expense_collection = db["expenses"]

# Predefined mapping for automatic AI Group based on icon_key
AI_GROUP_MAP = {
    "food": "Food & Dining",
    "coffee": "Food & Dining",
    "shopping": "Shopping",
    "bills": "Bills & Utilities",
    "subscriptions": "Bills & Utilities",
    "travel": "Transportation & Travel",
    "car": "Transportation & Travel",
    "fuel": "Transportation & Travel",
    "health": "Health & Fitness",
    "medicine": "Health & Fitness",
    "movie": "Entertainment",
    "gift": "Gifts & Donations",
    "home": "Home & Living",
    "education": "Education",
    "pets": "Lifestyle",
    "investment": "Financial Investments",
    "salary": "Income",
    "freelance": "Income",
    "tax": "Taxes",
    "others": "Miscellaneous"
}

def category_helper(cat) -> dict:
    return {
        "id": str(cat["_id"]),
        "name": cat["name"],
        "normalized_name": cat.get("normalized_name", cat["name"].lower().strip()),
        "icon_key": cat.get("icon_key", "others"),
        "color": cat.get("color", "#94A3B8"),
        "is_default": cat.get("is_default", False),
        "ai_group": cat.get("ai_group", "Miscellaneous"),
        "display_order": cat.get("display_order", 999),
        "created_at": cat.get("created_at"),
        "updated_at": cat.get("updated_at"),
        "deleted_at": cat.get("deleted_at")
    }

class CategoryService:
    @staticmethod
    async def get_user_categories(user_id: str) -> list:
        # Load only non-deleted categories
        categories = await category_collection.find({
            "user_id": user_id,
            "deleted_at": None
        }).to_list(length=100)
        
        # Seed defaults if empty
        if not categories:
            defaults = [
                {"name": "Food", "color": "#F97316", "icon_key": "food", "is_default": True, "display_order": 1},
                {"name": "Shopping", "color": "#8B5CF6", "icon_key": "shopping", "is_default": True, "display_order": 2},
                {"name": "Bills", "color": "#64748B", "icon_key": "bills", "is_default": True, "display_order": 3},
                {"name": "Travel", "color": "#0EA5E9", "icon_key": "travel", "is_default": True, "display_order": 4},
                {"name": "Entertainment", "color": "#EC4899", "icon_key": "movie", "is_default": True, "display_order": 5},
                {"name": "Health", "color": "#22C55E", "icon_key": "health", "is_default": True, "display_order": 6},
                {"name": "Others", "color": "#94A3B8", "icon_key": "others", "is_default": True, "display_order": 7}
            ]
            now = datetime.utcnow()
            for d in defaults:
                d["user_id"] = user_id
                d["normalized_name"] = d["name"].lower().strip()
                d["ai_group"] = AI_GROUP_MAP.get(d["icon_key"], "Miscellaneous")
                d["created_at"] = now
                d["updated_at"] = now
                d["deleted_at"] = None
                
            await category_collection.insert_many(defaults)
            categories = await category_collection.find({
                "user_id": user_id,
                "deleted_at": None
            }).to_list(length=100)
            
        return [category_helper(c) for c in categories]

    @staticmethod
    async def create_user_category(user_id: str, category_data: dict) -> dict:
        name = category_data["name"]
        normalized_name = name.lower().strip()
        icon_key = category_data.get("icon_key", "others").lower().strip()
        color = category_data.get("color", "#94A3B8")
        
        # Check active duplicates (where deleted_at is null)
        existing = await category_collection.find_one({
            "user_id": user_id,
            "normalized_name": normalized_name,
            "deleted_at": None
        })
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Category '{name}' already exists."
            )
            
        now = datetime.utcnow()
        cat_doc = {
            "user_id": user_id,
            "name": name,
            "normalized_name": normalized_name,
            "icon_key": icon_key,
            "color": color,
            "is_default": False,
            "ai_group": AI_GROUP_MAP.get(icon_key, "Lifestyle"),
            "display_order": 999,
            "created_at": now,
            "updated_at": now,
            "deleted_at": None
        }
        
        result = await category_collection.insert_one(cat_doc)
        return {
            "message": "Category created",
            "id": str(result.inserted_id)
        }

    @staticmethod
    async def soft_delete_category(user_id: str, category_id: str) -> dict:
        cat = await category_collection.find_one({
            "_id": ObjectId(category_id),
            "user_id": user_id
        })
        if not cat:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )
            
        if cat.get("is_default", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Default categories cannot be deleted."
            )
            
        # Get or seed user categories to locate Others
        user_cats = await CategoryService.get_user_categories(user_id)
        others_cat = next((c for c in user_cats if c["name"].lower() == "others"), None)
        
        if not others_cat:
            raise HTTPException(
                status_code=500,
                detail="System default 'Others' category not found."
            )
            
        others_oid = ObjectId(others_cat["id"])
        category_oid = ObjectId(category_id)
        
        # Soft delete the category
        now = datetime.utcnow()
        await category_collection.update_one(
            {"_id": category_oid},
            {"$set": {
                "deleted_at": now,
                "updated_at": now
            }}
        )
        
        # Migrate all expenses using this category to "Others" and keep a transient backup link
        await expense_collection.update_many(
            {"user_id": user_id, "category_id": category_oid},
            {"$set": {
                "category_id": others_oid,
                "previous_category_id": category_oid
            }}
        )
        
        return {
            "message": f"Category '{cat['name']}' soft-deleted. Expenses migrated to 'Others'."
        }

    @staticmethod
    async def restore_category(user_id: str, category_id: str) -> dict:
        category_oid = ObjectId(category_id)
        cat = await category_collection.find_one({
            "_id": category_oid,
            "user_id": user_id
        })
        if not cat:
            raise HTTPException(
                status_code=404,
                detail="Category not found"
            )
            
        # Revert soft delete status
        await category_collection.update_one(
            {"_id": category_oid},
            {"$set": {
                "deleted_at": None,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Revert expense category migration for any matching expenses
        await expense_collection.update_many(
            {"user_id": user_id, "previous_category_id": category_oid},
            {
                "$set": {"category_id": category_oid},
                "$unset": {"previous_category_id": ""}
            }
        )
        
        return {
            "message": f"Category '{cat['name']}' successfully restored."
        }
