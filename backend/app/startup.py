import logging
import sys
from app.services.migrations.migration_runner import MigrationRunner
from app.services.index_manager import IndexManager

logger = logging.getLogger("startup_orchestrator")

def safe_print(text: str):
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii'))
        except Exception:
            print(text.replace("✓", "[Done]"))

async def run_startup():
    """
    Orchestrates application database startup:
    1. MigrationRunner checks and executes versioned data migrations sequentially.
    2. IndexManager validates and guarantees database indexes dynamically.
    """
    logger.info("Executing database startup orchestration...")
    safe_print("➔ Starting database initialization and migrations...")

    # 1. Versioned Data Migrations
    try:
        await MigrationRunner.run()
        safe_print("✓ Versioned database migrations processed successfully.")
    except Exception as e:
        logger.critical(f"CRITICAL: Migrations runner failed to execute: {e}", exc_info=True)
        safe_print(f"✗ CRITICAL: Data migrations runner failed: {e}")
        raise e

    # 2. Database Indexes Validation
    try:
        safe_print("➔ Verifying database indexes...")
        await IndexManager.ensure_indexes()
        safe_print("✓ Database indexes successfully validated and applied.")
    except Exception as e:
        logger.critical(f"CRITICAL: Failed to validate and apply database indexes: {e}", exc_info=True)
        safe_print(f"✗ CRITICAL: Index validation failed: {e}")
        raise e

    logger.info("Database startup orchestration completed successfully.")
    safe_print("✓ Database startup orchestration finished successfully.")
