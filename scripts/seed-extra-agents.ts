import { AgentStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.agent.upsert({
    where: { id: "00000000-0000-4000-8000-00000000a111" },
    update: {
      name: "Tammy",
      role: "Product Lead",
      status: AgentStatus.IDLE,
      statusMessage: "Prioritizing backlog",
      heartbeatAt: new Date(),
    },
    create: {
      id: "00000000-0000-4000-8000-00000000a111",
      name: "Tammy",
      role: "Product Lead",
      status: AgentStatus.IDLE,
      statusMessage: "Prioritizing backlog",
      heartbeatAt: new Date(),
    },
  });

  await prisma.agent.upsert({
    where: { id: "00000000-0000-4000-8000-00000000b222" },
    update: {
      name: "Claudio",
      role: "Operations",
      status: AgentStatus.WORKING,
      statusMessage: "Coordinating sprint blockers",
      heartbeatAt: new Date(),
    },
    create: {
      id: "00000000-0000-4000-8000-00000000b222",
      name: "Claudio",
      role: "Operations",
      status: AgentStatus.WORKING,
      statusMessage: "Coordinating sprint blockers",
      heartbeatAt: new Date(),
    },
  });

  const count = await prisma.agent.count();
  console.log(`agents_total=${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
