"""FastAPI application entry point.

How this connects to the rest of the code:
- Imports the SQLAlchemy `engine` and `Base` so the app can create tables on startup.
- Includes the authentication router (`app.routes.auth_routes`) which exposes `/auth/*` endpoints.

When you run `uvicorn app.main:app`, FastAPI loads this module and serves `app`.
"""

from fastapi import FastAPI

from app.database.connection import engine
from app.database.base import Base
from app.routes import auth_routes
from app.routes import category_routes
from app.routes import expense_routes
from app.routes import budget_routes
from app.routes import analytics_routes

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)
app.include_router(category_routes.router)
app.include_router(expense_routes.router)
app.include_router(budget_routes.router)
app.include_router(analytics_routes.router)


@app.get("/")
def home():
    return {"message": "Expense Manager API Running"}