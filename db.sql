SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `CrawlWebsite`;
CREATE TABLE `CrawlWebsite` (
  `CrawlWebsiteId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) NOT NULL,
  `StartingUrl` varchar(255) NOT NULL,
  `WebsiteId` int(11) NOT NULL,
  `Max_Depth` int(11) NOT NULL DEFAULT 0,
  `Max_Pages` int(11) NOT NULL DEFAULT 0,
  `Wait_JS` tinyint(1) NOT NULL DEFAULT 0,
  `Creation_Date` datetime NOT NULL,
  `Done` tinyint(1) NOT NULL DEFAULT '0',
  `Tag` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`CrawlWebsiteId`),
  UNIQUE KEY `CrawlWebsiteId_UNIQUE` (`CrawlWebsiteId`),
  KEY `CWWebsiteId_fk` (`WebsiteId`),
  CONSTRAINT `CWWebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `CrawlPage`;
CREATE TABLE `CrawlPage` (
  `CrawlId` int(11) NOT NULL AUTO_INCREMENT,
  `CrawlWebsiteId` int(11) NOT NULL,
  `Uri` varchar(255) NOT NULL,
  PRIMARY KEY (`CrawlId`),
  UNIQUE KEY `CrawlId_UNIQUE` (`CrawlId`),
  KEY `CrawlWebsiteId_fk` (`CrawlWebsiteId`),
  CONSTRAINT `CrawlWebsiteId_fk` FOREIGN KEY (`CrawlWebsiteId`) REFERENCES `CrawlWebsite` (`CrawlWebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Invalid_Token`;
CREATE TABLE `Invalid_Token` (
  `TokenId` int(11) NOT NULL AUTO_INCREMENT,
  `Token` text NOT NULL,
  `Expiration_Date` datetime NOT NULL,
  PRIMARY KEY (`TokenId`),
  UNIQUE KEY `TokenId_UNIQUE` (`TokenId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- DROP TABLE IF EXISTS `Apps_Invalid_Token`;
-- CREATE TABLE `Apps_Invalid_Token` (
--   `AppsTokenId` int(11) NOT NULL AUTO_INCREMENT,
--   `AppsToken` text NOT NULL,
--   `Expiration_Date` datetime NOT NULL,
--   PRIMARY KEY (`AppsTokenId`),
--   UNIQUE KEY `AppsTokenId_UNIQUE` (`AppsTokenId`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Observatory`;
CREATE TABLE `Observatory` (
  `ObservatoryId` int(11) NOT NULL AUTO_INCREMENT,
  `Global_Statistics` MEDIUMTEXT NOT NULL,
  `Type` varchar(255) NOT NULL DEFAULT "auto",
  `Creation_Date` DATETIME NOT NULL,
  PRIMARY KEY (`ObservatoryId`),
  UNIQUE KEY `ObservatoryId_UNIQUE` (`ObservatoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- DROP TABLE IF EXISTS `AppsObservatory`;
-- CREATE TABLE `AppsObservatory` (
--   `AppsObservatoryId` int(11) NOT NULL AUTO_INCREMENT,
--   `Global_Statistics` text NOT NULL,
--   `Type` varchar(255) NOT NULL DEFAULT "auto",
--   `Creation_Date` DATETIME NOT NULL,
--   PRIMARY KEY (`AppsObservatoryId`),
--   UNIQUE KEY `AppsObservatoryId_UNIQUE` (`AppsObservatoryId`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsDirectory`;
-- CREATE TABLE `AppsDirectory` (
--   `AppsDirectoryId` int (11) NOT NULL AUTO_INCREMENT,
--   `Name` varchar (255) NOT NULL,
--   `Method` tinyint(1) NOT NULL DEFAULT '0',
--   `Creation_Date` datetime NOT NULL,
--   PRIMARY KEY (`AppsDirectoryId`),
--   UNIQUE KEY `AppsDirectoryId_UNIQUE` (`AppsDirectoryId`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsCategory`;
-- CREATE TABLE `AppsCategory` (
--   `AppsCategoryId` int(11) NOT NULL AUTO_INCREMENT,
--   `UserId` int(11) DEFAULT NULL,
--   `Name` varchar(255) NOT NULL,
--   `Creation_Date` datetime NOT NULL,
--   PRIMARY KEY (`AppsCategoryId`),
--   UNIQUE KEY `AppsCategoryId_UNIQUE` (`AppsCategoryId`),
--   UNIQUE KEY `UserAppsCategory` (`UserId`,`Name`),
--   KEY `CUserId_fk_idx` (`UserId`),
--   CONSTRAINT `CUserId_fk` FOREIGN KEY (`UserId`) REFERENCES `User` (`UserId`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsEntity`;
-- CREATE TABLE `AppsEntity` (
--   `AppsEntityId` int(11) NOT NULL AUTO_INCREMENT,
--   `Short_Name` varchar(45) NOT NULL,
--   `Long_Name` varchar(255) NOT NULL,
--   `Creation_Date` datetime NOT NULL,
--   PRIMARY KEY (`AppsEntityId`),
--   UNIQUE KEY `AppsEntityId_UNIQUE` (`AppsEntityId`),
--   UNIQUE KEY `ShortLongName` (`Short_name`,`Long_Name`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Website`;
CREATE TABLE `Website` (
  `WebsiteId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `StartingUrl` varchar(255) NOT NULL,
  `Declaration` int(3),
  `Declaration_Update_Date` DATETIME,
  `Stamp` int(3),
  `Stamp_Update_Date` DATETIME,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`WebsiteId`),
  UNIQUE KEY `WebsiteId_UNIQUE` (`WebsiteId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- DROP TABLE IF EXISTS `Application`;
-- CREATE TABLE `Application` (
--   `ApplicationId` int(11) NOT NULL AUTO_INCREMENT,
--   `UserId` int(11) DEFAULT NULL,
--   `Name` varchar(255) NOT NULL,
--   `DownloadUrl` varchar(255) NOT NULL,
--   `OperatingSystem` varchar(10) NOT NULL,
--   `Declaration` int(3),
--   `DeclarationUpdateDate` DATETIME,
--   `Stamp` int(3),
--   `StampUpdateDate` DATETIME,
--   `CreationDate` datetime NOT NULL,
--   PRIMARY KEY (`ApplicationId`),
--   UNIQUE KEY `ApplicationId_UNIQUE` (`ApplicationId`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Page`;
CREATE TABLE `Page` (
  `PageId` int(11) NOT NULL AUTO_INCREMENT,
  `Uri` varchar(255) NOT NULL,
  `Show_In` varchar(3) NOT NULL DEFAULT '000',
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`PageId`),
  UNIQUE KEY `PageId_UNIQUE` (`PageId`),
  UNIQUE KEY `PageUri_UNIQUE` (`Uri`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Evaluation`;
CREATE TABLE `Evaluation` (
  `EvaluationId` int(11) NOT NULL AUTO_INCREMENT,
  `PageId` int(11) NOT NULL,
  `Title` varchar(1024) DEFAULT NULL,
  `Score` decimal(4,1) NOT NULL,
  `Pagecode` mediumtext NOT NULL,
  `Tot` text NOT NULL,
  `Nodes` longtext NOT NULL,
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

-- DROP TABLE IF EXISTS `AppsEvaluation`;
-- CREATE TABLE `AppsEvaluation` (
--   `AppsEvaluationId` int(11) NOT NULL AUTO_INCREMENT,
--   `AppId` int(11) NOT NULL,
--   `Title` varchar(1024) DEFAULT NULL,
--   `Show_To` varchar(2) NOT NULL DEFAULT '00',
--   `Conformance` decimal(4,1) NOT NULL,
--   `Result` text NOT NULL,
--   `Date` datetime NOT NULL,
--   PRIMARY KEY (`AppsEvaluationId`),
--   UNIQUE KEY `AppsEvaluationId_UNIQUE` (`AppsEvaluationId`),
--   KEY `AppId_fk_idx` (`AppId`),
--   CONSTRAINT `AppId_fk` FOREIGN KEY (`AppId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsDirectoryAppsCategory`;
-- CREATE TABLE `AppsDirectoryAppsCategory` (
--   `AppsDirectoryId` int (11) NOT NULL,
--   `AppsCategoryId` int (11) NOT NULL,
--   PRIMARY KEY (`AppsDirectoryId`,`AppsCategoryId`),
--   UNIQUE KEY `AppsDirectoryAppsCategory` (`AppsDirectoryId`,`AppsCategoryId`),
--   KEY `AppsCategoryId_fk_idx` (`AppsCategoryId`),
--   CONSTRAINT `DCAppsDirectoryId_fk` FOREIGN KEY (`AppsDirectoryId`) REFERENCES `AppsDirectory` (`AppsDirectoryId`) ON DELETE CASCADE,
--   CONSTRAINT `DCAppsCategoryId_fk` FOREIGN KEY (`AppsCategoryId`) REFERENCES `AppsCategory` (`AppsCategoryId`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsCategoryApplication`;
-- CREATE TABLE `AppsCategoryApplication` (
--   `AppsCategoryId` int(11) NOT NULL,
--   `ApplicationId` int(11) NOT NULL,
--   PRIMARY KEY (`AppsCategoryId`,`ApplicationId`),
--   UNIQUE KEY `AppsCategoryApplication` (`AppsCategoryId`,`ApplicationId`),
--   KEY `ApplicationId_fk_idx` (`ApplicationId`),
--   CONSTRAINT `CAAppsCategoryId_fk` FOREIGN KEY (`AppsCategoryId`) REFERENCES `AppsCategory` (`AppsCategoryId`) ON DELETE CASCADE,
--   CONSTRAINT `CAApplicationId_fk` FOREIGN KEY (`ApplicationId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

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

-- DROP TABLE IF EXISTS `AppsEntityApplication`;
-- CREATE TABLE `AppsEntityApplication` (
--   `AppsEntityId` int(11) NOT NULL,
--   `ApplicationId` int(11) NOT NULL,
--   PRIMARY KEY (`AppsEntityId`,`ApplicationId`),
--   UNIQUE KEY `AppsEntityApplication` (`AppsEntityId`,`ApplicationId`),
--   KEY `ApplicationId_fk_idx` (`ApplicationId`),
--   CONSTRAINT `EAEntityId_fk` FOREIGN KEY (`AppsEntityId`) REFERENCES `AppsEntity` (`AppsEntityId`) ON DELETE CASCADE,
--   CONSTRAINT `EAApplicationId_fk` FOREIGN KEY (`ApplicationId`) REFERENCES `Application` (`ApplicationId`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `WebsitePage`;
CREATE TABLE `WebsitePage` (
  `WebsiteId` int(11) NOT NULL,
  `PageId` int(11) NOT NULL,
  PRIMARY KEY (`WebsiteId`,`PageId`),
  UNIQUE KEY `WebistePage` (`WebsiteId`,`PageId`),
  KEY `WPPageId_idx` (`PageId`),
  CONSTRAINT `WPWebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE,
  CONSTRAINT `WPPageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Accessibility_Statement`;
CREATE TABLE `Accessibility_Statement` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `WebsiteId`                        INT(11)         NOT NULL,
    `CreatedAt`                     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`                     DATETIME        DEFAULT NULL,
    `url` varchar(255) NOT NULL,
    `state` ENUM('completeStatement', 'incompleteStatement', 'possibleStatement'),
    `conformance` varchar(255) DEFAULT NULL,
    `evidence` text(255) DEFAULT NULL,
    `seal` varchar(255) DEFAULT NULL,
    `hash` varchar(255) DEFAULT NULL,
    `statementDate` datetime DEFAULT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `Accessibility_StatementId_UNIQUE` (`Id`),
    CONSTRAINT `Accessibility_Statement_WebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Automatic_Evaluation`;
CREATE TABLE `Automatic_Evaluation` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `Accessibility_Statement_Id`                        INT(11)         NOT NULL,
    `Title` varchar(255) DEFAULT NULL,
    `Url` varchar(255) DEFAULT NULL,
    `Sample` varchar(255) DEFAULT NULL,
    `Tool` varchar(255) DEFAULT NULL,
    `Summary` text(255) DEFAULT NULL,
    `Date` datetime DEFAULT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `Automatic_EvaluationId_UNIQUE` (`Id`),
    CONSTRAINT `Automatic_Evaluation_Accessibility_Statement_fk` FOREIGN KEY (`Accessibility_Statement_Id`) REFERENCES `Accessibility_Statement` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Manual_Evaluation`;
CREATE TABLE `Manual_Evaluation` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `Accessibility_Statement_Id`                        INT(11)         NOT NULL,
    `Title` varchar(255) DEFAULT NULL,
    `Url` varchar(255) DEFAULT NULL,
    `Sample` varchar(255) DEFAULT NULL,
    `HeuristicsPassed` INT(11)   DEFAULT NULL,
    `HeuristicsTotal` INT(11)   DEFAULT NULL,
    `Summary` text(255) DEFAULT NULL,
    `Date` datetime DEFAULT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `Manual_EvaluationId_UNIQUE` (`Id`),
    CONSTRAINT `Manual_Evaluation_Accessibility_Statement_fk` FOREIGN KEY (`Accessibility_Statement_Id`) REFERENCES `Accessibility_Statement` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `User_Evaluation`;
CREATE TABLE `User_Evaluation` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `Accessibility_Statement_Id`                        INT(11)         NOT NULL,
    `Title` varchar(255) DEFAULT NULL,
    `Url` varchar(255) DEFAULT NULL,
    `Sample` varchar(255) DEFAULT NULL,
    `Participants` varchar(255) DEFAULT NULL,
    `Process` text DEFAULT NULL,
    `Summary` text(255) DEFAULT NULL,
    `Date` datetime DEFAULT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `User_EvaluationId_UNIQUE` (`Id`),
    CONSTRAINT `User_Evaluation_Accessibility_Statement_fk` FOREIGN KEY (`Accessibility_Statement_Id`) REFERENCES `Accessibility_Statement` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Contact`;
CREATE TABLE `Contact` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `Accessibility_Statement_Id`                        INT(11)         NOT NULL,
    `Contact` varchar(255) DEFAULT NULL,
    `ContactType` varchar(255) DEFAULT NULL,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `ContactId_UNIQUE` (`Id`),
    CONSTRAINT `Contact_Accessibility_Statement_fk` FOREIGN KEY (`Accessibility_Statement_Id`) REFERENCES `Accessibility_Statement` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `Collection_Date`;
CREATE TABLE `Collection_Date` (
    `Id`        INT(11)         NOT NULL AUTO_INCREMENT,
    `CreatedAt` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`Id`),
    UNIQUE KEY `ContactId_UNIQUE` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `GovUser`;
CREATE TABLE `GovUser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ccNumber` varchar(255) NOT NULL,
  `registerDate` datetime NOT NULL,
   `lastLogin` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserId_UNIQUE` (`id`),
  UNIQUE KEY `ccNumber_UNIQUE` (`ccNumber`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `UserGovUser`;
CREATE TABLE `UserGovUser` (
  `UserId` int(11) NOT NULL,
  `GovUserId` int(11) NOT NULL,
  PRIMARY KEY (`UserId`,`GovUserId`),
  UNIQUE KEY `UserGovUser` (`UserId`,`GovUserId`),
  KEY `UGUserId_idx` (`UserId`),
  CONSTRAINT `UGUserId_fk` FOREIGN KEY (`UserId`) REFERENCES `User` (`UserId`) ON DELETE CASCADE,
  CONSTRAINT `UGUGovUserId_fk` FOREIGN KEY (`GovUserId`) REFERENCES `GovUser` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SET FOREIGN_KEY_CHECKS = 1;