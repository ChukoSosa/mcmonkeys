import DashboardPage from "../dashboard-page";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function OverviewPage() {
  return (
    <DashboardShell>
      <DashboardPage />
    </DashboardShell>
  );
}