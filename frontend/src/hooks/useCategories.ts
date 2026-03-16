// Used by: Categories.tsx (full CRUD + loading/error/refetch), Expenses.tsx and Dashboard.tsx (categories list only).
// Depends on: api/categories (backend), types (Category), utils/parseApiError.
import { useEffect, useState } from "react";
import * as categoriesApi from "../api/categories";
import type { Category } from "../types";
import { parseApiError } from "../utils/parseApiError";

export function useCategories() {
    // Holds categories array + loading/error state for async operations.
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Load categories once on mount; used by Categories page to show list and by Expenses/Dashboard to have category options.
    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetches all categories from API via run(); exposed as refetch so Categories page can retry on error.
    async function fetchCategories() {
        setLoading(true);
        setError("");
        try {
            const data = await categoriesApi.getCategories();
            setCategories(data);
        } catch (err) {
            setError(parseApiError(err, "Failed to load categories."));
        } finally {
            setLoading(false);
        }
    }

    // Creates a category via API and appends it to local state; returns new category. Used by Categories.tsx "Add category" form (and optional budget).
    async function addCategory(name: string): Promise<Category> {
        try {
            const cat = await categoriesApi.createCategory(name);
            setCategories((prev) => [...prev, cat]);
            return cat;
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add category."));
        }
    }

    // Updates category name via API and replaces that item in local state. Used by Categories.tsx when saving the budget form (if name changed).
    async function updateCategory(id: number, name: string) {
        try {
            const cat = await categoriesApi.updateCategory(id, name);
            setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update category."));
        }
    }

    // Deletes category via API and removes it from local state. Used by Categories.tsx delete confirmation modal.
    async function removeCategory(id: number) {
        try {
            await categoriesApi.deleteCategory(id);
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to delete category."));
        }
    }

    // Public API: list + loading/error for UI; refetch for retry; add/update/remove for Categories page. Expenses and Dashboard only destructure categories.
    return {
        categories,
        loading,
        error,
        refetch: fetchCategories,
        addCategory,
        updateCategory,
        removeCategory,
    };
}
