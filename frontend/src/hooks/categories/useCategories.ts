import { useEffect, useState } from "react";
import * as categoriesApi from "../../api/categories";
import type { Category } from "../../types";
import { parseApiError } from "../../utils/parseApiError";

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

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

    async function addCategory(name: string): Promise<Category> {
        try {
            const cat = await categoriesApi.createCategory(name);
            setCategories((prev) => [...prev, cat]);
            return cat;
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to add category."));
        }
    }

    async function updateCategory(id: number, name: string) {
        try {
            const cat = await categoriesApi.updateCategory(id, name);
            setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)));
        } catch (err) {
            throw new Error(parseApiError(err, "Failed to update category."));
        }
    }

    async function removeCategory(id: number) {
        try {
            await categoriesApi.deleteCategory(id);
            setCategories((prev) => prev.filter((c) => c.id !== id));
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
