import { useEffect, useState } from "react";
import { MONTH_NAMES } from "../../../config/constants";

export interface BudgetFormModalProps {
    title: string;
    initialName: string;
    initialAmount: string;
    currentMonth: number;
    currentYear: number;
    onSave: (name: string, amount: string, month: number, year: number) => Promise<void>;
    onClose: () => void;
}

export default function BudgetFormModal({
    title,
    initialName,
    initialAmount,
    currentMonth,
    currentYear,
    onSave,
    onClose,
}: BudgetFormModalProps) {
    const [name, setName] = useState(initialName);
    const [amount, setAmount] = useState(initialAmount);
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(initialName);
    }, [initialName]);

    useEffect(() => {
        setAmount(initialAmount);
    }, [initialAmount]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedAmount = amount.trim();

        if (!trimmedName) {
            setError("Category name is required.");
            return;
        }
        const num = parseFloat(trimmedAmount);
        if (!trimmedAmount || isNaN(num) || num <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            await onSave(trimmedName, trimmedAmount, month, year);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Fitness, Groceries"
                            maxLength={100}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                        />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-slate-500">Month</span>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
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
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
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
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20"
                        />
                    </label>
                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !name.trim() || !amount.trim()}
                            className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

