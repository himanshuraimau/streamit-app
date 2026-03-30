CREATE TYPE "StreamAudience" AS ENUM ('PUBLIC', 'FOLLOWERS', 'INVITE_ONLY');
CREATE TYPE "StreamCameraFacingMode" AS ENUM ('FRONT', 'BACK');
CREATE TYPE "StreamFilterPreset" AS ENUM ('NONE', 'WARM', 'COOL', 'NOIR', 'POP');
CREATE TYPE "StreamMusicPreset" AS ENUM ('NONE', 'AMBIENT', 'HYPE', 'LOFI', 'ACOUSTIC');

ALTER TABLE "stream"
ADD COLUMN "category" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "audience" "StreamAudience" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "allowGifts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowAds" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowPayPerView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cameraFacingMode" "StreamCameraFacingMode" NOT NULL DEFAULT 'FRONT',
ADD COLUMN "audioOnlyMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "filterPreset" "StreamFilterPreset" NOT NULL DEFAULT 'NONE',
ADD COLUMN "musicPreset" "StreamMusicPreset" NOT NULL DEFAULT 'NONE';
