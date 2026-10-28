import * as z from 'zod'
import { authorizationSchema, metaSchema, paginationSchema, positiveIdSchema, trimmedEmailSchema } from './common.schema.js'

export const categorySchema = z.enum(['electronics', 'clothing', 'food', 'other'])

const optionalText = (max: number) => z.preprocess(
    value => value === '' || value === null ? undefined : value,
    z.string().trim().max(max).optional(),
)

export const productFieldsSchema = z.object({
    name: z.string().trim().min(2).max(100),
    price: z.coerce.number().positive(),
    category: categorySchema,
    description: optionalText(500),
})

export const createProductInputSchema = z.object({
    headers: z.object({ authorization: authorizationSchema }),
    body: productFieldsSchema,
})

export const updateProductInputSchema = z.object({
    params: z.object({ id: positiveIdSchema }),
    headers: z.object({ authorization: authorizationSchema }),
    body: productFieldsSchema.partial(),
})

export const getManyProductsInputSchema = paginationSchema.extend({
    category: categorySchema.optional(),
    creator: trimmedEmailSchema.optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
}).refine(query => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice, {
    message: 'minPrice не может быть больше maxPrice',
    path: ['minPrice'],
})

export type GetManyProductsQuery = z.output<typeof getManyProductsInputSchema>
export type CreateProductBody = z.output<typeof createProductInputSchema>['body']
export type UpdateProductBody = z.output<typeof updateProductInputSchema>['body']

export const productSchema = z.object({
    id: z.number().int().positive(),
    accountId: z.number().int().positive(),
    name: z.string(),
    price: z.number().positive(),
    category: categorySchema,
    description: z.string().nullable(),
    imageUrl: z.string().nullable(),
    archived: z.boolean(),
    createdAt: z.date(),
    email: z.email(),
})

export const productDetailsSchema = productSchema.extend({
    profile: z.object({
        bio: z.string(),
        avatar: z.string().nullable(),
    }).nullable(),
})

export const getProductsWithMetaOutputSchema = z.object({
    data: z.array(productSchema),
    meta: metaSchema,
})
