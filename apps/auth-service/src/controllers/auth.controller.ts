import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@artistbook/db'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  otpRequestSchema,
  otpVerifySchema,
} from '../validators'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })
  const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  })
  return { accessToken, refreshToken }
}

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        error:
          existing.email === data.email
            ? 'Email already in use'
            : 'Username already taken',
      })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        role: data.role,
      },
    })

    if (data.role === 'ARTIST') {
      await prisma.artist.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      })
    } else if (data.role === 'CUSTOMER') {
      await prisma.customer.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    })

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    })

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      })
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET)

    await prisma.refreshToken.delete({ where: { id: stored.id } })

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      stored.user.id,
      stored.user.role
    )

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    })

    return res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body)
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    return res.json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone } = otpRequestSchema.parse(req.body)

    if (!process.env.TWILIO_SID || !process.env.TWILIO_VERIFY_SID) {
      return res.status(503).json({
        success: false,
        error: 'OTP service not configured',
      })
    }

    const twilio = require('twilio')(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    )

    await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: 'sms' })

    return res.json({ success: true, message: 'OTP sent' })
  } catch (err) {
    next(err)
  }
}

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, code, userId } = otpVerifySchema.parse(req.body)

    if (!process.env.TWILIO_SID || !process.env.TWILIO_VERIFY_SID) {
      return res.status(503).json({
        success: false,
        error: 'OTP service not configured',
      })
    }

    const twilio = require('twilio')(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    )

    const check = await twilio.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code })

    if (check.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Invalid OTP' })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    })

    return res.json({ success: true, message: 'Phone verified' })
  } catch (err) {
    next(err)
  }
}
