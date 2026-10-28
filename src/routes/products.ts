import { randomUUID } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { Router, type Request, type Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { os, ORPCError } from '@orpc/server'
import multer from 'multer'
import * as z from 'zod'


import { requireAuth, accessSecret } from '../auth.js'
import { formatSuccess } from '../middleware/format-result.js'
import { productsRepository } from '../repository/products.repository.js'
import { positiveIdSchema } from '../schemas/common.schema.js'
import {
    createProductInputSchema,
    getManyProductsInputSchema,
    getProductsWithMetaOutputSchema,
    updateProductInputSchema,
    productDetailsSchema,
    productFieldsSchema
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

const publicBase = os.$context<{ req: Request, res: Response }>()

const protectedBase = publicBase
    .use(({ next, context }) => {
        const token = context.req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
        if (!token) {
            throw new ORPCError('UNAUTHORIZED', { message: 'Требуется авторизация' })
        }
        try {
            return next({
                context: {
                    user: jwt.verify(token, accessSecret) as JwtPayload
                }
            })
        } catch {
            throw new ORPCError('UNAUTHORIZED', { message: 'Недействительный токен' })
        }
    })


const getManyProducts = publicBase
    .route({
        method: 'GET',
        path: '/api/products',
        summary: 'Список товаров с фильтрацией и пагинацией',
        tags: ['Товары']
    })
    .input(getManyProductsInputSchema)
    .output(getProductsWithMetaOutputSchema)
    .handler(async ({ input }) => {
        return await productsRepository.getAll(input)
    })

const getOneProduct = protectedBase
    .route({
        method: 'GET',
        path: '/api/products/{id}',
        summary: 'Детальная информация о товаре (требует авторизации)',
        tags: ['Товары'],
        spec: (initialSpec) => ({
            ...initialSpec,
            security: [{ bearerAuth: [] }]
        })
    })
    .input(
        z.object({ id: positiveIdSchema })
    )
    .output(productDetailsSchema)
    .handler(async ({ input }) => {
        const product = await productsRepository.getOne(input.id)

        if (!product) {
            throw new ORPCError('NOT_FOUND', { message: 'Товар не найден' })
        }

        return product
    })

const createProduct = protectedBase
    .route({
        method: 'POST',
        path: '/api/products/',
        summary: 'Создание товара (требует авторизации)',
        tags: ['Товары'],
        spec: (initialSpec) => ({
            ...initialSpec,
            security: [{ bearerAuth: [] }]
        })
    })
    .use(async ({ next }) => {
        try {
            upload.single('image')
        } catch (error) {
            if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
                throw new ORPCError('PAYLOAD_TOO_LARGE', { message: 'Размер изображения не должен превышать 2 МБ' })
            }

            if (error instanceof multer.MulterError) {
                throw new ORPCError('UNPROCESSABLE_CONTENT', { message: 'Не удалось загрузить изображение' })
            }
        }

        return next()
    })
    .input(productFieldsSchema)
    .output(productDetailsSchema)
    .handler(async ({ input, context }) => {
        const imageUrl = context.req.file
            ? `/static/${context.req.file.filename}`
            : null

        return await productsRepository.add(
            input,
            context.user!.id,
            imageUrl
        )
    })


export const productsRouterOrpc = {
    products: {
        getManyProducts,
        getOneProduct,
        createProduct
    },
}

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
