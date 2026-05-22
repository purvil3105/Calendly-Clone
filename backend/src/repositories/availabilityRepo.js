const prisma = require('../lib/prisma.js');

class AvailabilityRepository {
  async findRules() {
    return prisma.availabilityRule.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
  }

  async findOverrides(startDate, endDate) {
    return prisma.dateOverride.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  async updateAvailability(timezone, rules) {
    return prisma.$transaction(async (tx) => {
      // Update user timezone
      const defaultUser = await tx.user.findFirst();
      if (!defaultUser) throw new Error("No default user found");
      
      await tx.user.update({
        where: { id: defaultUser.id },
        data: { timezone }
      });

      // Delete existing rules and insert new ones
      await tx.availabilityRule.deleteMany();
      
      if (rules.length > 0) {
        await tx.availabilityRule.createMany({
          data: rules.map(r => ({
            dayOfWeek: r.day_of_week,
            startTime: r.start_time,
            endTime: r.end_time,
          }))
        });
      }
    });
  }
}

module.exports = new AvailabilityRepository();
