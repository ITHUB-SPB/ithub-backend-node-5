import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { Router } from 'express'
import multer from 'multer'

import { requireAuth } from '../auth.js'
import { formatSuccess } from '../middleware/format-result.js'
import { accountsRepository } from '../repository/accounts.repository.js'
import {
    createProfileInputSchema,
} from '../schemas/accounts.schema.js'
import { HttpError } from '../types.js'

const uploadsDirectory = path.join(
    import.meta.dirname,
    '..',
    '..',
    'assets',
    'uploads',
)

await mkdir(uploadsDirectory, { recursive: true })

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadsDirectory,
        filename: (_request, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase()
            callback(null, `${randomUUID()}${extension}`)
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
        const isImage = file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'

        if (!isImage) {
            return callback(new HttpError('Допускаются только изображения JPEG и PNG', 422))
        }

        callback(null, true)
    },
})

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, async (request, response) => {
    const account = await accountsRepository.getOne(request.user!.id)

    if (!account) {
        throw new HttpError('Пользователь не найден', 404)
    }

    formatSuccess(response, account, '200')
})

usersRouter.post('/:id/profile', requireAuth, upload.single('avatar'), async (request, response) => {
    const input = createProfileInputSchema.parse({
        params: request.params,
        headers: request.headers,
        body: request.body,
    })

    if (input.params.id !== request.user!.id) {
        throw new HttpError('Недостаточно прав', 403)
    }

    const accountId = await accountsRepository.getId(input.params.id)

    if (!accountId) {
        throw new HttpError('Пользователь не найден', 404)
    }

    // input.body.avatar
    const avatarUrl = request.file ? `/static/${request.file.filename}` : undefined

    const profile = await accountsRepository.saveProfile(
        accountId,
        input.body.bio,
        avatarUrl,
    )

    formatSuccess(response, profile, '200')
})