SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `GovUser`;
CREATE TABLE `GovUser` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `ccNumber` varchar(255) NOT NULL,
  `registerDate` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserId_UNIQUE` (`id`)
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