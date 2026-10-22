import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const connection = new Redis({
    port: 6379,
    maxRetriesPerRequest: null
})

export const thumbnailsQueue = new Queue('thumbnails', {
    connection,
    defaultJobOptions: {
        attempts: 10,
    }
})

export const emailQueue = new Queue('email', {
    connection,
})