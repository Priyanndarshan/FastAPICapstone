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
        <div className="min-h-screen flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-800">Create account</h1>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password (min 3 characters)"
                    type="password"
                    minLength={3}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                    type="submit"
                    className="w-full rounded bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                    Register
                </button>
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700">Log in</Link>
                </p>
            </form>
        </div>
    );
}