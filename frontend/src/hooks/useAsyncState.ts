import { useState, useCallback } from "react";
import { parseApiError } from "../utils/parseApiError";

interface AsyncState<T> {
    data: T;
    loading: boolean;
    error: string;
}

export function useAsyncState<T>(initialData: T) {
    const [state, setState] = useState<AsyncState<T>>({
        data: initialData,
        loading: true,
        error: "",
    });

    const run = useCallback(async (fn: () => Promise<T>) => {
        setState((s) => ({ ...s, loading: true, error: "" }));
        try {
            const data = await fn();
            setState({ data, loading: false, error: "" });
            return data;
        } catch (err) {
            setState((s) => ({
                ...s,
                loading: false,
                error: parseApiError(err, "Something went wrong"),
            }));
        }
    }, []);

    function setData(updater: (prev: T) => T) {
        setState((s) => ({ ...s, data: updater(s.data) }));
    }

    return {
        data: state.data,
        loading: state.loading,
        error: state.error,
        setData,
        run,
    };
}
