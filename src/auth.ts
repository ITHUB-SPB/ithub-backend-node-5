import 'dotenv/config'
import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import { HttpError } from './types.js'

const scrypt = promisify(scryptCallback)

function requiredEnvironment(name: 'ACCESS_TOKEN_SECRET' | 'REFRESH_TOKEN_SECRET'): string {
    const value = process.env[name]

    if (!value) throw new Error('ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET должны быть указаны в .env')
    return value

}

export const accessSecret = requiredEnvironment('ACCESS_TOKEN_SECRET')
export const refreshSecret = requiredEnvironment('REFRESH_TOKEN_SECRET')

export type TokenUser = { id: number, email: string, role: 'user' | 'moderator' }

export async function hashPassword(password: string): Promise<string> {

    const salt = randomBytes(16).toString('hex')
    const hash = await scrypt(password, salt, 64) as Buffer

    return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
    const [salt, storedHash] = storedValue.split(':')

    if (!salt || !storedHash) return false

    const actualHash = await scrypt(password, salt, 64) as Buffer
    const expectedHash = Buffer.from(storedHash, 'hex')

    return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash)
}

export function createTokens(user: TokenUser): { accessToken: string, refreshToken: string } {
    const payload = { id: user.id, email: user.email, role: user.role }

    return {
        accessToken: jwt.sign(payload, accessSecret, { expiresIn: '15m' }),
        refreshToken: jwt.sign(payload, refreshSecret, { expiresIn: '7d' }),
    }
    
}

export function verifyRefreshToken(token: string): TokenUser {
    try {
        return jwt.verify(token, refreshSecret) as unknown as TokenUser
    } catch {
        throw new HttpError('Недействительный refresh token', 401)
    }
}

export const requireAuth: RequestHandler = (request, _response, next) => {
    const token = request.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return next(new HttpError('Требуется авторизация', 401))
    try {
        request.user = jwt.verify(token, accessSecret) as JwtPayload & TokenUser
        next()
    } catch {
        next(new HttpError('Недействительный access token', 401))
    }
}

export const requireModerator: RequestHandler = (request, _response, next) => {
    if (request.user?.role !== 'moderator') return next(new HttpError('Недостаточно прав', 403))
    next()
}

export function getCookie(request: import('express').Request, name: string): string | undefined {

    const cookies = request.headers.cookie?.split(';') ?? []
    const cookie = cookies.find(item => item.trim().startsWith(`${name}=`))

    return cookie?.trim().slice(name.length + 1)
}
