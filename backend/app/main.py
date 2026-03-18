import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database.connection import engine
from app.database.base import Base
from app.routes import auth_routes
from app.routes import category_routes
from app.routes import expense_routes
from app.routes import budget_routes
from app.routes import analytics_routes

logger = logging.getLogger(__name__)
app = FastAPI()
Base.metadata.create_all(bind=engine)
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


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
    # Log full exception details server-side; return a generic message to clients.
    logger.exception("Database error on", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Database error. Please try again later."},
    )


@app.get("/")
def home():
    return {"message": "Expense Manager API Running"}