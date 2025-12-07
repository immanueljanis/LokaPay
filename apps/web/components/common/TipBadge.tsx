interface TipBadgeProps {
    tipIdr: string | number
    className?: string
}

export function TipBadge({ tipIdr, className = '' }: TipBadgeProps) {
    const tipAmount = parseFloat(tipIdr.toString())

    if (tipAmount <= 0) {
        return null
    }

    return (
        <span className={`bg-green-500 text-white text-[10px] px-1 py-0.5 rounded-lg font-semibold ${className}`}>
            + Rp.{Math.floor(tipAmount).toLocaleString('id-ID')} (tip)
        </span>
    )
}

