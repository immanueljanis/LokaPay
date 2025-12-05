import { Wallet } from 'ethers'
import { TatumSDK, Network, Ethereum } from '@tatumio/tatum'

const tatum = await TatumSDK.init<Ethereum>(
    {
        network: Network.ETHEREUM,
        apiKey: { v4: process.env.TATUM_API_KEY },
        verbose: true
    }
)

export const getRealExchangeRate = async (): Promise<number | null> => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr')
        const data = await response.json() as { tether: { idr: number } }

        const rate = data.tether.idr
        return parseFloat(rate.toString())
    } catch (error) {
        console.error('Gagal ambil rate', error)
        return null
    }
}

export const generateDepositWallet = async () => {
    const wallet = Wallet.createRandom()

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase
    }
}

export const subscribeToIncomingTxs = async (address: string, webhookUrl: string) => {
    try {
        console.log(`📡 Subscribing Tatum to: ${address}`)
        const subscription = await tatum.notification.subscribe.addressEvent({
            url: webhookUrl,
            address: address,
        })
        console.log('✅ Subscribed ID:', subscription.data.id)
        return subscription.data.id
    } catch (error) {
        console.error('❌ Gagal subscribe webhook:', error)
        return null
    }
}