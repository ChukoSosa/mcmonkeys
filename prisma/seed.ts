import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OPENCLAW_AGENT_ID = "agent-openclaw";
const ONBOARDING_TASK_ID = "task-onboarding-installation";

async function main() {
  const operator = await prisma.operator.upsert({
    where: { id: "operator-root" },
    update: {},
    create: {
      id: "operator-root",
      name: "Mission Operator",
      email: "operator@mission.control",
    },
  });

  // Keep seed deterministic: one visible agent and one onboarding task.
  await prisma.systemEvent.deleteMany();
  await prisma.run.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskActivity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.agentRoutine.deleteMany();
  await prisma.agent.deleteMany({});

  const openClaw = await prisma.agent.upsert({
    where: { id: OPENCLAW_AGENT_ID },
    update: {
      name: "OpenClaw",
      role: "Primary Mission Operator",
      status: "WORKING",
      statusMessage: "Handling installation onboarding",
      heartbeatAt: new Date(),
    },
    create: {
      id: OPENCLAW_AGENT_ID,
      name: "OpenClaw",
      role: "Primary Mission Operator",
      status: "WORKING",
      statusMessage: "Handling installation onboarding",
      heartbeatAt: new Date(),
    },
  });

  await prisma.task.upsert({
    where: { id: ONBOARDING_TASK_ID },
    update: {
      title: "Installation / Onboarding",
      description: "Track initial setup and onboarding steps performed by OpenClaw.",
      status: "IN_PROGRESS",
      priority: 1,
      createdById: operator.id,
      createdByType: "operator",
      assignedAgentId: openClaw.id,
    },
    create: {
      id: ONBOARDING_TASK_ID,
      title: "Installation / Onboarding",
      description: "Track initial setup and onboarding steps performed by OpenClaw.",
      status: "IN_PROGRESS",
      priority: 1,
      createdById: operator.id,
      createdByType: "operator",
      assignedAgentId: openClaw.id,
    },
  });

  await prisma.subtask.createMany({
    data: [
      {
        id: "subtask-onboarding-1",
        taskId: ONBOARDING_TASK_ID,
        title: "Verify API and database connectivity",
        status: "TODO",
        position: 1,
        ownerAgentId: openClaw.id,
      },
      {
        id: "subtask-onboarding-2",
        taskId: ONBOARDING_TASK_ID,
        title: "Create initial workspace configuration",
        status: "TODO",
        position: 2,
        ownerAgentId: openClaw.id,
      },
      {
        id: "subtask-onboarding-3",
        taskId: ONBOARDING_TASK_ID,
        title: "Register additional assistant profiles",
        status: "TODO",
        position: 3,
        ownerAgentId: openClaw.id,
      },
      {
        id: "subtask-onboarding-4",
        taskId: ONBOARDING_TASK_ID,
        title: "Validate board and office views",
        status: "TODO",
        position: 4,
        ownerAgentId: openClaw.id,
      },
      {
        id: "subtask-onboarding-5",
        taskId: ONBOARDING_TASK_ID,
        title: "Finalize onboarding checklist",
        status: "TODO",
        position: 5,
        ownerAgentId: openClaw.id,
      },
    ],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
