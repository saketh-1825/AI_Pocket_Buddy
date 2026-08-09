import logging
from app.utils.database import db

logger = logging.getLogger("index_manager")

class IndexManager:
    @classmethod
    def _normalize_key(cls, key):
        if key is None:
            return None
        # PyMongo might return key as a list of lists or list of tuples; normalize to a list of tuples
        return [(str(k), int(v)) for k, v in key]

    @classmethod
    def _normalize_pfe(cls, pfe):
        if pfe is None:
            return None
        # Recursively convert SON / dict to standard dict for robust comparison
        if isinstance(pfe, dict):
            return {k: cls._normalize_pfe(v) for k, v in pfe.items()}
        if hasattr(pfe, "items"): # Handles pymongo.bson.SON or similar mapping types
            return {k: cls._normalize_pfe(v) for k, v in pfe.items()}
        return pfe

    @classmethod
    async def ensure_indexes(cls):
        """
        Inspects existing indexes on expenses and budgets collections.
        Drops obsolete indexes and recreates/ensures them only when properties differ or are missing.
        """
        logger.info("Verifying and ensuring database indexes...")

        # 1. Expenses Collection
        expenses_col = db["expenses"]
        try:
            existing_expenses = await expenses_col.index_information()
            expected_expenses = {
                "user_id_1_date_-1": [("user_id", 1), ("date", -1)],
                "user_id_1_category_1": [("user_id", 1), ("category", 1)],
                "date_-1": [("date", -1)]
            }
            
            for name, key in expected_expenses.items():
                if name not in existing_expenses:
                    await expenses_col.create_index(key, name=name)
                    logger.info(f"Created missing index '{name}' on expenses.")
        except Exception as e:
            logger.error(f"Failed to ensure indexes on expenses collection: {e}", exc_info=True)
            raise e

        # 2. Budgets Collection
        budgets_col = db["budgets"]
        try:
            existing_budgets = await budgets_col.index_information()
            
            # Drop legacy indexes
            legacy_indexes = [
                "user_id_1_month_1_year_1",
                "user_id_1_category_1",
                "user_id_1_month_1_year_1_monthly_budget_exists"
            ]
            for idx_name in legacy_indexes:
                if idx_name in existing_budgets:
                    try:
                        await budgets_col.drop_index(idx_name)
                        logger.info(f"Dropped obsolete legacy index '{idx_name}' from budgets.")
                    except Exception as e:
                        logger.warning(f"Failed to drop legacy index '{idx_name}': {e}")

            # Expected budgets indexes
            expected_budgets = {
                "user_id_1_category_1_month_1_year_1": {
                    "key": [("user_id", 1), ("category", 1), ("month", 1), ("year", 1)],
                    "unique": True,
                    "partialFilterExpression": {"category": {"$exists": True}, "is_active": True}
                },
                "user_id_1_month_1_year_1_unique_monthly": {
                    "key": [("user_id", 1), ("month", 1), ("year", 1)],
                    "unique": True,
                    "partialFilterExpression": {"monthly_budget": {"$exists": True}, "is_active": True}
                },
                "user_id_1_month_1_year_1_lookup": {
                    "key": [("user_id", 1), ("month", 1), ("year", 1)],
                    "unique": False,
                    "partialFilterExpression": None
                }
            }

            for name, spec in expected_budgets.items():
                need_recreate = False
                
                if name in existing_budgets:
                    info = existing_budgets[name]
                    
                    # 1. Compare Key
                    norm_existing_key = cls._normalize_key(info.get("key"))
                    norm_expected_key = cls._normalize_key(spec["key"])
                    if norm_existing_key != norm_expected_key:
                        need_recreate = True
                        logger.info(f"Index '{name}' key mismatch. Existing: {norm_existing_key}, Expected: {norm_expected_key}")
                    
                    # 2. Compare Unique flag
                    if bool(info.get("unique", False)) != bool(spec["unique"]):
                        need_recreate = True
                        logger.info(f"Index '{name}' unique flag mismatch. Existing: {info.get('unique')}, Expected: {spec['unique']}")
                    
                    # 3. Compare Partial Filter Expression
                    norm_existing_pfe = cls._normalize_pfe(info.get("partialFilterExpression"))
                    norm_expected_pfe = cls._normalize_pfe(spec["partialFilterExpression"])
                    if norm_existing_pfe != norm_expected_pfe:
                        need_recreate = True
                        logger.info(f"Index '{name}' partialFilterExpression mismatch. Existing: {norm_existing_pfe}, Expected: {norm_expected_pfe}")
                else:
                    need_recreate = True
                    logger.info(f"Index '{name}' is missing on budgets.")

                if need_recreate:
                    if name in existing_budgets:
                        logger.info(f"Dropping index '{name}' for recreation...")
                        try:
                            await budgets_col.drop_index(name)
                        except Exception as e:
                            logger.warning(f"Could not drop index '{name}' before recreation: {e}")
                    
                    # Recreate/Create index
                    kwargs = {"name": name}
                    if spec["unique"]:
                        kwargs["unique"] = True
                    if spec["partialFilterExpression"]:
                        kwargs["partialFilterExpression"] = spec["partialFilterExpression"]
                    
                    await budgets_col.create_index(spec["key"], **kwargs)
                    logger.info(f"Successfully created/updated index '{name}' on budgets.")
            
            logger.info("Budgets indexes verified and ensured.")
        except Exception as e:
            logger.error(f"Failed to ensure indexes on budgets collection: {e}", exc_info=True)
            raise e

        # 3. Categories Collection
        categories_col = db["categories"]
        try:
            existing_categories = await categories_col.index_information()
            
            # Drop legacy index
            legacy_idx = "user_id_1_normalized_name_1"
            if legacy_idx in existing_categories:
                try:
                    await categories_col.drop_index(legacy_idx)
                    logger.info(f"Dropped legacy categories index '{legacy_idx}'.")
                except Exception as e:
                    logger.warning(f"Could not drop legacy categories index '{legacy_idx}': {e}")
            
            # Expected active categories indexes
            expected_categories = {
                "user_id_1_normalized_name_1_unique_active": {
                    "key": [("user_id", 1), ("normalized_name", 1)],
                    "unique": True,
                    "partialFilterExpression": {"deleted_at": None}
                },
                "user_id_1_is_default_1": {
                    "key": [("user_id", 1), ("is_default", 1)],
                    "unique": False,
                    "partialFilterExpression": None
                },
                "user_id_1_ai_group_1": {
                    "key": [("user_id", 1), ("ai_group", 1)],
                    "unique": False,
                    "partialFilterExpression": None
                },
                "user_id_1_deleted_at_1": {
                    "key": [("user_id", 1), ("deleted_at", 1)],
                    "unique": False,
                    "partialFilterExpression": None
                }
            }

            for name, spec in expected_categories.items():
                if name not in existing_categories:
                    kwargs = {"name": name}
                    if spec["unique"]:
                        kwargs["unique"] = True
                    if spec["partialFilterExpression"]:
                        kwargs["partialFilterExpression"] = spec["partialFilterExpression"]
                    
                    await categories_col.create_index(spec["key"], **kwargs)
                    logger.info(f"Successfully created categories index '{name}'.")
            
            logger.info("Categories indexes verified and ensured.")
        except Exception as e:
            logger.error(f"Failed to ensure indexes on categories collection: {e}", exc_info=True)
            raise e

