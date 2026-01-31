import { SPREAD_VALUE } from '../constants/value';
import { getIDRXRate } from '../libs/idrx';

export const pricingService = {
    getRateWithSpread: async (amountIDR: number) => {
        const marketRate = await getIDRXRate();
        if (!marketRate) return null;

        const rawUSD = amountIDR / marketRate;
        const usdWithSpread = rawUSD * (1 + SPREAD_VALUE);

        return {
            marketRate,
            finalUSD: roundUpTo(usdWithSpread, 3),
        };
    },
    calculateIdrFromUsd: async (amountUSD: number) => {
        const marketRate = await getIDRXRate();
        if (!marketRate) return null;

        return {
            amountIDR: amountUSD * marketRate,
            rate: marketRate
        };
    }
};

export const roundUpTo = (num: number, decimalPlaces: number) => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.ceil(num * factor) / factor;
};