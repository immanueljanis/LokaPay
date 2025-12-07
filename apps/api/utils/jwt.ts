import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'lokapay-secret-key-change-in-production'
)
const JWT_ALGORITHM = 'HS256'

export async function generateToken(payload: { merchantId: string; email: string }): Promise<string> {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(JWT_SECRET)

    return token
}

export async function verifyToken(token: string): Promise<{ merchantId: string; email: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET, {
            algorithms: [JWT_ALGORITHM],
        })

        return {
            merchantId: payload.merchantId as string,
            email: payload.email as string,
        }
    } catch (error) {
        return null
    }
}

