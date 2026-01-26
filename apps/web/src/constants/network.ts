export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID)
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as string

export function generateEIP681AddressURI(recipientAddress: string, amountUSDC: number): string {
    const normalized = Number.isFinite(amountUSDC) && amountUSDC > 0 ? amountUSDC : 0
    const amountWei = BigInt(Math.round(normalized * 1e18))
    return `ethereum:${USDC_ADDRESS}@${CHAIN_ID}/transfer?address=${recipientAddress}&uint256=${amountWei.toString()}`
}