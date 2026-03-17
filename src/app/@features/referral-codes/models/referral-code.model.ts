/**
 * Referral Code model interfaces.
 */
export interface ReferralCode {
  id?: number;
  uuid: string;
  createdAt?: string;
  updatedAt?: string;
  programId?: number;
  userId?: string;
  userType?: string;
  code: string;
  isCustom?: boolean;
  usageCount?: number;
  maxUses?: number | null;
  status?: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null; 
}

export interface ReferralCodeListResponse {
  statusCode: number;
  status: boolean;
  message: string;
  data: ReferralCodeItems;
  timestamp?: string;
  path?: string;
}

export interface ReferralCodeItems {
  record: ReferralCode[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
