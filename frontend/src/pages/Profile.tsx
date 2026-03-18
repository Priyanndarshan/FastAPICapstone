import ProfileField from "../components/profile/ProfileField";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../config/routes";
import { BackIcon, LogoutIcon } from "../components/ui/icons";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN);
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to={ROUTES.DASHBOARD}
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4863D4]"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Your Profile Details</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <ProfileField
            label="Name"
            value={user.name}
            editable
            onSave={async (value) => updateProfile({ name: value })}
          />
          <ProfileField
            label="Mobile Number"
            value={user.phone ?? ""}
            editable
            onSave={async (value) => updateProfile({ phone: value || null })}
          />
          <ProfileField
            label="Email"
            value={user.email}
            editable={false}
          />
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-0"
            aria-label="Logout"
          >

            <LogoutIcon className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
