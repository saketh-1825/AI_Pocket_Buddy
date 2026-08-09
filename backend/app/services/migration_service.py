import logging
from datetime import datetime, timezone
from app.utils.database import db

logger = logging.getLogger("migration_service")

class MigrationService:
    @classmethod
    async def is_migration_completed(cls, migration_name: str) -> bool:
        """
        Check if a specific migration has already been executed successfully.
        """
        try:
            doc = await db["system_migrations"].find_one({"migration": migration_name, "completed": True})
            return doc is not None
        except Exception as e:
            logger.error(f"Failed to check migration status for '{migration_name}': {e}", exc_info=True)
            # Default to False on failure so we attempt to run it or fail loudly
            return False

    @classmethod
    async def mark_migration_completed(cls, migration_name: str):
        """
        Mark a migration as successfully completed in system_migrations.
        """
        try:
            await db["system_migrations"].update_one(
                {"migration": migration_name},
                {
                    "$set": {
                        "completed": True,
                        "executed_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            logger.info(f"Migration '{migration_name}' successfully marked as completed.")
        except Exception as e:
            logger.error(f"Failed to mark migration '{migration_name}' as completed: {e}", exc_info=True)
            raise e
