import type { RefObject } from "react";
import { useState, useRef, useEffect } from "react";
import type { ExpenseFilters } from "../../api/expenses";

export interface UseExpenseFiltersOptions {
    exportMenuRef?: RefObject<HTMLDivElement | null>;
    setExportMenuOpen?: (open: boolean) => void;
}

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

export function useExpenseFilters(
    onFilterChange: (filters: ExpenseFilters) => void,
    options?: UseExpenseFiltersOptions
) {
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

    const [typeFilterOpen, setTypeFilterOpen] = useState(false);
    const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
    const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [recurringFilterOpen, setRecurringFilterOpen] = useState(false);
    const typeFilterRef = useRef<HTMLDivElement>(null);
    const durationDropdownRef = useRef<HTMLDivElement>(null);
    const categoryFilterRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);
    const recurringFilterRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (paymentModesRef.current && !paymentModesRef.current.contains(target)) {
                setPaymentModesOpen(false);
            }
            if (typeFilterRef.current && !typeFilterRef.current.contains(target)) {
                setTypeFilterOpen(false);
            }
            if (durationDropdownRef.current && !durationDropdownRef.current.contains(target)) {
                setDurationDropdownOpen(false);
            }
            if (categoryFilterRef.current && !categoryFilterRef.current.contains(target)) {
                setCategoryFilterOpen(false);
            }
            if (recurringFilterRef.current && !recurringFilterRef.current.contains(target)) {
                setRecurringFilterOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
                setSortDropdownOpen(false);
            }
            if (options?.exportMenuRef?.current && !options.exportMenuRef.current.contains(target)) {
                options.setExportMenuOpen?.(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [options?.exportMenuRef, options?.setExportMenuOpen]);

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
        setTypeFilterOpen(false);
        setDurationDropdownOpen(false);
        setCategoryFilterOpen(false);
        setSortDropdownOpen(false);
        setRecurringFilterOpen(false);
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
        typeFilterOpen,
        setTypeFilterOpen,
        durationDropdownOpen,
        setDurationDropdownOpen,
        categoryFilterOpen,
        setCategoryFilterOpen,
        sortDropdownOpen,
        setSortDropdownOpen,
        recurringFilterOpen,
        setRecurringFilterOpen,
        typeFilterRef,
        durationDropdownRef,
        categoryFilterRef,
        sortDropdownRef,
        recurringFilterRef,
    };
}
