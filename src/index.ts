import path from 'node:path'
import express from 'express'
import * as z from "zod"
import { ru } from "zod/locales"

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { usersRouter } from './routes/users.js'
import { authRouter } from './routes/auth.js'
import { logger, errorHandler } from './middleware/index.js'
import type { ErrorWithCode } from './types.js'
import { thumbnailsQueue, emailQueue } from './queue.js';

z.config(ru())

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(thumbnailsQueue),
    new BullMQAdapter(emailQueue)
  ],
  serverAdapter,
});

const app = express()

app.use('/queues', serverAdapter.getRouter());

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static', express.static(path.join(import.meta.dirname, '..', 'assets')))

app.use(logger)

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

app.use((_request: express.Request, _response: express.Response, next: express.NextFunction) => {
  const error = new Error('Ресурс не найден') as ErrorWithCode
  error.code = "404"

  next(error)
})


app.use(errorHandler)

app.listen(3000)