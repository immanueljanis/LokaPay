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