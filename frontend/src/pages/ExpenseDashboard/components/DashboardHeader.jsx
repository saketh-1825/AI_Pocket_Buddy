import SidebarToggle from "../../../components/layout/SidebarToggle";

export default function DashboardHeader({ greeting, userName }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <SidebarToggle />

        <h1 className="text-[32px] font-bold tracking-tight text-textPrimary font-heading">
          {greeting}, {userName}
        </h1>
      </div>

      <p className="text-sm font-medium text-textSecondary">
        Here's your financial overview
      </p>
    </div>
  );
}
