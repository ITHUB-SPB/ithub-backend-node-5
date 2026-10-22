import * as z from 'zod'
import { prisma } from '../prisma.js'

import { AccountsRepository } from "./abstract.js";

import { getAccountSchema, createAccountInputSchema } from '../schemas/accounts.schema.js';

class AccountsRepositorySqlite extends AccountsRepository<false> {
    protected readonly name = 'accounts'

    async add(record: z.input<typeof createAccountInputSchema>['body']): Promise<z.output<typeof getAccountSchema>> {
        const { email, password } = record

        return prisma.account.create({
            data: { email, password },
            select: {
                id: true,
                email: true,
                role: true,
            },
        })
    }

    async getByEmail(email: string) {
        return prisma.account.findUnique({
            where: { email },
        })
    }

    async getOne(id: number) {
        return prisma.account.findUniqueOrThrow({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        id: true,
                        bio: true,
                        avatar: true,
                    },
                },
                products: true,
            },
        })
    }

    async getId(id: number) {
        const account = await prisma.account.findUnique({
            where: { id },
            select: { id: true },
        })

        return account?.id ?? null
    }

    async saveProfile(id: number, bio: string, avatar?: string) {
        return prisma.profile.upsert({
            where: { accountId: id },
            create: {
                bio,
                ...(avatar !== undefined ? { avatar } : {}),
                accountId: id,
            },
            update: {
                bio,
                ...(avatar !== undefined ? { avatar } : {}),
            },
        })
    }

    async delete() {
        throw new Error('Not implemented')
    }

    async getAll() {
        throw new Error('Not implemented')
    }
}


export const accountsRepository = new AccountsRepositorySqlite()