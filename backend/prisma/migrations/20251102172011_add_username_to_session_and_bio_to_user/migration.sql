-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'AVATAR';

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bio" TEXT;
