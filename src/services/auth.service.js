const authRepository = require('../repositories/auth.repository')
const { hashPassword, comparePassword } = require('../utils/hash')
const {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  verifyRefreshToken,
  verifyResetToken,
} = require('../utils/jwt')

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002'
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003'
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
const SERVICE_TOKEN = process.env.SERVICE_TOKEN
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const register = async (email, password, firstName, lastName) => {
  const existing = await authRepository.findByEmail(email)
  if (existing) {
    const error = new Error('Email already exists')
    error.status = 409
    throw error
  }

  const passwordHash = await hashPassword(password)
  const user = await authRepository.createUser(email, passwordHash)

  // Create wallet in payment service
  try {
    await fetch(`${PAYMENT_SERVICE_URL}/internal/wallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': SERVICE_TOKEN,
      },
      body: JSON.stringify({ userId: user.id }),
    })
  } catch (err) {
    console.error('Failed to create wallet:', err.message)
  }

  // Create profile in user service
  try {
    await fetch(`${USER_SERVICE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': SERVICE_TOKEN,
        'X-User-Id': user.id,
      },
      body: JSON.stringify({ firstName, lastName }),
    })
  } catch (err) {
    console.error('Failed to create profile:', err.message)
  }

  // Send welcome email via notification service
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': SERVICE_TOKEN,
      },
      body: JSON.stringify({
        to: email,
        template: 'welcome',
        data: { firstName, lastName, email },
      }),
    })
  } catch (err) {
    console.error('Failed to send welcome email:', err.message)
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)
  await authRepository.updateRefreshToken(user.id, refreshToken)

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } }
}

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email)
  if (!user) {
    const error = new Error('Invalid credentials')
    error.status = 401
    throw error
  }

  const valid = await comparePassword(password, user.passwordHash)
  if (!valid) {
    const error = new Error('Invalid credentials')
    error.status = 401
    throw error
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)
  await authRepository.updateRefreshToken(user.id, refreshToken)

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } }
}

const refresh = async (token) => {
  if (!token) {
    const error = new Error('Refresh token required')
    error.status = 401
    throw error
  }

  let decoded
  try {
    decoded = verifyRefreshToken(token)
  } catch (_err) {
    const error = new Error('Invalid or expired refresh token')
    error.status = 401
    throw error
  }

  const user = await authRepository.findById(decoded.sub)
  if (!user || user.refreshToken !== token) {
    const error = new Error('Invalid refresh token')
    error.status = 401
    throw error
  }

  const accessToken = generateAccessToken(user)
  const newRefreshToken = generateRefreshToken(user)
  await authRepository.updateRefreshToken(user.id, newRefreshToken)

  return { accessToken, refreshToken: newRefreshToken }
}

const logout = async (userId) => {
  await authRepository.updateRefreshToken(userId, null)
}

const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email)
  if (!user) {
    // Return silently to prevent email enumeration
    return
  }

  const resetToken = generateResetToken(user)
  const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`

  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': SERVICE_TOKEN,
      },
      body: JSON.stringify({
        to: email,
        template: 'reset-password',
        data: { resetLink, email },
      }),
    })
  } catch (err) {
    console.error('Failed to send reset email:', err.message)
  }
}

const resetPassword = async (token, newPassword) => {
  let decoded
  try {
    decoded = verifyResetToken(token)
  } catch (_err) {
    const error = new Error('Invalid or expired reset token')
    error.status = 400
    throw error
  }

  const user = await authRepository.findById(decoded.sub)
  if (!user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  const passwordHash = await hashPassword(newPassword)
  await authRepository.updatePassword(user.id, passwordHash)
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
}
