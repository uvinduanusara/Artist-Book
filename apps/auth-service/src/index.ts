import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

import { authRouter } from './routes/auth'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' })
})

app.use('/auth', authRouter)
app.use(errorHandler as express.ErrorRequestHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`[auth-service] running on :${PORT}`)
})
