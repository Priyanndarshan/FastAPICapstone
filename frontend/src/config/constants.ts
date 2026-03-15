/**
 * App-wide route paths and navigation config.
 * Use these constants instead of hardcoding paths for consistency and easier refactors.
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EXPENSES: "/expenses",
  CATEGORIES: "/categories",
} as const;

/** Short month names (Jan, Feb, ...) for display */
export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "short" })
);

export const NAV_LINKS = [
  { label: "Dashboard", path: ROUTES.DASHBOARD },
  { label: "Expenses", path: ROUTES.EXPENSES },
  { label: "Categories", path: ROUTES.CATEGORIES },
] as const;
