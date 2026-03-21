import { useState, useRef } from "react";
import type { Expense } from "../../../types";
import type { ExpensePayload } from "../../../api/expenses";
import { uploadReceipt } from "../../../api/expenses";
import { DatePicker } from "../../ui/DatePicker";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    DeleteIcon,
    EditIcon,
} from "../../ui/icons";
import { formatDateLabel } from "../../../utils/formatters";
import { btnPrimary, btnSecondary, input } from "../../../styles/ui";

const PAYMENT_MODES = ["UPI", "CASH"] as const;

export interface ExpenseTableProps {
    pageExpenses: Expense[];
    categories: { id: number; name: string }[];
    editId: number | null;
    editForm: ExpensePayload;
    setEditForm: React.Dispatch<React.SetStateAction<ExpensePayload>>;
    editError: string;
    saving: boolean;
    totalCount: number;
    currentPage: number;
    totalPages: number;
    startEntry: number;
    endEntry: number;
    onEdit: (exp: Expense) => void;
    onDelete: (id: number) => void;
    onSaveEdit: (id: number) => void;
    onCancelEdit: () => void;
    onPageChange: (updater: (p: number) => number) => void;
}

export default function ExpenseTable({
    pageExpenses,
    categories,
    editId,
    editForm,
    setEditForm,
    editError,
    saving,
    totalCount,
    currentPage,
    totalPages,
    startEntry,
    endEntry,
    onEdit,
    onDelete,
    onSaveEdit,
    onCancelEdit,
    onPageChange,
}: ExpenseTableProps) {
    return (
        <>
            {}
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                    Showing <span className="font-medium">{startEntry}</span> – <span className="font-medium">{endEntry}</span> of <span className="font-medium">{totalCount}</span> entries
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                        aria-label="Previous page"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <span className="flex items-center gap-1 text-sm text-slate-700">
                        Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
                        aria-label="Next page"
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>
            {}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Notes</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Mode</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="w-24 px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {pageExpenses.map((exp) => (
                            editId === exp.id ? (
                                <tr key={exp.id}>
                                    <td colSpan={6} className="bg-[#e8ecfc]/50 p-0">
                                        <ExpenseEditForm
                                            form={editForm}
                                            setForm={setEditForm}
                                            categories={categories}
                                            error={editError}
                                            saving={saving}
                                            onSave={() => onSaveEdit(exp.id)}
                                            onCancel={onCancelEdit}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                <ExpenseTableRow
                                    key={exp.id}
                                    expense={exp}
                                    categories={categories}
                                    onEdit={() => onEdit(exp)}
                                    onDelete={() => onDelete(exp.id)}
                                />
                            )
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function ExpenseTableRow({
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
        <tr className="transition-colors hover:bg-slate-50/80">
            <td className="px-4 py-3 text-slate-700">{formatDateLabel(expense.date)}</td>
            <td className="max-w-[200px] px-4 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {expense.notes ? (
                        <span className="block max-w-full truncate text-slate-800" title={expense.notes}>{expense.notes}</span>
                    ) : (
                        <span className="text-slate-400">—</span>
                    )}
                    {expense.is_recurring && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Recurring</span>
                    )}
                    {expense.receipt_url && (
                        <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#4863D4] hover:underline"
                        >
                            Receipt
                        </a>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-slate-600">{categoryName}</td>
            <td className="px-4 py-3 text-slate-600">{expense.payment_mode}</td>
            <td className="px-4 py-3 text-right">
                <span className={`font-semibold tabular-nums ${expense.transaction_type === "in" ? "text-emerald-600" : "text-red-600"}`}>
                    {expense.transaction_type === "out" ? "-" : ""}{expense.amount}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-0.5">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="rounded p-1.5 text-slate-400 hover:bg-[#e8ecfc] hover:text-[#4863D4]"
                        aria-label="Edit"
                    >
                        <EditIcon />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

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
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [receiptError, setReceiptError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setReceiptError("Please choose an image file (e.g. JPEG, PNG).");
            return;
        }
        setReceiptError("");
        setUploadingReceipt(true);
        try {
            const { receipt_url } = await uploadReceipt(file);
            setForm((prev) => ({ ...prev, receipt_url }));
        } catch (err) {
            setReceiptError((err as Error).message);
        } finally {
            setUploadingReceipt(false);
        }
    }

    function handleRemoveReceipt() {
        setForm((prev) => ({ ...prev, receipt_url: null }));
        setReceiptError("");
    }

    return (
        <div className="rounded-lg border-2 border-[#4863D4]/30 bg-[#e8ecfc]/50 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Amount *</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                        className={input}
                    />
                </label>
                <div className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Date *</span>
                    <DatePicker
                        value={form.date}
                        onChange={(value) => setForm((f) => ({ ...f, date: value }))}
                        placeholder="Pick a date"
                        className="w-full"
                    />
                </div>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Category</span>
                    <select
                        value={form.category_id ?? ""}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                category_id: e.target.value ? Number(e.target.value) : null,
                            }))
                        }
                        className={input}
                    >
                        <option value="">None</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Payment mode</span>
                    <select
                        value={form.payment_mode ?? "CASH"}
                        onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
                        className={input}
                    >
                        {PAYMENT_MODES.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Type</span>
                    <select
                        value={form.transaction_type ?? "out"}
                        onChange={(e) => setForm((f) => ({ ...f, transaction_type: e.target.value as "in" | "out" }))}
                        className={input}
                    >
                        <option value="out">Cash Out</option>
                        <option value="in">Cash In</option>
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-slate-600">Notes</span>
                    <input
                        type="text"
                        value={form.notes ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        className={input}
                    />
                </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                />
                Recurring
            </label>
            {}
            <div className="mt-3 border-t border-slate-200 pt-3">
                <span className="mb-1 block text-xs font-medium text-slate-600">Receipt (optional)</span>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    onChange={handleReceiptChange}
                    className="hidden"
                />
                {form.receipt_url ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={form.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#4863D4] hover:underline"
                        >
                            View receipt
                        </a>
                        <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="text-sm text-slate-500 hover:text-red-600"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingReceipt}
                        className="text-sm font-medium text-slate-600 underline hover:text-slate-800 disabled:opacity-50"
                    >
                        {uploadingReceipt ? "Uploading…" : "Upload receipt"}
                    </button>
                )}
                {receiptError && <p className="mt-1 text-sm text-red-600">{receiptError}</p>}
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
