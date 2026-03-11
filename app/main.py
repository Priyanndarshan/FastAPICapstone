from fastapi import FastAPI

from app.database.connection import engine
from app.database.base import Base
from app.routes import auth_routes

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(auth_routes.router)


@app.get("/")
def home():
    return {"message": "Expense Manager API Running"}