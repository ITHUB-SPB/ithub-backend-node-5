import { Router } from 'express'

import {
    createTokens,
    getCookie,
    hashPassword,
    requireAuth,
    verifyPassword,
    verifyRefreshToken,
} from '../auth.js'
import { formatSuccess } from '../middleware/format-result.js'
import { accountsRepository } from '../repository/accounts.repository.js'
import { loginInputSchema, registerInputSchema } from '../schemas/auth.schema.js'
import { emailQueue } from '../queue.js'
import { HttpError } from '../types.js'

const refreshCookieOptions = {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
}

export const authRouter = Router()

authRouter.post('/register', async (request, response) => {
    const { body } = registerInputSchema.parse(request)
    const password = await hashPassword(body.password)

    const account = await accountsRepository.add({ email: body.email, password })

    emailQueue.add('welcome-email', account)

    formatSuccess(response, {
        id: account.id,
        email: account.email,
        role: account.role,
    }, '201')
})

authRouter.post('/login', async (request, response) => {
    const { body } = loginInputSchema.parse({ body: request.body })
    const account = await accountsRepository.getByEmail(body.email)

    if (!account || !await verifyPassword(body.password, account.password)) {
        throw new HttpError('Неверный email или пароль', 401)
    }

    const tokens = createTokens(account)

    response.cookie('refresh-token', tokens.refreshToken, refreshCookieOptions)
    formatSuccess(response, { accessToken: tokens.accessToken }, '200')
})

authRouter.post('/refresh', (request, response) => {
    const refreshToken = getCookie(request, 'refresh-token')

    if (!refreshToken) {
        throw new HttpError('Refresh token не найден', 401)
    }

    const tokenUser = verifyRefreshToken(refreshToken)
    const tokens = createTokens(tokenUser)

    response.cookie('refresh-token', tokens.refreshToken, refreshCookieOptions)
    formatSuccess(response, { accessToken: tokens.accessToken }, '200')
})

authRouter.post('/logout', requireAuth, (_request, response) => {
    response.clearCookie('refresh-token', {
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth',
    })

    formatSuccess(response, {}, '200')
})