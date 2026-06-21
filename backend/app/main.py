from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import db, create_db_indexes
from app.routes.expense_routes import router as expense_router
from app.routes.auth_routes import router as auth_router
from app.routes.category_routes import router as category_router
from app.routes.budget_routes import router as budget_router
from app.routes.analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database indexes
    await create_db_indexes()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():

    collections = await db.list_collection_names()

    return {
        "message": "Backend Running",
        "collections": collections
    }


app.include_router(auth_router)
app.include_router(expense_router)
app.include_router(category_router)
app.include_router(budget_router)
app.include_router(analytics_router)