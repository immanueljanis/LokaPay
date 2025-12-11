'use client'

import React from 'react'

type Column<T> = {
    key: keyof T | string
    header: string
    render?: (row: T) => React.ReactNode
    className?: string
}

interface SimpleTableProps<T> {
    columns: Column<T>[]
    data: T[]
    emptyText?: string
}

export function SimpleTable<T extends { id: string | number }>({ columns, data, emptyText = 'No data' }: SimpleTableProps<T>) {
    return (
        <div className="overflow-x-auto bg-card border border-border rounded-lg">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key as string} className={`px-4 py-3 ${col.className || ''}`}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-6 text-center text-muted-foreground">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr key={row.id as string} className="border-b last:border-0">
                                {columns.map((col) => (
                                    <td key={col.key as string} className={`px-4 py-3 ${col.className || ''}`}>
                                        {col.render ? col.render(row) : (row as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}

