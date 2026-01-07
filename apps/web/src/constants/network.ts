export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID)
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as string

export function generateEIP681AddressURI(recipientAddress: string, amountUSDT: number): string {
    const normalized = Number.isFinite(amountUSDT) && amountUSDT > 0 ? amountUSDT : 0
    const amountWei = BigInt(Math.round(normalized * 1e18))
    return `ethereum:${USDT_ADDRESS}@${CHAIN_ID}/transfer?address=${recipientAddress}&uint256=${amountWei.toString()}`
}