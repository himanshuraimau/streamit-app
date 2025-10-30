export type ApplicationStep = 'welcome' | 'identity' | 'financial' | 'profile' | 'review';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'draft';

export type IDType = 'AADHAAR' | 'PASSPORT' | 'DRIVERS_LICENSE';

export type ContentCategory = 
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'LIFESTYLE'
  | 'GAMING'
  | 'MUSIC'
  | 'SPORTS'
  | 'TECHNOLOGY'
  | 'COOKING'
  | 'ART'
  | 'FITNESS';

export interface IdentityData {
  idType: IDType;
  idDocument: string | null; // Now stores URL instead of File
  selfiePhoto: string | null; // Now stores URL instead of File
}

export interface FinancialData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
}

export interface ProfileData {
  profilePicture: string | null; // Now stores URL instead of File
  categories: ContentCategory[];
  bio: string;
}

export interface CreatorApplicationData {
  identity: IdentityData;
  financial: FinancialData;
  profile: ProfileData;
  status: ApplicationStatus;
  submittedAt?: string;
}
