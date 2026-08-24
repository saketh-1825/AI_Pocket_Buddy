import os
import pytest
import asyncio
from bson import ObjectId

# Force the application to use the isolated test database
os.environ["TESTING"] = "True"

import app.database as app_db
from app.main import app
from app.utils.jwt_handler import create_access_token
from httpx import AsyncClient, ASGITransport

@pytest.fixture(autouse=True)
async def setup_db_loop():
    """Reset the Motor client database state before each test so that it initializes fresh on the current active loop."""
    app_db._client = None





@pytest.fixture
async def test_user(setup_db_loop):
    """
    Fixture that creates a temporary test user in the test database.
    Generates a JWT access token and yields a dict containing headers and credentials.
    Performs cleanup of the user document and related database tables upon teardown.
    """
    user_id = ObjectId()
    user_id_str = str(user_id)
    
    test_user_doc = {
        "_id": user_id,
        "email": f"test_{user_id_str}@example.com",
        "username": f"test_{user_id_str}",
        "password": "hashedpassword123"
    }
    
    # Seeding user record
    await app_db.db["users"].insert_one(test_user_doc)
    
    # Generate token
    token = create_access_token({"user_id": user_id_str})
    headers = {"Authorization": f"Bearer {token}"}
    
    user_context = {
        "user_id": user_id_str,
        "email": test_user_doc["email"],
        "token": token,
        "headers": headers
    }
    
    yield user_context
    
    # Teardown: Clean up database documents
    await app_db.db["users"].delete_one({"_id": user_id})
    await app_db.db["expenses"].delete_many({"user_id": user_id_str})
    await app_db.db["budgets"].delete_many({"user_id": user_id_str})
    await app_db.db["categories"].delete_many({"user_id": user_id_str})

@pytest.fixture
async def client(setup_db_loop):
    """Httpx AsyncClient fixture to execute async calls against FastAPI."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac



