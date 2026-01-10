// ============================================================================
// API Response Models - Standardized Responses
// ============================================================================

export class ApiResponse<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: string | object,
    public message?: string,
    public timestamp: string = new Date().toISOString()
  ) {}

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, undefined, message)
  }

  static error(error: string | object, message?: string): ApiResponse {
    return new ApiResponse(false, undefined, error, message)
  }
}

export class PaginatedResponse<T> {
  constructor(
    public data: T[],
    public total: number,
    public page: number,
    public per_page: number,
    public has_more: boolean,
    public timestamp: string = new Date().toISOString()
  ) {}

  static create<T>(
    data: T[],
    total: number,
    page: number,
    per_page: number
  ): PaginatedResponse<T> {
    return new PaginatedResponse(
      data,
      total,
      page,
      per_page,
      page * per_page < total
    )
  }
}

export class ErrorResponse extends ApiResponse {
  constructor(
    error: string | object,
    public statusCode: number = 500,
    message?: string
  ) {
    super(false, undefined, error, message)
  }
}

// Standardized error codes
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
}

export class ApplicationError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}
