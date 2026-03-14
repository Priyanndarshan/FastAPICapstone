import api from "../api";

export async function getCategories() {
    const res = await api.get("/categories");
    return res.data;
}

export async function createCategory(name: string) {
    const res = await api.post("/categories", { name });
    return res.data;
}

export async function updateCategory(id: number, name: string) {
    const res = await api.put(`/categories/${id}`, { name });
    return res.data;
}

export async function deleteCategory(id: number) {
    await api.delete(`/categories/${id}`);
}