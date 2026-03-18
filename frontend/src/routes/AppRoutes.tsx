import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-gray-500">Loading...</p>;
  if (user) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.CATEGORIES} element={<Categories />} />
        <Route path={ROUTES.EXPENSES} element={<Expenses />} />
      </Route>

      <Route element={<PublicOnly />}>
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}