import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'search-service', port: 3003 })
})

const PORT = process.env.PORT || 3003
app.listen(PORT, () => {
  console.log(`search-service running on :${PORT}`)
})
