import { Queue } from 'bullmq'

const thumbnailsQueue = new Queue('thumbnails', {
    connection: {  },
    defaultJobOptions: {
        attempts: 10,
        removeOnComplete: true
    }
})