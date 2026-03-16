import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/shared";
import { ROUTES } from "../config/routes";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Categories from "../pages/Categories";
import Expenses from "../pages/Expenses";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;
  if (user) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.CATEGORIES} element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path={ROUTES.EXPENSES} element={<PrivateRoute><Expenses /></PrivateRoute>} />
      <Route path={ROUTES.LOGIN} element={<PublicRoute><Login /></PublicRoute>} />
      <Route path={ROUTES.REGISTER} element={<PublicRoute><Register /></PublicRoute>} />
      <Route path={ROUTES.DASHBOARD} element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path={ROUTES.PROFILE} element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path={ROUTES.HOME} element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
