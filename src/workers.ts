import { Worker } from "bullmq";
import sharp from "sharp";
import { connection } from './queue.js'

type ThumbnailsData = {
    pathToOriginalFile: string
    pathToThumbnailFile: string
}

const thumbnailsWorker = new Worker<ThumbnailsData>('thumbnails-worker', async (job) => {
    await sharp(job.data.pathToOriginalFile).png({ quality: 90 }).resize({
        fit: "cover",
        width: 120,
        height: 120
    }).toFile(job.data.pathToThumbnailFile)
}, { connection, concurrency: 10 })

thumbnailsWorker.on('completed', job => {
    console.log(`Job ${job.id} completed: generated file ${job.data.pathToThumbnailFile}`)
})

thumbnailsWorker.on('error', error => {
    console.error(`Job failed: ${error.message}`)
})