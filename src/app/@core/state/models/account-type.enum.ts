export enum AccountType {
  ADMIN = "ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  CLIENT = "CLIENT",
  FREELANCER = "FREELANCER",
}

/**
 * Get display label for account type
 */
export function getAccountTypeLabel(accountType: string | undefined | null): string {
  if (!accountType) return 'N/A';
  
  switch (accountType.toUpperCase()) {
    case AccountType.ADMIN:
      return 'Referral';
    case AccountType.SUB_ADMIN:
      return 'Sub Admin';
    case AccountType.CLIENT:
      return 'Client';
    case AccountType.FREELANCER:
      return 'Freelancer';
    default:
      return accountType;
  }
}

