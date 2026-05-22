const prisma = require('../lib/prisma.js');


class ScheduleRepo {
  async findByUserId(userId) {
    return prisma.schedule.findMany({
      where: { userId },
      include: {
        availabilityRules: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id) {
    return prisma.schedule.findUnique({
      where: { id },
      include: {
        availabilityRules: true,
      },
    });
  }

  async create(data) {
    return prisma.schedule.create({
      data,
      include: {
        availabilityRules: true,
      },
    });
  }

  async update(id, data) {
    return prisma.schedule.update({
      where: { id },
      data,
      include: {
        availabilityRules: true,
      },
    });
  }

  async delete(id) {
    return prisma.schedule.delete({
      where: { id },
    });
  }
}

module.exports = new ScheduleRepo();
