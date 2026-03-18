import { useCallback, useEffect, useState } from "react";
import * as expensesApi from "../../api/expenses";
import type { PagedExpenseQuery } from "../../api/expenses";
import { parseApiError } from "../../utils/parseApiError";

// Reuse the sort options defined for the paged expenses query.
export type SortOption = PagedExpenseQuery["sort_by"];

/**
 * Server-side pagination hook for the Expenses page.
 * - Accepts a single query object (filters + sort + page/page_size)
 * - Sends it to GET /expenses/paged
 * - Returns the current page items plus total count (for pagination UI).
 */
export function usePagedExpenses(query: PagedExpenseQuery) {
  const [items, setItems] = useState<expensesApi.PaginatedExpensesResponse["items"]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cashInTotal, setCashInTotal] = useState(0);
  const [cashOutTotal, setCashOutTotal] = useState(0);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await expensesApi.getExpensesPaged(query);
      setItems(res.items);
      setTotal(res.total);
      setCashInTotal(Number(res.cash_in_total ?? 0));
      setCashOutTotal(Number(res.cash_out_total ?? 0));
    } catch (err) {
      setError(parseApiError(err, "Failed to load expenses."));
      setItems([]);
      setTotal(0);
      setCashInTotal(0);
      setCashOutTotal(0);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    items,
    total,
    loading,
    error,
    cashInTotal,
    cashOutTotal,
    refetch: fetchPage,
  };
}

