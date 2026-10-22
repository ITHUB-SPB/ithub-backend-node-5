import * as z from 'zod'
import type { BaseEntity } from "../types.js";
import { accountSchema, createAccountInputSchema, getAccountSchema } from '../schemas/accounts.schema.js';

type Account = z.output<typeof accountSchema>
type GetAccountOutput = z.output<typeof getAccountSchema>

abstract class BaseRepository<T extends BaseEntity, TSync> {
    abstract getOne(id: T['id']): TSync extends true ? Partial<T> | undefined : Promise<Partial<T> | undefined>;
    abstract add(record: z.output<typeof z.ZodAny>): TSync extends true ? Partial<T> : Promise<Partial<T>>;
    abstract delete(id: T['id']): TSync extends true ? void : Promise<void>;
}

export abstract class AccountsRepository<KSync> extends BaseRepository<Account, KSync> {
    abstract override add(record: z.output<typeof createAccountInputSchema>['body']): KSync extends true ? GetAccountOutput : Promise<GetAccountOutput>;
    abstract override getOne(id: number): KSync extends true ? GetAccountOutput : Promise<GetAccountOutput>
    abstract getByEmail(email: string): Promise<unknown | null>
    abstract getId(id: number): Promise<number | null>
    abstract saveProfile(id: number, bio: string, avatar?: string): Promise<unknown>
}