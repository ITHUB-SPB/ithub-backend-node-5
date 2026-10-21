import type { Server } from 'socket.io'
import type { DefaultEventsMap } from 'socket.io'

const connections = new Map<string, string>()
const messages: { user: string, message: string }[] = []

type ChatIncomingEvent = 'user:login' | 'message:send' // использовать в EventsMap
type ChatOutputEvent = 'user:list' | 'message:receive' // использовать в EventsMap

type ChatIncomingEventMap = DefaultEventsMap & {
    'user:login': (user: string) => void,
    'message:send': (message: string) => void
}

type ChatMessage = {
    user: string,
    message: string
}

export function setupWebsockets(wss: Server<ChatIncomingEventMap>) {
    wss.on('message', message => {
        console.log(message)
    })

    wss.on('connection', (ws) => {
        let user: string | null = null;

        ws.on('user:login', (userMessage) => {
            connections.set(userMessage, ws.id)
            user = userMessage

            wss.emit('user:list', [...connections.keys()])
            ws.emit('message:recent', messages.slice(-5))
        })

        ws.on('message:send', message => {
            messages.push({
                user,
                message: message
            } as ChatMessage)

            wss.emit('message:receive', messages.at(-1))
        })

        ws.on('disconnect', () => {
            connections.delete(user as string)
            ws.broadcast.emit('user:list', [...connections.keys()])
        })
    })
    wss.on('error', (error) => {
        console.error(error)
    })
}


