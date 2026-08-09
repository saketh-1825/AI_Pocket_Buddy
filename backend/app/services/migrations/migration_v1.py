import logging
from app.services.budget_migration_service import BudgetMigrationService

logger = logging.getLogger("migration_v1")

class MigrationV1:
    @classmethod
    async def run(cls):
        logger.info("Starting Budget v2 Schema migration (V1)...")
        await BudgetMigrationService.run()
        logger.info("Budget v2 Schema migration (V1) completed.")
