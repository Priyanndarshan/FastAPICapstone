import { MONTH_NAMES } from "../../../config/constants";
import { useCategoryBudgetForm } from "../../../hooks/budgets/useCategoryBudgetForm";

export interface AddCategoryModalProps {
    currentMonth: number;
    currentYear: number;
    onAdd: (name: string, amount: string, month: number, year: number) => Promise<void>;
    onClose: () => void;
}

export default function AddCategoryModal({
    currentMonth,
    currentYear,
    onAdd,
    onClose,
}: AddCategoryModalProps) {
    const {
        name,
        setName,
        amount,
        setAmount,
        month,
        setMonth,
        year,
        setYear,
        error,
        saving,
        handleSubmit,
    } = useCategoryBudgetForm({
        initialName: "",
        initialAmount: "",
        initialMonth: currentMonth,
        initialYear: currentYear,
        onSubmit: onAdd,
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-slate-900">Add category</h3>
                <p className="mt-0.5 text-sm text-slate-500">Create a category and optionally set a budget.</p>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500">Category name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
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
                            disabled={saving || !name.trim()}
                            className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a50b8] disabled:opacity-50"
                        >
                            {saving ? "Adding…" : "Add category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

