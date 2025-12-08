// src/modules/users/users.service.js
const { prisma } = require('../../core/prisma');

class UsersService {
  async createStudent(name, email, passwordHash) {
    return prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'student',
      },
    });
  }

  async listAll() {
    return prisma.user.findMany();
  }
}

module.exports = { UsersService };
