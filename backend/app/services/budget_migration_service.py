import logging
from datetime import datetime, timezone
from app.utils.database import db

logger = logging.getLogger("budget_migration_service")

class BudgetMigrationService:
    @classmethod
    async def run(cls):
        """
        Executes the budget v2 schema migration.
        - Normalizes existing valid documents as 'is_active': True if not archived.
        - Renames 'monthly_budget' to 'limit_amount' for category budgets.
        - Identifies and migrates documents missing 'month' or 'year'.
        - Resolves duplicates by archiving older records rather than deleting/renaming fields.
        """
        logger.info("Initializing budget v2 schema migration...")
        now = datetime.now(timezone.utc)
        budget_col = db["budgets"]

        # Step 0: Temporarily drop unique indexes to prevent conflict during migration updates
        try:
            existing_indexes = await budget_col.index_information()
            for idx_name in [
                "user_id_1_category_1_month_1_year_1",
                "user_id_1_month_1_year_1_unique_monthly"
            ]:
                if idx_name in existing_indexes:
                    await budget_col.drop_index(idx_name)
                    logger.info(f"Temporarily dropped unique index '{idx_name}' for migration.")
        except Exception as e:
            logger.warning(f"Failed to temporarily drop unique index: {e}")

        # Step 1: Ensure all existing budgets have standard active/archived state fields
        try:
            # Mark all non-archived budgets as active
            await budget_col.update_many(
                {"is_archived": {"$ne": True}},
                {"$set": {"is_active": True}}
            )
            # Mark all archived budgets as inactive
            await budget_col.update_many(
                {"is_archived": True},
                {"$set": {"is_active": False}}
            )
            logger.info("Active/Inactive budget flags initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize active/archived flags: {e}", exc_info=True)
            raise e

        # Step 2: Rename legacy monthly_budget -> limit_amount for category budgets
        try:
            rename_filter = {
                "category": {"$exists": True},
                "monthly_budget": {"$exists": True},
                "is_archived": {"$ne": True}
            }
            rename_count = 0
            async for doc in budget_col.find(rename_filter):
                await budget_col.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$rename": {"monthly_budget": "limit_amount"},
                        "$set": {"updated_at": now}
                    }
                )
                rename_count += 1
            if rename_count > 0:
                logger.info(f"Renamed legacy monthly_budget field in {rename_count} category budgets.")
        except Exception as e:
            logger.error(f"Failed to rename monthly_budget to limit_amount: {e}", exc_info=True)
            raise e

        # Step 3: Find documents missing month or year
        migration_filter = {
            "$or": [
                {"month": None},
                {"month": {"$exists": False}},
                {"year": None},
                {"year": {"$exists": False}}
            ]
        }

        try:
            migrated_count = 0
            archived_count = 0
            
            async for doc in budget_col.find(migration_filter):
                doc_id = doc["_id"]
                user_id = doc.get("user_id")
                
                # Determine correct target month and year historically
                created_at = doc.get("created_at")
                updated_at = doc.get("updated_at")
                
                if isinstance(created_at, datetime):
                    target_month = created_at.month
                    target_year = created_at.year
                elif isinstance(updated_at, datetime):
                    target_month = updated_at.month
                    target_year = updated_at.year
                else:
                    # Fallback to ObjectId generation timestamp
                    gen_time = doc_id.generation_time
                    target_month = gen_time.month
                    target_year = gen_time.year
                
                category = doc.get("category")
                is_category_budget = category is not None
                
                if is_category_budget:
                    # Check for duplicate active category budget
                    duplicate_filter = {
                        "user_id": user_id,
                        "category": category,
                        "month": target_month,
                        "year": target_year,
                        "is_active": True,
                        "_id": {"$ne": doc_id}
                    }
                    existing_active = await budget_col.find_one(duplicate_filter)
                    
                    if existing_active:
                        # Determine newest document
                        doc_time = created_at or doc_id.generation_time
                        existing_time = existing_active.get("created_at") or existing_active["_id"].generation_time
                        
                        if doc_time > existing_time:
                            # Current document is newer. Archive the existing one.
                            logger.warning(
                                f"Archiving duplicate active category budget '{existing_active['_id']}' "
                                f"in favor of newer migrating budget '{doc_id}' (User: {user_id}, "
                                f"Category: '{category}', Period: {target_month}/{target_year})."
                            )
                            await budget_col.update_one(
                                {"_id": existing_active["_id"]},
                                {
                                    "$set": {
                                        "is_active": False,
                                        "is_archived": True,
                                        "migration_reason": "Obsolete duplicate category budget (older)",
                                        "migrated_at": now
                                    }
                                }
                            )
                            # Migrate current document
                            await budget_col.update_one(
                                {"_id": doc_id},
                                {
                                    "$set": {
                                        "month": target_month,
                                        "year": target_year,
                                        "is_active": True,
                                        "is_archived": False,
                                        "updated_at": now
                                    }
                                }
                            )
                            migrated_count += 1
                            archived_count += 1
                        else:
                            # Existing document is newer. Archive current document.
                            logger.warning(
                                f"Archiving older migrating category budget '{doc_id}' "
                                f"in favor of newer active budget '{existing_active['_id']}' (User: {user_id}, "
                                f"Category: '{category}', Period: {target_month}/{target_year})."
                            )
                            await budget_col.update_one(
                                {"_id": doc_id},
                                {
                                    "$set": {
                                        "month": target_month,
                                        "year": target_year,
                                        "is_active": False,
                                        "is_archived": True,
                                        "migration_reason": "Obsolete duplicate category budget (older)",
                                        "migrated_at": now
                                    }
                                }
                            )
                            archived_count += 1
                    else:
                        # Migrate normally
                        await budget_col.update_one(
                            {"_id": doc_id},
                            {
                                "$set": {
                                    "month": target_month,
                                    "year": target_year,
                                    "is_active": True,
                                    "is_archived": False,
                                    "updated_at": now
                                }
                            }
                        )
                        migrated_count += 1
                else:
                    # Overall monthly budget
                    # Check for duplicate active overall monthly budget
                    duplicate_filter = {
                        "user_id": user_id,
                        "month": target_month,
                        "year": target_year,
                        "monthly_budget": {"$exists": True},
                        "is_active": True,
                        "_id": {"$ne": doc_id}
                    }
                    existing_active = await budget_col.find_one(duplicate_filter)
                    
                    if existing_active:
                        # Determine newest document
                        doc_time = created_at or doc_id.generation_time
                        existing_time = existing_active.get("created_at") or existing_active["_id"].generation_time
                        
                        if doc_time > existing_time:
                            # Current document is newer. Archive existing.
                            logger.warning(
                                f"Archiving duplicate active overall budget '{existing_active['_id']}' "
                                f"in favor of newer migrating budget '{doc_id}' (User: {user_id}, "
                                f"Period: {target_month}/{target_year})."
                            )
                            await budget_col.update_one(
                                {"_id": existing_active["_id"]},
                                {
                                    "$set": {
                                        "is_active": False,
                                        "is_archived": True,
                                        "migration_reason": "Obsolete duplicate overall budget (older)",
                                        "migrated_at": now
                                    }
                                }
                            )
                            # Migrate current document
                            await budget_col.update_one(
                                {"_id": doc_id},
                                {
                                    "$set": {
                                        "month": target_month,
                                        "year": target_year,
                                        "is_active": True,
                                        "is_archived": False,
                                        "updated_at": now
                                    }
                                }
                            )
                            migrated_count += 1
                            archived_count += 1
                        else:
                            # Existing document is newer. Archive current document.
                            logger.warning(
                                f"Archiving older migrating overall budget '{doc_id}' "
                                f"in favor of newer active budget '{existing_active['_id']}' (User: {user_id}, "
                                f"Period: {target_month}/{target_year})."
                            )
                            await budget_col.update_one(
                                {"_id": doc_id},
                                {
                                    "$set": {
                                        "month": target_month,
                                        "year": target_year,
                                        "is_active": False,
                                        "is_archived": True,
                                        "migration_reason": "Obsolete duplicate overall budget (older)",
                                        "migrated_at": now
                                    }
                                }
                            )
                            archived_count += 1
                    else:
                        # Migrate normally
                        await budget_col.update_one(
                            {"_id": doc_id},
                            {
                                "$set": {
                                    "month": target_month,
                                    "year": target_year,
                                    "is_active": True,
                                    "is_archived": False,
                                    "updated_at": now
                                }
                            }
                        )
                        migrated_count += 1
            
            logger.info(f"Budget migration completed. Migrated: {migrated_count}, Archived: {archived_count} documents.")
        except Exception as e:
            logger.error(f"Failed to process budget documents during migration: {e}", exc_info=True)
            raise e
