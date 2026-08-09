import logging
from app.services.migration_service import MigrationService
from app.services.migrations.migration_v1 import MigrationV1
from app.services.migrations.migration_v2 import MigrationV2

logger = logging.getLogger("migration_runner")

class MigrationRunner:
    @classmethod
    async def run(cls):
        logger.info("Initializing migration runner...")
        
        # 1. Budget Schema Migration (v1)
        v1_name = "budget_v2_schema"
        if not await MigrationService.is_migration_completed(v1_name):
            logger.info(f"Running migration: {v1_name}...")
            await MigrationV1.run()
            await MigrationService.mark_migration_completed(v1_name)
            logger.info(f"Migration '{v1_name}' finished.")
        else:
            logger.info(f"Migration '{v1_name}' already completed.")

        # 2. Expense Category ID Migration (v2)
        v2_name = "expense_category_objectid_ref"
        if not await MigrationService.is_migration_completed(v2_name):
            logger.info(f"Running migration: {v2_name}...")
            await MigrationV2.run()
            await MigrationService.mark_migration_completed(v2_name)
            logger.info(f"Migration '{v2_name}' finished.")
        else:
            logger.info(f"Migration '{v2_name}' already completed.")
