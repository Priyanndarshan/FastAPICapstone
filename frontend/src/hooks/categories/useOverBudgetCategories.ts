import { useMemo } from "react";
import type { Category } from "../../types";

export interface OverBudgetCategory {
  categoryId: number;
  name: string;
  limit: number;
  spent: number;
  overAmount: number;
}

export function useOverBudgetCategories(
  budgetByCategory: { [key: number]: { limit: number; spent: number } },
  categories: Category[]
) {
  return useMemo<OverBudgetCategory[]>(() => {
    const list: OverBudgetCategory[] = [];

    for (const [categoryId, data] of Object.entries(budgetByCategory)) {
      if (data.limit > 0 && data.spent > data.limit) {
        const catId = Number(categoryId);
        const name = categories.find((c) => c.id === catId)?.name ?? "—";
        list.push({
          categoryId: catId,
          name,
          limit: data.limit,
          spent: data.spent,
          overAmount: data.spent - data.limit,
        });
      }
    }

    return list;
  }, [budgetByCategory, categories]);
}

