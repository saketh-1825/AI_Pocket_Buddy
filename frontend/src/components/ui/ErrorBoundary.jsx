import React from "react";
import { FiAlertOctagon, FiRefreshCw, FiHome } from "react-icons/fi";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details to console
    console.error("ErrorBoundary caught an unexpected exception:", error);
    console.error("Error Info details:", errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Custom premium fallback UI
      return (
        <div className="min-h-screen bg-[#F6F8FC] text-[#111827] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-soft text-center flex flex-col items-center space-y-6">
            
            {/* Crash Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/15">
              <FiAlertOctagon className="h-8 w-8" />
            </div>

            {/* Error Message Details */}
            <div className="space-y-2 font-sans">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">
                Oops!
              </h1>
              <h2 className="text-lg font-bold text-[#6B7280]">
                Something went wrong.
              </h2>
              <p className="text-sm text-[#6B7280] max-w-xs mx-auto leading-relaxed">
                An unexpected crash occurred in the application. Please refresh the page or return to the main dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-transparent py-3 text-sm font-semibold text-[#6B7280] hover:bg-slate-50 transition-all duration-200 cursor-pointer"
              >
                <FiRefreshCw className="h-4 w-4" />
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 cursor-pointer"
              >
                <FiHome className="h-4 w-4" />
                Dashboard
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
