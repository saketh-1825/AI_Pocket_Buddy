import os
import time
import asyncio
from bson import ObjectId
from datetime import datetime, timezone

# Force the database routing to the isolated test DB
os.environ["TESTING"] = "True"

from app.database import db, create_db_indexes
from app.routes.budget_routes import create_indexes as create_budget_indexes

from app.main import app
from app.utils.jwt_handler import create_access_token
from httpx import AsyncClient, ASGITransport

def get_index_used(plan):
    """Recursively search the queryPlanner winningPlan for the index used (IXSCAN stage)."""
    if not plan:
        return "COLLSCAN"
    stage = plan.get("stage")
    if stage == "IXSCAN":
        return plan.get("indexName", "Unknown Index")
    input_stage = plan.get("inputStage")
    if input_stage:
        return get_index_used(input_stage)
    input_stages = plan.get("inputStages", [])
    for s in input_stages:
        res = get_index_used(s)
        if res != "COLLSCAN":
            return res
    return "COLLSCAN"

async def run_audit():
    print("Initializing Database Performance Audit...")
    
    # Ensure indexes are created on the test DB
    await create_db_indexes()
    await create_budget_indexes()
    
    # Setup HTTP client
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # 1. Verification of Indexes
        expenses_info = await db["expenses"].index_information()
        budgets_info = await db["budgets"].index_information()
        
        print("\nVerified Database Indexes:")
        print(f"- expenses: {list(expenses_info.keys())}")
        print(f"- budgets: {list(budgets_info.keys())}\n")
        
        # Assert critical indexes exist
        assert "user_id_1_date_-1" in expenses_info, "Missing user_id_1_date_-1 index on expenses"
        assert "user_id_1_category_1" in expenses_info, "Missing user_id_1_category_1 index on expenses"
        assert "user_id_1_category_1_month_1_year_1" in budgets_info, "Missing user_id_1_category_1_month_1_year_1 index on budgets"
        
        # 2. Seed Mock Data for Audit
        user_id = ObjectId()
        user_id_str = str(user_id)
        token = create_access_token({"user_id": user_id_str})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Insert user
        await db["users"].insert_one({
            "_id": user_id,
            "email": f"audit_{user_id_str}@example.com",
            "username": f"audit_{user_id_str}",
            "password": "hashedpassword123"
        })

        # Seed budgets and expenses
        # Seed category budget and overall monthly budget
        now = datetime.now(timezone.utc)
        await db["budgets"].insert_many([
            {
                "user_id": user_id_str,
                "category": "Food",
                "limit_amount": 5000.0,
                "month": now.month,
                "year": now.year,
                "created_at": now,
                "updated_at": now
            },
            {
                "user_id": user_id_str,
                "monthly_budget": 10000.0,
                "month": now.month,
                "year": now.year,
                "created_at": now,
                "updated_at": now
            }
        ])
        
        # Seed 6 expenses to provide docs and keys to examine
        expenses_seed = [
            {
                "user_id": user_id_str,
                "title": f"Expense {i}",
                "amount": 100.0 * (i + 1),
                "category": "Food" if i % 2 == 0 else "Transport",
                "date": now,
                "created_at": now
            }
            for i in range(6)
        ]
        await db["expenses"].insert_many(expenses_seed)


        
        # --- AUDIT CASE 1: Analytics Summary ---
        start = time.perf_counter()
        resp = await client.get("/analytics/summary", headers=headers)
        duration_ms = int((time.perf_counter() - start) * 1000)
        
        assert resp.status_code == 200, "Analytics Summary request failed"
        
        explain = await db.command({
            "explain": {
                "find": "expenses",
                "filter": {"user_id": user_id_str}
            },
            "verbosity": "executionStats"
        })
        stats = explain.get("executionStats", {})
        docs_examined = stats.get("totalDocsExamined", 0)
        keys_examined = stats.get("totalKeysExamined", 0)
        index_used = get_index_used(explain.get("queryPlanner", {}).get("winningPlan", {}))
        
        status = "PASS" if duration_ms < 150 else "FAIL"
        
        print("====================================")
        print("Analytics Summary")
        print(f"Response Time: {duration_ms} ms")
        print(f"Docs Examined: {docs_examined}")
        print(f"Keys Examined: {keys_examined}")
        print(f"Index Used: {index_used}")
        print(status)
        print("====================================")
        
        # --- AUDIT CASE 2: AI Summary ---
        start = time.perf_counter()
        resp = await client.get("/insights/ai-summary", headers=headers)
        duration_ms = int((time.perf_counter() - start) * 1000)
        
        assert resp.status_code == 200, "AI Summary request failed"
        
        # Query matching budget overspending fetch:
        explain = await db.command({
            "explain": {
                "find": "budgets",
                "filter": {"user_id": user_id_str}
            },
            "verbosity": "executionStats"
        })
        stats = explain.get("executionStats", {})
        docs_examined = stats.get("totalDocsExamined", 0)
        keys_examined = stats.get("totalKeysExamined", 0)
        index_used = get_index_used(explain.get("queryPlanner", {}).get("winningPlan", {}))
        
        status = "PASS" if duration_ms < 150 else "FAIL"
        
        print("====================================")
        print("AI Summary")
        print(f"Response Time: {duration_ms} ms")
        print(f"Docs Examined: {docs_examined}")
        print(f"Keys Examined: {keys_examined}")
        print(f"Index Used: {index_used}")
        print(status)
        print("====================================")

        # --- AUDIT CASE 3: Heatmap ---
        start = time.perf_counter()
        resp = await client.get("/insights/calendar-heatmap", headers=headers)
        duration_ms = int((time.perf_counter() - start) * 1000)
        
        assert resp.status_code == 200, "Calendar Heatmap request failed"
        
        explain = await db.command({
            "explain": {
                "find": "expenses",
                "filter": {"user_id": user_id_str}
            },
            "verbosity": "executionStats"
        })
        stats = explain.get("executionStats", {})
        docs_examined = stats.get("totalDocsExamined", 0)
        keys_examined = stats.get("totalKeysExamined", 0)
        index_used = get_index_used(explain.get("queryPlanner", {}).get("winningPlan", {}))
        
        status = "PASS" if duration_ms < 150 else "FAIL"
        
        print("====================================")
        print("Heatmap")
        print(f"Response Time: {duration_ms} ms")
        print(f"Docs Examined: {docs_examined}")
        print(f"Keys Examined: {keys_examined}")
        print(f"Index Used: {index_used}")
        print(status)
        print("====================================")

        
    # Teardown audit data
    await db["users"].delete_one({"_id": user_id})
    await db["expenses"].delete_many({"user_id": user_id_str})
    await db["budgets"].delete_many({"user_id": user_id_str})

if __name__ == "__main__":
    asyncio.run(run_audit())

