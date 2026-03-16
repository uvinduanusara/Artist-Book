import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok', service: 'api-gateway', port: 4000
3001
3002
  })
})

const PORT = process.env.PORT || 4000
3001
3002
app.listen(PORT, () => {
  console.log(`api-gateway running on :${PORT}`)
})
