import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/api/server/prisma";
import { MISSION_CONTROL_ONBOARDING_TASK_TITLE } from "@/lib/mission/bootstrapTask";
import { getRuntimePolicy, isLocalHost } from "@/lib/runtime/profile";

async function getRedirectTarget(hostname: string): Promise<string> {
  const policy = getRuntimePolicy(hostname);

  if (policy.isOnlineDemo) {
    return "/web/landing";
  }

  if (policy.isLocalDev) {
    return "/overview";
  }

  if (policy.isInstallLocal && isLocalHost(hostname)) {
    try {
      const bootstrapTaskExists = await prisma.task.findFirst({
        where: { title: MISSION_CONTROL_ONBOARDING_TASK_TITLE },
        select: { id: true },
      });

      return bootstrapTaskExists ? "/overview" : "/initializing";
    } catch {
      // If DB is not ready yet, keep startup flow on initializing.
      return "/initializing";
    }
  }

  return "/overview";
}

export default async function Home() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("host") ?? "";
  redirect(await getRedirectTarget(hostHeader));
}
