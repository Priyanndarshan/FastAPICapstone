"""Pydantic schemas for Category endpoints.

How this connects to the rest of the code:
- Used by `app.routes.category_routes` as request/response models.
- `from_attributes=True` lets FastAPI return SQLAlchemy ORM objects directly.
"""

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

