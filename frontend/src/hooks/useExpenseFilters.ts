import { useState, useRef, useEffect } from "react";
import type { ExpenseFilters } from "../api/expenses";

export type DurationFilter = "all_time" | "today" | "this_week" | "this_month" | "custom";

function getDateRange(
    duration: DurationFilter,
    filterStart: string,
    filterEnd: string
): { start?: string; end?: string } {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const pad = (n: number) => String(n).padStart(2, "0");
    if (duration === "today") {
        const s = `${y}-${pad(m + 1)}-${pad(d)}`;
        return { start: s, end: s };
    }
    if (duration === "this_week") {
        const day = today.getDay();
        const mon = new Date(today);
        mon.setDate(d - (day === 0 ? 6 : day - 1));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        return {
            start: `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`,
            end: `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`,
        };
    }
    if (duration === "this_month") {
        return {
            start: `${y}-${pad(m + 1)}-01`,
            end: `${y}-${pad(m + 1)}-${pad(new Date(y, m + 1, 0).getDate())}`,
        };
    }
    if (duration === "custom" && filterStart && filterEnd) {
        return { start: filterStart, end: filterEnd };
    }
    return {};
}

export function useExpenseFilters(onFilterChange: (filters: ExpenseFilters) => void) {
    const [duration, setDuration] = useState<DurationFilter>("all_time");
    const [filterStart, setFilterStart] = useState("");
    const [filterEnd, setFilterEnd] = useState("");
    const [filterType, setFilterType] = useState<"" | "in" | "out">("");
    const [paymentModeSelected, setPaymentModeSelected] = useState<string[]>([]);
    const [paymentModesOpen, setPaymentModesOpen] = useState(false);
    const [filterCategoryId, setFilterCategoryId] = useState("");
    const [filterRecurring, setFilterRecurring] = useState<"" | "true" | "false">("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const paymentModesRef = useRef<HTMLDivElement>(null);
    const didMount = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
        return () => clearTimeout(t);
    }, [searchKeyword]);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        const range = getDateRange(duration, filterStart, filterEnd);
        const next: ExpenseFilters = {};
        if (range.start) next.start_date = range.start;
        if (range.end) next.end_date = range.end;
        if (filterType) next.transaction_type = filterType;
        if (paymentModeSelected.length > 0) next.payment_modes = paymentModeSelected.join(",");
        if (filterCategoryId) next.category_id = Number(filterCategoryId);
        if (debouncedKeyword.trim()) next.keyword = debouncedKeyword.trim();
        onFilterChange(next);
    }, [duration, filterStart, filterEnd, filterType, paymentModeSelected, filterCategoryId, debouncedKeyword]);

    function clearFilters() {
        setDuration("all_time");
        setFilterStart("");
        setFilterEnd("");
        setFilterType("");
        setPaymentModeSelected([]);
        setFilterCategoryId("");
        setFilterRecurring("");
        setSearchKeyword("");
        setDebouncedKeyword("");
        setPaymentModesOpen(false);
        onFilterChange({});
    }

    const hasActiveFilters =
        duration !== "all_time" ||
        !!filterType ||
        paymentModeSelected.length > 0 ||
        !!filterCategoryId ||
        !!filterRecurring ||
        !!searchKeyword.trim();

    return {
        duration,
        setDuration,
        filterStart,
        setFilterStart,
        filterEnd,
        setFilterEnd,
        filterType,
        setFilterType,
        paymentModeSelected,
        setPaymentModeSelected,
        paymentModesOpen,
        setPaymentModesOpen,
        filterCategoryId,
        setFilterCategoryId,
        filterRecurring,
        setFilterRecurring,
        searchKeyword,
        setSearchKeyword,
        debouncedKeyword,
        paymentModesRef,
        clearFilters,
        hasActiveFilters,
        getDateRange: () => getDateRange(duration, filterStart, filterEnd),
    };
}
