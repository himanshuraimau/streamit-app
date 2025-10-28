-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IDType" AS ENUM ('AADHAAR', 'PASSPORT', 'DRIVERS_LICENSE');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('EDUCATION', 'ENTERTAINMENT', 'LIFESTYLE', 'GAMING', 'MUSIC', 'SPORTS', 'TECHNOLOGY', 'COOKING', 'ART', 'FITNESS');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('ID_DOCUMENT', 'SELFIE_PHOTO', 'PROFILE_PICTURE', 'OTHER');

-- CreateTable
CREATE TABLE "creator_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_verification" (
    "id" TEXT NOT NULL,
    "creatorApplicationId" TEXT NOT NULL,
    "idType" "IDType" NOT NULL,
    "idDocumentUrl" TEXT NOT NULL,
    "selfiePhotoUrl" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identity_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_details" (
    "id" TEXT NOT NULL,
    "creatorApplicationId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_profile" (
    "id" TEXT NOT NULL,
    "creatorApplicationId" TEXT NOT NULL,
    "profilePictureUrl" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "categories" "ContentCategory"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "purpose" "FilePurpose" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_upload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_application_userId_key" ON "creator_application"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "identity_verification_creatorApplicationId_key" ON "identity_verification"("creatorApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "financial_details_creatorApplicationId_key" ON "financial_details"("creatorApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_profile_creatorApplicationId_key" ON "creator_profile"("creatorApplicationId");

-- AddForeignKey
ALTER TABLE "creator_application" ADD CONSTRAINT "creator_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_verification" ADD CONSTRAINT "identity_verification_creatorApplicationId_fkey" FOREIGN KEY ("creatorApplicationId") REFERENCES "creator_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_details" ADD CONSTRAINT "financial_details_creatorApplicationId_fkey" FOREIGN KEY ("creatorApplicationId") REFERENCES "creator_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_profile" ADD CONSTRAINT "creator_profile_creatorApplicationId_fkey" FOREIGN KEY ("creatorApplicationId") REFERENCES "creator_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
