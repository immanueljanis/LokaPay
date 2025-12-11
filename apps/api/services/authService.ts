import { generateToken } from '../utils/jwt'
import { merchantRepository } from '../repositories/merchantRepository'

export const authService = {
    register: async (data: { name: string; email: string; password: string; bankName?: string; bankAccount?: string }) => {
        const existingUser = await merchantRepository.findByEmail(data.email)
        if (existingUser) {
            return { error: 'Email already registered' }
        }

        const passwordHash = await Bun.password.hash(data.password)

        const newMerchant = await merchantRepository.create({
            name: data.name,
            email: data.email,
            passwordHash,
            bankName: data.bankName,
            bankAccount: data.bankAccount,
        })

        return {
            merchant: {
                id: newMerchant.id,
                name: newMerchant.name,
                email: newMerchant.email,
            },
        }
    },

    login: async (data: { email: string; password: string }) => {
        const merchant = await merchantRepository.findByEmail(data.email)
        if (!merchant) {
            return { error: 'Email atau password salah' }
        }

        const isMatch = await Bun.password.verify(data.password, merchant.passwordHash)
        if (!isMatch) {
            return { error: 'Email atau password salah' }
        }

        const token = await generateToken({
            merchantId: merchant.id,
            email: merchant.email,
        })

        return {
            merchant: {
                id: merchant.id,
                name: merchant.name,
                email: merchant.email,
                balanceIDR: merchant.balanceIDR,
            },
            token,
        }
    },
}

