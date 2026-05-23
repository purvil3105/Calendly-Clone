const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Dropping strict unique index to allow group events...");
  try {
    await prisma.$executeRawUnsafe(`
      DROP INDEX IF EXISTS uniq_active_booking;
    `);
    console.log("✅ Success! Unique index dropped. Group events are now possible.");
  } catch (error) {
    console.error("❌ Error dropping index:", error);
  }
}

main().finally(() => prisma.$disconnect());
