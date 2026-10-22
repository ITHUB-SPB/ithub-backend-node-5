import { Queue } from 'bullmq'
import { Redis } from 'ioredis'

export const connection = new Redis({
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null
})

export const thumbnailsQueue = new Queue('thumbnails', {
    connection,
    defaultJobOptions: {
        attempts: 10,
        removeOnComplete: true
    }
})