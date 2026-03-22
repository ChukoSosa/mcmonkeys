import DashboardPage from "../dashboard-page";
import { DashboardShell } from "@/components/mission-control/dashboard/DashboardShell";
import { LicenseGate } from "@/components/mission-control/dashboard/LicenseGate";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  return (
    <LicenseGate>
      <DashboardShell>
        <DashboardPage />
      </DashboardShell>
    </LicenseGate>
  );
}