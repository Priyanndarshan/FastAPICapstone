import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Expenses", path: "/expenses" },
    { label: "Categories", path: "/categories" },
    { label: "Budgets", path: "/budgets" },
];

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate("/login");
    }

    return (
        <nav className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1 p-4">
                <span className="px-3 py-2 text-lg font-bold tracking-tight text-violet-600">
                    Expense Manager
                </span>
                <div className="mt-4 flex flex-col gap-0.5">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                                location.pathname === link.path
                                    ? "bg-violet-50 text-violet-700"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="mt-auto border-t border-slate-200 p-4">
                {user?.email && (
                    <p className="mb-3 truncate px-3 text-xs text-slate-500" title={user.email}>
                        {user.email}
                    </p>
                )}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
