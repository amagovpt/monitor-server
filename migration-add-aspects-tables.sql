-- Migration script to add new Aspects tables
-- Created: 2025-10-26
-- Description: Adds ContentAspects, FunctionalAspects, and TransactionAspects tables
--              for storing website conformance evaluations across different aspects

-- Create ContentAspects table
DROP TABLE IF EXISTS `ContentAspects`;
CREATE TABLE `ContentAspects` (
  `ContentAspectsId` int(11) NOT NULL AUTO_INCREMENT,
  `WebsiteId` int(11) NOT NULL,
  `Date` datetime NOT NULL,
  `Conformance` decimal(4,1) NOT NULL,
  `Result` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`ContentAspectsId`),
  UNIQUE KEY `ContentAspectsId_UNIQUE` (`ContentAspectsId`),
  KEY `WebsiteId_CA_fk_idx` (`WebsiteId`),
  CONSTRAINT `WebsiteId_CA_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create FunctionalAspects table
DROP TABLE IF EXISTS `FunctionalAspects`;
CREATE TABLE `FunctionalAspects` (
  `FunctionalAspectsId` int(11) NOT NULL AUTO_INCREMENT,
  `WebsiteId` int(11) NOT NULL,
  `Date` datetime NOT NULL,
  `Conformance` decimal(4,1) NOT NULL,
  `Result` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`FunctionalAspectsId`),
  UNIQUE KEY `FunctionalAspectsId_UNIQUE` (`FunctionalAspectsId`),
  KEY `WebsiteId_FA_fk_idx` (`WebsiteId`),
  CONSTRAINT `WebsiteId_FA_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create TransactionAspects table
DROP TABLE IF EXISTS `TransactionAspects`;
CREATE TABLE `TransactionAspects` (
  `TransactionAspectsId` int(11) NOT NULL AUTO_INCREMENT,
  `WebsiteId` int(11) NOT NULL,
  `Date` datetime NOT NULL,
  `Conformance` decimal(4,1) NOT NULL,
  `Result` MEDIUMTEXT NOT NULL,
  PRIMARY KEY (`TransactionAspectsId`),
  UNIQUE KEY `TransactionAspectsId_UNIQUE` (`TransactionAspectsId`),
  KEY `WebsiteId_TA_fk_idx` (`WebsiteId`),
  CONSTRAINT `WebsiteId_TA_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
