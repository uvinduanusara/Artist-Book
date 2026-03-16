import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service', port: 3002 })
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`user-service running on :${PORT}`)
})
