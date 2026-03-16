import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ROUTES } from "../config/constants";
import { BackIcon, EditIcon, LogoutIcon } from "../components/ui/icons";
import { input } from "../styles/ui";

function ProfileField({
  label,
  value,
  editable,
  onSave,
}: {
  label: string;
  value: string;
  editable: boolean;
  onSave: (value: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  async function handleSave() {
    if (draft.trim() === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editable) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
          <span className="flex-1">{value || "—"}</span>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={input + " flex-1 sm:min-w-0"}
            autoFocus
            aria-label={label}
          />
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2 disabled:opacity-50"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#4863D4] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#3a50b8] focus:outline-none focus:ring-2 focus:ring-[#4863D4] focus:ring-offset-2 disabled:opacity-50"
              aria-label="Update"
            >
              {saving ? "Updating…" : "Update"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <span className="flex-1 text-slate-900">{value || "—"}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded p-1.5 text-[#4863D4] hover:bg-[#e8ecfc] focus:outline-none focus:ring-2 focus:ring-[#4863D4]"
          aria-label={`Edit ${label}`}
        >
          <EditIcon />
        </button>
      </div>
    </div>
  );
}

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
            onSave={async () => {}}
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
