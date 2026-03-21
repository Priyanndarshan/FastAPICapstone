import type { Budget, Category, MonthlyAnalytics } from "../types";

export function getBudgetByCategory(
  month: number,
  year: number,
  budgets: Budget[],
  monthly: MonthlyAnalytics | null
): Record<number, { limit: number; spent: number }> {
  const map: Record<number, { limit: number; spent: number }> = {};
  const thisMonthBudgets = budgets.filter((b) => b.month === month && b.year === year);
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
}

export interface OverBudgetCategory {
  categoryId: number;
  name: string;
  limit: number;
  spent: number;
  overAmount: number;
}

export function getOverBudgetCategories(
  budgetByCategory: Record<number, { limit: number; spent: number }>,
  categories: Category[]
): OverBudgetCategory[] {
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
}
