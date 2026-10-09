import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';
import PublicRoute from '../auth/PublicRoute';
import AppLayout from '../layouts/AppLayout';
import Landing from '../features/landing/Landing';
import Login from '../features/login/Login';
import Dashboard from '../features/dashboard/Dashboard';
import Settings from '../features/settings/Settings';
import Clients from '../features/clients/Clients';
import Invoices from '../features/invoices/Invoices';
import Expenses from '../features/expenses/Expenses';
import Income from '../features/income/Income';
import InvoiceDetail from '../features/invoices/InvoiceDetail';

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout>
              <div />
            </AppLayout>
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/clients"
          element={<Clients />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/invoices"
          element={<Invoices />}
        />

        <Route
          path="/expenses"
          element={<Expenses />}
        />

        <Route
          path="/income"
          element={<Income />}
        />

        <Route
          path="/invoices/:id"
          element={<InvoiceDetail />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
