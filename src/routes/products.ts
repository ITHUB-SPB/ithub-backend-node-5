import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { Router } from 'express'
import multer from 'multer'

import { requireAuth } from '../auth.js'
import { formatSuccess } from '../middleware/format-result.js'
import { productsRepository } from '../repository/products.repository.js'
import { positiveIdSchema } from '../schemas/common.schema.js'
import {
    createProductInputSchema,
    getManyProductsInputSchema,
    updateProductInputSchema,
} from '../schemas/products.schema.js'
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

export const productsRouter = Router()

productsRouter.get('/', async (request, response) => {
    const { query } = getManyProductsInputSchema.parse({ query: request.query })
    const result = await productsRepository.getAll(query)

    formatSuccess(response, result, '200')
})

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Получить продукт по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID продукта
 *     responses:
 *       200:
 *         description: Данные о продукте
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Продукт не найден
 */
productsRouter.get('/:id', requireAuth, async (request, response) => {
    const id = positiveIdSchema.parse(request.params['id'])
    const product = await productsRepository.getOne(id)

    if (!product) {
        throw new HttpError('Товар не найден', 404)
    }

    formatSuccess(response, product, '200')
})

productsRouter.post('/', requireAuth, upload.single('image'), async (request, response) => {
    const input = createProductInputSchema.parse({
        headers: request.headers,
        body: request.body,
    })

    const imageUrl = request.file ? `/static/${request.file.filename}` : null
    const product = await productsRepository.add(input.body, request.user!.id, imageUrl)

    formatSuccess(response, product, '201')
})

productsRouter.patch('/:id', requireAuth, upload.single('image'), async (request, response) => {
    const input = updateProductInputSchema.parse({
        params: request.params,
        headers: request.headers,
        body: request.body,
    })

    if (Object.keys(input.body).length === 0 && !request.file) {
        throw new HttpError('Передайте хотя бы одно поле для обновления', 422)
    }

    const ownerId = await productsRepository.getOwnerId(input.params.id)

    if (!ownerId) {
        throw new HttpError('Товар не найден', 404)
    }

    if (request.user!.role !== 'moderator' && ownerId !== request.user!.id) {
        throw new HttpError('Недостаточно прав', 403)
    }

    const imageUrl = request.file ? `/static/${request.file.filename}` : undefined
    const product = await productsRepository.update(input.params.id, input.body, imageUrl)

    formatSuccess(response, product, '200')
})

productsRouter.use((
    error: unknown,
    _request: import('express').Request,
    _response: import('express').Response,
    next: import('express').NextFunction,
) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return next(new HttpError('Размер изображения не должен превышать 2 МБ', 422))
    }

    if (error instanceof multer.MulterError) {
        return next(new HttpError('Не удалось загрузить изображение', 422))
    }

    next(error)
})
