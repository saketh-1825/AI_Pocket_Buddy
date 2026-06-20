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
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      // Custom premium fallback UI
      return (
        <div className="min-h-screen bg-[#0F0F11] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#16161A] border border-white/5 rounded-2xl p-8 shadow-2xl text-center flex flex-col items-center space-y-6">
            
            {/* Crash Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger border border-danger/15 animate-bounce">
              <FiAlertOctagon className="h-8 w-8" />
            </div>

            {/* Error Message Details */}
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Oops!
              </h1>
              <h2 className="text-lg font-bold text-[#9CA3AF]">
                Something went wrong.
              </h2>
              <p className="text-xs text-[#9CA3AF]/70 max-w-xs mx-auto leading-relaxed">
                An unexpected crash occurred in the application. Please refresh the page or return to the main dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex w-full gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent py-3 text-sm font-semibold text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                <FiRefreshCw className="h-4 w-4" />
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#A855F7] hover:bg-[#b56ef8] py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200"
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
