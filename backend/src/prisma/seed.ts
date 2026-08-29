import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const defaultSender = await prisma.sender.upsert({
    where: { email: 'outreach@reachinbox.ai' },
    update: {},
    create: {
      name: 'ReachInbox Sales Team',
      email: 'outreach@reachinbox.ai',
    },
  });

  const secondarySender = await prisma.sender.upsert({
    where: { email: 'alex@reachinbox.ai' },
    update: {},
    create: {
      name: 'Alex Rivera',
      email: 'alex@reachinbox.ai',
    },
  });

  console.log('✅ Seeded default senders:', defaultSender.email, secondarySender.email);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
