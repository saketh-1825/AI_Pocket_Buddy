import requests

base_url = 'http://127.0.0.1:8000'

# 1. Register a test user
print('Registering test user...')
requests.post(f'{base_url}/auth/register', json={
    'name': 'Test User',
    'email': 'testuser2@example.com',
    'password': 'password123'
})

# 2. Login
print('Logging in...')
r = requests.post(f'{base_url}/auth/login', json={
    'email': 'testuser2@example.com',
    'password': 'password123'
})
token = r.json().get('token')
headers = {'Authorization': f'Bearer {token}'}

# 3. Create a category
print('Creating category...')
r = requests.post(f'{base_url}/categories', headers=headers, json={
    'name': 'TestCat',
    'icon_key': 'shopping',
    'color': '#ff0000'
})
cat_id = r.json().get('id')

# 4. Create a budget for that category
print('Creating budget...')
r = requests.post(f'{base_url}/budgets', headers=headers, json={
    'category': 'TestCat',
    'limit_amount': 500,
    'month': 8,
    'year': 2026
})

# 5. Fetch budget
r = requests.get(f'{base_url}/budgets?month=8&year=2026', headers=headers)
budgets = r.json()
print("GET BUDGETS:", budgets)
if isinstance(budgets, list):
    for b in budgets:
        print(f"Budget {b.get('category', 'N/A')}: Spent {b.get('spent_amount', 'N/A')} / {b.get('limit_amount', 'N/A')}")

# 6. Add expense
print('Adding expense...')
r = requests.post(f'{base_url}/expenses', headers=headers, json={
    'title': 'Test Expense',
    'description': 'Test',
    'amount': 100,
    'category_id': cat_id,
    'date': '2026-08-24T12:00:00Z'
})
print(r.json())

# 7. Fetch budget again
print('Fetching budget after expense...')
r = requests.get(f'{base_url}/budgets?month=8&year=2026', headers=headers)
budgets = r.json()
print("GET BUDGETS AFTER EXPENSE:", budgets)
if isinstance(budgets, list):
    for b in budgets:
        print(f"Budget {b.get('category', 'N/A')}: Spent {b.get('spent_amount', 'N/A')} / {b.get('limit_amount', 'N/A')}")
