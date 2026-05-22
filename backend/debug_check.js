require('dotenv').config();
const prisma = require('./src/lib/prisma.js');

async function main() {
  const ets = await prisma.eventType.findMany({ include: { schedule: true } });
  ets.forEach(e => console.log('EventType:', e.name, '| slug:', e.slug, '| schedule:', e.schedule.name, '| scheduleId:', e.scheduleId));

  console.log('\n--- Overrides ---');
  const overrides = await prisma.dateOverride.findMany({ include: { schedule: true } });
  overrides.forEach(o => console.log('Override:', o.date.toISOString(), '| schedule:', o.schedule.name, '| scheduleId:', o.scheduleId, '| startTime:', o.startTime, '| endTime:', o.endTime));

  await prisma.$disconnect();
}

main();
