import { useState, useRef, useEffect } from "react";
import type { Category, Expense } from "../../../types";
import { ChevronDownIcon, DownloadIcon } from "../../ui/icons";
import { exportExpensesToCSV, exportExpensesToExcel, exportExpensesToPDF } from "../../../utils/exportExpenses";

export interface ExportMenuProps {
    expenses: Expense[];
    categories: Category[];
}

export default function ExportMenu({ expenses, categories }: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (containerRef.current && !containerRef.current.contains(target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative shrink-0" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                aria-expanded={open}
                aria-haspopup="true"
            >
                Export
                <DownloadIcon />
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                        type="button"
                        onClick={() => {
                            exportExpensesToCSV(expenses, categories);
                            setOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <span className="text-slate-500">.csv</span>
                        Download as CSV
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            exportExpensesToExcel(expenses, categories);
                            setOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <span className="text-slate-500">.xlsx</span>
                        Download as Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            exportExpensesToPDF(expenses, categories);
                            setOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                        <span className="text-slate-500">.pdf</span>
                        Download as PDF
                    </button>
                </div>
            )}
        </div>
    );
}
