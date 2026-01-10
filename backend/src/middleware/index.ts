// ============================================================================
// Middleware - Request Processing
// ============================================================================

import { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'
import { ApplicationError, ErrorCode, ApiResponse } from '../models/responses'
import { supabaseAdmin } from '../config/supabase'

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string
      weddingId?: string
      user?: any
    }
  }
}

// Error Handling Middleware
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { error: err })

  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.message, `${err.code}`)
    )
  }

  res.status(500).json(
    ApiResponse.error('Internal Server Error', 'INTERNAL_ERROR')
  )
}

// Authentication Middleware
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        'Missing or invalid authorization header',
        401
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      throw new ApplicationError(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired token',
        401
      )
    }

    req.userId = user.id
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

// Wedding Authorization Middleware
export const authorizeWedding = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const weddingId = req.params.weddingId
    if (!weddingId) {
      throw new ApplicationError(
        ErrorCode.INVALID_REQUEST,
        'Wedding ID is required',
        400
      )
    }

    const { data: wedding, error } = await supabaseAdmin
      .from('weddings')
      .select('*')
      .eq('id', weddingId)
      .single()

    if (error || !wedding) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        'Wedding not found',
        404
      )
    }

    // Check if user is bride, groom, or has role in wedding
    const isBrideOrGroom = 
      wedding.bride_id === req.userId || 
      wedding.groom_id === req.userId

    if (!isBrideOrGroom) {
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('wedding_id', weddingId)
        .eq('user_id', req.userId)
        .single()

      if (!userRole) {
        throw new ApplicationError(
          ErrorCode.FORBIDDEN,
          'Access denied to this wedding',
          403
        )
      }
    }

    req.weddingId = weddingId
    next()
  } catch (err) {
    next(err)
  }
}

// Request Validation Middleware
export const validateRequest = (schema: any) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body)
      next()
    } catch (err: any) {
      next(
        new ApplicationError(
          ErrorCode.VALIDATION_ERROR,
          err.message,
          400,
          err.details
        )
      )
    }
  }
}

// Logging Middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(
      `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    )
  })
  next()
}

// Rate Limiting Middleware (basic in-memory implementation)
const requestMap = new Map<string, { count: number; resetTime: number }>()

export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const userRequest = requestMap.get(key)

    if (!userRequest || userRequest.resetTime < now) {
      requestMap.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }

    userRequest.count++

    if (userRequest.count > maxRequests) {
      return res.status(429).json(
        ApiResponse.error(
          'Too many requests. Please try again later.',
          'RESOURCE_EXHAUSTED'
        )
      )
    }

    next()
  }
}
