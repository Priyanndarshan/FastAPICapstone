# Demo Script: Expense Manager (FastAPI + React)

## Prep (2 minutes)
1. Start backend: `uvicorn app.main:app --reload` (port `8000`)
2. Start frontend: `npm run dev` (port `5173`)
3. Ensure you have at least:
   - Some categories + budgets (so “Over budget” can appear)
   - Some expenses across different months (so charts/trend show data)
   - (Optional) Cloudinary configured in `backend/.env` so receipt upload works

## Demo flow (show in this order)

### 1) Landing + Auth guard
1. Open the app root: show `Landing` with buttons **Login** and **Register**
2. Try accessing a protected page (like Dashboard) while logged out:
   - Confirm it redirects to **Login** (RequireAuth)

### 2) Register (feature)
1. Go to **Register**
2. Fill: `Name`, `Email`, `Password`, (optional) `Mobile`
3. Submit and show it logs the user in and routes to **Dashboard**
4. Mention error UI (basic validation / API error messages appear on failure)

### 3) Login (feature)
1. Go to **Login**
2. Enter credentials and submit
3. Verify `Dashboard` loads successfully

### 4) Dashboard analytics (core feature)
1. Show **Cash flow summary** (Cash In / Cash Out / Net) for current month
2. Show **Top category** badge (from analytics endpoint)
3. Show **Spending by category pie chart**:
   - Change month/year from the dropdown and show the pie updates
4. Show **Over budget warning** (if any):
   - Click **Adjust →** and explain it jumps to **Categories** to fix budgets
5. Show **Spending trend chart**:
   - Explain it’s the last 6 months trend (or change by UI if you adjust trend months)
6. Show **Recent expenses** list card

### 5) Expenses page (CRUD + filters + export + receipts)
1. Navigate to **Expenses**
2. Demonstrate filtering:
   - Duration: `All time / Today / This week / This month / Custom`
   - Transaction type: `All / Cash In / Cash Out`
   - Payment modes: multi-select (UPI / CASH)
   - Category filter
   - Recurring filter: `All / Recurring only / Non-recurring only`
   - Search keyword (notes/amount area depending on backend support)
   - Sort dropdown (date / amount asc / amount desc)
3. Demonstrate pagination:
   - Use Next/Previous and show the “Showing X–Y of Z” header updates
4. Demonstrate **Add expense**:
   - Click **Cash Out** (and optionally **Cash In**)
   - Fill amount, date, notes, category, payment mode, type, and toggle **Recurring**
   - Save
5. Demonstrate **Edit expense**:
   - Click edit icon on a row
   - Change amount/category/notes (and optionally upload/clear receipt)
   - Save
6. Demonstrate **Delete expense**:
   - Click delete icon
   - Confirm deletion
7. Demonstrate **Receipt upload** (optional but ideal):
   - In add/edit, choose an image file
   - Explain backend uploads to Cloudinary and stores `receipt_url`
   - Show “View receipt” link after saving
8. Demonstrate **Export**:
   - Click **Export** menu
   - Show **Download as CSV / Excel (.xlsx) / PDF**

### 6) Categories page (categories CRUD + budgets + error UX)
1. Navigate to **Categories**
2. Demonstrate **Add category + optional budget**:
   - Click **Add category**
   - Enter a category name
   - Enter a budget amount (optional) + choose month/year
   - Submit
3. Demonstrate **Edit budget**:
   - Open budget form for a category
   - Change limit amount
   - Save
4. Demonstrate **Delete category** behavior:
   - Delete a category that still has expenses referencing it
   - Show the confirmation modal error message (FK/constraint prevents deletion)
   - (Optional) Delete a category after removing related expenses to show success path

### 7) Profile page (update + logout)
1. Navigate to **Profile**
2. Edit **Name** and/or **Mobile Number**, save, and show updated data
3. Click **Logout** and show it redirects to Login/Landing

## Optional (if you want a quick “error handling” moment)
1. Trigger a harmless error:
   - Use an invalid filter value (if UI allows) or temporarily stop backend
2. Show the page error UI + “Try again” retry behavior

