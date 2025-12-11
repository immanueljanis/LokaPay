export const BANK_OPTIONS = [
    {
        name: "BCA",
        value: "BCA",
    },
    {
        name: "BRI",
        value: "BRI",
    },
    {
        name: "Mandiri",
        value: "Mandiri",
    },
    {
        name: "BNI",
        value: "BNI",
    }
]

export const MENU_DASHBOARD = {
    merchant: [
        {
            label: 'Dashboard',
            i18nKey: 'dashboard',
            url: '/dashboard',
        },
        {
            label: 'Invoice',
            i18nKey: 'invoice',
            url: '/invoice',
        },
        {
            label: 'Account',
            i18nKey: 'account',
            url: '/account',
        },
    ],
    admin: [
        {
            label: 'Merchants',
            i18nKey: 'merchants',
            url: '/merchants',
        },
        {
            label: 'Transactions',
            i18nKey: 'transactions',
            url: '/transactions',
        },
        {
            label: 'Payouts',
            i18nKey: 'payouts',
            url: '/payouts',
        },
        {
            label: 'Settings',
            i18nKey: 'settings',
            url: '/settings',
        },
    ]
}