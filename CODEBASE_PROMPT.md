# Codebase context for AI

Use this as a system or context prompt so an AI understands the expense management project structure, conventions, and how pieces connect.

---

## Project overview

- **Name:** Expense management app
- **Stack:** FastAPI (Python) backend + React (TypeScript, Vite) frontend. PostgreSQL via SQLAlchemy. JWT auth (access + refresh tokens).
- **Root:** Monorepo with `backend/` and `frontend/`. No app at repo root; root has `.gitignore`, optional `PROJECT_OVERVIEW.md`.

---

## Repository layout (source only; exclude `node_modules`, `__pycache__`, `dist`, `.env`)

```
expense_management/
├── .gitignore
├── CODEBASE_PROMPT.md          # this file
├── backend/
│   ├── .env.example           # template: DATABASE_URL, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, ALLOWED_ORIGINS
│   ├── .gitignore             # .env, venv, __pycache__, etc.
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI app; CORS; includes routers; create_all(bind=engine)
│   │   ├── config.py          # Pydantic Settings from .env (DATABASE_URL, SECRET_KEY, ALLOWED_ORIGINS, etc.)
│   │   ├── database/
│   │   │   ├── base.py        # SQLAlchemy Base
│   │   │   ├── connection.py  # engine, session factory
│   │   │   └── __init__.py
│   │   ├── dependencies/
│   │   │   ├── db_dependency.py   # get_db() → Session
│   │   │   ├── auth_dependency.py # get_current_user() → User from Bearer JWT
│   │   │   └── __init__.py
│   │   ├── models/            # SQLAlchemy ORM (User, Category, Expense, Budget, RefreshToken)
│   │   │   ├── user_model.py
│   │   │   ├── category_model.py
│   │   │   ├── expense_model.py
│   │   │   ├── budget_model.py
│   │   │   ├── refresh_token_model.py
│   │   │   └── __init__.py
│   │   ├── schemas/           # Pydantic request/response
│   │   │   ├── user_schema.py
│   │   │   ├── category_schema.py
│   │   │   ├── expense_schema.py
│   │   │   ├── budget_schema.py
│   │   │   ├── analytics_schema.py
│   │   │   └── __init__.py
│   │   ├── repositories/      # DB access (per-entity)
│   │   │   ├── user_repository.py
│   │   │   ├── auth_repository.py
│   │   │   ├── category_repository.py
│   │   │   ├── expense_repository.py
│   │   │   ├── budget_repository.py
│   │   │   └── __init__.py
│   │   ├── services/          # Business logic; call repositories
│   │   │   ├── auth_service.py
│   │   │   ├── category_service.py
│   │   │   ├── expense_service.py
│   │   │   ├── budget_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── __init__.py
│   │   ├── routes/            # FastAPI routers (thin; delegate to services)
│   │   │   ├── auth_routes.py      # prefix="/auth"
│   │   │   ├── category_routes.py   # prefix="/categories"
│   │   │   ├── expense_routes.py    # prefix="/expenses"
│   │   │   ├── budget_routes.py     # prefix="/budgets"
│   │   │   ├── analytics_routes.py  # prefix="/analytics"
│   │   │   └── __init__.py
│   │   └── utils/
│   │       ├── jwt_handler.py      # create access/refresh tokens; decode; jti in refresh
│   │       ├── password_handler.py # hash/verify
│   │       └── __init__.py
│   └── tests/
│       └── test_category_pydantic_demo.py
└── frontend/
    ├── .env.example           # VITE_API_URL=http://localhost:8000
    ├── .gitignore             # node_modules, dist, .env, .env.local
    ├── index.html             # root div; script /src/main.tsx
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
    ├── eslint.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.tsx           # React root; imports App.tsx, index.css
        ├── App.tsx            # AuthProvider; BrowserRouter; Routes; PrivateRoute/PublicRoute
        ├── App.css
        ├── index.css
        ├── auth.ts            # register, login, getMe, logout — uses api (axios); stores tokens in localStorage
        ├── api/
        │   ├── client.ts      # axios instance: baseURL from VITE_API_URL; interceptor adds Bearer token
        │   ├── index.ts        # re-exports default from client
        │   ├── categories.ts   # getCategories, createCategory, updateCategory, deleteCategory — uses api
        │   ├── auth.ts         # (optional duplicate; app uses src/auth.ts)
        │   └── expenses.ts     # placeholder / empty
        ├── contexts/
        │   └── AuthContext.tsx # AuthProvider, useAuth; user, loading, login, register, logout; uses auth.ts
        ├── hooks/
        │   └── useCategories.ts # categories, loading, error, refetch, addCategory, updateCategory, removeCategory; uses api/categories
        ├── pages/
        │   ├── Login.tsx       # form; useAuth().login; navigate to /dashboard
        │   ├── Register.tsx    # form; useAuth().register; link to login
        │   ├── Dashboard.tsx   # welcome + user name/email; link to /categories; logout
        │   └── categories.tsx  # list categories; add/edit/delete; useCategories; Link to dashboard
        ├── types/
        │   └── index.ts        # User, Category (and placeholder for Expense, Budget)
        └── assets/
            └── (react.svg, vite.svg, hero.png, etc.)
```

