import cors from 'cors'
import express from 'express'
import morgan from 'morgan'

const app: express.Application = express()
// Middleware for System
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
export default app
