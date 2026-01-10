import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  API_VERSION: process.env.API_VERSION || 'v1',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Features
  ENABLE_AUDIT_LOGS: process.env.ENABLE_AUDIT_LOGS === 'true',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',

  // Validation
  validate: () => {
    if (process.env.NODE_ENV === 'production') {
      const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
      const missing = required.filter(key => !process.env[key])

      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
      }
    }
  }
}

config.validate()
