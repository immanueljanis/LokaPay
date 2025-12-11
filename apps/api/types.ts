import { Hono } from 'hono'

export type Variables = {
    merchant: { merchantId: string; email: string }
}

export type AppInstance = Hono<{ Variables: Variables }>

