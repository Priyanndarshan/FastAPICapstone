import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-semibold text-gray-800">Dashboard</h1>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-lg text-gray-800">Welcome, <span className="font-medium">{user?.name}</span></p>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-4 flex gap-3">
                    <Link
                        to="/categories"
                        className="inline-block rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    >
                        Categories
                    </Link>
                    <Link
                        to="/expenses"
                        className="inline-block rounded border border-violet-600 px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                    >
                        Expenses
                    </Link>
                </div>
            </div>

        </div>
    );
}