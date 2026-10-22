import type { Request, Response, NextFunction } from 'express'

export default function (request: Request, response: Response, next: NextFunction) {
    const startTime = Date.now()

    const info = {
        url: request.url,
        params: request.params,
        queryParams: request.query ?? {},
        body: request.body ?? {}
    }

    response.on('end', () => {
        const duration = Date.now() - startTime
        console.info(`[${duration.toFixed(3)} ms]: ${info}`)
    })

    next()
}