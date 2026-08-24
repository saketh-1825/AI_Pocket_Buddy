import asyncio
import os
os.environ["TESTING"] = "True"
from app.database import db

async def clean():
    await db["categories"].delete_many({})

if __name__ == "__main__":
    asyncio.run(clean())
