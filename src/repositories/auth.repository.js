const prisma = require('../prisma')

const createUser = async (email, passwordHash) => {
  return prisma.user.create({
    data: { email, passwordHash },
  })
}

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } })
}

const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } })
}

const updateRefreshToken = async (id, refreshToken) => {
  return prisma.user.update({
    where: { id },
    data: { refreshToken },
  })
}

const updatePassword = async (id, passwordHash) => {
  return prisma.user.update({
    where: { id },
    data: { passwordHash, refreshToken: null },
  })
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  updateRefreshToken,
  updatePassword,
}
