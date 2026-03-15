import { formatAmount } from "../../utils/formatters";

interface CashFlowSummaryCardProps {
    cashIn: number;
    cashOut: number;
    loading?: boolean;
}

export default function CashFlowSummaryCard({ cashIn, cashOut, loading }: CashFlowSummaryCardProps) {
    const netBalance = cashIn - cashOut;

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl bg-slate-100/80 px-3 py-2.5">
                        <div className="h-3 w-14 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-5 w-20 animate-pulse rounded bg-slate-200" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50/80 px-3 py-2.5 ring-1 ring-emerald-200/60">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-700/80">Cash In</span>
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-emerald-800">
                    {formatAmount(cashIn)}
                </p>
            </div>

            <div className="rounded-xl bg-red-50/80 px-3 py-2.5 ring-1 ring-red-200/60">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/15 text-red-600">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-red-700/80">Cash Out</span>
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-red-800">
                    {formatAmount(cashOut)}
                </p>
            </div>

            <div className="rounded-xl bg-slate-100/80 px-3 py-2.5 ring-1 ring-slate-200/60">
                <div className="flex items-center gap-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-300/50 text-slate-600">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14M5 18h14" />
                        </svg>
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                        Net Balance
                    </span>
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900">
                    {formatAmount(netBalance)}
                </p>
            </div>
        </div>
    );
}
