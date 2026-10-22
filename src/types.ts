import type * as z from 'zod'
import { metaSchema } from './schemas/common.schema.js'

export class HttpError extends Error {
    constructor(message: string, public readonly status = 400) {
        super(message)
    }
}

export type ErrorWithCode = Error & {
    code: string
}

export type BaseEntity = {
    id: number;
}

export type DataWithMeta<T> = {
    data: T[]
    meta: z.infer<typeof metaSchema>
}