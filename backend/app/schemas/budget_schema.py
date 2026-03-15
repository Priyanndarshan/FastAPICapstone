from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
class BudgetCreate(BaseModel):
    category_id: int
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    limit_amount: Decimal = Field(gt=0)
class BudgetUpdate(BaseModel):
    month: int | None = Field(default=None, ge=1, le=12)
    year: int | None = Field(default=None, ge=2000, le=2100)
    limit_amount: Decimal | None = Field(default=None, gt=0)
class BudgetResponse(BaseModel):
    id: int
    category_id: int
    month: int
    year: int
    limit_amount: Decimal
    model_config = ConfigDict(from_attributes=True)
