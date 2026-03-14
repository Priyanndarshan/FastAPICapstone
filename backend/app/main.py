"""FastAPI application entry point.

How this connects to the rest of the code:
- Imports the SQLAlchemy `engine` and `Base` so the app can create tables on startup.
- Includes the authentication router (`app.routes.auth_routes`) which exposes `/auth/*` endpoints.

When you run `uvicorn app.main:app`, FastAPI loads this module and serves `app`.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.connection import engine
from app.database.base import Base
# Import all models so they register with Base.metadata before create_all()
from app.models.user_model import User  # noqa: F401
from app.models.category_model import Category  # noqa: F401
from app.models.expense_model import Expense  # noqa: F401
from app.models.budget_model import Budget  # noqa: F401
from app.models.refresh_token_model import RefreshToken  # noqa: F401
from app.routes import auth_routes
from app.routes import category_routes
from app.routes import expense_routes
from app.routes import budget_routes
from app.routes import analytics_routes

app = FastAPI()

Base.metadata.create_all(bind=engine)

# Configure CORS using allowed origins from settings (comma-separated string).
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(category_routes.router)
app.include_router(expense_routes.router)
app.include_router(budget_routes.router)
app.include_router(analytics_routes.router)


@app.get("/")
def home():
    return {"message": "Expense Manager API Running"}