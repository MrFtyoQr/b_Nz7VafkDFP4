require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const employeesRouter = require('./routes/employees')
const companiesRouter = require('./routes/companies')
const benefitsRouter = require('./routes/benefits')
const reportsRouter = require('./routes/reports')

const app = express()
const PORT = process.env.PORT || 3001

// ============================================================
// Seguridad: cabeceras HTTP con Helmet
// ============================================================
app.use(helmet())

// ============================================================
// CORS — Solo permite orígenes autorizados
// ============================================================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej. Postman en dev, server-to-server)
      if (!origin && process.env.NODE_ENV === 'development') return callback(null, true)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      callback(new Error(`CORS bloqueado para origen: ${origin}`))
    },
    credentials: true,
  })
)

// ============================================================
// Rate limiting — Protección contra fuerza bruta
// ============================================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Rate limit más estricto para endpoints de escritura sensibles
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  message: { error: 'Demasiadas solicitudes. Espera un momento.' },
})

// ============================================================
// Parsers y logging
// ============================================================
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ============================================================
// Health check
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cuponera-camsa-backend', ts: new Date().toISOString() })
})

// ============================================================
// Rutas de la API
// ============================================================
app.use('/api/employees', strictLimiter, employeesRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/benefits', strictLimiter, benefitsRouter)
app.use('/api/reports', reportsRouter)

// ============================================================
// 404
// ============================================================
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` })
})

// ============================================================
// Error handler global
// ============================================================
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  const status = err.status || 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
  })
})

// ============================================================
// Inicio del servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Backend Cuponera CAMSA corriendo en http://localhost:${PORT}`)
  console.log(`   Entorno: ${process.env.NODE_ENV}`)
  console.log(`   CORS permitido: ${allowedOrigins.join(', ')}`)
})
