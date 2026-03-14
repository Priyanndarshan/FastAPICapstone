import { useState, useRef, useEffect } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { useCategories } from "../hooks/useCategories";
import type { Expense } from "../types";
import type { ExpensePayload, ExpenseFilters } from "../api/expenses";

const defaultPayload: ExpensePayload = {
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    is_recurring: false,
    category_id: null,
    currency: "INR",
};

function payloadFromExpense(e: Expense): ExpensePayload {
    return {
        amount: e.amount,
        currency: e.currency,
        date: e.date,
        notes: e.notes ?? "",
        is_recurring: e.is_recurring,
        recurrence_period: e.recurrence_period ?? null,
        category_id: e.category_id,
    };
}

export default function Expenses() {
    const { categories } = useCategories();
    const { expenses, loading, error, refetch, addExpense, updateExpense, removeExpense } = useExpenses();

    const [form, setForm] = useState<ExpensePayload>(defaultPayload);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ExpensePayload>(defaultPayload);
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [filters, setFilters] = useState<ExpenseFilters>({});
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");
    const [filterCategoryId, setFilterCategoryId] = useState<string>("");

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        const amount = form.amount.trim();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setAddError("Enter a valid amount.");
            return;
        }
        setAdding(true);
        setAddError("");
        try {
            await addExpense({
                ...form,
                amount,
                category_id: form.category_id ?? null,
                notes: form.notes || null,
                recurrence_period: form.is_recurring ? form.recurrence_period ?? null : null,
            });
            setForm(defaultPayload);
        } catch (err) {
            setAddError((err as Error).message);
        } finally {
            setAdding(false);
        }
    }

    function startEdit(exp: Expense) {
        setEditId(exp.id);
        setEditForm(payloadFromExpense(exp));
        setEditError("");
    }

    function cancelEdit() {
        setEditId(null);
        setEditForm(defaultPayload);
        setEditError("");
    }

    async function handleSaveEdit(id: number) {
        const amount = editForm.amount.trim();
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setEditError("Enter a valid amount.");
            return;
        }
        setSaving(true);
        setEditError("");
        try {
            await updateExpense(id, {
                ...editForm,
                amount,
                category_id: editForm.category_id ?? null,
                notes: editForm.notes || null,
                recurrence_period: editForm.is_recurring ? editForm.recurrence_period ?? null : null,
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
            await removeExpense(id);
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    function applyFilters() {
        const next: ExpenseFilters = {};
        if (filterStart) next.start_date = filterStart;
        if (filterEnd) next.end_date = filterEnd;
        if (filterCategoryId) next.category_id = Number(filterCategoryId);
        setFilters(next);
        refetch(next);
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-xl font-semibold text-gray-800">Expenses</h1>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-gray-50 p-3">
                <label className="flex flex-col gap-1 text-sm">
                    From
                    <input
                        type="date"
                        value={filterStart}
                        onChange={(e) => setFilterStart(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    To
                    <input
                        type="date"
                        value={filterEnd}
                        onChange={(e) => setFilterEnd(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Category
                    <select
                        value={filterCategoryId}
                        onChange={(e) => setFilterCategoryId(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="">All</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setFilterStart("");
                        setFilterEnd("");
                        setFilterCategoryId("");
                        setFilters({});
                        refetch();
                    }}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                    Clear
                </button>
            </div>

            {/* Add expense form */}
            <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
                <label className="flex flex-col gap-1 text-sm">
                    Amount *
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="0.00"
                        className="rounded border border-gray-300 px-3 py-2"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Currency
                    <input
                        type="text"
                        value={form.currency ?? "INR"}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                        placeholder="INR"
                        maxLength={10}
                        className="rounded border border-gray-300 px-3 py-2"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Date *
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className="rounded border border-gray-300 px-3 py-2"
                    />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Category
                    <select
                        value={form.category_id ?? ""}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                category_id: e.target.value ? Number(e.target.value) : null,
                            }))
                        }
                        className="rounded border border-gray-300 px-3 py-2"
                    >
                        <option value="">—</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Notes
                    <input
                        type="text"
                        value={form.notes ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="Optional"
                        className="rounded border border-gray-300 px-3 py-2"
                    />
                </label>
                <div className="flex flex-col justify-end gap-2 sm:flex-row">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_recurring}
                            onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                        />
                        Recurring
                    </label>
                    <button
                        type="submit"
                        disabled={adding}
                        className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                        {adding ? "Adding…" : "Add expense"}
                    </button>
                </div>
            </form>
            {addError && <p className="mb-4 text-sm text-red-600">{addError}</p>}

            {loading && <p className="text-gray-500">Loading…</p>}
            {!loading && error && (
                <div>
                    <p className="text-red-600">{error}</p>
                    <button type="button" onClick={() => refetch()} className="mt-2 text-sm text-violet-600 hover:underline">
                        Try again
                    </button>
                </div>
            )}
            {!loading && !error && expenses.length === 0 && (
                <p className="text-gray-500">No expenses yet. Add one above or clear filters.</p>
            )}
            {!loading && !error && expenses.length > 0 && (
                <ul className="space-y-2">
                    {expenses.map((exp) => (
                        <li key={exp.id}>
                            {editId === exp.id ? (
                                <ExpenseEditForm
                                    form={editForm}
                                    setForm={setEditForm}
                                    categories={categories}
                                    error={editError}
                                    saving={saving}
                                    onSave={() => handleSaveEdit(exp.id)}
                                    onCancel={cancelEdit}
                                />
                            ) : (
                                <ExpenseRow
                                    expense={exp}
                                    categories={categories}
                                    onEdit={() => startEdit(exp)}
                                    onDelete={() => setDeleteId(exp.id)}
                                />
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                        <p className="text-gray-800">
                            Delete this expense? This cannot be undone.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="flex-1 rounded border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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

function ExpenseRow({
    expense,
    categories,
    onEdit,
    onDelete,
}: {
    expense: Expense;
    categories: { id: number; name: string }[];
    onEdit: () => void;
    onDelete: () => void;
}) {
    const categoryName = expense.category_id
        ? categories.find((c) => c.id === expense.category_id)?.name ?? `#${expense.category_id}`
        : "—";
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-white px-3 py-2">
            <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-gray-900">
                    {expense.currency} {expense.amount}
                </span>
                <span className="text-sm text-gray-500">{expense.date}</span>
                <span className="text-sm text-gray-600">{categoryName}</span>
                {expense.notes && (
                    <span className="text-sm text-gray-500 truncate max-w-[120px]" title={expense.notes}>
                        {expense.notes}
                    </span>
                )}
                {expense.is_recurring && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Recurring</span>
                )}
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onEdit} className="text-sm text-violet-600 hover:underline">
                    Edit
                </button>
                <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:underline">
                    Delete
                </button>
            </div>
        </div>
    );
}

function ExpenseEditForm({
    form,
    setForm,
    categories,
    error,
    saving,
    onSave,
    onCancel,
}: {
    form: ExpensePayload;
    setForm: React.Dispatch<React.SetStateAction<ExpensePayload>>;
    categories: { id: number; name: string }[];
    error: string;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <label className="text-sm">
                    Amount *
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm">
                    Currency
                    <input
                        type="text"
                        value={form.currency ?? "INR"}
                        onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                        className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm">
                    Date *
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
                <label className="text-sm">
                    Category
                    <select
                        value={form.category_id ?? ""}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                category_id: e.target.value ? Number(e.target.value) : null,
                            }))
                        }
                        className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5"
                    >
                        <option value="">—</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    Notes
                    <input
                        type="text"
                        value={form.notes ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5"
                    />
                </label>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                />
                Recurring
            </label>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            <div className="mt-2 flex gap-2">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
                >
                    {saving ? "Saving…" : "Save"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
