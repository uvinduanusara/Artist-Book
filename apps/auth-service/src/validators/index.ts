import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  role: z.enum(['VIEWER', 'ARTIST', 'CUSTOMER']),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const otpRequestSchema = z.object({
  phone: z.string().min(10),
})

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  code: z.string().length(6),
  userId: z.string().min(1),
})
