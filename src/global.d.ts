import type { JwtPayload } from 'jsonwebtoken'

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL?: string
            ACCESS_TOKEN_SECRET?: string
            REFRESH_TOKEN_SECRET?: string
            DEBUG?: string
            CORS_ORIGIN?: string

            EMAIL_USERNAME?: string
            EMAIL_PASSWORD?: string
            EMAIL_HOST?: string
            EMAIL_PORT?: number
        }
    }

    namespace Express {
        interface Request {
            user?: JwtPayload & { id: number, role: 'user' | 'moderator', email: string }
        }
    }
}

export { }