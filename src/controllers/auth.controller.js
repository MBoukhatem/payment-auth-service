const authService = require('../services/auth.service')

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body
    const result = await authService.register(email, password, firstName, lastName)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/',
    })

    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/',
    })

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    })
  } catch (err) {
    next(err)
  }
}

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    const result = await authService.refresh(token)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/',
    })

    res.json({ accessToken: result.accessToken })
  } catch (err) {
    next(err)
  }
}

const logout = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id']
    await authService.logout(userId)

    res.clearCookie('refreshToken', { path: '/auth' })
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    await authService.forgotPassword(email)
    res.json({ message: 'If the email exists, a reset link has been sent.' })
  } catch (err) {
    next(err)
  }
}

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body
    await authService.resetPassword(token, password)
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
}
