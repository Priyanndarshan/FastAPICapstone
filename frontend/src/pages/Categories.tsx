// --- Page dependencies: React, data hooks, types, config, shared components ---
// Connected to: hooks/useCategories, useBudgets, useAnalytics (API); types/index (Category); config/constants (MONTH_NAMES); components/shared (ConfirmModal, PageHeader)
import { useState, useMemo } from "react";
import { useCategories } from "../hooks/useCategories";
import { useBudgets } from "../hooks/useBudgets";
import { useAnalytics } from "../hooks/useAnalytics";
import type { Category } from "../types";
import { MONTH_NAMES } from "../config/constants";
import { formatAmount } from "../utils/formatters";
import { ConfirmModal, PageHeader } from "../components/shared";
import { PlusIcon, CategoryIcon, DeleteIcon } from "../components/ui/icons";

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
    const budgetByCategory = useMemo(() => {
        const map: Record<number, { limit: number; spent: number }> = {};
        const thisMonthBudgets = budgets.filter(
            (b) => b.month === currentMonth && b.year === currentYear
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
    }, [budgets, monthly]);

    // "Add category" modal state: visibility, form fields (name, amount, month, year), validation error, and saving flag
    const [addModal, setAddModal] = useState({
        open: false,
        name: "",
        amount: "",
        month: currentMonth,
        year: currentYear,
        error: "",
        saving: false,
    });

    // Delete confirmation: which category id is selected for delete (null = modal closed); deleting = request in progress
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // "Add/Edit budget" modal state: which category, name, month/year, amount, error, saving. Shared for both add and edit flows.
    const [budgetForm, setBudgetForm] = useState<{
        categoryId: number | null;
        name: string;
        month: number;
        year: number;
        amount: string;
        error: string;
        saving: boolean;
    }>({
        categoryId: null,
        name: "",
        month: currentMonth,
        year: currentYear,
        amount: "",
        error: "",
        saving: false,
    });

    // Opens add-category modal and resets form to current month/year and empty name/amount
    function openAddModal() {
        setAddModal((prev) => ({
            ...prev,
            open: true,
            name: "",
            amount: "",
            month: currentMonth,
            year: currentYear,
            error: "",
        }));
    }

    // Closes add modal and clears all fields; used on cancel or after successful submit
    function closeAddModal() {
        setAddModal({
            open: false,
            name: "",
            amount: "",
            month: currentMonth,
            year: currentYear,
            error: "",
            saving: false,
        });
    }

    // Submit handler for "Add category" form: validates name/amount, calls addCategory (API), then addBudget if amount given; closes modal on success, sets error on failure
    async function handleAddCategoryWithBudget(e: React.FormEvent) {
        e.preventDefault();
        const name = addModal.name.trim();
        if (!name) {
            setAddModal((prev) => ({ ...prev, error: "Category name is required." }));
            return;
        }
        const amountStr = addModal.amount.trim();
        const amountNum = amountStr ? parseFloat(amountStr) : 0;
        if (amountStr && (isNaN(amountNum) || amountNum <= 0)) {
            setAddModal((prev) => ({ ...prev, error: "Enter a valid budget amount." }));
            return;
        }
        setAddModal((prev) => ({ ...prev, saving: true, error: "" }));
        try {
            const cat = await addCategory(name);
            if (amountStr && !isNaN(amountNum) && amountNum > 0) {
                await addBudget({
                    category_id: cat.id,
                    month: addModal.month,
                    year: addModal.year,
                    limit_amount: amountStr,
                });
            }
            closeAddModal();
        } catch (err) {
            setAddModal((prev) => ({ ...prev, error: (err as Error).message }));
        } finally {
            setAddModal((prev) => ({ ...prev, saving: false }));
        }
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

    // Opens budget modal for a category: pre-fills name from categories, amount/month/year from existing budget for current month if any
    function openBudgetForm(categoryId: number) {
        const cat = categories.find((c) => c.id === categoryId);
        const existing = budgets.find(
            (b) => b.category_id === categoryId && b.month === currentMonth && b.year === currentYear
        );
        setBudgetForm((prev) => ({
            ...prev,
            categoryId,
            name: cat?.name ?? "",
            month: currentMonth,
            year: currentYear,
            amount: existing ? existing.limit_amount : "",
            error: "",
        }));
    }

    // Closes budget modal and resets form; used on cancel or after successful save
    function closeBudgetForm() {
        setBudgetForm({
            categoryId: null,
            name: "",
            month: currentMonth,
            year: currentYear,
            amount: "",
            error: "",
            saving: false,
        });
    }

    // Submit handler for budget form: validates name/amount; updates category name via updateCategory if changed; then updateBudget or addBudget (API) and closes modal
    async function handleSaveBudget(e: React.FormEvent) {
        e.preventDefault();
        if (budgetForm.categoryId == null) return;
        const name = budgetForm.name.trim();
        if (!name) {
            setBudgetForm((prev) => ({ ...prev, error: "Category name is required." }));
            return;
        }
        const amount = budgetForm.amount.trim();
        const num = parseFloat(amount);
        if (!amount || isNaN(num) || num <= 0) {
            setBudgetForm((prev) => ({ ...prev, error: "Enter a valid amount." }));
            return;
        }
        setBudgetForm((prev) => ({ ...prev, saving: true, error: "" }));
        try {
            const cat = categories.find((c) => c.id === budgetForm.categoryId);
            if (cat && name !== cat.name) {
                await updateCategory(budgetForm.categoryId, name);
            }
            const existing = budgets.find(
                (b) =>
                    b.category_id === budgetForm.categoryId &&
                    b.month === budgetForm.month &&
                    b.year === budgetForm.year
            );
            if (existing) {
                await updateBudget(existing.id, { limit_amount: amount });
            } else {
                await addBudget({
                    category_id: budgetForm.categoryId,
                    month: budgetForm.month,
                    year: budgetForm.year,
                    limit_amount: amount,
                });
            }
            closeBudgetForm();
        } catch (err) {
            setBudgetForm((prev) => ({ ...prev, error: (err as Error).message }));
        } finally {
            setBudgetForm((prev) => ({ ...prev, saving: false }));
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

            {/* Add/Edit budget modal overlay; form submits to handleSaveBudget; backdrop click closes via closeBudgetForm */}
            {budgetForm.categoryId !== null && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
                    onClick={closeBudgetForm}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">
                            {budgets.some(
                                (b) =>
                                    b.category_id === budgetForm.categoryId &&
                                    b.month === budgetForm.month &&
                                    b.year === budgetForm.year
                            )
                                ? "Edit budget"
                                : "Add budget"}
                        </h3>
                        <form onSubmit={handleSaveBudget} className="mt-4 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                                <input
                                    type="text"
                                    value={budgetForm.name}
                                    onChange={(e) => setBudgetForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Fitness, Groceries"
                                    maxLength={100}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                                    <select
                                        value={budgetForm.month}
                                        onChange={(e) => setBudgetForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {MONTH_NAMES.map((name, i) => (
                                            <option key={name} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
                                    <select
                                        value={budgetForm.year}
                                        onChange={(e) => setBudgetForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Amount</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={budgetForm.amount}
                                    onChange={(e) => setBudgetForm((prev) => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            {budgetForm.error && (
                                <p className="text-sm text-red-600">{budgetForm.error}</p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeBudgetForm}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={budgetForm.saving || !budgetForm.name.trim() || !budgetForm.amount.trim()}
                                    className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                                >
                                    {budgetForm.saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add category modal overlay; form submits to handleAddCategoryWithBudget; backdrop click closes via closeAddModal */}
            {addModal.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
                    onClick={closeAddModal}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold text-slate-900">Add category</h3>
                        <p className="mt-0.5 text-sm text-slate-500">Create a category and optionally set a budget.</p>
                        <form onSubmit={handleAddCategoryWithBudget} className="mt-4 space-y-4">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                                <input
                                    type="text"
                                    value={addModal.name}
                                    onChange={(e) => setAddModal((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Groceries, Transport, Fitness"
                                    maxLength={100}
                                    autoFocus
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Budget amount (optional)</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={addModal.amount}
                                    onChange={(e) => setAddModal((prev) => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                                    <select
                                        value={addModal.month}
                                        onChange={(e) => setAddModal((prev) => ({ ...prev, month: Number(e.target.value) }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {MONTH_NAMES.map((name, i) => (
                                            <option key={name} value={i + 1}>{name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-xs font-medium text-slate-500">Year</span>
                                    <select
                                        value={addModal.year}
                                        onChange={(e) => setAddModal((prev) => ({ ...prev, year: Number(e.target.value) }))}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                                    >
                                        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {addModal.error && (
                                <p className="text-sm text-red-600">{addModal.error}</p>
                            )}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addModal.saving || !addModal.name.trim()}
                                    className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                                >
                                    {addModal.saving ? "Adding…" : "Add category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
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

// --- CategoryRow: types and presentational row for one category card ---
// Receives category + optional budget info (from budgetByCategory); used only inside this file in the categories grid
interface BudgetInfo {
    limit: number;
    spent: number;
}

interface CategoryRowProps {
    cat: Category;
    budgetInfo?: BudgetInfo;
    month: number;
    year: number;
    onDeleteClick: () => void;
    onAddBudgetClick: () => void;
}

// Renders one category card: name, month/year label, spent vs limit progress (or "no budget" copy), delete and add/edit budget buttons. Uses formatAmount and MONTH_NAMES.
function CategoryRow({
    cat,
    budgetInfo,
    month,
    year,
    onDeleteClick,
    onAddBudgetClick,
}: CategoryRowProps) {
    // Derived for progress display: whether category has a budget, amount left, over-budget flag, and percentage for bar width
    const hasBudget = budgetInfo && budgetInfo.limit > 0;
    const left = hasBudget ? budgetInfo!.limit - budgetInfo!.spent : 0;
    const overBudget = hasBudget && budgetInfo!.spent > budgetInfo!.limit;
    const pct = hasBudget && budgetInfo!.limit > 0
        ? Math.min(100, (budgetInfo!.spent / budgetInfo!.limit) * 100)
        : 0;

    return (
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8ecfc] text-[#4863D4]">
                        <CategoryIcon />
                    </span>
                    <div>
                        <h3 className="truncate font-semibold text-slate-900">{cat.name}</h3>
                        <p className="text-xs text-slate-500">
                            {MONTH_NAMES[month - 1]} {year}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0">
                    <button
                        type="button"
                        onClick={onDeleteClick}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete category"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </div>

            {hasBudget ? (
                <div className="mt-4 space-y-3">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-slate-600">
                            <span className="font-medium tabular-nums text-slate-900">{formatAmount(budgetInfo!.spent)}</span>
                            {" / "}
                            <span className="tabular-nums text-slate-700">{formatAmount(budgetInfo!.limit)}</span>
                        </span>
                        {left >= 0 ? (
                            <span className="font-medium tabular-nums text-[#4863D4]">{formatAmount(left)} left</span>
                        ) : (
                            <span className="font-medium tabular-nums text-red-600">{formatAmount(-left)} over</span>
                        )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                            className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-[#4863D4]"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                        />
                    </div>
                </div>
            ) : budgetInfo && budgetInfo.spent > 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                    Spent <span className="tabular-nums font-medium text-slate-700">{formatAmount(budgetInfo.spent)}</span> this month · no budget set
                </p>
            ) : (
                <p className="mt-3 text-sm text-slate-400">No budget or spending yet</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    onClick={onAddBudgetClick}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-[#4863D4] hover:text-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                >
                    {hasBudget ? "Edit budget" : "Add budget"}
                </button>
            </div>
        </article>
    );
}