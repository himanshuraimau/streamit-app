export type ApplicationStep = 'welcome' | 'identity' | 'financial' | 'profile' | 'review';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'draft';

export type IDType = 'aadhaar' | 'passport' | 'drivers-license';

export type ContentCategory = 
  | 'education'
  | 'entertainment'
  | 'lifestyle'
  | 'gaming'
  | 'music'
  | 'sports'
  | 'technology'
  | 'cooking'
  | 'art'
  | 'fitness';

export interface IdentityData {
  idType: IDType;
  idDocument: File | null;
  selfiePhoto: File | null;
}

export interface FinancialData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
}

export interface ProfileData {
  profilePicture: File | null;
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
