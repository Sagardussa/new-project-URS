/**
 * Settings payload for create/update API.
 */
export interface CreateSettingsPayload {
  pointsToCurrencyRate: number;
  currency: string;
  minimumRedemptionPoints: number;
  pointsExpiryDays: number | null;
  allowNegativeBalance: boolean;
  redemptionProcessingDays: number;
  apiwebhookUrl?: string;
}

/**
 * Settings entity (e.g. from list/get API).
 */
export interface Settings extends CreateSettingsPayload {
  id: string | number;
  uuid?: string;
  settings?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  secretKey?: string;
}

/** Mock settings for list when API returns empty (dev/demo). */
export const MOCK_SETTINGS: Settings[] = [
  {
    id: 'settings-1',
    pointsToCurrencyRate: 100,
    currency: 'USD',
    minimumRedemptionPoints: 1000,
    pointsExpiryDays: null,
    allowNegativeBalance: false,
    redemptionProcessingDays: 3,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'settings-2',
    pointsToCurrencyRate: 150,
    currency: 'EUR',
    minimumRedemptionPoints: 1500,
    pointsExpiryDays: 365,
    allowNegativeBalance: true,
    redemptionProcessingDays: 5,
    createdAt: '2025-01-14T09:30:00Z',
    updatedAt: '2025-01-14T09:30:00Z',
  },
];

