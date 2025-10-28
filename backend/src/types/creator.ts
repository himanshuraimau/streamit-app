import { ApplicationStatus, IDType, ContentCategory, FilePurpose } from '@prisma/client';

// Frontend-compatible types
export type ApplicationStep = 'welcome' | 'identity' | 'financial' | 'profile' | 'review';

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

export interface CreateApplicationRequest {
  identity: {
    idType: IDType;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
  };
  financial: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
  };
  profile: {
    profilePictureUrl: string;
    categories: ContentCategory[];
    bio: string;
  };
}

export interface ApplicationResponse {
  id: string;
  userId: string;
  status: ApplicationStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  identity?: {
    id: string;
    idType: IDType;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
    verifiedAt: Date | null;
  };
  financial?: {
    id: string;
    accountHolderName: string;
    accountNumber: string; 
    ifscCode: string;
    panNumber: string;
    isVerified: boolean;
    verifiedAt: Date | null;
  };
  profile?: {
    id: string;
    profilePictureUrl: string;
    bio: string;
    categories: ContentCategory[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Draft saving request
export interface SaveDraftRequest {
  step: 'identity' | 'financial' | 'profile';
  data: any;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface MaskedFinancialData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string; 
}