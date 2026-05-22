const prisma = require('../lib/prisma.js');

class EventTypeRepository {
  async findAll() {
    return prisma.eventType.findMany({
      include: { schedule: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id) {
    return prisma.eventType.findUnique({
      where: { id },
      include: { schedule: true }
    });
  }

  async findBySlug(slug) {
    return prisma.eventType.findFirst({
      where: { slug },
      include: { schedule: true }
    });
  }

  async create(data) {
    // Since this is a single-user system for the demo, get the default user
    const defaultUser = await prisma.user.findFirst({
      include: { schedules: true }
    });
    if (!defaultUser) throw new Error("No default user found. Please run the seed script.");

    const scheduleId = data.schedule_id || defaultUser.schedules[0]?.id;
    if (!scheduleId) throw new Error("No schedule available to attach this event type.");

    return prisma.eventType.create({
      data: {
        userId: defaultUser.id,
        scheduleId: scheduleId,
        name: data.name,
        slug: data.slug,
        durationMin: data.duration_min,
        description: data.description,
        bufferBefore: data.buffer_before || 0,
        bufferAfter: data.buffer_after || 0,
        customQuestions: data.custom_questions || [],
      }
    });
  }

  async update(id, data) {
    const updateData = {
      name: data.name,
      slug: data.slug,
      durationMin: data.duration_min,
      description: data.description,
      bufferBefore: data.buffer_before || 0,
      bufferAfter: data.buffer_after || 0,
      customQuestions: data.custom_questions || [],
    };
    if (data.schedule_id) {
      updateData.scheduleId = data.schedule_id;
    }

    return prisma.eventType.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id) {
    return prisma.eventType.delete({
      where: { id }
    });
  }
}

module.exports = new EventTypeRepository();
