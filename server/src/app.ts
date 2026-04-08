import path from 'path'
import dotenv from 'dotenv'

// Load server/.env even when the process cwd is the repo root or another folder
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from './config/db'
import MODULE_ROUTES_MAPPINGS from './modules'
import { handleError } from './utils/errors'
import notificationRoutes from './modules/notification/routes/notification.route';
import formRoutes from './modules/form/routes/form.route';
import consentRoutes from './modules/consent/routes/consent.route';
import teleconsultationRoutes from './modules/teleconsultation/teleconsultation.route';
import { staffBillingRoutes } from './modules/billing/staff';

const app: Application = express()

// Error handling
if (process.env.NODE_ENV !== 'development') {
  handleError()
}

// With credentials: true, browsers reject Access-Control-Allow-Origin: * — use an explicit list.
// Origin values have no trailing slash (matches the browser Origin header).
const builtInOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://clinic-management-pearl-beta.vercel.app',
]
const envOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const allowedOrigins = [...new Set([...builtInOrigins, ...envOrigins])]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(null, false)
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Omit allowedHeaders so preflight mirrors Access-Control-Request-Headers (axios may send Accept, etc.)
    credentials: true,
    optionsSuccessStatus: 204,
  }),
)
// Default CORP is same-origin and blocks cross-origin reads (different ports count as cross-origin)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// DB initialization and connection
connectDB()

// Routers
MODULE_ROUTES_MAPPINGS.forEach(({ prefix, router }) => {
  app.use(prefix, router)
})

app.use('/api/notifications', notificationRoutes);
app.use('/api/form', formRoutes);
app.use('/api/consent', consentRoutes);
app.use('/teleconsultation', teleconsultationRoutes);
app.use('/api/staff/billing', staffBillingRoutes);



// Endpoints
app.get('/', (req: Request, res: Response): void => {
  res.send('Clinic management!')
})

export default app
