// Page deps: shared components, hooks, types
import { useState, useCallback } from "react";
import {
    CashFlowSummaryCard,
    ConfirmModal,
    ExpenseFormModal,
    ExportMenu,
    ExpenseFiltersBar,
    ExpenseTable,
    PageHeader,
} from "../components/shared";
import { useExpenses } from "../hooks/useExpenses";
import { useExpenseFilters } from "../hooks/useExpenseFilters";
import { usePaginatedExpenses, type SortOption } from "../hooks/usePaginatedExpenses";
import { useCategories } from "../hooks/useCategories";
import type { Expense } from "../types";
import type { ExpensePayload, ExpenseFilters } from "../api/expenses";

// Default form values for add/edit; date is today in YYYY-MM-DD
const defaultPayload: ExpensePayload = {
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    is_recurring: false,
    category_id: null,
    payment_mode: "CASH",
    transaction_type: "out",
};

// Converts an Expense from API into form payload for editing
function payloadFromExpense(e: Expense): ExpensePayload {
    return {
        amount: e.amount,
        payment_mode: e.payment_mode,
        transaction_type: e.transaction_type,
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

    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("date");

    const [showAddForm, setShowAddForm] = useState<"in" | "out" | false>(false);
    const [form, setForm] = useState<ExpensePayload>(defaultPayload);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const [editId, setEditId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<ExpensePayload>(defaultPayload);
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const onFilterChange = useCallback(
        (filters: ExpenseFilters) => {
            setPage(1);
            refetch(filters);
        },
        [refetch]
    );
    const filters = useExpenseFilters(onFilterChange);

    const paginated = usePaginatedExpenses(expenses, filters.filterRecurring, sortBy, page);

    const cashIn = expenses.filter((e) => e.transaction_type === "in").reduce((s, e) => s + Number(e.amount), 0);
    const cashOut = expenses.filter((e) => e.transaction_type === "out").reduce((s, e) => s + Number(e.amount), 0);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        setAddError("");
        try {
            await addExpense(form);
            setForm(defaultPayload);
            setShowAddForm(false);
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
        setSaving(true);
        setEditError("");
        try {
            await updateExpense(id, editForm);
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

    return (
        <div className="space-y-6">
            <PageHeader
                title="Expenses"
                actions={<ExportMenu expenses={expenses} categories={categories} />}
            />

            {showAddForm && (
                <ExpenseFormModal
                    title={showAddForm === "in" ? "Cash In" : "Cash Out"}
                    form={form}
                    onChange={setForm}
                    categories={categories}
                    error={addError}
                    submitting={adding}
                    submitLabel={adding ? "Adding…" : "Add"}
                    onSubmit={handleAdd}
                    onClose={() => {
                        setShowAddForm(false);
                        setAddError("");
                        setForm(defaultPayload);
                    }}
                />
            )}

            <CashFlowSummaryCard cashIn={cashIn} cashOut={cashOut} loading={loading} />

            <ExpenseFiltersBar
                filters={filters}
                sortBy={sortBy}
                onSortChange={(sort) => {
                    setSortBy(sort);
                    setPage(1);
                }}
                categories={categories}
                onAddCashIn={() => {
                    setShowAddForm("in");
                    setAddError("");
                    setForm({ ...defaultPayload, transaction_type: "in" });
                }}
                onAddCashOut={() => {
                    setShowAddForm("out");
                    setAddError("");
                    setForm({ ...defaultPayload, transaction_type: "out" });
                }}
            />

            {loading && (
                <div className="py-12 text-center text-slate-500">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="border-t border-slate-200 bg-red-50/50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 text-sm font-medium text-[#4863D4] hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && expenses.length === 0 && (
                <div className="border-t border-slate-200 py-16 text-center">
                    <p className="text-slate-500">No expenses yet.</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Use &quot;Cash In&quot; or &quot;Cash Out&quot; above to add one, or clear filters.
                    </p>
                </div>
            )}

            {!loading && !error && expenses.length > 0 && paginated.isEmpty && (
                <div className="border-t border-slate-200 py-12 text-center">
                    <p className="text-slate-500">No expenses match the recurring filter.</p>
                    <p className="mt-1 text-sm text-slate-400">Try changing or clearing filters.</p>
                </div>
            )}

            {!loading && !error && expenses.length > 0 && !paginated.isEmpty && (
                <ExpenseTable
                    pageExpenses={paginated.pageExpenses}
                    categories={categories}
                    editId={editId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    editError={editError}
                    saving={saving}
                    totalCount={paginated.totalCount}
                    currentPage={paginated.currentPage}
                    totalPages={paginated.totalPages}
                    startEntry={paginated.startEntry}
                    endEntry={paginated.endEntry}
                    onEdit={startEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={cancelEdit}
                    onPageChange={setPage}
                />
            )}

            {deleteId !== null && (
                <ConfirmModal
                    message="Delete this expense? This cannot be undone."
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
