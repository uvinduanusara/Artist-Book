import { Router } from 'express'
import {
  register,
  login,
  refresh,
  logout,
  sendOtp,
  verifyOtp,
} from '../controllers/auth.controller'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh', refresh)
authRouter.post('/logout', logout)
authRouter.post('/otp/send', sendOtp)
authRouter.post('/otp/verify', verifyOtp)
