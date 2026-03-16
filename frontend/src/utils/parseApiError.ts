
export function parseApiError(err: unknown, fallback = "Something went wrong"): string {
    const e = err as { response?: { data?: { detail?: string | { msg: string }[] } } };
    const detail = e?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    return fallback;
}



// {
//     message: "Request failed with status code 422",
//     response: {
//         status: 422,
//         data: {
//             detail: [
//                 { msg: "field required", loc: ["body", "email"] },
//                 { msg: "value is not a valid email", loc: ["body", "email"] }
//             ]
//         }
//     },
//     config: { ... },
//     headers: { ... }
// }

//{ "detail": "Email already registered" }