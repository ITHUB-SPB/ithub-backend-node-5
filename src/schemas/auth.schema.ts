import * as z from 'zod'
import { createAccountInputSchema } from './accounts.schema.js'


export const authorizationSchema = z.string().regex(/^Bearer\s+.+$/i, 'Ожидается Bearer access token')

export const registerInputSchema = createAccountInputSchema

export const loginInputSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(1).max(128),
    }),
})