import { Hono } from 'hono'

export type Variables = {
    merchant: { merchantId: string; email: string; role?: string }
}

export type AppInstance = Hono<{ Variables: Variables }>

