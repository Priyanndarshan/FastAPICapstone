import { Link } from "react-router-dom";
import { ROUTES } from "../config/constants";

export default function Landing() {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-[#e8ecfc]/30">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#4863D4]/30 bg-[#e8ecfc]/80 px-4 py-1.5 text-sm font-medium text-[#3a50b8]">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4863D4] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e8ecfc]0" />
                    </span>
                    Track income & expenses
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                    Expense Manager
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-600">
                    Manage your cash flow, set budgets by category, and see where your money goes—all in one place.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Link
                        to={ROUTES.LOGIN}
                        className="inline-flex h-12 items-center justify-center rounded-xl bg-[#4863D4] px-8 text-base font-semibold text-white shadow-lg shadow-[#4863D4]/25 transition hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                    >
                        Log in
                    </Link>
                    <Link
                        to={ROUTES.REGISTER}
                        className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition hover:border-[#4863D4] hover:bg-[#e8ecfc]/50 hover:text-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                    >
                        Register
                    </Link>
                </div>
                <p className="mt-8 text-sm text-slate-500">
                    Sign in or create an account to get started.
                </p>
            </div>
        </div>
    );
}
