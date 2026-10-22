import * as z from 'zod'
import { positiveIdSchema, paginationSchema, metaSchema } from './common.schema.js'

export const accountSchema = z.object({
    id: z.number().positive().int(),
    email: z.email(),
    password: z.string().min(8),
    role: z.literal(['user', 'moderator'])
})

export const getAccountSchema = accountSchema.omit({
    password: true,
})

export const roleSchema = z.enum(['user', 'moderator'])

export const profileSchema = z.object({
    id: z.number().int().positive(),
    bio: z.string().min(3),
    avatar: z.string().nullable(),
})

export const createAccountInputSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(8).max(128),
    }),
})

export const getManyAccountsInputSchema = z.object({ query: paginationSchema })

export const authorizationSchema = z.string().regex(/^Bearer\s+.+$/i, 'Ожидается Bearer access token')

export const createProfileInputSchema = z.object({
    params: z.object({ id: positiveIdSchema }),
    headers: z.object({ authorization: authorizationSchema }),
    body: z.object({
        bio: z.string().trim().min(3).max(500),
        avatar: z.preprocess(value => value === '' || value === null ? undefined : value, z.url().optional()),
    }),
})

export const accountsWithMetaSchema = z.object({
    data: z.array(accountSchema.extend({ profile: profileSchema.nullable() })),
    meta: metaSchema,
})

export const registerInputSchema = createAccountInputSchema

export const loginInputSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(1).max(128),
    }),
})