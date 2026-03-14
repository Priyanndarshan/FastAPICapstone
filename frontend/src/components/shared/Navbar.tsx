import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Expenses", path: "/expenses" },
    { label: "Categories", path: "/categories" },
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
        <nav className="border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
                {/* Left — app name + links */}
                <div className="flex items-center gap-6">
                    <span className="text-sm font-bold text-violet-600">
                        Expense Manager
                    </span>
                    <div className="flex items-center gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-medium transition-colors ${location.pathname === link.path
                                        ? "text-violet-600"
                                        : "text-gray-500 hover:text-gray-800"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right — user + logout */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{user?.email}</span>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}