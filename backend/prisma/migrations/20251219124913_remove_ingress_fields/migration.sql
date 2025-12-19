/*
  Warnings:

  - You are about to drop the column `ingressId` on the `stream` table. All the data in the column will be lost.
  - You are about to drop the column `serverUrl` on the `stream` table. All the data in the column will be lost.
  - You are about to drop the column `streamKey` on the `stream` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."stream_ingressId_idx";

-- DropIndex
DROP INDEX "public"."stream_ingressId_key";

-- AlterTable
ALTER TABLE "stream" DROP COLUMN "ingressId",
DROP COLUMN "serverUrl",
DROP COLUMN "streamKey";
