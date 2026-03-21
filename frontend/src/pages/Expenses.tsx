import { useState, useCallback, useMemo } from "react";
import { useCategories } from "../hooks/categories/useCategories";
import {
    CashFlowSummaryCard,
    ConfirmModal,
    ExpenseFormModal,
    ExportMenu,
    ExpenseFiltersBar,
    ExpenseTable,
    PageHeader,
} from "../components/shared";
import { useExpenses } from "../hooks/expenses/useExpenses";
import { useExpenseFilters } from "../hooks/expenses/useExpenseFilters";
import { usePagedExpenses, type SortOption } from "../hooks/expenses/usePagedExpenses";
import type { Expense } from "../types";
import type { ExpenseFilters, ExpensePayload, PagedExpenseQuery } from "../api/expenses";

const defaultPayload: ExpensePayload = {
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    is_recurring: false,
    category_id: null,
    payment_mode: "CASH",
    transaction_type: "out",
    receipt_url: null,
};

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
        receipt_url: e.receipt_url ?? null,
    };
}

export default function Expenses() {
    const { categories } = useCategories();
    const { addExpense, updateExpense, removeExpense } = useExpenses();

    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("date");
    const PAGE_SIZE = 10;

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

    const [activeFilters, setActiveFilters] = useState<ExpenseFilters>({});
    const onFilterChange = useCallback(
        (filters: ExpenseFilters) => {
            setPage(1);
            setActiveFilters(filters);
        },
        []
    );
    const filters = useExpenseFilters(onFilterChange);

    const pagedQuery: PagedExpenseQuery = useMemo(
        () => ({
            ...activeFilters,
            page,
            page_size: PAGE_SIZE,
            sort_by: sortBy,
        }),
        [activeFilters, page, sortBy]
    );

    const {
        items: pageExpensesAll,
        total: totalCountAll,
        cashInTotal,
        cashOutTotal,
        loading,
        error,
        refetch,
    } = usePagedExpenses(pagedQuery);

    const pageExpenses =
        filters.filterRecurring === "true"
            ? pageExpensesAll.filter((e) => e.is_recurring)
            : filters.filterRecurring === "false"
                ? pageExpensesAll.filter((e) => !e.is_recurring)
                : pageExpensesAll;

    const totalCount = totalCountAll;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const endEntry = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + pageExpenses.length;
    const isEmpty = totalCount === 0;

    const cashIn = cashInTotal;
    const cashOut = cashOutTotal;

    function handleSortChange(sort: SortOption) {
        setSortBy(sort);
        setPage(1);
    }

    function openAddCashIn() {
        setShowAddForm("in");
        setAddError("");
        setForm({ ...defaultPayload, transaction_type: "in" });
    }

    function openAddCashOut() {
        setShowAddForm("out");
        setAddError("");
        setForm({ ...defaultPayload, transaction_type: "out" });
    }

    function closeAddForm() {
        setShowAddForm(false);
        setAddError("");
        setForm(defaultPayload);
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        setAddError("");
        try {
            await addExpense(form);
            await refetch();
            closeAddForm();
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
            await refetch();
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
            await refetch();
            setDeleteId(null);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="space-y-6">
            {}
            <PageHeader
                title="Expenses"
                actions={<ExportMenu expenses={pageExpenses} categories={categories} />}
            />

            {}
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
                    onClose={closeAddForm}
                />
            )}

            {}
            <CashFlowSummaryCard cashIn={cashIn} cashOut={cashOut} loading={loading} />

            {}
            <ExpenseFiltersBar
                filters={filters}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                categories={categories}
                onAddCashIn={openAddCashIn}
                onAddCashOut={openAddCashOut}
            />

            {}
            {loading && (
                <div className="py-12 text-center text-slate-500">Loading…</div>
            )}

            {!loading && error && (
                <div className="border-t border-slate-200 bg-red-50/50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-medium text-[#4863D4] hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && totalCount === 0 && (
                <div className="border-t border-slate-200 py-16 text-center">
                    <p className="text-slate-500">No expenses yet.</p>
                    <p className="mt-1 text-sm text-slate-400">Use "Cash In" or "Cash Out" above to add one, or clear filters.</p>
                </div>
            )}

            {!loading && !error && totalCount > 0 && pageExpenses.length === 0 && (
                <div className="border-t border-slate-200 py-12 text-center">
                    <p className="text-slate-500">No expenses match the recurring filter.</p>
                    <p className="mt-1 text-sm text-slate-400">Try changing or clearing filters.</p>
                </div>
            )}

            {!loading && !error && !isEmpty && (
                <ExpenseTable
                    pageExpenses={pageExpenses}
                    categories={categories}
                    editId={editId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    editError={editError}
                    saving={saving}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    startEntry={startEntry}
                    endEntry={endEntry}
                    onEdit={startEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={cancelEdit}
                    onPageChange={setPage}
                />
            )}

            {}
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