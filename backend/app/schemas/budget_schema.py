"""Pydantic schemas for Budget endpoints."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


# Used as the request body schema for `POST /budgets` in `budget_routes.create_budget`.
class BudgetCreate(BaseModel):
    category_id: int
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    limit_amount: Decimal = Field(gt=0)


# Used as the request body schema for `PUT /budgets/{budget_id}` in `budget_routes.update_budget`.
class BudgetUpdate(BaseModel):
    month: int | None = Field(default=None, ge=1, le=12)
    year: int | None = Field(default=None, ge=2000, le=2100)
    limit_amount: Decimal | None = Field(default=None, gt=0)


# Used as the response model for:
# - `GET  /budgets`           (`budget_routes.list_budgets`)
# - `POST /budgets`           (`budget_routes.create_budget`)
# - `GET  /budgets/{budget}`  (`budget_routes.get_budget`)
# - `PUT  /budgets/{budget}`  (`budget_routes.update_budget`)
class BudgetResponse(BaseModel):
    id: int
    category_id: int
    month: int
    year: int
    limit_amount: Decimal

    model_config = ConfigDict(from_attributes=True)

