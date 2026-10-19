import path from 'node:path'
import { createServer } from 'node:http'
import express from 'express'
import { WebSocketServer } from 'ws'
import * as z from "zod"
import { ru } from "zod/locales"

import { productsRouter } from './routes/products.js'
import { logger, errorHandler } from './middleware/index.js'
import type { ErrorWithCode } from './types.js'

z.config(ru())

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static', express.static(path.join(import.meta.dirname, '..', 'assets', 'uploads')))
app.use(express.static(path.join(import.meta.dirname, '..', 'public')))

app.use(logger)

app.use('api/products', productsRouter)

app.use((request: express.Request, _response: express.Response, next: express.NextFunction) => {
    if (request.path.endsWith('.json')) {
        next()
        return
    }

    const error = new Error('Ресурс не найден') as ErrorWithCode
    error.code = "404"

    next(error)
})


app.use(errorHandler)

const server = createServer(app)

const wss = new WebSocketServer({ server })

const connections = new Set()

wss.on('connection', (ws, request) => {
    connections.add(ws)

    ws.send(`Hi! There are ${connections.size} users`)

    ws.on('message', event => {
        console.log({
            event: String(event),
            url: request.url
        })

        // ws.send(event)
    })

    ws.on('close', () => {
        connections.delete(ws)
    })
})

wss.on('error', (error) => {
    console.error(error)
})

wss.on('close', () => {
    console.log('Disconnected')
})

server.listen(3000)