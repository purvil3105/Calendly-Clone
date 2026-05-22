const prisma = require('../lib/prisma.js');

class AvailabilityRepository {
  async findRules(scheduleId) {
    return prisma.availabilityRule.findMany({
      where: { scheduleId },
      orderBy: { dayOfWeek: 'asc' }
    });
  }

  async findOverrides(scheduleId, startDate, endDate) {
    return prisma.dateOverride.findMany({
      where: {
        scheduleId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  async updateAvailability(scheduleId, timezone, rules) {
    return prisma.$transaction(async (tx) => {
      // Update schedule timezone
      await tx.schedule.update({
        where: { id: scheduleId },
        data: { timezone }
      });

      // Delete existing rules for this schedule and insert new ones
      await tx.availabilityRule.deleteMany({
        where: { scheduleId }
      });
      
      if (rules.length > 0) {
        await tx.availabilityRule.createMany({
          data: rules.map(r => ({
            scheduleId,
            dayOfWeek: r.day_of_week,
            startTime: r.start_time,
            endTime: r.end_time,
          }))
        });
      }
    });
  }

  // ─── Date Override CRUD ─────────────────────────────────
  async findOverridesByScheduleId(scheduleId) {
    return prisma.dateOverride.findMany({
      where: { scheduleId },
      orderBy: { date: 'asc' }
    });
  }

  async upsertOverride(scheduleId, date, startTime, endTime) {
    return prisma.dateOverride.upsert({
      where: {
        scheduleId_date: { scheduleId, date }
      },
      update: { startTime, endTime },
      create: { scheduleId, date, startTime, endTime }
    });
  }

  async deleteOverride(id) {
    return prisma.dateOverride.delete({
      where: { id }
    });
  }
}

module.exports = new AvailabilityRepository();
