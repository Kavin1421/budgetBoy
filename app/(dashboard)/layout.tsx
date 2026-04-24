import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-root relative z-[2] flex min-h-screen w-full text-slate-900">
      <DashboardSidebar />
      <DashboardChrome>{children}</DashboardChrome>
    </div>
  );
}
