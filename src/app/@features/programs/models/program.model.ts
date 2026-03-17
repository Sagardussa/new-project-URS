export interface ProgramRules {
  id?: number;
  uuid?: string;
  programId?: number;
  attributionWindowDays: number;
  maxReferralsPerUser: number;
  cooldownPeriodDays: number | null;
  allowSelfReferral: boolean;
  requireUniqueEmail: boolean;
  requireUniqueDevice: boolean;
  customRules: Record<string, unknown>;
}

export interface ProgramReward {
  id?: number;
  uuid?: string;
  programId?: number;
  stageNumber: number;
  stageName: string;
  recipientType: string;
  triggerEvent: string;
  rewardType: string;
  rewardValue: string; // API returns string, not number
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Program {
  id: number;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  slug: string;
  referrerType: string;
  refereeType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  programRules?: ProgramRules; // API uses programRules, not rules
  programRewards?: ProgramReward[]; // API uses programRewards, not rewards
}

export interface CreateProgramPayload {
  name: string;
  description: string;
  slug: string;
  referrerType: string;
  refereeType: string;
  rules: ProgramRules;
  rewards: ProgramReward[];
}

export const REFERRER_TYPES = [
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Freelancer', value: 'FREELANCER' },
] as const;

export const REFEREE_TYPES = [
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Freelancer', value: 'FREELANCER' },
] as const;

export const PROGRAM_STATUSES = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
] as const;

export const RECIPIENT_TYPES = [
  { label: 'REFERRER', value: 'REFERRER' },
  // { label: 'Referee', value: 'REFEREE' },
] as const;

export const REWARD_TYPES = [
  { label: 'POINTS', value: 'POINTS' },
  // { label: 'Badge', value: 'BADGE' },
  // { label: 'Unlock', value: 'UNLOCK' },
  // { label: 'Discount', value: 'DISCOUNT' },
] as const;