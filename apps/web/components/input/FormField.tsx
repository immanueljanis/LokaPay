import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

interface FormFieldProps {
    label: string
    required?: boolean
    error?: string
    className?: string
    children: React.ReactNode
}

export function FormField({
    label,
    required = false,
    error,
    className,
    children
}: FormFieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <Label className="text-sm font-medium text-card-foreground">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
                {!required && <span className="text-muted-foreground ml-1 text-xs">(optional)</span>}
            </Label>
            {children}
            {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
            )}
        </div>
    )
}

interface FormInputProps extends React.ComponentProps<"input"> {
    error?: string
    label?: string
    required?: boolean
}

export function FormInput({
    error,
    label,
    required = false,
    className,
    ...props
}: FormInputProps) {
    if (label) {
        return (
            <FormField label={label} required={required} error={error}>
                <Input
                    className={cn(
                        "w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50",
                        error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                        className
                    )}
                    aria-invalid={error ? "true" : undefined}
                    {...props}
                />
            </FormField>
        )
    }

    return (
        <Input
            className={cn(
                "w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50",
                error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                className
            )}
            aria-invalid={error ? "true" : undefined}
            {...props}
        />
    )
}

interface FormSelectProps extends React.ComponentProps<"select"> {
    error?: string
    label?: string
    required?: boolean
    options: Array<{ value: string; label: string }>
    placeholder?: string
}

export function FormSelect({
    error,
    label,
    required = false,
    options,
    placeholder,
    className,
    ...props
}: FormSelectProps) {
    const selectElement = (
        <select
            className={cn(
                "w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-background/50 backdrop-blur-sm text-foreground hover:border-primary/50",
                error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                className
            )}
            aria-invalid={error ? "true" : undefined}
            {...props}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )

    if (label) {
        return (
            <FormField label={label} required={required} error={error}>
                {selectElement}
            </FormField>
        )
    }

    return selectElement
}

