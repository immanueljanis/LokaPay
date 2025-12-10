import { z } from 'zod'
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

export const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
})

export const createTransactionSchema = z.object({
    merchantId: z.string().uuid(),
    amountIDR: z.number().min(10000),
})