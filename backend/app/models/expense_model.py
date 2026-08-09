from datetime import timezone

def expense_helper(expense):
    created_at = expense.get("created_at")
    if not created_at:
        created_at = expense["_id"].generation_time
    elif created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
        
    return {
        "id": str(expense["_id"]),
        "title": expense["title"],
        "amount": expense["amount"],
        "category_id": str(expense.get("category_id", "")),
        "description": expense.get("description"),
        "date": expense["date"],
        "user_id": expense["user_id"],
        "created_at": created_at
    }