---

## Backend flow (summary)

- **Config:** `app.config.settings` loads from `backend/.env` (run server from `backend/` so `.env` is found).
- **DB:** SQLAlchemy; `get_db()` in `db_dependency` yields a `Session`; routes use `Depends(get_db)`.
- **Auth:** JWT access + refresh. Login returns `access_token` and `refresh_token`. Refresh tokens stored in DB with unique `jti`. Protected routes use `Depends(get_current_user)` from `auth_dependency` (Bearer token → User).
- **Layers:** Route → Service → Repository → Model. Routes are thin; services contain business logic; repositories do DB access.
- **API prefixes:** `/auth`, `/categories`, `/expenses`, `/budgets`, `/analytics`. CORS uses `ALLOWED_ORIGINS` from config.

---

## Frontend flow (summary)

- **Entry:** `index.html` → `src/main.tsx` → `App.tsx`.
- **Routing:** React Router in `App.tsx`. Routes: `/` → dashboard; `/login`, `/register` (public); `/dashboard`, `/categories` (private). `PrivateRoute`/`PublicRoute` use `useAuth()`; redirect to login or dashboard as needed.
- **Auth:** `AuthContext` wraps the app; provides `user`, `loading`, `login`, `register`, `logout`. It uses `src/auth.ts`, which uses `import api from "./api"` (i.e. `api/index.ts` → `api/client.ts`). Tokens stored in `localStorage`; client interceptor adds `Authorization: Bearer <access_token>`.
- **API client:** Single axios instance in `src/api/client.ts`. `baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"`. `src/api/index.ts` re-exports it so `import api from "./api"` or `"../api"` works.
- **Categories:** Page `categories.tsx` uses hook `useCategories` from `hooks/useCategories.ts`; hook calls `api/categories` (getCategories, createCategory, updateCategory, deleteCategory). All category API calls go through the shared client (env-based URL + auth header).

---

## Conventions to follow

- **Backend:** Add new features by adding/updating model → schema → repository → service → route. Use `Depends(get_db)` and `Depends(get_current_user)` for protected endpoints. Keep routes thin.
- **Frontend:** New API modules under `src/api/` should import the shared client from `./client` or `../api`. Use `useAuth()` for user state; add new hooks under `src/hooks/` if needed. Page components under `src/pages/`; filename lowercase (e.g. `categories.tsx`).
- **Env:** Backend: copy `.env.example` to `.env` in `backend/`. Frontend: `VITE_*` in `.env` (and `.env.example`); never commit real `.env` (both gitignores include `.env`).

---

## Quick reference

| Concern            | Backend                          | Frontend                          |
|--------------------|----------------------------------|-----------------------------------|
| API base URL       | N/A (server)                     | `VITE_API_URL` in `.env`          |
| Auth               | JWT; get_current_user dependency| AuthContext; auth.ts; Bearer in client |
| DB                 | SQLAlchemy + get_db             | N/A                               |
| Categories API     | GET/POST /categories; PUT/DELETE /categories/:id | api/categories.ts + useCategories |
| Auth API           | POST /auth/login (form), /auth/register (JSON), /auth/me, /auth/logout (JSON body), refresh | auth.ts                           |

Use this prompt when asking an AI to modify, debug, or extend this codebase so it keeps the same structure and conventions.
