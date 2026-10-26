import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import * as z from 'zod'
import { ru } from 'zod/locales'
import swaggerUI from 'swagger-ui-express'

import { authRouter } from './routes/auth.js'
import { productsRouter } from './routes/products.js'
import { usersRouter } from './routes/users.js'
import { logger, errorHandler } from './middleware/index.js'
import { specs } from './swagger.js'
import { HttpError } from './types.js'

z.config(ru())

const app = express()
app.disable('x-powered-by')
app.use(helmet({ frameguard: { action: 'deny' } }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
    response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
    if (request.method === 'OPTIONS') {
        response.sendStatus(204)
        return
    }
    next()
})
app.use('/static', express.static(path.join(import.meta.dirname, '..', 'assets', 'uploads')))
app.use(logger)

app.use('/docs', swaggerUI.serve, swaggerUI.setup(specs))

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)

app.use((_request, _response, next) => next(new HttpError('Ресурс не найден', 404)))
app.use(errorHandler)

app.listen(3000, () => console.info('API доступен на http://localhost:3000'))
