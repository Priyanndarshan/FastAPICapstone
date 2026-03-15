import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (password.length < 3) {
            setError("Password must be at least 3 characters");
            return;
        }
        try {
            await register(name, email, password);
            navigate("/dashboard");
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail)
                ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(". ")
                : typeof detail === "string"
                    ? detail
                    : err.message ?? "Registration failed";
            setError(msg);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expense Manager</h1>
                    <p className="mt-1 text-sm text-slate-600">Create your account</p>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
                >
                    <h2 className="mb-6 text-lg font-semibold text-slate-900">Register</h2>
                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Name</span>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                type="email"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </label>
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 3 characters"
                                type="password"
                                minLength={3}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                        </label>
                    </div>
                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        className="mt-6 w-full rounded-lg bg-violet-600 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    >
                        Create account
                    </button>
                    <p className="mt-6 text-center text-sm text-slate-600">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">
                            Log in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}