# AI Powered Expense Tracker

A premium, modern Fintech Dashboard for tracking, managing, and categorizing personal expenses. Designed strictly around a **Deep Black & Violet** theme.

---

## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Toasts**: React Toastify (Dark Theme)
- **Utilities**: Papa Parse (CSV exporting), React Icons

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Async MongoDB client via Motor)
- **Auth**: JWT Bearer Authentication (python-jose, passlib)

---

## Key Features

1. **Fintech Dashboard**: Upgraded overview displaying total monthly expenses, dynamic remaining balances, and animated progress percentages.
2. **MongoDB-Backed Budgeting**: Dynamic monthly budget settings stored in MongoDB via FastAPI routes, with live progress meters and over-budget alarm indicators.
3. **AI Buddy & Health Score**: A glassmorphic Copilot-style insight card showing highest-spend categories, week vs. weekend spending ratios, and a calculated Spending Health Score (Poor, Good, Excellent, Outstanding).
4. **Interactive Timeline Mode**: Switch seamlessly between a clean grid table and a Notion/Apple Wallet-style timeline view grouped dynamically under TODAY, YESTERDAY, and OLDER with relative time tracking.
5. **Natural Quick Add Parser**: A floating button that parses text using regex/keyword matching (e.g. "Spent 250 on Pizza" -> Food, Pizza, 250) and displays a confirmation check before saving.
6. **Dynamic Categories**: Upgraded cards displaying total expense counts, spend percentages, progress meters, and dynamic insights (peak day, frequent items, or month-over-month trend changes).
7. **CSV Exporting**: Bypasses pagination limits to download the full matching dataset, prefixing it with timestamp and record count metadata rows.
8. **Robust Error Boundary**: Class-based React ErrorBoundary catching rendering crashes and displaying a styled recovery screen.

---

## Folder Structure

```text
AI_Pocket_Buddy/
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios configs & API wrappers
│   │   ├── components/      # Modals, list rows, skeleton loaders
│   │   ├── constants/       # Badge colors & icon registries
│   │   ├── pages/           # Dashboard & Category Management
│   │   ├── App.jsx          # Route mappings & ErrorBoundary wrap
│   │   └── main.jsx         # App mounting
│   ├── vercel.json          # SPA routing rewrites for Vercel
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── models/          # DB collection references
│   │   ├── routes/          # Auth & Expenses endpoints
│   │   ├── schemas/         # Pydantic payloads
│   │   ├── utils/           # Hashing & JWT checkers
│   │   └── main.py          # FastAPI application mount
│   ├── Procfile             # Railway launch instructions
│   └── railway.json         # Railway deployment schema
```

---

## Environment Variables

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
```

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
MONGODB_URL=mongodb://localhost:27017
JWT_SECRET=your_super_secret_jwt_key
DATABASE_NAME=expense_tracker
```

---

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB running locally or a MongoDB Atlas URI

### Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Uvicorn reloading server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite dev server:
   ```bash
   npm run dev
   ```

---

## Deployment Configuration

### Frontend (Vercel)
The project is configured for seamless deployment on Vercel:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Configuration**: `frontend/vercel.json` maps all sub-directories back to `index.html` preventing `404 Not Found` errors on route reload.

### Backend (Railway)
The backend is set up for deployment on Railway:
- **Runner**: Nixpacks
- **Start Command**: Configured in `backend/Procfile` and `backend/railway.json`:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```

---

## End-to-End Testing Checklist

Use this checklist to perform manual validation testing of all core application mechanics:

### 1. Authentication Flow
- [ ] **Register**: Submit registration form. Verify successful redirect and token storage.
- [ ] **Login**: Test wrong password error warnings, then test correct credentials login redirect.
- [ ] **Protected Route**: Log out, try navigating directly to `/dashboard` or `/categories`. Verify immediate intercept and redirect back to `/`.

### 2. Expenses CRUD
- [ ] **Add**: Open Add Expense modal. Verify that selecting a dynamic category, adding validation errors (e.g. empty or $0 fields), and submitting succeeds. Verify success toast.
- [ ] **Edit**: Click edit icon. Verify fields prefill correctly (especially HTML dates). Modify value and save. Verify instant reload in table.
- [ ] **Delete**: Click delete icon. Verify warning modal prompt. Confirm deletion. Verify success toast and list refresh.

### 3. Categories Management
- [ ] **Create**: Go to `/categories`. Submit the name "Travel", pick a color and icon. Verify card grid displays stats.
- [ ] **Duplicate Check**: Try adding "Travel" or "travel" again. Verify error toast blocking duplicates.
- [ ] **Delete Custom**: Delete "Travel". Verify warning modal indicating matching expenses will migrate to "Others". Confirm.
- [ ] **Delete Default Guard**: Attempt to delete the "Food" card. Verify that delete button is hidden/disabled, and that backend returns `400` block error.

### 4. Dashboard Mechanics
- [ ] **Debounced Search**: Type "burg". Verify that list filtering triggers after exactly 300ms.
- [ ] **Sort Criteria**: Choose sorting: Amount High to Low, Date Oldest, Category A-Z. Verify row orders.
- [ ] **Pagination limits**: Populate >10 expenses. Navigate to Page 2. Verify page highlight. Change search query. Verify active page resets to Page 1.
- [ ] **CSV Export**: Apply search filter. Click "Export CSV". Check downloaded file content in editor. Verify metadata rows:
  - Row 1: `Export Date,<YYYY-MM-DD>`
  - Row 2: `Total Records,<Matching Count>`
  - Row 3: Blank line
  - Row 4: Column Headers
  - Row 5+: Verify matches are fully exported regardless of pagination slicing.

### 5. UI & Safety
- [ ] **Skeleton Loader**: Force network throttle. Verify 5-row pulse skeletons display without layout shifts.
- [ ] **Empty State**: Delete all expenses. Verify dots illustration and prominent Add button renders.
- [ ] **ErrorBoundary Page**: Inject a deliberate crash in render tree. Verify custom recovery page with Reload and Dashboard navigation buttons displays.
