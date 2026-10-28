import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import * as z from 'zod'
import { ru } from 'zod/locales'
import swaggerUI from 'swagger-ui-express'

import { OpenAPIGenerator } from '@orpc/openapi'
import { OpenAPIHandler } from '@orpc/openapi/node'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'

import { authRouter } from './routes/auth.js'
import { productsRouter } from './routes/products.js'
import { usersRouter } from './routes/users.js'
import { logger, errorHandler } from './middleware/index.js'
import { specs } from './swagger.js'
import { HttpError } from './types.js'
import { productsRouterOrpc } from './routes/products.js'

import {
    ZodToJsonSchemaConverter
} from '@orpc/zod/zod4'

z.config(ru())

const handler = new OpenAPIHandler(productsRouterOrpc, {
    plugins: [new CORSPlugin()],
    interceptors: [
        onError((error) => {
            console.error(error)
        }),
    ],
})

const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [
        new ZodToJsonSchemaConverter(),
    ],
})

const openApiDocument = await openAPIGenerator.generate(productsRouterOrpc, {
    info: {
        title: "Products API",
        version: "0.1.0",
        description: "Products API Docs",
    },
})

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

app.use('/api{/*path}', async (req, res, next) => {
    const { matched } = await handler.handle(req, res, {
        context: {
            req,
            res
        },
    })

    if (matched) {
        return
    }

    next()
})

app.use('/docs', swaggerUI.serve, swaggerUI.setup(openApiDocument))

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter)
app.use('/api/products', productsRouter)
app.use('/api/users', usersRouter)

app.use((_request, _response, next) => next(new HttpError('Ресурс не найден', 404)))
app.use(errorHandler)

app.listen(3000, () => console.info('API доступен на http://localhost:3000'))
