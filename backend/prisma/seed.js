const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a Demo User
  const demoEmail = process.env.DEFAULT_USER_EMAIL || 'demo@calendly-clone.com';
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      name: 'Demo User',
      email: demoEmail,
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`✅ Created user: ${user.name} (${user.email})`);

  // 2. Clear existing Event Types (for clean seeding)
  await prisma.eventType.deleteMany();

  // 3. Create Event Types
  const eventTypes = [
    { name: '15 Minute Meeting', slug: '15min', durationMin: 15, description: 'Quick chat or introductory call.' },
    { name: '30 Minute Meeting', slug: '30min', durationMin: 30, description: 'Standard meeting.' },
    { name: '1 Hour Meeting', slug: '60min', durationMin: 60, description: 'Deep dive discussion.' },
  ];

  for (const et of eventTypes) {
    await prisma.eventType.create({ data: et });
  }
  console.log('✅ Created 3 event types');

  // 4. Set Default Availability Rules (Mon-Fri, 9am to 5pm)
  await prisma.availabilityRule.deleteMany();
  
  const rules = [];
  // 1=Mon, ..., 5=Fri
  for (let i = 1; i <= 5; i++) {
    rules.push({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '17:00'
    });
  }
  await prisma.availabilityRule.createMany({ data: rules });
  console.log('✅ Created availability rules (Mon-Fri, 9:00-17:00)');

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
