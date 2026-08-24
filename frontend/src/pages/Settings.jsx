import { useNavigate } from "react-router-dom";
import { FiUser, FiGlobe, FiSun, FiAlertOctagon, FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import SidebarToggle from "../components/layout/SidebarToggle";

export default function Settings() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Saketh";
  const userEmail = localStorage.getItem("userEmail") || `${userName.toLowerCase().replace(/\s+/g, "")}@example.com`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    toast.info("Logged out successfully", { theme: "light" });
    navigate("/login");
  };

  return (
    <div className="p-8 space-y-8 select-none max-w-[1440px] mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
            Settings
          </h1>
        </div>
        <p className="text-sm font-medium text-textSecondary font-sans">
          Manage your account preferences and configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Profile Card */}
        <div className="bg-surface p-7 rounded-card border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <FiUser className="h-5 w-5 text-textSecondary" />
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Account Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary mb-1.5">
                Username
              </label>
              <div className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textPrimary font-semibold">
                {userName}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary mb-1.5">
                Email Address
              </label>
              <div className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textPrimary font-semibold">
                {userEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="bg-surface p-7 rounded-card border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <FiGlobe className="h-5 w-5 text-textSecondary" />
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">App Preferences</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary mb-1.5">
                Currency
              </label>
              <div className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textPrimary flex justify-between items-center font-semibold">
                <span>Indian Rupee</span>
                <span className="font-bold text-primary">INR (₹)</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-textSecondary mb-1.5">
                Theme Mode
              </label>
              <div className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textPrimary flex justify-between items-center font-semibold">
                <span className="flex items-center gap-2">
                  <FiSun className="h-4 w-4 text-textSecondary" />
                  Light Banking Theme
                </span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface p-7 rounded-card border border-border shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <FiAlertOctagon className="h-5 w-5 text-danger" />
          <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">Session Management</h3>
        </div>

        <p className="text-sm text-textSecondary leading-relaxed">
          Log out of the current active session. This will safely clear your local authorization tokens.
        </p>

        <button
          onClick={handleLogout}
          className="bg-danger/5 hover:bg-danger/10 border border-danger/15 text-danger rounded-xl px-5 py-3 text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger/20"
        >
          <FiLogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
