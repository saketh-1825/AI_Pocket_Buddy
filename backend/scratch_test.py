import asyncio
from bson import ObjectId
from app.database import db
from app.services.category_service import CategoryService
from app.services.pandas_service import PandasAnalyticsService

async def main():
    user_id = str(ObjectId())
    cats = await CategoryService.get_user_categories(user_id)
    food_cat_id = next(c["id"] for c in cats if c["name"] == "Food")
    
    expense = {
        "user_id": user_id,
        "title": "Starbucks Coffee",
        "amount": 350.0,
        "category_id": ObjectId(food_cat_id),
    }
    await db["expenses"].insert_one(expense)
    
    df = await PandasAnalyticsService.load_expenses_dataframe(user_id)
    print("DataFrame rows:")
    for _, row in df.iterrows():
        print(f"Title: {row['title']}, Category ID in DF? no it's Category: {row['category']}")
        
asyncio.run(main())
