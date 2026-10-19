import path from 'node:path'
import { createServer } from 'node:http'
import express from 'express'
import { Server, Socket } from 'socket.io'
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

const wss = new Server(server, { path: '/chat' })

const connections = new Map<string, Socket>()
const messages: { user: string, message: string }[] = []

type ChatEvent = {
    type: 'user:login' | 'message:send'
    message: string
}

wss.on('connection', (ws) => {
    ws.on('disconnect', () => {
        for (const [user, connection] of connections.entries()) {
            if (connection === Socket) {
                connections.delete(user)
            }
        }

        for (const connection of connections.values()) {
            connection.send(JSON.stringify({
                type: 'user:list',
                message: [...connections.keys()]
            }))
        }
    })

    ws.on('message', (eventData) => {
        // console.log({
        //     event: String(eventData),
        //     url: request.url
        // })

        const event: ChatEvent = JSON.parse(String(eventData))

        if (event.type === "user:login") {
            connections.set(event.message, ws)

            for (const connection of connections.values()) {
                connection.send(JSON.stringify({
                    type: 'user:list',
                    message: [...connections.keys()]
                }))
            }

            ws.send(JSON.stringify({
                type: 'message:recent',
                message: messages.slice(-5)
            }))

        } else if (event.type === "message:send") {
            for (const [user, connection] of connections.entries()) {
                if (connection === ws) {
                    messages.push({
                        user,
                        message: event.message
                    })
                }
            }

            for (const connection of connections.values()) {
                connection.send(JSON.stringify({
                    type: 'message:receive',
                    message: messages.at(-1)
                }))
            }
        }

    })
})

wss.on('error', (error) => {
    console.error(error)
})

wss.on('close', () => {
    console.log('Disconnected')
})

server.listen(3000)