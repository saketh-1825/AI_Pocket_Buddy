def expense_helper(expense):
    return {
        "id": str(expense["_id"]),
        "title": expense["title"],
        "amount": expense["amount"],
        "category": expense["category"],
        "description": expense.get("description"),
        "date": expense["date"],
        "user_id": expense["user_id"]
    }