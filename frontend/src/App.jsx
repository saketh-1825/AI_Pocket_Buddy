import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ExpenseDashboard from "./pages/ExpenseDashboard/ExpenseDashboard";
import BudgetCenter from "./pages/BudgetCenter/BudgetCenter";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Layout from "./components/layout/Layout";
import { useAuthStore } from "./store/authStore";

// Redirect already-authenticated users away from public pages (login/register)
function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function App() {

  return (
    <ErrorBoundary>
      <BrowserRouter>

        <Routes>

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Nest layout under protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ExpenseDashboard />} />
            <Route path="/dashboard" element={<ExpenseDashboard />} />
            <Route path="/budgets" element={<BudgetCenter />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all: redirect any unknown URL back to dashboard (or login if not authed) */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />

      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;