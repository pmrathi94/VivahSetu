// ============================================================================
// Main Application Entry Point
// ============================================================================

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { config } from './config'
import { logger } from './config/logger'
import {
  errorHandler,
  requestLogger,
  rateLimiter
} from './middleware'
import apiRoutes from './routes'

const app = express()

// ============================================================================
// Global Middleware
// ============================================================================

// Security
app.use(helmet())

// CORS
const corsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
]

app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow non-browser requests (e.g., curl, server-to-server)
    if (!incomingOrigin) return callback(null, true)

    if (corsOrigins.includes(incomingOrigin)) return callback(null, true)

    // Allow GitHub Codespaces preview subdomains like https://...preview.app.github.dev
    const codespacesRegex = /^https?:\/\/[a-z0-9-]+(?:-\d+)?\.preview\.app\.github\.dev(?::\d+)?$/i
    if (codespacesRegex.test(incomingOrigin)) return callback(null, true)

    // Log denied origins in development
    if (config.NODE_ENV === 'development') {
      logger.debug(`CORS denied for origin: ${incomingOrigin}`)
      return callback(null, true) // Allow in development
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}))

// Compression
app.use(compression())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Logging
app.use(requestLogger)

// Rate limiting
if (config.ENABLE_RATE_LIMITING) {
  app.use(rateLimiter(100, 60000))
}

// ============================================================================
// Health Check Endpoints
// ============================================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
  })
})

app.get('/health/db', (req, res) => {
  // In production, check actual database connection
  res.status(200).json({
    status: 'ok',
    database: 'connected',
    timestamp: new Date().toISOString(),
  })
})

// ============================================================================
// API Routes
// ============================================================================
app.use(`/api/${config.API_VERSION}`, apiRoutes)

// ============================================================================
// Error Handling
// ============================================================================
app.use(errorHandler)

// ============================================================================
// Server Startup
// ============================================================================
const server = app.listen(config.PORT, () => {
  logger.info(`
    🚀 Vivah Setu Backend Server Started
    Environment: ${config.NODE_ENV}
    Port: ${config.PORT}
    API Version: /api/${config.API_VERSION}
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server')
  server.close(() => {
    logger.info('HTTP server closed')
    process.exit(0)
  })
})

export default app
