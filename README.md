# Expense Manager (FastAPI + React)

Full‑stack expense tracking app with authentication, expenses CRUD (with receipt uploads), categories + budgets, and analytics dashboards.

## Tech stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Axios, React Router, Recharts
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, JWT auth (access + refresh tokens)
- **External**: Cloudinary (optional) for receipt image uploads

## Repo structure

- `backend/`: FastAPI app + DB models/services/routes
- `frontend/`: React app
- `backend/migrations/`: SQL migration scripts (manual)

## Prerequisites

- **Python** 3.11+ (recommended)
- **Node.js** 18+ (recommended)
- **PostgreSQL** running locally (or a hosted Postgres)

## Environment variables

### Backend (`backend/.env`)

Create `backend/.env` (copy from `backend/.env.example`) and fill values.

Required:
- **`DATABASE_URL`**: Postgres connection string (example in `.env.example`)
- **`SECRET_KEY`**, **`ALGORITHM`**
- **`ACCESS_TOKEN_EXPIRE_MINUTES`**, **`REFRESH_TOKEN_EXPIRE_DAYS`**
- **`ALLOWED_ORIGINS`**: usually `http://localhost:5173`

Optional (receipt uploads):
- **`CLOUDINARY_URL`** (recommended single variable)
  - Format: `cloudinary://api_key:api_secret@cloud_name`

> Important: don’t commit real secrets. Use `.env.example` for placeholders.

### Frontend (`frontend/.env`)

Create `frontend/.env` (copy from `frontend/.env.example`).

- **`VITE_API_URL`**: backend base URL (default: `http://localhost:8000`)

## Setup & run (local dev)

### 1) Backend

From the repo root:

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`.

#### Database tables / schema

This project calls `Base.metadata.create_all(...)` on startup (see `backend/app/main.py`), which will create tables if they don’t exist.

If you need to apply SQL migrations, run the scripts in `backend/migrations/` manually against your database (in order), using a DB tool like pgAdmin or `psql`.

### 2) Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Key backend endpoints

All endpoints below require auth unless noted.

### Auth

- `POST /auth/register`
- `POST /auth/login` (form-urlencoded)
- `GET /auth/me`
- `PATCH /auth/me`
- `POST /auth/logout`

### Expenses

- `GET /expenses` (filters)
- `GET /expenses/paged` (pagination + totals)
- `POST /expenses`
- `GET /expenses/{expense_id}`
- `PUT /expenses/{expense_id}`
- `DELETE /expenses/{expense_id}`
- `POST /expenses/upload-receipt` (Cloudinary upload; returns `{ receipt_url }`)

### Categories

- `GET /categories`
- `POST /categories`
- `PUT /categories/{category_id}`
- `DELETE /categories/{category_id}`

### Budgets

- `GET /budgets`
- `POST /budgets`
- `GET /budgets/{budget_id}`
- `PUT /budgets/{budget_id}`
- `DELETE /budgets/{budget_id}`

### Analytics

- `GET /analytics/monthly?month=<1-12>&year=<YYYY>`
- `GET /analytics/top-category?month=<1-12>&year=<YYYY>`
- `GET /analytics/trend?months=<1-60>` (default: 6)

## How auth works (frontend)

- The frontend stores tokens in `localStorage` as:
  - `access_token`
  - `refresh_token`
- Axios attaches `Authorization: Bearer <access_token>` automatically (see `frontend/src/api/client.ts`).
- If the backend returns **401**, the frontend clears tokens and redirects to `/login`.

## Error handling

- **Backend**: a global handler catches `SQLAlchemyError` and returns a safe `500` JSON response (see `backend/app/main.py`).
- **Frontend**: API errors are converted into readable messages (see `frontend/src/utils/parseApiError.ts`) and shown inline in pages/modals.

## Troubleshooting

- **CORS errors**: ensure `backend/.env` has `ALLOWED_ORIGINS=http://localhost:5173` and restart the backend.
- **401 redirects to login**: your token is missing/expired. Login again; check `localStorage` has `access_token`.
- **Receipt upload fails**:
  - Ensure `CLOUDINARY_URL` is set in `backend/.env`
  - File must be an image and under 10MB
- **DB errors / table not found**:
  - Verify `DATABASE_URL` is correct
  - Ensure Postgres is running
  - Start backend once to auto-create tables

