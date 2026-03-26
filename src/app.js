const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/auth', authRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Auth service error:', err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Auth service running on http://localhost:${PORT}`)
})

module.exports = app
