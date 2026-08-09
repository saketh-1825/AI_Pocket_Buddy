from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
_client = None

def get_db_collection(collection_name: str):
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URL)
    if os.getenv("TESTING") == "True":
        return _client.expense_tracker_test[collection_name]
    return _client.expense_tracker[collection_name]

class LazyCollection:
    def __init__(self, name):
        self._name = name
        
    def _get_col(self):
        return get_db_collection(self._name)
        
    def __getattr__(self, name):
        return getattr(self._get_col(), name)
        
    def __getitem__(self, name):
        return self._get_col()[name]
        
    def find(self, *args, **kwargs):
        return self._get_col().find(*args, **kwargs)
        
    def find_one(self, *args, **kwargs):
        return self._get_col().find_one(*args, **kwargs)
        
    def insert_one(self, *args, **kwargs):
        return self._get_col().insert_one(*args, **kwargs)
        
    def insert_many(self, *args, **kwargs):
        return self._get_col().insert_many(*args, **kwargs)
        
    def update_one(self, *args, **kwargs):
        return self._get_col().update_one(*args, **kwargs)
        
    def update_many(self, *args, **kwargs):
        return self._get_col().update_many(*args, **kwargs)
        
    def delete_one(self, *args, **kwargs):
        return self._get_col().delete_one(*args, **kwargs)
        
    def delete_many(self, *args, **kwargs):
        return self._get_col().delete_many(*args, **kwargs)
        
    def aggregate(self, *args, **kwargs):
        return self._get_col().aggregate(*args, **kwargs)

    def count_documents(self, *args, **kwargs):
        return self._get_col().count_documents(*args, **kwargs)

    def create_index(self, *args, **kwargs):
        return self._get_col().create_index(*args, **kwargs)

    def drop_index(self, *args, **kwargs):
        return self._get_col().drop_index(*args, **kwargs)

    def index_information(self, *args, **kwargs):
        return self._get_col().index_information(*args, **kwargs)

class LazyDatabase:
    def __getitem__(self, name):
        return LazyCollection(name)
        
    def __getattr__(self, name):
        return LazyCollection(name)
        
    async def list_collection_names(self):
        global _client
        if _client is None:
            _client = AsyncIOMotorClient(MONGO_URL)
        if os.getenv("TESTING") == "True":
            return await _client.expense_tracker_test.list_collection_names()
        return await _client.expense_tracker.list_collection_names()

    async def command(self, *args, **kwargs):
        global _client
        if _client is None:
            _client = AsyncIOMotorClient(MONGO_URL)
        if os.getenv("TESTING") == "True":
            return await _client.expense_tracker_test.command(*args, **kwargs)
        return await _client.expense_tracker.command(*args, **kwargs)

db = LazyDatabase()


