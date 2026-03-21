import { useState, useRef } from "react";
import type { ExpensePayload } from "../../../api/expenses";
import { uploadReceipt } from "../../../api/expenses";
import type { Category } from "../../../types";
import { DatePicker } from "../../ui/DatePicker";
import { CloseIcon } from "../../ui/icons";
import { input, btnPrimary, btnSecondary } from "../../../styles/ui";

const PAYMENT_MODES = ["UPI", "CASH"] as const;

export interface ExpenseFormModalProps {
    title: string;
    form: ExpensePayload;
    onChange: React.Dispatch<React.SetStateAction<ExpensePayload>>;
    categories: Category[];
    error: string;
    submitting: boolean;
    submitLabel: string;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

export default function ExpenseFormModal({
    title,
    form,
    onChange,
    categories,
    error,
    submitting,
    submitLabel,
    onSubmit,
    onClose,
}: ExpenseFormModalProps) {
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
            onChange((prev) => ({ ...prev, receipt_url }));
        } catch (err) {
            setReceiptError((err as Error).message);
        } finally {
            setUploadingReceipt(false);
        }
    }

    function handleRemoveReceipt() {
        onChange((prev) => ({ ...prev, receipt_url: null }));
        setReceiptError("");
    }

    return (
        <div
            className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/25 p-4"
            onClick={onClose}
        >
            <div
                className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <form onSubmit={onSubmit} className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Amount *</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={form.amount}
                                    onChange={(e) => onChange((f) => ({ ...f, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className={input}
                                />
                            </label>
                            <div className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Date *</span>
                                <DatePicker
                                    value={form.date}
                                    onChange={(value) => onChange((f) => ({ ...f, date: value }))}
                                    placeholder="Pick a date"
                                    className="w-full"
                                />
                            </div>
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-slate-500">Category</span>
                                <select
                                    value={form.category_id ?? ""}
                                    onChange={(e) =>
                                        onChange((f) => ({
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
                                <span className="mb-1 block text-xs font-medium text-slate-500">Payment mode</span>
                                <select
                                    value={form.payment_mode ?? "CASH"}
                                    onChange={(e) => onChange((f) => ({ ...f, payment_mode: e.target.value }))}
                                    className={input}
                                >
                                    {PAYMENT_MODES.map((mode) => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label className="mt-4 block">
                            <span className="mb-1 block text-xs font-medium text-slate-500">Notes</span>
                            <input
                                type="text"
                                value={form.notes ?? ""}
                                onChange={(e) => onChange((f) => ({ ...f, notes: e.target.value }))}
                                placeholder="Optional"
                                className={input}
                            />
                        </label>
                        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                checked={form.is_recurring}
                                onChange={(e) => onChange((f) => ({ ...f, is_recurring: e.target.checked }))}
                                className="h-4 w-4 rounded border-slate-300 text-[#4863D4] focus:ring-[#4863D4]"
                            />
                            Recurring
                        </label>

                        {}
                        <div className="mt-4 border-t border-slate-200 pt-4">
                            <span className="mb-2 block text-xs font-medium text-slate-500">Receipt (optional)</span>
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

                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={onClose} className={btnSecondary}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting} className={btnPrimary}>
                                {submitLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
