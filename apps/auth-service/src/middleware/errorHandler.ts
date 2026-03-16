import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  if (err instanceof Error) {
    console.error(`[auth-service] ${err.message}`)
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    })
  }

  return res.status(500).json({ success: false, error: 'Unknown error' })
}
