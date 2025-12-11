import { z } from 'zod'
import { BANK_OPTIONS } from '../constants/value'

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

const validBankNames = BANK_OPTIONS.map((bank) => bank.value as string)

export const registerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    bankName: z.enum(validBankNames as [string, ...string[]], { message: 'Please select a valid bank' }),
    bankAccount: z.string().min(1, 'Bank account number is required'),
})

export const createTransactionSchema = z.object({
    merchantId: z.string().uuid(),
    amountIDR: z.number().min(10000),
})