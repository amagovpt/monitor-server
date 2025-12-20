-- Migration: Add unique constraints to GovUser table
-- This migration adds unique constraints on ccNumber and name columns
-- WARNING: This will fail if duplicate data exists. Clean duplicates first.

-- Check for duplicates before applying (optional, for reference)
-- SELECT ccNumber, COUNT(*) as count FROM GovUser GROUP BY ccNumber HAVING count > 1;
-- SELECT name, COUNT(*) as count FROM GovUser GROUP BY name HAVING count > 1;

-- Add unique constraint on ccNumber
ALTER TABLE `GovUser`
ADD UNIQUE KEY `ccNumber_UNIQUE` (`ccNumber`);

-- Add unique constraint on name
ALTER TABLE `GovUser`
ADD UNIQUE KEY `name_UNIQUE` (`name`);
