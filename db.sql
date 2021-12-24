SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `CrawlDomain`;
CREATE TABLE `CrawlDomain` (
  `CrawlDomainId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `DomainUri` varchar(255) NOT NULL,
  `DomainId` int(11) NOT NULL,
  `Max_Depth` int(11) NOT NULL DEFAULT 0,
  `Max_Pages` int(11) NOT NULL DEFAULT 0,
  `Wait_JS` tinyint(1) NOT NULL DEFAULT 0,
  `Creation_Date` datetime NOT NULL,
  `Done` tinyint(1) NOT NULL DEFAULT '0',
  `SubDomainUri` varchar(255) NOT NULL,
  `Tag` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`CrawlDomainId`),
  UNIQUE KEY `CrawlDomainId_UNIQUE` (`CrawlDomainId`),
  UNIQUE KEY `UserIdDomainId_UNIQUE` (`UserId`,`DomainId`),
  KEY `CDDomainId_fk` (`DomainId`),
  CONSTRAINT `CDDomainId_fk` FOREIGN KEY (`DomainId`) REFERENCES `Domain` (`DomainId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `CrawlPage`;
CREATE TABLE `CrawlPage` (
  `CrawlId` int(11) NOT NULL AUTO_INCREMENT,
  `CrawlDomainId` int(11) NOT NULL,
  `Uri` varchar(255) NOT NULL,
  PRIMARY KEY (`CrawlId`),
  UNIQUE KEY `CrawlId_UNIQUE` (`CrawlId`),
  KEY `CrawlDomainId_fk` (`CrawlDomainId`),
  CONSTRAINT `CrawlDomainId_fk` FOREIGN KEY (`CrawlDomainId`) REFERENCES `CrawlDomain` (`CrawlDomainId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Domain`;
CREATE TABLE `Domain` (
  `DomainId` int(11) NOT NULL AUTO_INCREMENT,
  `WebsiteId` int(11) NOT NULL,
  `Url` varchar(255) NOT NULL,
  `Start_Date` datetime NOT NULL,
  `End_Date` datetime DEFAULT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`DomainId`),
  UNIQUE KEY `DomainId_UNIQUE` (`DomainId`),
  KEY `WebsiteId_fk_idx` (`WebsiteId`),
  CONSTRAINT `WebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `DomainPage`;
CREATE TABLE `DomainPage` (
  `DomainId` int(11) NOT NULL,
  `PageId` int(11) NOT NULL,
  PRIMARY KEY (`DomainId`,`PageId`),
  UNIQUE KEY `DomainPage` (`DomainId`,`PageId`),
  KEY `DPPageId_idx` (`PageId`),
  CONSTRAINT `DPDomainId_fk` FOREIGN KEY (`DomainId`) REFERENCES `Domain` (`DomainId`) ON DELETE CASCADE,
  CONSTRAINT `DPPageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Entity`;
CREATE TABLE `Entity` (
  `EntityId` int(11) NOT NULL AUTO_INCREMENT,
  `Short_Name` varchar(45) NOT NULL,
  `Long_Name` varchar(255) NOT NULL,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`EntityId`),
  UNIQUE KEY `EntityId_UNIQUE` (`EntityId`),
  UNIQUE KEY `ShortLongName` (`Short_name`,`Long_Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Evaluation`;
CREATE TABLE `Evaluation` (
  `EvaluationId` int(11) NOT NULL AUTO_INCREMENT,
  `PageId` int(11) NOT NULL,
  `Title` varchar(1024) DEFAULT NULL,
  `Score` decimal(4,1) NOT NULL,
  `Pagecode` mediumtext NOT NULL,
  `Tot` text NOT NULL,
  `Nodes` mediumtext NOT NULL,
  `Errors` text NOT NULL,
  `A` int(11) NOT NULL,
  `AA` int(11) NOT NULL,
  `AAA` int(11) NOT NULL,
  `Evaluation_Date` datetime NOT NULL,
  `Element_Count` TEXT,
  `Tag_Count` TEXT,
  `Show_To` varchar(2) NOT NULL DEFAULT '00',
  `StudyUserId` int(11) DEFAULT NULL,
  PRIMARY KEY (`EvaluationId`),
  UNIQUE KEY `EvalautionId_UNIQUE` (`EvaluationId`),
  KEY `PageId_fk_idx` (`PageId`),
  CONSTRAINT `PageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Evaluation_List`;
CREATE TABLE `Evaluation_List` (
  `EvaluationListId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `PageId` int(11) NOT NULL,
  `Url` varchar(2048) NOT NULL,
  `Show_To` varchar(2) NOT NULL DEFAULT '00',
  `Error` text,
  `Creation_Date` datetime NOT NULL,
  `Is_Evaluating` tinyint(1) NOT NULL DEFAULT '0',
  `StudyUserId` int(11) DEFAULT NULL,
  PRIMARY KEY (`EvaluationListId`),
  UNIQUE KEY `PairKey` (`UserId`,`PageId`),
  CONSTRAINT `ELPageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Invalid_Token`;
CREATE TABLE `Invalid_Token` (
  `TokenId` int(11) NOT NULL AUTO_INCREMENT,
  `Token` text NOT NULL,
  `Expiration_Date` datetime NOT NULL,
  PRIMARY KEY (`TokenId`),
  UNIQUE KEY `TokenId_UNIQUE` (`TokenId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Page`;
CREATE TABLE `Page` (
  `PageId` int(11) NOT NULL AUTO_INCREMENT,
  `Uri` varchar(1024) NOT NULL,
  `Show_In` varchar(3) NOT NULL DEFAULT '000',
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`PageId`),
  UNIQUE KEY `PageId_UNIQUE` (`PageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Directory`;
CREATE TABLE `Directory` (
  `DirectoryId` int (11) NOT NULL AUTO_INCREMENT,
  `Name` varchar (255) NOT NULL,
  `Method` tinyint(1) NOT NULL DEFAULT '0',
  `Show_in_Observatory` tinyint (1) NOT NULL DEFAULT '0',
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`DirectoryId`),
  UNIQUE KEY `DirectoryId_UNIQUE` (`DirectoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `DirectoryTag`;
CREATE TABLE `DirectoryTag` (
  `DirectoryId` int (11) NOT NULL,
  `TagId` int (11) NOT NULL,
  PRIMARY KEY (`DirectoryId`,`TagId`),
  UNIQUE KEY `DirectoryTag` (`DirectoryId`,`TagId`),
  KEY `TagId_fk_idx` (`TagId`),
  CONSTRAINT `DTDirectoryId_fk` FOREIGN KEY (`DirectoryId`) REFERENCES `Directory` (`DirectoryId`) ON DELETE CASCADE,
  CONSTRAINT `DTTagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Tag`;
CREATE TABLE `Tag` (
  `TagId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`TagId`),
  UNIQUE KEY `TagId_UNIQUE` (`TagId`),
  UNIQUE KEY `UserTag` (`UserId`,`Name`),
  KEY `UserId_fk_idx` (`UserId`),
  CONSTRAINT `UserId_fk` FOREIGN KEY (`UserId`) REFERENCES `User` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `TagWebsite`;
CREATE TABLE `TagWebsite` (
  `TagId` int(11) NOT NULL,
  `WebsiteId` int(11) NOT NULL,
  PRIMARY KEY (`TagId`,`WebsiteId`),
  UNIQUE KEY `TagWebsite` (`TagId`,`WebsiteId`),
  KEY `WebsiteId_fk_idx` (`WebsiteId`),
  CONSTRAINT `TWTagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE,
  CONSTRAINT `TWWebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `EntityWebsite`;
CREATE TABLE `EntityWebsite` (
  `EntityId` int(11) NOT NULL,
  `WebsiteId` int(11) NOT NULL,
  PRIMARY KEY (`EntityId`,`WebsiteId`),
  UNIQUE KEY `EntityWebsite` (`EntityId`,`WebsiteId`),
  KEY `WebsiteId_fk_idx` (`WebsiteId`),
  CONSTRAINT `EWEntityId_fk` FOREIGN KEY (`EntityId`) REFERENCES `Entity` (`EntityId`) ON DELETE CASCADE,
  CONSTRAINT `EWWebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `UserId` int(11) NOT NULL AUTO_INCREMENT,
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Type` varchar(45) NOT NULL,
  `Names` varchar(255) DEFAULT NULL,
  `Emails` varchar(255) DEFAULT NULL,
  `Register_Date` datetime NOT NULL,
  `Last_Login` datetime DEFAULT NULL,
  `Unique_Hash` varchar(255) NOT NULL,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `UserId_UNIQUE` (`UserId`),
  UNIQUE KEY `Unique_Hash_UNIQUE` (`Unique_Hash`),
  UNIQUE KEY `Username_UNIQUE` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Website`;
CREATE TABLE `Website` (
  `WebsiteId` int(11) NOT NULL AUTO_INCREMENT,
  `EntityId` int(11) DEFAULT NULL,
  `UserId` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `Declaration` int(3),
  `Declaration_Update_Date` DATETIME,
  `Stamp` int(3),
  `Stamp_Update_Date` DATETIME,
  `Creation_Date` datetime NOT NULL,
  `Deleted` tinyint(1) NOT NULL DEFAULT '0',
  `Deleted_Date` datetime DEFAULT NULL,
  PRIMARY KEY (`WebsiteId`),
  UNIQUE KEY `WebsiteId_UNIQUE` (`WebsiteId`),
  KEY `fk_Website_1_idx` (`EntityId`),
  CONSTRAINT `EntityId_fk` FOREIGN KEY (`EntityId`) REFERENCES `Entity` (`EntityId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Observatory`;
CREATE TABLE `Observatory` (
  `ObservatoryId` int(11) NOT NULL AUTO_INCREMENT,
  `Global_Statistics` MEDIUMTEXT NOT NULL,
  `Type` varchar(255) NOT NULL DEFAULT "auto",
  `Creation_Date` DATETIME NOT NULL,
  PRIMARY KEY (`ObservatoryId`),
  UNIQUE KEY `ObservatoryId_UNIQUE` (`ObservatoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Evaluation_Request_Counter`;
CREATE TABLE `Evaluation_Request_Counter` (
  `EvaluationRequestCounterId` int(11) NOT NULL AUTO_INCREMENT,
  `Application` varchar(100) NOT NULL,
  `Counter` int(11) NOT NULL DEFAULT 0,
  `Start_Date` DATETIME NOT NULL DEFAULT NOW(),
  `Last_Request` DATETIME NOT NULL,
  PRIMARY KEY (`EvaluationRequestCounterId`),
  UNIQUE KEY `EvaluationRequestCounterId_UNIQUE` (`EvaluationRequestCounterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;