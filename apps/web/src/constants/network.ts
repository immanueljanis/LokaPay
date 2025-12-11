export const MANTLE_CHAIN_ID = 5003
export const MANTLE_USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE' // USDT on Mantle (default fallback)

export function generateEIP681AddressURI(
    recipientAddress: string,
    amountUSDT: number,
    chainId: number = MANTLE_CHAIN_ID
): string {
    const normalized = Number.isFinite(amountUSDT) && amountUSDT > 0 ? amountUSDT : 0
    const amountWei = BigInt(Math.round(normalized * 1e18))
    return `ethereum:${MANTLE_USDT_ADDRESS}@${chainId}/transfer?address=${recipientAddress}&uint256=${amountWei.toString()}`
}