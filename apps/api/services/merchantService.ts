import { merchantRepository } from '../repositories/merchantRepository'

export const merchantService = {
    getMe: async (merchantId: string) => {
        return merchantRepository.findByIdSelect(merchantId)
    },

    getDashboard: async (id: string) => {
        return merchantRepository.findByIdWithTransactions(id)
    },
}

