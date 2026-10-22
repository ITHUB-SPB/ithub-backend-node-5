import { Worker } from "bullmq";
import sharp from "sharp";
import * as z from "zod";

import { sendWelcomeMail } from "./mail.js";
import { connection } from './queue.js'
import { getAccountSchema } from "./schemas/accounts.schema.js";

type ThumbnailsData = {
    pathToOriginalFile: string
    pathToThumbnailFile: string
}

type EmailData = z.output<typeof getAccountSchema>

const errorHandler = (error: Error) => {
    console.error(`Job failed: ${error.message}`)
}

const thumbnailsWorker = new Worker<ThumbnailsData>('thumbnails', async (job) => {
    await sharp(job.data.pathToOriginalFile).png({ quality: 90 }).resize({
        fit: "cover",
        width: 120,
        height: 120
    }).toFile(job.data.pathToThumbnailFile)
}, { connection, concurrency: 10 })

const emailWorker = new Worker<EmailData>('email', async (job) => {
    await sendWelcomeMail(job.data)
}, { connection, concurrency: 10 })

thumbnailsWorker.on('completed', job => {
    console.log(`Job ${job.id} completed: generated file ${job.data.pathToThumbnailFile}`)
})

emailWorker.on('completed', job => {
    console.log(`Job ${job.id} completed: email sent to ${job.data.email}`)
})

thumbnailsWorker.on('error', errorHandler)
emailWorker.on('error', errorHandler)