'use client'

import {
    Popover as ShadcnPopover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface PopoverProps {
    trigger: React.ReactNode
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    className?: string
}

export function Popover({
    trigger,
    children,
    open,
    onOpenChange,
    side = 'bottom',
    align = 'center',
    className,
}: PopoverProps) {
    return (
        <ShadcnPopover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent side={side} align={align} className={className}>
                {children}
            </PopoverContent>
        </ShadcnPopover>
    )
}

