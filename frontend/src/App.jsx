import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ExpenseDashboard from "./pages/ExpenseDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import BudgetCenter from "./pages/BudgetCenter";
import AIBuddyPage from "./pages/AIBuddyPage";
import HeatmapPage from "./pages/HeatmapPage";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Layout from "./components/layout/Layout";

// Redirect already-authenticated users away from public pages (login/register)
function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
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
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/budgets" element={<BudgetCenter />} />
            <Route path="/ai-buddy" element={<AIBuddyPage />} />
            <Route path="/heatmap" element={<HeatmapPage />} />
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