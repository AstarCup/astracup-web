-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('open', 'full', 'closed');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchupStatus" AS ENUM ('available', 'scheduled', 'completed');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('match_invitation', 'system_notification', 'admin_message');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('unread', 'read', 'archived');

-- CreateEnum
CREATE TYPE "UserGroup" AS ENUM ('player', 'admin');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('not_registered', 'registered', 'approved');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('referee', 'commentator', 'streamer');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "osuId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL,
    "avatar_url" TEXT,
    "pp" DOUBLE PRECISION,
    "global_rank" INTEGER,
    "country_rank" INTEGER,
    "country" TEXT NOT NULL,
    "userGroup" "UserGroup" NOT NULL DEFAULT 'player',
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'not_registered',
    "season" TEXT,
    "accuracy" DOUBLE PRECISION,
    "stamina" DOUBLE PRECISION,
    "firstSight" DOUBLE PRECISION,
    "strategy" DOUBLE PRECISION,
    "experience" DOUBLE PRECISION,
    "customKey" TEXT,
    "customValue" DOUBLE PRECISION,
    "cover_custom_url" TEXT,
    "cover_url" TEXT,
    "cover_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRoom" (
    "id" SERIAL NOT NULL,
    "room_name" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "match_time" TIMESTAMP(3) NOT NULL,
    "match_number" INTEGER NOT NULL,
    "max_participants" INTEGER NOT NULL DEFAULT 2,
    "status" "RoomStatus" NOT NULL DEFAULT 'open',
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSchedule" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "player1_osuId" TEXT NOT NULL,
    "player1_username" TEXT NOT NULL,
    "player2_osuId" TEXT NOT NULL,
    "player2_username" TEXT NOT NULL,
    "red_score" INTEGER NOT NULL DEFAULT 0,
    "blue_score" INTEGER NOT NULL DEFAULT 0,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'pending',
    "replay_link" TEXT,
    "match_link" TEXT,
    "stream_link" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerMatchup" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER,
    "player1_osuId" TEXT NOT NULL,
    "player1_username" TEXT NOT NULL,
    "player2_osuId" TEXT NOT NULL,
    "player2_username" TEXT NOT NULL,
    "status" "MatchupStatus" NOT NULL DEFAULT 'available',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerMatchup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "sender_osuId" TEXT NOT NULL,
    "sender_username" TEXT NOT NULL,
    "receiver_osuId" TEXT NOT NULL,
    "receiver_username" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "related_matchup_id" INTEGER,
    "status" "MessageStatus" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRoomAssignment" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "staff_osuId" TEXT NOT NULL,
    "staff_username" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRoomAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchScore" (
    "id" SERIAL NOT NULL,
    "schedule_id" INTEGER NOT NULL,
    "player_osuId" TEXT NOT NULL,
    "player_username" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentSetting" (
    "id" SERIAL NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapSelection" (
    "id" SERIAL NOT NULL,
    "beatmapId" INTEGER NOT NULL,
    "beatmapsetId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "title_unicode" TEXT,
    "artist" TEXT NOT NULL,
    "artist_unicode" TEXT,
    "version" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "starRating" DOUBLE PRECISION NOT NULL,
    "bpm" DOUBLE PRECISION NOT NULL,
    "totalLength" INTEGER NOT NULL,
    "maxCombo" INTEGER NOT NULL,
    "ar" DOUBLE PRECISION NOT NULL,
    "cs" DOUBLE PRECISION NOT NULL,
    "od" DOUBLE PRECISION NOT NULL,
    "hp" DOUBLE PRECISION NOT NULL,
    "selectedMods" TEXT,
    "modPosition" INTEGER,
    "comment" TEXT,
    "selectedBy" TEXT NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "season" TEXT,
    "category" TEXT,
    "url" TEXT,
    "coverUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "padding" BOOLEAN NOT NULL DEFAULT false,
    "isCustome" BOOLEAN NOT NULL DEFAULT false,
    "isOrigin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCookie" (
    "id" TEXT NOT NULL,
    "osuId" TEXT NOT NULL,
    "cookieHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionCookie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_osuId_idx" ON "User"("osuId");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_userGroup_idx" ON "User"("userGroup");

-- CreateIndex
CREATE INDEX "User_registrationStatus_idx" ON "User"("registrationStatus");

-- CreateIndex
CREATE INDEX "User_season_idx" ON "User"("season");

-- CreateIndex
CREATE INDEX "MatchRoom_round_number_idx" ON "MatchRoom"("round_number");

-- CreateIndex
CREATE INDEX "MatchRoom_match_date_idx" ON "MatchRoom"("match_date");

-- CreateIndex
CREATE INDEX "MatchRoom_status_idx" ON "MatchRoom"("status");

-- CreateIndex
CREATE INDEX "MatchRoom_created_by_idx" ON "MatchRoom"("created_by");

-- CreateIndex
CREATE INDEX "MatchSchedule_room_id_idx" ON "MatchSchedule"("room_id");

-- CreateIndex
CREATE INDEX "MatchSchedule_player1_osuId_idx" ON "MatchSchedule"("player1_osuId");

-- CreateIndex
CREATE INDEX "MatchSchedule_player2_osuId_idx" ON "MatchSchedule"("player2_osuId");

-- CreateIndex
CREATE INDEX "MatchSchedule_status_idx" ON "MatchSchedule"("status");

-- CreateIndex
CREATE INDEX "MatchSchedule_created_by_idx" ON "MatchSchedule"("created_by");

-- CreateIndex
CREATE INDEX "PlayerMatchup_room_id_idx" ON "PlayerMatchup"("room_id");

-- CreateIndex
CREATE INDEX "PlayerMatchup_player1_osuId_idx" ON "PlayerMatchup"("player1_osuId");

-- CreateIndex
CREATE INDEX "PlayerMatchup_player2_osuId_idx" ON "PlayerMatchup"("player2_osuId");

-- CreateIndex
CREATE INDEX "PlayerMatchup_status_idx" ON "PlayerMatchup"("status");

-- CreateIndex
CREATE INDEX "PlayerMatchup_created_by_idx" ON "PlayerMatchup"("created_by");

-- CreateIndex
CREATE INDEX "Message_sender_osuId_idx" ON "Message"("sender_osuId");

-- CreateIndex
CREATE INDEX "Message_receiver_osuId_idx" ON "Message"("receiver_osuId");

-- CreateIndex
CREATE INDEX "Message_type_idx" ON "Message"("type");

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");

-- CreateIndex
CREATE INDEX "Message_related_matchup_id_idx" ON "Message"("related_matchup_id");

-- CreateIndex
CREATE INDEX "StaffRoomAssignment_room_id_idx" ON "StaffRoomAssignment"("room_id");

-- CreateIndex
CREATE INDEX "StaffRoomAssignment_staff_osuId_idx" ON "StaffRoomAssignment"("staff_osuId");

-- CreateIndex
CREATE INDEX "StaffRoomAssignment_role_idx" ON "StaffRoomAssignment"("role");

-- CreateIndex
CREATE INDEX "MatchScore_schedule_id_idx" ON "MatchScore"("schedule_id");

-- CreateIndex
CREATE INDEX "MatchScore_player_osuId_idx" ON "MatchScore"("player_osuId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSetting_setting_key_key" ON "TournamentSetting"("setting_key");

-- CreateIndex
CREATE INDEX "MapSelection_beatmapId_idx" ON "MapSelection"("beatmapId");

-- CreateIndex
CREATE INDEX "MapSelection_beatmapsetId_idx" ON "MapSelection"("beatmapsetId");

-- CreateIndex
CREATE INDEX "MapSelection_selectedBy_idx" ON "MapSelection"("selectedBy");

-- CreateIndex
CREATE INDEX "MapSelection_season_idx" ON "MapSelection"("season");

-- CreateIndex
CREATE INDEX "MapSelection_category_idx" ON "MapSelection"("category");

-- CreateIndex
CREATE INDEX "MapSelection_approved_idx" ON "MapSelection"("approved");

-- CreateIndex
CREATE UNIQUE INDEX "SessionCookie_cookieHash_key" ON "SessionCookie"("cookieHash");

-- CreateIndex
CREATE INDEX "SessionCookie_osuId_idx" ON "SessionCookie"("osuId");

-- CreateIndex
CREATE INDEX "SessionCookie_cookieHash_idx" ON "SessionCookie"("cookieHash");

-- CreateIndex
CREATE INDEX "SessionCookie_expiresAt_idx" ON "SessionCookie"("expiresAt");

-- AddForeignKey
ALTER TABLE "MatchSchedule" ADD CONSTRAINT "MatchSchedule_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "MatchRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMatchup" ADD CONSTRAINT "PlayerMatchup_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "MatchRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRoomAssignment" ADD CONSTRAINT "StaffRoomAssignment_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "MatchRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "MatchSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
