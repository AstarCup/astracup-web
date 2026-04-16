-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `osuId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `pp` DOUBLE NULL,
    `global_rank` INTEGER NULL,
    `country` VARCHAR(191) NOT NULL,
    `country_rank` INTEGER NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `userGroup` ENUM('player', 'admin') NOT NULL DEFAULT 'player',
    `registrationStatus` ENUM('not_registered', 'registered', 'approved') NOT NULL DEFAULT 'not_registered',
    `season` VARCHAR(191) NULL,
    `accuracy` DOUBLE NULL,
    `stamina` DOUBLE NULL,
    `firstSight` DOUBLE NULL,
    `strategy` DOUBLE NULL,
    `experience` DOUBLE NULL,
    `customKey` VARCHAR(191) NULL,
    `customValue` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `User_osuId_idx`(`osuId`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_approved_idx`(`approved`),
    INDEX `User_userGroup_idx`(`userGroup`),
    INDEX `User_registrationStatus_idx`(`registrationStatus`),
    INDEX `User_season_idx`(`season`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_name` VARCHAR(191) NOT NULL,
    `round_number` INTEGER NOT NULL,
    `match_date` DATETIME(3) NOT NULL,
    `match_time` DATETIME(3) NOT NULL,
    `match_number` INTEGER NOT NULL,
    `max_participants` INTEGER NOT NULL DEFAULT 2,
    `status` ENUM('open', 'full', 'closed') NOT NULL DEFAULT 'open',
    `description` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `MatchRoom_round_number_idx`(`round_number`),
    INDEX `MatchRoom_match_date_idx`(`match_date`),
    INDEX `MatchRoom_status_idx`(`status`),
    INDEX `MatchRoom_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `player1_osuId` VARCHAR(191) NOT NULL,
    `player1_username` VARCHAR(191) NOT NULL,
    `player2_osuId` VARCHAR(191) NOT NULL,
    `player2_username` VARCHAR(191) NOT NULL,
    `red_score` INTEGER NOT NULL DEFAULT 0,
    `blue_score` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `replay_link` VARCHAR(191) NULL,
    `match_link` VARCHAR(191) NULL,
    `stream_link` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `MatchSchedule_room_id_idx`(`room_id`),
    INDEX `MatchSchedule_player1_osuId_idx`(`player1_osuId`),
    INDEX `MatchSchedule_player2_osuId_idx`(`player2_osuId`),
    INDEX `MatchSchedule_status_idx`(`status`),
    INDEX `MatchSchedule_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayerMatchup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NULL,
    `player1_osuId` VARCHAR(191) NOT NULL,
    `player1_username` VARCHAR(191) NOT NULL,
    `player2_osuId` VARCHAR(191) NOT NULL,
    `player2_username` VARCHAR(191) NOT NULL,
    `status` ENUM('available', 'scheduled', 'completed') NOT NULL DEFAULT 'available',
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `PlayerMatchup_room_id_idx`(`room_id`),
    INDEX `PlayerMatchup_player1_osuId_idx`(`player1_osuId`),
    INDEX `PlayerMatchup_player2_osuId_idx`(`player2_osuId`),
    INDEX `PlayerMatchup_status_idx`(`status`),
    INDEX `PlayerMatchup_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sender_osuId` VARCHAR(191) NOT NULL,
    `sender_username` VARCHAR(191) NOT NULL,
    `receiver_osuId` VARCHAR(191) NOT NULL,
    `receiver_username` VARCHAR(191) NOT NULL,
    `type` ENUM('match_invitation', 'system_notification', 'admin_message') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `related_matchup_id` INTEGER NULL,
    `status` ENUM('unread', 'read', 'archived') NOT NULL DEFAULT 'unread',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Message_sender_osuId_idx`(`sender_osuId`),
    INDEX `Message_receiver_osuId_idx`(`receiver_osuId`),
    INDEX `Message_type_idx`(`type`),
    INDEX `Message_status_idx`(`status`),
    INDEX `Message_related_matchup_id_idx`(`related_matchup_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffRoomAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `staff_osuId` VARCHAR(191) NOT NULL,
    `staff_username` VARCHAR(191) NOT NULL,
    `role` ENUM('referee', 'commentator', 'streamer') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `StaffRoomAssignment_room_id_idx`(`room_id`),
    INDEX `StaffRoomAssignment_staff_osuId_idx`(`staff_osuId`),
    INDEX `StaffRoomAssignment_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchScore` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schedule_id` INTEGER NOT NULL,
    `player_osuId` VARCHAR(191) NOT NULL,
    `player_username` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `MatchScore_schedule_id_idx`(`schedule_id`),
    INDEX `MatchScore_player_osuId_idx`(`player_osuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TournamentSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(191) NOT NULL,
    `setting_value` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TournamentSetting_setting_key_key`(`setting_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MapSelection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `beatmapId` INTEGER NOT NULL,
    `beatmapsetId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `title_unicode` VARCHAR(191) NULL,
    `artist` VARCHAR(191) NOT NULL,
    `artist_unicode` VARCHAR(191) NULL,
    `version` VARCHAR(191) NOT NULL,
    `creator` VARCHAR(191) NOT NULL,
    `starRating` DOUBLE NOT NULL,
    `bpm` DOUBLE NOT NULL,
    `totalLength` INTEGER NOT NULL,
    `maxCombo` INTEGER NOT NULL,
    `ar` DOUBLE NOT NULL,
    `cs` DOUBLE NOT NULL,
    `od` DOUBLE NOT NULL,
    `hp` DOUBLE NOT NULL,
    `selectedMods` VARCHAR(191) NULL,
    `modPosition` INTEGER NULL,
    `comment` VARCHAR(191) NULL,
    `selectedBy` VARCHAR(191) NOT NULL,
    `selectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `season` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `url` VARCHAR(191) NULL,
    `coverUrl` VARCHAR(191) NULL,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `padding` BOOLEAN NOT NULL DEFAULT false,
    `isCustome` BOOLEAN NOT NULL DEFAULT false,
    `isOrigin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MapSelection_beatmapId_idx`(`beatmapId`),
    INDEX `MapSelection_beatmapsetId_idx`(`beatmapsetId`),
    INDEX `MapSelection_selectedBy_idx`(`selectedBy`),
    INDEX `MapSelection_season_idx`(`season`),
    INDEX `MapSelection_category_idx`(`category`),
    INDEX `MapSelection_approved_idx`(`approved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionCookie` (
    `id` VARCHAR(191) NOT NULL,
    `osuId` VARCHAR(191) NOT NULL,
    `cookieHash` VARCHAR(191) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SessionCookie_cookieHash_key`(`cookieHash`),
    INDEX `SessionCookie_osuId_idx`(`osuId`),
    INDEX `SessionCookie_cookieHash_idx`(`cookieHash`),
    INDEX `SessionCookie_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MatchSchedule` ADD CONSTRAINT `MatchSchedule_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `MatchRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerMatchup` ADD CONSTRAINT `PlayerMatchup_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `MatchRoom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffRoomAssignment` ADD CONSTRAINT `StaffRoomAssignment_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `MatchRoom`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchScore` ADD CONSTRAINT `MatchScore_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `MatchSchedule`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
