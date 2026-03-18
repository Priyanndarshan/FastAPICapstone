import { Link, useLocation } from "react-router-dom";
import { NAV_LINKS } from "../../../config/routes";

export default function Navbar() {
    // Current URL path, used to highlight the active nav link.
    const location = useLocation();

    return (
        // Fixed left sidebar nav (sits below the fixed TopNav).
        <nav className="fixed left-0 top-14 bottom-0 z-[9] flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1 p-4 pt-6">
                <div className="flex flex-col gap-0.5">
                    {/* Render navigation links from NAV_LINKS config */}
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            // Style active link differently so the user knows which page they're on.
                            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${location.pathname === link.path
                                    ? "bg-[#e8ecfc] text-[#4863D4]"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}
