interface CashFlowSummaryCardProps {
    cashIn: number;
    cashOut: number;
    loading?: boolean;
}

function formatAmount(value: number): string {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CashFlowSummaryCard({ cashIn, cashOut, loading }: CashFlowSummaryCardProps) {
    const netBalance = cashIn - cashOut;

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-slate-100/80 p-5">
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                        <div className="mt-3 h-8 w-28 animate-pulse rounded bg-slate-200" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Cash In */}
            <div className="rounded-2xl bg-emerald-50/80 p-5 ring-1 ring-emerald-200/60">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-700/80">Cash In</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-emerald-800">
                    {formatAmount(cashIn)}
                </p>
            </div>

            {/* Cash Out */}
            <div className="rounded-2xl bg-red-50/80 p-5 ring-1 ring-red-200/60">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-red-700/80">Cash Out</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-red-800">
                    {formatAmount(cashOut)}
                </p>
            </div>

            {/* Net Balance - neutral styling for both positive and negative */}
            <div className="rounded-2xl bg-slate-100/80 p-5 ring-1 ring-slate-200/60">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-300/50 text-slate-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14M5 18h14" />
                        </svg>
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                        Net Balance
                    </span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {formatAmount(netBalance)}
                </p>
            </div>
        </div>
    );
}
