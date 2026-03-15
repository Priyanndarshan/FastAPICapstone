import { useEffect } from "react";
import * as categoriesApi from "../api/categories";
import type { Category } from "../types";
import { parseApiError } from "../utils/parseApiError";
import { useAsyncState } from "./useAsyncState";

export function useCategories() {
    const { data: categories, loading, error, run, setData } = useAsyncState<Category[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        await run(() => categoriesApi.getCategories());
    }

    async function addCategory(name: string): Promise<Category> {
        try {
            const cat = await categoriesApi.createCategory(name);
            setData((prev) => [...prev, cat]);
            return cat;
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add category."));
        }
    }

    async function updateCategory(id: number, name: string) {
        try {
            const cat = await categoriesApi.updateCategory(id, name);
            setData((prev) => prev.map((c) => (c.id === id ? cat : c)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update category."));
        }
    }

    async function removeCategory(id: number) {
        try {
            await categoriesApi.deleteCategory(id);
            setData((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to delete category."));
        }
    }

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
