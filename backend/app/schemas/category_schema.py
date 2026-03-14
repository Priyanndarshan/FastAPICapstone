"""Pydantic schemas for Category endpoints.

How this connects to the rest of the code:
- Used by `app.routes.category_routes` as request/response models.
- `from_attributes=True` lets FastAPI return SQLAlchemy ORM objects directly.
"""

from pydantic import BaseModel, ConfigDict, Field


# Used as the request body schema for `POST /categories`
# in `category_routes.create_category`.
class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100, examples=["Food"])


# Used as the request body schema for `PUT /categories/{category_id}`
# in `category_routes.update_category`.
class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


# Used as the response model for:
# - `GET  /categories`              (`category_routes.list_categories`)
# - `POST /categories`              (`category_routes.create_category`)
# - `PUT  /categories/{category_id}` (`category_routes.update_category`)
class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
