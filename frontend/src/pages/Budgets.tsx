import { useState, useRef, useEffect } from "react";
import { useBudgets } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";
import type { Budget } from "../types";
import type { BudgetCreatePayload, BudgetUpdatePayload } from "../api/budgets";

const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();

export default function Budgets() {
    const { categories } = useCategories();
    const { budgets, loading, error, refetch, addBudget, updateBudget, removeBudget } = useBudgets();

    const [form, setForm] = useState<BudgetCreatePayload>({
        category_id: 0,
        month: new Date().getMonth() + 1,
        year: currentYear,
        limit_amount: "",
    });
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<BudgetUpdatePayload>({});
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!form.category_id || !form.limit_amount.trim()) {
            setAddError("Select a category and enter a limit.");
            return;
        }
        const amount = Number(form.limit_amount);
        if (isNaN(amount) || amount <= 0) {
            setAddError("Enter a valid limit amount.");
            return;
        }
        setAdding(true);
        setAddError("");
        try {
            await addBudget({
                ...form,
                category_id: form.category_id,
                limit_amount: form.limit_amount.trim(),
            });
            setForm({ category_id: 0, month: new Date().getMonth() + 1, year: currentYear, limit_amount: "" });
        } catch (err) {
            setAddError((err as Error).message);
        } finally {
            setAdding(false);
        }
    }

    function startEdit(b: Budget) {
        setEditId(b.id);
        setEditForm({
            month: b.month,
            year: b.year,
            limit_amount: b.limit_amount,
        });
        setEditError("");
    }

    function cancelEdit() {
        setEditId(null);
        setEditForm({});
        setEditError("");
    }

    async function handleSaveEdit(id: number) {
        const amount = editForm.limit_amount?.trim();
        if (amount !== undefined && (amount === "" || isNaN(Number(amount)) || Number(amount) <= 0)) {
            setEditError("Enter a valid limit amount.");
            return;
        }
        setSaving(true);
        setEditError("");
        try {
            await updateBudget(id, {
                ...editForm,
                limit_amount: amount === "" ? undefined : amount,
            });
            cancelEdit();
        } catch (err) {
            setEditError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeBudget(id);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm";
    const btnPrimary =
        "rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50";
    const btnSecondary =
        "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2";

    return (
        <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Budgets</h1>
            <p className="mb-8 text-slate-600">Set spending limits by category and month</p>

            {/* Add form */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">New budget</h2>
                <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Category *
                        <select
                            value={form.category_id || ""}
                            onChange={(e) => setForm((f) => ({ ...f, category_id: Number(e.target.value) }))}
                            className={inputClass}
                            required
                        >
                            <option value="">Select category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Month
                        <select
                            value={form.month}
                            onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                            className={inputClass}
                        >
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Year
                        <select
                            value={form.year}
                            onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                            className={inputClass}
                        >
                            {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                        Limit amount *
                        <input
                            type="text"
                            inputMode="decimal"
                            value={form.limit_amount}
                            onChange={(e) => setForm((f) => ({ ...f, limit_amount: e.target.value }))}
                            placeholder="0.00"
                            className={inputClass}
                        />
                    </label>
                    <div className="flex items-end">
                        <button type="submit" disabled={adding || !form.category_id || !form.limit_amount.trim()} className={btnPrimary}>
                            {adding ? "Adding…" : "Add budget"}
                        </button>
                    </div>
                </form>
                {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
            </div>

            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={refetch} className="mt-3 text-sm font-medium text-violet-600 hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && budgets.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm">
                    No budgets yet. Add one above to get started.
                </div>
            )}

            {!loading && !error && budgets.length > 0 && (
                <ul className="space-y-3">
                    {budgets.map((budget) => (
                        <li key={budget.id}>
                            {editId === budget.id ? (
                                <BudgetEditForm
                                    editForm={editForm}
                                    setEditForm={setEditForm}
                                    categories={categories}
                                    error={editError}
                                    saving={saving}
                                    onSave={() => handleSaveEdit(budget.id)}
                                    onCancel={cancelEdit}
                                />
                            ) : (
                                <BudgetRow
                                    budget={budget}
                                    categories={categories}
                                    onEdit={() => startEdit(budget)}
                                    onDelete={() => setDeleteId(budget.id)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                        <p className="text-slate-700">Delete this budget? This cannot be undone.</p>
                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={() => setDeleteId(null)} className={btnSecondary + " flex-1"}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BudgetRow({
    budget,
    categories,
    onEdit,
    onDelete,
}: {
    budget: Budget;
    categories: { id: number; name: string }[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    const categoryName = categories.find((c) => c.id === budget.category_id)?.name ?? `#${budget.category_id}`;
    const monthLabel = MONTHS.find((m) => m.value === budget.month)?.label ?? String(budget.month);
    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-800">{categoryName}</span>
                <span className="text-sm text-slate-500">
                    {monthLabel} {budget.year}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">Limit: {budget.limit_amount}</span>
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

function BudgetEditForm({
    editForm,
    setEditForm,
    categories,
    error,
    saving,
    onSave,
    onCancel,
}: {
    editForm: BudgetUpdatePayload;
    setEditForm: React.Dispatch<React.SetStateAction<BudgetUpdatePayload>>;
    categories: { id: number; name: string }[];
    error: string;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-sm";
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Month
                    <select
                        value={editForm.month ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, month: Number(e.target.value) }))}
                        className={inputClass}
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Year
                    <select
                        value={editForm.year ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, year: Number(e.target.value) }))}
                        className={inputClass}
                    >
                        {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Limit amount *
                    <input
                        type="text"
                        inputMode="decimal"
                        value={editForm.limit_amount ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, limit_amount: e.target.value }))}
                        className={inputClass}
                    />
                </label>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
                <button type="button" onClick={onSave} disabled={saving} className={btnPrimary}>
                    {saving ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={onCancel} className={btnSecondary}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

// Reuse button classes in edit form (defined in parent)
const btnPrimary =
    "rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50";
const btnSecondary =
    "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2";
