
export function parseApiError(err: unknown, fallback = "Something went wrong"): string {
    const e = err as { response?: { data?: { detail?: string | { msg: string; loc?: (string | number)[] }[] } } };
    const detail = e?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((d) => (d.loc && d.loc.length ? `${d.loc.join(".")}: ${d.msg}` : d.msg))
            .join(", ");
    }
    return fallback;
}




