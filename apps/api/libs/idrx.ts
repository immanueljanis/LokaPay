import crypto from 'crypto';

const IDRX_API_KEY = process.env.IDRX_API_KEY || '';
const IDRX_SECRET_KEY = process.env.IDRX_SECRET_KEY || '';
const IDRX_BASE_URL = process.env.IDRX_BASE_URL || 'https://idrx.co/api';

const generateIDRXSignature = (timestamp: string, path: string) => {
    const message = `${timestamp}GET${path}`;
    return crypto
        .createHmac('sha256', IDRX_SECRET_KEY)
        .update(message)
        .digest('hex');
};

interface IDRXRateResponse {
    statusCode: number;
    message: string;
    data: {
        price: string;
        buyAmount: string;
        chainId: number;
    };
}

export const getIDRXRate = async (usdcAmount: number = 1) => {
    try {
        const timestamp = Date.now().toString();
        const path = `/transaction/rates?usdtAmount=${usdcAmount}`;
        const signature = generateIDRXSignature(timestamp, path);

        const response = await fetch(`${IDRX_BASE_URL}${path}`, {
            method: 'GET',
            headers: {
                'idrx-api-key': IDRX_API_KEY,
                'idrx-api-sig': signature,
                'idrx-api-ts': timestamp,
            },
        });

        const result = await response.json() as IDRXRateResponse;
        if (result.statusCode === 200 && result.data) {
            const pricePerIDR = parseFloat(result.data.price);
            return 1 / pricePerIDR;
        }

        console.error('IDRX API Error:', result.message);
        return null;
    } catch (error) {
        console.error('IDRX Fetch Failed:', error);
        return null;
    }
};