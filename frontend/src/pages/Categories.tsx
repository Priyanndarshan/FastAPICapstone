import { useState } from "react";
import { AddCategoryModal, BudgetFormModal, CategoryRow, ConfirmModal, PageHeader } from "../components/shared";
import { useCategories } from "../hooks/categories/useCategories";
import { useBudgets } from "../hooks/budgets/useBudgets";
import { useAnalytics } from "../hooks/analytics/useAnalytics";
import { PlusIcon } from "../components/ui/icons";
import { useBudgetByCategory } from "../hooks/categories/useBudgetByCategory";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export default function Categories() {
    const { categories, loading, error, refetch, addCategory, updateCategory, removeCategory } = useCategories();
    const { budgets, addBudget, updateBudget } = useBudgets();
    const { monthly } = useAnalytics(currentMonth, currentYear, 1);

    const [addModal, setAddModal] = useState({ open: false });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [budgetForm, setBudgetForm] = useState<{ categoryId: number | null }>({ categoryId: null });
    const [budgetFormInitial, setBudgetFormInitial] = useState({ name: "", amount: "" });

    const budgetByCategory = useBudgetByCategory(currentMonth, currentYear, budgets, monthly);

    function openAddModal() {
        setAddModal({ open: true });
    }

    function closeAddModal() {
        setAddModal({ open: false });
    }

    async function handleAddCategoryWithBudget(name: string, amount: string, month: number, year: number) {
        const amountNum = amount ? parseFloat(amount) : 0;
        const cat = await addCategory(name);
        if (amount && !isNaN(amountNum) && amountNum > 0) {
            await addBudget({ category_id: cat.id, month, year, limit_amount: amount });
        }
        closeAddModal();
    }

    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeCategory(id);
            setDeleteId(null);
        } catch {
        } finally {
            setDeleting(false);
        }
    }

    function openBudgetForm(categoryId: number) {
        const cat = categories.find((c) => c.id === categoryId);
        const existing = budgets.find((b) => b.category_id === categoryId && b.month === currentMonth && b.year === currentYear);
        setBudgetForm({ categoryId });
        setBudgetFormInitial({
            name: cat?.name ?? "",
            amount: existing ? existing.limit_amount : "",
        });
    }

    function closeBudgetForm() {
        setBudgetForm({ categoryId: null });
    }

    async function handleSaveBudget(name: string, amount: string, month: number, year: number) {
        if (budgetForm.categoryId == null) return;
        const cat = categories.find((c) => c.id === budgetForm.categoryId);
        if (cat && name !== cat.name) {
            await updateCategory(budgetForm.categoryId, name);
        }
        const existing = budgets.find((b) => b.category_id === budgetForm.categoryId && b.month === month && b.year === year);
        if (existing) {
            await updateBudget(existing.id, { limit_amount: amount });
        } else {
            await addBudget({ category_id: budgetForm.categoryId, month, year, limit_amount: amount });
        }
        closeBudgetForm();
    }

    const isEditing = budgets.some(
        (b) => b.category_id === budgetForm.categoryId && b.month === currentMonth && b.year === currentYear
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Categories"
                description="Organize expenses and set budgets by category"
                actions={
                    <>
                        {!loading && !error && categories.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                                {categories.length} {categories.length === 1 ? "category" : "categories"}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4863D4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8]"
                        >
                            <PlusIcon />
                            Add category
                        </button>
                    </>
                }
            />

            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={refetch} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
                    <p className="text-slate-600">No categories yet</p>
                    <p className="mt-1 text-sm text-slate-500">Click "Add category" above to create one.</p>
                </div>
            )}

            {!loading && !error && categories.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat) => (
                        <li key={cat.id}>
                            <CategoryRow
                                cat={cat}
                                budgetInfo={budgetByCategory[cat.id]}
                                month={currentMonth}
                                year={currentYear}
                                onDeleteClick={() => setDeleteId(cat.id)}
                                onAddBudgetClick={() => openBudgetForm(cat.id)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {budgetForm.categoryId !== null && (
                <BudgetFormModal
                    title={isEditing ? "Edit budget" : "Add budget"}
                    initialName={budgetFormInitial.name}
                    initialAmount={budgetFormInitial.amount}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onSave={handleSaveBudget}
                    onClose={closeBudgetForm}
                />
            )}

            {addModal.open && (
                <AddCategoryModal
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onAdd={handleAddCategoryWithBudget}
                    onClose={closeAddModal}
                />
            )}

            {deleteId !== null && (
                <ConfirmModal
                    message={`Delete "${categories.find((c) => c.id === deleteId)?.name}"? Expenses may lose their category.`}
                    confirmLabel={deleting ? "Deleting…" : "Delete"}
                    cancelLabel="Cancel"
                    loading={deleting}
                    onConfirm={() => handleDelete(deleteId)}
                    onCancel={() => setDeleteId(null)}
                />
            )}
        </div>
    );
}