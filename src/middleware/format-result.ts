import { type Response } from "express"

type SuccessCode = `2${number}${number}`
type ErrorCode = `${4 | 5}${number}${number}`

export function formatSuccess(
    response: Response,
    data: unknown,
    code: SuccessCode
) {
    response.status(Number(code)).json({
        success: true,
        data
    })
}

export function formatError(
    response: Response,
    message: string,
    code: ErrorCode = "400",
    details: object = {}
) {
    response.status(Number(code)).json({
        success: false,
        error: message,
        details
    })
}