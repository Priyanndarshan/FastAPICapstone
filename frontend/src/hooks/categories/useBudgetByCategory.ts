import { useMemo } from "react";
import type { Budget, MonthlyAnalytics } from "../../types";


export function useBudgetByCategory(
  month: number,
  year: number,
  budgets: Budget[],
  monthly: MonthlyAnalytics | null
) {
  return useMemo(() => {
    const map: { [key: number]: { limit: number; spent: number } } = {};

    const thisMonthBudgets = budgets.filter(
      (b) => b.month === month && b.year === year
    );

    for (const b of thisMonthBudgets) {
      map[b.category_id] = { limit: Number(b.limit_amount), spent: 0 };
    }

    for (const c of monthly?.categories ?? []) {
      if (c.category_id != null) {
        const spent = Number(c.total_amount);
        if (map[c.category_id]) {
          map[c.category_id].spent = spent;
        } else {
          map[c.category_id] = { limit: 0, spent };
        }
      }
    }

    return map;
  }, [budgets, monthly, month, year]);
}

