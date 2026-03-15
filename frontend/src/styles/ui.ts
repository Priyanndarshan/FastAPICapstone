
export function cn(...args: (string | undefined | false)[]): string {
    return args.filter(Boolean).join(" ");
}

export const btnPrimary =
    "rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2 disabled:opacity-50";
export const btnSecondary =
    "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2";
export const btnDanger =
    "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50";

export const input =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-[#4863D4] focus:outline-none focus:ring-2 focus:ring-[#4863D4]/20 text-sm";
export const label = "mb-1 block text-xs font-medium text-slate-500";

export const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";
export const modal = "fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4";
export const modalPanel = "w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl";
