const prisma = require('../lib/prisma.js');

class MeetingRepository {
  async findById(id) {
    return prisma.meeting.findUnique({
      where: { id },
      include: { eventType: true }
    });
  }

  async findAllByStatus(status) {
    const now = new Date();
    
    if (status === 'upcoming') {
      return prisma.meeting.findMany({
        where: {
          startAt: { gte: now },
          status: 'scheduled'
        },
        include: { eventType: true },
        orderBy: { startAt: 'asc' }
      });
    } else {
      return prisma.meeting.findMany({
        where: {
          OR: [
            { startAt: { lt: now } },
            { status: 'cancelled' }
          ]
        },
        include: { eventType: true },
        orderBy: { startAt: 'desc' }
      });
    }
  }

  async findUpcomingBetween(startDate, endDate) {
    return prisma.meeting.findMany({
      where: {
        startAt: { gte: startDate, lt: endDate },
        status: 'scheduled'
      },
      select: {
        startAt: true,
        endAt: true,
        eventType: { select: { bufferBefore: true, bufferAfter: true } }
      }
    });
  }

  async findConflicting(startAt, endAt) {
    return prisma.meeting.findFirst({
      where: {
        status: 'scheduled',
        OR: [
          { startAt: { lt: endAt }, endAt: { gt: startAt } }
        ]
      }
    });
  }

  async create(data) {
    return prisma.meeting.create({
      data: {
        eventTypeId: data.eventTypeId,
        startAt: data.startAt,
        endAt: data.endAt,
        inviteeName: data.inviteeName,
        inviteeEmail: data.inviteeEmail,
        notes: data.notes,
        answers: data.answers,
        status: 'scheduled'
      }
    });
  }

  async cancel(id) {
    return prisma.meeting.update({
      where: { id },
      data: { status: 'cancelled' }
    });
  }

  async reschedule(id, startAt, endAt) {
    return prisma.meeting.update({
      where: { id },
      data: { startAt, endAt }
    });
  }
}

module.exports = new MeetingRepository();
