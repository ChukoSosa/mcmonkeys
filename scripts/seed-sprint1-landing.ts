import { PrismaClient, TaskStatus, SubtaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

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

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    take: 4,
  });

  if (agents.length === 0) {
    throw new Error("No agents found. Seed agents first.");
  }

  // Re-runnable seed: remove previous Sprint 1 landing tasks by title prefix.
  await prisma.task.deleteMany({
    where: {
      title: {
        startsWith: "[Sprint 1]",
      },
    },
  });

  const sprintTasks = [
    {
      title: "[Sprint 1] Define Landing IA and Copy Blocks",
      description:
        "Create section hierarchy, core messaging, and conversion-oriented copy draft for hero, benefits, proof, and CTA zones.",
      status: TaskStatus.DONE,
      priority: 3,
      assignedAgentId: agents[0]?.id ?? null,
      subtasks: [
        { title: "Map page narrative arc", status: SubtaskStatus.DONE },
        { title: "Draft hero + value proposition", status: SubtaskStatus.DONE },
        { title: "Finalize CTA copy variants", status: SubtaskStatus.DONE },
      ],
      comments: [
        {
          body: "Copy baseline approved. Ready for UI implementation.",
          authorType: "human",
          status: "resolved",
        },
      ],
    },
    {
      title: "[Sprint 1] Build Responsive Hero and Navigation",
      description:
        "Implement hero layout, sticky nav, and responsive behavior for mobile and desktop breakpoints.",
      status: TaskStatus.IN_PROGRESS,
      priority: 3,
      assignedAgentId: agents[0]?.id ?? null,
      subtasks: [
        { title: "Desktop hero composition", status: SubtaskStatus.DONE },
        { title: "Mobile nav interactions", status: SubtaskStatus.DOING },
        { title: "Cross-browser visual QA", status: SubtaskStatus.TODO },
      ],
      comments: [
        {
          body: "Need final icon sizing check on small screens before moving to review.",
          authorType: "agent",
          status: "open",
        },
      ],
    },
    {
      title: "[Sprint 1] Implement Features + Social Proof Sections",
      description:
        "Create reusable cards for benefits and testimonials with consistent spacing and typography tokens.",
      status: TaskStatus.REVIEW,
      priority: 2,
      assignedAgentId: agents[1]?.id ?? agents[0]?.id ?? null,
      subtasks: [
        { title: "Build feature card component", status: SubtaskStatus.DONE },
        { title: "Integrate testimonial grid", status: SubtaskStatus.DONE },
        { title: "Content QA against copy deck", status: SubtaskStatus.DOING },
      ],
      comments: [
        {
          body: "Section is stable. Waiting on operator approval for final testimonial order.",
          authorType: "agent",
          status: "answered",
        },
      ],
    },
    {
      title: "[Sprint 1] Integrate Lead Capture Form + Validation",
      description:
        "Wire CTA form, client-side validation, and success/error states for conversion events.",
      status: TaskStatus.BLOCKED,
      priority: 3,
      assignedAgentId: agents[2]?.id ?? agents[0]?.id ?? null,
      subtasks: [
        { title: "Form UI scaffold", status: SubtaskStatus.DONE },
        { title: "Validation rules", status: SubtaskStatus.DOING },
        { title: "Webhook integration", status: SubtaskStatus.BLOCKED },
      ],
      comments: [
        {
          body: "Blocked by missing webhook credentials from marketing automation provider.",
          authorType: "agent",
          status: "open",
          requiresResponse: true,
        },
      ],
    },
    {
      title: "[Sprint 1] Performance and Accessibility Hardening",
      description:
        "Optimize LCP assets, reduce layout shifts, and improve semantic/ARIA coverage for key sections.",
      status: TaskStatus.BACKLOG,
      priority: 2,
      assignedAgentId: agents[1]?.id ?? agents[0]?.id ?? null,
      subtasks: [
        { title: "Image optimization pass", status: SubtaskStatus.TODO },
        { title: "Keyboard navigation audit", status: SubtaskStatus.TODO },
        { title: "Lighthouse baseline report", status: SubtaskStatus.TODO },
      ],
      comments: [],
    },
    {
      title: "[Sprint 1] Deploy Landing to Staging and Smoke Test",
      description:
        "Publish to staging, run smoke tests on primary flows, and capture launch checklist evidence.",
      status: TaskStatus.DONE,
      priority: 1,
      assignedAgentId: agents[3]?.id ?? agents[0]?.id ?? null,
      subtasks: [
        { title: "Staging deployment", status: SubtaskStatus.DONE },
        { title: "Critical path smoke tests", status: SubtaskStatus.DONE },
        { title: "Publish QA evidence", status: SubtaskStatus.DONE },
      ],
      comments: [
        {
          body: "Staging validated. Smoke tests passed on desktop and mobile.",
          authorType: "human",
          status: "resolved",
        },
      ],
    },
  ];

  for (const taskData of sprintTasks) {
    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        createdByType: "operator",
        createdById: operator.id,
        assignedAgentId: taskData.assignedAgentId,
        metadata: { sprint: "Sprint 1", initiative: "Landing Page" },
      },
    });

    if (taskData.subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: taskData.subtasks.map((subtask, index) => ({
          taskId: task.id,
          title: subtask.title,
          status: subtask.status,
          position: index + 1,
          ownerAgentId: taskData.assignedAgentId,
        })),
      });
    }

    for (const comment of taskData.comments) {
      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          authorType: comment.authorType,
          authorId: comment.authorType === "human" ? operator.id : taskData.assignedAgentId,
          body: comment.body,
          status: comment.status,
          requiresResponse: comment.requiresResponse ?? false,
          resolvedAt: comment.status === "resolved" ? new Date() : null,
        },
      });
    }
  }

  const summary = await prisma.task.groupBy({
    by: ["status"],
    where: { title: { startsWith: "[Sprint 1]" } },
    _count: { _all: true },
  });

  console.log("Sprint 1 landing tasks created.");
  for (const row of summary) {
    console.log(`${row.status}: ${row._count._all}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
