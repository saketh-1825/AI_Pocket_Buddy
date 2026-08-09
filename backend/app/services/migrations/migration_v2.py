import logging
from app.database import db
from bson import ObjectId
from app.services.category_service import CategoryService

logger = logging.getLogger("migration_v2")

class MigrationV2:
    @classmethod
    async def run(cls):
        logger.info("Starting Expense Category reference migration (V2)...")
        expense_col = db["expenses"]
        
        # Find all expenses where category_id is missing or is not an ObjectId
        expenses_cursor = expense_col.find({
            "$or": [
                {"category_id": {"$exists": False}},
                {"category_id": None}
            ]
        })
        
        migrated_count = 0
        async for expense in expenses_cursor:
            expense_id = expense["_id"]
            user_id = expense.get("user_id")
            category_name = expense.get("category")
            
            if not user_id or not category_name:
                continue
                
            try:
                # Retrieve user categories (seeds default list if empty)
                categories = await CategoryService.get_user_categories(user_id)
                
                # Try matching by name case-insensitively
                matched = next(
                    (c for c in categories if c["name"].lower().strip() == category_name.lower().strip()),
                    None
                )
                
                # Fallback to 'Others' if not matched
                if not matched:
                    matched = next(
                        (c for c in categories if c["name"].lower().strip() == "others"),
                        None
                    )
                
                if matched:
                    await expense_col.update_one(
                        {"_id": expense_id},
                        {"$set": {
                            "category_id": ObjectId(matched["id"])
                        }}
                    )
                    migrated_count += 1
            except Exception as e:
                logger.error(f"Failed to migrate expense '{expense_id}': {e}")
                
        logger.info(f"Expense Category reference migration (V2) completed. Migrated: {migrated_count} expenses.")
