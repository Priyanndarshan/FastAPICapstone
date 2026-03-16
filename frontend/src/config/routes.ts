export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  EXPENSES: "/expenses",
  CATEGORIES: "/categories",
} as const;

export const NAV_LINKS = [
  { label: "Dashboard", path: ROUTES.DASHBOARD },
  { label: "Expenses", path: ROUTES.EXPENSES },
  { label: "Categories", path: ROUTES.CATEGORIES },
] as const;

