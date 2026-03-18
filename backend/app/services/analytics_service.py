from datetime import date, timedelta  # date: used for trend window; timedelta: imported (not used in this file)
from decimal import Decimal  # precise decimal math for money totals
from typing import Optional  # imported (not used in this file)

from fastapi import HTTPException, status  # HTTP errors + status codes for API failures
from sqlalchemy import func, extract  # SQL functions (SUM/COALESCE) and date-part extraction (year/month)
from sqlalchemy.orm import Session  # DB session type used for dependency injection

from app.models.category_model import Category  # Category ORM model (to fetch names)
from app.models.expense_model import Expense  # Expense ORM model (analytics source table)


def get_monthly_analytics(db: Session, user_id: int, month: int, year: int):  # per-category totals for a month
    q = (  # build a SQLAlchemy query object (not executed yet)
        db.query(  # start SELECT ...
            Expense.category_id,  # group key: category for each expense (can be NULL)
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),  # SUM(amount) per category, default 0 if NULL
        )  # end selected columns
        .filter(  # WHERE conditions (restrict which expenses are included)
            Expense.user_id == user_id,  # only this user's expenses
            Expense.transaction_type == "out",  # only spending ("out"), not income ("in")
            extract("year", Expense.date) == year,  # only rows whose date year matches
            extract("month", Expense.date) == month,  # only rows whose date month matches
        )  # end WHERE
        .group_by(Expense.category_id)  # GROUP BY category_id so SUM is per category
    )  # end query construction
    rows = q.all()  # execute query and return all grouped rows
    category_ids = [r.category_id for r in rows if r.category_id is not None]  # collect category ids we need names for
    names_by_id: dict[int, str] = {}  # map category_id -> category_name for quick lookup
    if category_ids:  # only query categories table if there are any non-null ids
        for c in (  # iterate over category rows fetched from DB
            db.query(Category)  # SELECT * FROM categories ...
            .filter(Category.id.in_(category_ids))  # WHERE id IN (category_ids)
            .all()  # execute and return all matching categories
        ):  # end category query loop
            names_by_id[c.id] = c.name  # store the category name for that id
    categories = []  # list of per-category totals to return
    total_spent = Decimal("0")  # running total of spending for the month (across all categories)
    for r in rows:  # loop over grouped expense rows (one per category_id)
        amount = Decimal(str(r.total_amount))  # convert DB numeric/decimal to Decimal safely
        total_spent += amount  # accumulate monthly total
        categories.append(  # append a response item for this category group
            {
                "category_id": r.category_id,  # the category id for this group (may be None)
                "category_name": names_by_id.get(r.category_id) if r.category_id is not None else None,  # name lookup or None
                "total_amount": amount,  # total spent in that category for the month
            }  # end dict
        )  # end append
    return {  # return a JSON-serializable dict (FastAPI will serialize it)
        "month": month,  # echo requested month
        "year": year,  # echo requested year
        "total_spent": total_spent,  # total spending across categories
        "categories": categories,  # per-category breakdown list
    }  # end return payload


def get_top_category(db: Session, user_id: int, month: int, year: int):  # highest-spend category for a month
    q = (  # build query to compute sums per category and sort by largest
        db.query(  # SELECT ...
            Expense.category_id,  # group key
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),  # sum spent per category
        )  # end selected columns
        .filter(  # WHERE conditions (same month/year + user + "out")
            Expense.user_id == user_id,  # only this user's rows
            Expense.transaction_type == "out",  # only spending
            extract("year", Expense.date) == year,  # match year
            extract("month", Expense.date) == month,  # match month
        )  # end WHERE
        .group_by(Expense.category_id)  # GROUP BY category so SUM is per category
        .order_by(func.sum(Expense.amount).desc())  # ORDER BY sum(amount) descending (largest first)
    )  # end query
    row = q.first()  # execute and return the first (largest) row
    if not row:  # if there were no expenses matching the filters
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No expenses for given month")  # return 404
    category_name = None  # default when category_id is NULL or category row not found
    if row.category_id is not None:  # if the top row has a real category id
        category = db.query(Category).filter(Category.id == row.category_id).first()  # fetch that category row
        if category:  # if category exists
            category_name = category.name  # store name for response
    amount = Decimal(str(row.total_amount))  # convert summed amount to Decimal
    return {  # return response payload
        "month": month,  # echo requested month
        "year": year,  # echo requested year
        "category_id": row.category_id,  # top category id (or None)
        "category_name": category_name,  # top category name (or None)
        "total_amount": amount,  # amount spent in that category for the month
    }  # end return payload


def get_trend(db: Session, user_id: int, months: int):  # totals per month for last N months
    if months <= 0:  # validate input
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="months must be positive")  # bad request
    today = date.today()  # current date (local system date)
    start_year = today.year  # initialize start year for the trend window
    start_month = today.month - (months - 1)  # month number for the first month in the window
    while start_month <= 0:  # if we went back past January, wrap into previous years
        start_month += 12  # add 12 months to bring month back into 1..12 range
        start_year -= 1  # move the year back by 1 for each wrap
    start_date = date(start_year, start_month, 1)  # first day of the computed starting month
    q = (  # build query to sum spending grouped by month/year
        db.query(  # SELECT ...
            extract("year", Expense.date).label("year"),  # computed year number from Expense.date
            extract("month", Expense.date).label("month"),  # computed month number from Expense.date
            func.coalesce(func.sum(Expense.amount), 0).label("total_amount"),  # total spending for that month
        )  # end selected columns
        .filter(  # WHERE conditions
            Expense.user_id == user_id,  # only this user's expenses
            Expense.transaction_type == "out",  # only spending
            Expense.date >= start_date,  # only dates in the trend window (start_date onwards)
        )  # end WHERE
        .group_by(extract("year", Expense.date), extract("month", Expense.date))  # GROUP BY year+month buckets
        .order_by(extract("year", Expense.date), extract("month", Expense.date))  # sort ascending by year then month
    )  # end query
    rows = q.all()  # execute query and get all month buckets returned by the DB
    points = []  # build list of points suitable for charting in frontend
    for r in rows:  # iterate each bucket row
        points.append(  # append one point to the output list
            {
                "year": int(r.year),  # cast extracted year (often Decimal/float) to int
                "month": int(r.month),  # cast extracted month to int
                "total_spent": Decimal(str(r.total_amount)),  # cast sum to Decimal for consistent money handling
            }  # end point dict
        )  # end append
    return {"points": points}  # return list of trend points under "points" key
