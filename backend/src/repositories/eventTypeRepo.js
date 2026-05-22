const prisma = require('../lib/prisma.js');

class EventTypeRepository {
  async findAll() {
    return prisma.eventType.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id) {
    return prisma.eventType.findUnique({
      where: { id }
    });
  }

  async findBySlug(slug) {
    return prisma.eventType.findFirst({
      where: { slug }
    });
  }

  async create(data) {
    // Since this is a single-user system for the demo, get the default user
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) throw new Error("No default user found. Please run the seed script.");

    return prisma.eventType.create({
      data: {
        userId: defaultUser.id,
        name: data.name,
        slug: data.slug,
        durationMin: data.duration_min,
        description: data.description,
      }
    });
  }

  async update(id, data) {
    return prisma.eventType.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        durationMin: data.duration_min,
        description: data.description,
      }
    });
  }

  async delete(id) {
    return prisma.eventType.delete({
      where: { id }
    });
  }
}

module.exports = new EventTypeRepository();
