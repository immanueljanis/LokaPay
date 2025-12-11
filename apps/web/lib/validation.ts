import { z } from 'zod'
import { BANK_OPTIONS } from '../src/constants/value'

const validBankNames = BANK_OPTIONS.map(bank => bank.value)

export const registerSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    bankName: z.string().min(1, 'Please select a bank').refine(
        (val) => validBankNames.includes(val),
        { message: 'Please select a valid bank' }
    ),
    bankAccount: z.string().min(1, 'Bank account number is required'),
})

export type RegisterFormData = z.infer<typeof registerSchema>

