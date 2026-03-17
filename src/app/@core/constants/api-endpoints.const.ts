/**
 * API endpoint constants - single source for backend paths
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    VALIDATE_EMAIL: '/auth/validate-email',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    ME: '/auth/me',
    PERMISSIONS: '/auth/permissions',
    CSRF_TOKEN: '/auth/csrf-token',
  },
  REFERRALS: {
    BASE: '/referrals',
    /** GET /referrals/admin/stats/{referralCode} - totalReferralCount, totalRewardPointsSum */
    ADMIN_STATS: (referralCode: string) => `/referrals/admin/stats/${encodeURIComponent(referralCode)}`,
  },
  REFERRAL_CODES: {
    BASE: '/referral-codes',
    BY_UUID: (uuid: string) => `/referral-codes/${uuid}`,
  },
  EVENTS: {
    BASE: '/events',
    DROPDOWN: '/events/dropdown',
    BY_UUID: (uuid: string) => `/events/${uuid}`,
    STATUS: (uuid: string) => `/events/${uuid}/status`,
  },
  PROGRAMS: {
    BASE: '/programs',
    BY_UUID: (uuid: string) => `/programs/${uuid}`,
  },
  SETTINGS: {
    BASE: '/settings',
    BY_ID: (id: string) => `/settings/${id}`,
  },
  REWARDS: {
    BASE: '/rewards',
  },
  POINT_WALLETS: {
    BALANCES: '/point-wallets/balances',
    TRANSACTIONS: '/point-wallets/transactions',
  },
  IMAGES: {
    URL: (uuid: string) => `/images/${uuid}/url`,
  },
} as const;
