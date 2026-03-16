import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { ChevronDownIcon, LogoutIcon } from "../ui/icons";
import { ROUTES } from "../../config/constants";

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold bg-[#e8ecfc] text-[#4863D4] ${sizeClass}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
  }

  if (!user) return null;

  return (
    <header className="fixed left-0 right-0 top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link
          to={ROUTES.DASHBOARD}
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-[#4863D4]"
        >
          Expense Manager
        </Link>

        <div className="flex items-center gap-2">
          <Popover open={profileOpen} onOpenChange={setProfileOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2"
                aria-label="My profile"
                aria-expanded={profileOpen}
              >
                <Avatar name={user.name} size="sm" />
                <span className="hidden max-w-[120px] truncate font-medium text-slate-900 sm:inline">
                  {user.name}
                </span>
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
              <div className="p-4">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <Avatar name={user.name} size="md" />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                    {user.email && (
                      <p className="truncate text-sm text-slate-500" title={user.email}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  to={ROUTES.PROFILE}
                  onClick={() => setProfileOpen(false)}
                  className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-[#4863D4] hover:text-[#3a50b8] sm:justify-start"
                >
                  Your Profile
                  <span aria-hidden>&rarr;</span>
                </Link>
              </div>
              <div className="border-t border-slate-200 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-inset"
                >
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
