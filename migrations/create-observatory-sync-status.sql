-- Migration: Create ObservatorySyncStatus table
-- This table tracks the status of observatory data generation processes

CREATE TABLE `ObservatorySyncStatus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` enum('idle','running','completed','failed','interrupted') NOT NULL DEFAULT 'idle',
  `type` enum('auto','manual') NOT NULL DEFAULT 'auto',
  `startTime` datetime DEFAULT NULL,
  `endTime` datetime DEFAULT NULL,
  `totalChunks` int(11) NOT NULL DEFAULT '0',
  `processedChunks` int(11) NOT NULL DEFAULT '0',
  `totalDirectories` int(11) NOT NULL DEFAULT '0',
  `processedDirectories` int(11) NOT NULL DEFAULT '0',
  `errorMessage` text,
  `processId` varchar(50) DEFAULT NULL,
  `namespace` varchar(50) DEFAULT NULL,
  `amsid` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_startTime` (`startTime`),
  KEY `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create index for efficient querying of running syncs
CREATE INDEX `idx_status_startTime` ON `ObservatorySyncStatus` (`status`, `startTime` DESC);