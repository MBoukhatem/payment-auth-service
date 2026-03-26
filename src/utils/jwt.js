const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const generateAccessToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

const generateRefreshToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  })
}

const generateResetToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '1h',
  })
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET)
}

const verifyResetToken = (token) => {
  return jwt.verify(token, JWT_SECRET)
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
}
