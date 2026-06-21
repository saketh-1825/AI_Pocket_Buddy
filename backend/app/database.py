from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = AsyncIOMotorClient(MONGO_URL)

db = client.expense_tracker

async def create_db_indexes():
    expenses_col = db["expenses"]
    await expenses_col.create_index([("user_id", 1), ("date", -1)], name="user_id_1_date_-1")
    await expenses_col.create_index([("user_id", 1), ("category", 1)], name="user_id_1_category_1")
    await expenses_col.create_index([("date", -1)], name="date_-1")

