import { Link } from "react-router-dom";
import { CloseIcon } from "../../ui/icons";
import { ROUTES } from "../../../config/routes";
import type { OverBudgetCategory } from "../../../hooks/categories/useOverBudgetCategories";

interface OverBudgetBannerProps {
  categories: OverBudgetCategory[];
  onDismiss: () => void;
}

export default function OverBudgetBanner({ categories, onDismiss }: OverBudgetBannerProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
      <p className="flex-1 min-w-0 text-sm font-medium text-red-800">
        Budget exceeded: {categories.map((c) => c.name).join(", ")}.
        <Link to={ROUTES.CATEGORIES} className="ml-1 font-medium text-red-700 hover:text-red-900 underline">
          Adjust →
        </Link>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1.5 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="Dismiss warning"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

