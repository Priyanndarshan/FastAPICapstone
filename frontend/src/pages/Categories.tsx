// --- Page dependencies: React, data hooks, types, config, shared components ---
// Connected to: hooks/useCategories, useBudgets, useAnalytics (API); types/index (Category); config/constants (MONTH_NAMES); components/shared (ConfirmModal, PageHeader)
import { useState, useMemo } from "react";
import { useCategories } from "../hooks/useCategories";
import { useBudgets } from "../hooks/useBudgets";
import { useAnalytics } from "../hooks/useAnalytics";
import { useBudgetByCategory } from "../hooks/useBudgetByCategory";
import type { Category } from "../types";
import { MONTH_NAMES } from "../config/constants";
import { AddCategoryModal, BudgetFormModal, CategoryRow, ConfirmModal, PageHeader } from "../components/shared";
import { PlusIcon } from "../components/ui/icons";

// Current month/year used for budget defaults and "this month" filtering; computed once at module load
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export default function Categories() {
    // Data layer: categories CRUD + loading/error (useCategories → API); budgets CRUD (useBudgets → API); monthly analytics (useAnalytics → API) for spent-per-category
    const { categories, loading, error, refetch, addCategory, updateCategory, removeCategory } =
        useCategories();
    const { budgets, addBudget, updateBudget } = useBudgets();
    const { monthly } = useAnalytics(currentMonth, currentYear, 1);

    // Derives a map: categoryId → { limit, spent } for current month. Merges budgets (limit) with analytics (spent). Used by CategoryRow to show progress bars.
    const budgetByCategory = useBudgetByCategory(currentMonth, currentYear, budgets, monthly);

    // "Add category" modal state: only visibility; form state lives in AddCategoryModal
    const [addModal, setAddModal] = useState({ open: false });

    // Delete confirmation: which category id is selected for delete (null = modal closed); deleting = request in progress
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // "Add/Edit budget" modal state: which category is active; form state lives in BudgetFormModal
    const [budgetForm, setBudgetForm] = useState<{ categoryId: number | null }>({
        categoryId: null,
    });

    // Initial values passed into BudgetFormModal when opening
    const [budgetFormInitial, setBudgetFormInitial] = useState({
        name: "",
        amount: "",
    });

    // Opens add-category modal
    function openAddModal() {
        setAddModal({ open: true });
    }

    // Closes add modal; used on cancel or after successful submit
    function closeAddModal() {
        setAddModal({ open: false });
    }

    // Submit handler for "Add category" form: called from AddCategoryModal with validated values
    async function handleAddCategoryWithBudget(
        name: string,
        amount: string,
        month: number,
        year: number
    ) {
        const amountNum = amount ? parseFloat(amount) : 0;
        const cat = await addCategory(name);
        if (amount && !isNaN(amountNum) && amountNum > 0) {
            await addBudget({
                category_id: cat.id,
                month,
                year,
                limit_amount: amount,
            });
        }
        closeAddModal();
    }

    // Runs when user confirms delete: calls removeCategory (API), then clears deleteId to close ConfirmModal
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

    // Opens budget modal for a category: pre-fills initial name and amount; month/year come from currentMonth/currentYear
    function openBudgetForm(categoryId: number) {
        const cat = categories.find((c) => c.id === categoryId);
        const existing = budgets.find(
            (b) => b.category_id === categoryId && b.month === currentMonth && b.year === currentYear
        );
        setBudgetForm({ categoryId });
        setBudgetFormInitial({
            name: cat?.name ?? "",
            amount: existing ? existing.limit_amount : "",
        });
    }

    // Closes budget modal; used on cancel or after successful save
    function closeBudgetForm() {
        setBudgetForm({ categoryId: null });
    }

    // Submit handler for budget form: called from BudgetFormModal with validated values
    async function handleSaveBudget(
        name: string,
        amount: string,
        month: number,
        year: number
    ) {
        if (budgetForm.categoryId == null) return;
        try {
            const cat = categories.find((c) => c.id === budgetForm.categoryId);
            if (cat && name !== cat.name) {
                await updateCategory(budgetForm.categoryId, name);
            }
            const existing = budgets.find(
                (b) =>
                    b.category_id === budgetForm.categoryId &&
                    b.month === month &&
                    b.year === year
            );
            if (existing) {
                await updateBudget(existing.id, { limit_amount: amount });
            } else {
                await addBudget({
                    category_id: budgetForm.categoryId,
                    month,
                    year,
                    limit_amount: amount,
                });
            }
            closeBudgetForm();
        } catch (err) {
            // Error is surfaced in BudgetFormModal via thrown message
            throw err;
        } finally {
        }
    }

    // Main layout: header with count + "Add category" button, then loading / error / empty / list, then modals (budget, add, delete)
    return (
        <div className="space-y-8">
            {/* Title, description, category count badge, and primary CTA; connected to openAddModal */}
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
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4863D4] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                        >
                            <PlusIcon />
                            Add category
                        </button>
                    </>
                }
            />

            {/* Shown while useCategories is loading; no other content */}
            {loading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {/* Shown when useCategories returned error; refetch triggers a retry */}
            {!loading && error && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={refetch} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {/* Empty state when no categories exist; prompts user to add first category */}
            {!loading && !error && categories.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
                    <p className="text-slate-600">No categories yet</p>
                    <p className="mt-1 text-sm text-slate-500">Click &quot;Add category&quot; above to create one and optionally set a budget.</p>
                </div>
            )}

            {/* Grid of category cards; each CategoryRow gets category, budgetByCategory entry, and callbacks for delete / add-edit budget */}
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

            {/* Budget form modal */}
            {budgetForm.categoryId !== null && (
                <BudgetFormModal
                    title={
                        budgets.some(
                            (b) =>
                                b.category_id === budgetForm.categoryId &&
                                b.month === currentMonth &&
                                b.year === currentYear
                        )
                            ? "Edit budget"
                            : "Add budget"
                    }
                    initialName={budgetFormInitial.name}
                    initialAmount={budgetFormInitial.amount}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onSave={handleSaveBudget}
                    onClose={closeBudgetForm}
                />
            )}

            {/* Add category modal */}
            {addModal.open && (
                <AddCategoryModal
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    onAdd={handleAddCategoryWithBudget}
                    onClose={closeAddModal}
                />
            )}

            {/* Delete confirmation modal; confirm runs handleDelete(deleteId), cancel sets deleteId to null */}
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