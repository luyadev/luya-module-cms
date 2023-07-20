# ************************************************************
# Sequel Pro SQL dump
# Version 5446
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.5.5-10.3.22-MariaDB-1:10.3.22+maria~bionic)
# Database: luya
# Generation Time: 2020-07-18 06:38:27 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table admin_auth
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_auth`;

CREATE TABLE `admin_auth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `alias_name` varchar(60) NOT NULL,
  `module_name` varchar(60) NOT NULL,
  `is_crud` tinyint(1) DEFAULT 0,
  `route` varchar(200) DEFAULT NULL,
  `api` varchar(200) DEFAULT NULL,
  `pool` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_route` (`route`),
  KEY `index_api` (`api`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_auth` WRITE;
/*!40000 ALTER TABLE `admin_auth` DISABLE KEYS */;

INSERT INTO `admin_auth` (`id`, `alias_name`, `module_name`, `is_crud`, `route`, `api`, `pool`)
VALUES
	(1,'module_permission_page_blocks','cmsadmin',1,'0','api-cms-navitempageblockitem',NULL),
	(2,'menu_group_item_env_container','cmsadmin',1,'0','api-cms-navcontainer',NULL),
	(3,'menu_group_item_env_layouts','cmsadmin',1,'0','api-cms-layout',NULL),
	(4,'menu_group_item_env_redirections','cmsadmin',1,'0','api-cms-redirect',NULL),
	(5,'menu_group_item_elements_group','cmsadmin',1,'0','api-cms-blockgroup',NULL),
	(6,'menu_group_item_elements_blocks','cmsadmin',1,'0','api-cms-block',NULL),
	(7,'module_permission_add_new_page','cmsadmin',0,'cmsadmin/page/create','0',NULL),
	(8,'module_permission_update_pages','cmsadmin',0,'cmsadmin/page/update','0',NULL),
	(9,'module_permission_delete_pages','cmsadmin',0,'cmsadmin/page/delete','0',NULL),
	(10,'module_permission_edit_drafts','cmsadmin',0,'cmsadmin/page/drafts','0',NULL),
	(11,'menu_group_item_env_config','cmsadmin',0,'cmsadmin/config/index','0',NULL),
	(12,'menu_node_cms','cmsadmin',0,'cmsadmin/default/index','0',NULL),
	(13,'menu_group_item_env_permission','cmsadmin',0,'cmsadmin/permission/index','0',NULL),
	(14,'menu_access_item_user','admin',1,'0','api-admin-user',NULL),
	(15,'menu_access_item_group','admin',1,'0','api-admin-group',NULL),
	(16,'menu_system_item_config','admin',1,'0','api-admin-config',NULL),
	(17,'menu_system_item_language','admin',1,'0','api-admin-lang',NULL),
	(18,'menu_system_item_tags','admin',1,'0','api-admin-tag',NULL),
	(19,'menu_system_logger','admin',1,'0','api-admin-logger',NULL),
	(20,'menu_images_item_effects','admin',1,'0','api-admin-effect',NULL),
	(21,'menu_images_item_filters','admin',1,'0','api-admin-filter',NULL),
	(22,'Machines','admin',1,'0','api-admin-proxymachine',NULL),
	(23,'Builds','admin',1,'0','api-admin-proxybuild',NULL),
	(24,'menu_node_filemanager','admin',0,'admin/storage/index','0',NULL);

/*!40000 ALTER TABLE `admin_auth` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_config`;

CREATE TABLE `admin_config` (
  `name` varchar(80) NOT NULL,
  `value` varchar(255) NOT NULL,
  `is_system` tinyint(1) DEFAULT 1,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `index_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_config` WRITE;
/*!40000 ALTER TABLE `admin_config` DISABLE KEYS */;

INSERT INTO `admin_config` (`name`, `value`, `is_system`, `id`)
VALUES
	('100genericBlockUpdate','1',1,1),
	('last_import_timestamp','1513077719',1,2),
	('setup_command_timestamp','1513077719',1,3);

/*!40000 ALTER TABLE `admin_config` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_group`;

CREATE TABLE `admin_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `text` text DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_group` WRITE;
/*!40000 ALTER TABLE `admin_group` DISABLE KEYS */;

INSERT INTO `admin_group` (`id`, `name`, `text`, `is_deleted`)
VALUES
	(1,'Administrator','Administrator Accounts have full access to all Areas and can create, update and delete all data records.',0);

/*!40000 ALTER TABLE `admin_group` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_group_auth
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_group_auth`;

CREATE TABLE `admin_group_auth` (
  `group_id` int(11) DEFAULT NULL,
  `auth_id` int(11) DEFAULT NULL,
  `crud_create` smallint(4) DEFAULT NULL,
  `crud_update` smallint(4) DEFAULT NULL,
  `crud_delete` smallint(4) DEFAULT NULL,
  KEY `index_group_id` (`group_id`),
  KEY `index_auth_id` (`auth_id`),
  KEY `index_group_id_auth_id` (`group_id`,`auth_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_group_auth` WRITE;
/*!40000 ALTER TABLE `admin_group_auth` DISABLE KEYS */;

INSERT INTO `admin_group_auth` (`group_id`, `auth_id`, `crud_create`, `crud_update`, `crud_delete`)
VALUES
	(1,1,1,1,1),
	(1,2,1,1,1),
	(1,3,1,1,1),
	(1,4,1,1,1),
	(1,5,1,1,1),
	(1,6,1,1,1),
	(1,7,1,1,1),
	(1,8,1,1,1),
	(1,9,1,1,1),
	(1,10,1,1,1),
	(1,11,1,1,1),
	(1,12,1,1,1),
	(1,13,1,1,1),
	(1,14,1,1,1),
	(1,15,1,1,1),
	(1,16,1,1,1),
	(1,17,1,1,1),
	(1,18,1,1,1),
	(1,19,1,1,1),
	(1,20,1,1,1),
	(1,21,1,1,1),
	(1,22,1,1,1),
	(1,23,1,1,1),
	(1,24,1,1,1);

/*!40000 ALTER TABLE `admin_group_auth` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_lang
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_lang`;

CREATE TABLE `admin_lang` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `short_code` varchar(15) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_short_code` (`short_code`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_lang` WRITE;
/*!40000 ALTER TABLE `admin_lang` DISABLE KEYS */;

INSERT INTO `admin_lang` (`id`, `name`, `short_code`, `is_default`, `is_deleted`)
VALUES
	(1,'English','en',1,0),
	(2,'Deutsch','de',0,0);

/*!40000 ALTER TABLE `admin_lang` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_logger
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_logger`;

CREATE TABLE `admin_logger` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` int(11) NOT NULL,
  `trace_file` varchar(255) DEFAULT NULL,
  `trace_line` varchar(255) DEFAULT NULL,
  `trace_function` varchar(255) DEFAULT NULL,
  `trace_function_args` text DEFAULT NULL,
  `group_identifier` varchar(255) DEFAULT NULL,
  `group_identifier_index` int(11) DEFAULT NULL,
  `get` text DEFAULT NULL,
  `post` text DEFAULT NULL,
  `session` text DEFAULT NULL,
  `server` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_ngrest_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_ngrest_log`;

CREATE TABLE `admin_ngrest_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `timestamp_create` int(11) NOT NULL,
  `route` varchar(80) NOT NULL,
  `api` varchar(80) NOT NULL,
  `is_update` tinyint(1) DEFAULT 0,
  `is_insert` tinyint(1) DEFAULT 0,
  `attributes_json` text NOT NULL,
  `attributes_diff_json` text DEFAULT NULL,
  `pk_value` varchar(255) DEFAULT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  `is_delete` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_property
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_property`;

CREATE TABLE `admin_property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(120) DEFAULT NULL,
  `var_name` varchar(40) NOT NULL,
  `class_name` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `var_name` (`var_name`),
  KEY `index_var_name` (`var_name`),
  KEY `index_class_name` (`class_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_proxy_build
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_proxy_build`;

CREATE TABLE `admin_proxy_build` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `machine_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `build_token` varchar(255) NOT NULL,
  `config` text NOT NULL,
  `is_complet` tinyint(1) DEFAULT 0,
  `expiration_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `build_token` (`build_token`),
  KEY `index_machine_id` (`machine_id`),
  KEY `index_build_token` (`build_token`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_proxy_machine
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_proxy_machine`;

CREATE TABLE `admin_proxy_machine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `is_disabled` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`),
  KEY `index_access_token` (`access_token`),
  KEY `index_identifier` (`identifier`),
  KEY `index_is_deleted` (`is_deleted`),
  KEY `index_identifier_is_deleted` (`identifier`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_queue
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_queue`;

CREATE TABLE `admin_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel` varchar(255) NOT NULL,
  `job` blob NOT NULL,
  `pushed_at` int(11) NOT NULL,
  `ttr` int(11) NOT NULL,
  `delay` int(11) NOT NULL DEFAULT 0,
  `priority` int(11) unsigned NOT NULL DEFAULT 1024,
  `reserved_at` int(11) DEFAULT NULL,
  `attempt` int(11) DEFAULT NULL,
  `done_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `channel` (`channel`),
  KEY `reserved_at` (`reserved_at`),
  KEY `priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_queue_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_queue_log`;

CREATE TABLE `admin_queue_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `push_timestamp` int(11) NOT NULL,
  `run_timestamp` int(11) DEFAULT NULL,
  `end_timestamp` int(11) DEFAULT NULL,
  `is_error` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `queue_id` (`queue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_queue_log_error
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_queue_log_error`;

CREATE TABLE `admin_queue_log_error` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_log_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `trace` text DEFAULT NULL,
  `file` text DEFAULT NULL,
  `line` varchar(255) DEFAULT NULL,
  `created_at` int(11) DEFAULT NULL,
  `updated_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `queue_log_id` (`queue_log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_scheduler
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_scheduler`;

CREATE TABLE `admin_scheduler` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `model_class` varchar(255) NOT NULL,
  `primary_key` varchar(255) NOT NULL,
  `target_attribute_name` varchar(255) NOT NULL,
  `new_attribute_value` varchar(255) NOT NULL,
  `old_attribute_value` varchar(255) DEFAULT NULL,
  `schedule_timestamp` int(11) NOT NULL,
  `is_done` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_search_data
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_search_data`;

CREATE TABLE `admin_search_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `timestamp_create` int(11) NOT NULL,
  `query` varchar(255) NOT NULL,
  `num_rows` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_storage_effect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_effect`;

CREATE TABLE `admin_storage_effect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `imagine_name` varchar(255) DEFAULT NULL,
  `imagine_json_params` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`),
  KEY `index_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_storage_effect` WRITE;
/*!40000 ALTER TABLE `admin_storage_effect` DISABLE KEYS */;

INSERT INTO `admin_storage_effect` (`id`, `identifier`, `name`, `imagine_name`, `imagine_json_params`)
VALUES
	(1,'thumbnail','Thumbnail','thumbnail','{\"vars\":[{\"var\":\"width\",\"label\":\"Breit in Pixel\"},{\"var\":\"height\",\"label\":\"Hoehe in Pixel\"},{\"var\":\"mode\",\"label\":\"outbound or inset\"},{\"var\":\"saveOptions\",\"label\":\"save options\"}]}'),
	(2,'crop','Crop','crop','{\"vars\":[{\"var\":\"width\",\"label\":\"Breit in Pixel\"},{\"var\":\"height\",\"label\":\"Hoehe in Pixel\"},{\"var\":\"saveOptions\",\"label\":\"save options\"}]}');

/*!40000 ALTER TABLE `admin_storage_effect` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_storage_file
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_file`;

CREATE TABLE `admin_storage_file` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_hidden` tinyint(1) DEFAULT 0,
  `folder_id` int(11) DEFAULT 0,
  `name_original` varchar(255) DEFAULT NULL,
  `name_new` varchar(255) DEFAULT NULL,
  `name_new_compound` varchar(255) DEFAULT NULL,
  `mime_type` varchar(255) DEFAULT NULL,
  `extension` varchar(255) DEFAULT NULL,
  `hash_file` varchar(255) DEFAULT NULL,
  `hash_name` varchar(255) DEFAULT NULL,
  `upload_timestamp` int(11) DEFAULT NULL,
  `file_size` int(11) DEFAULT 0,
  `upload_user_id` int(11) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `passthrough_file` tinyint(1) DEFAULT 0,
  `passthrough_file_password` varchar(40) DEFAULT NULL,
  `passthrough_file_stats` int(11) DEFAULT 0,
  `caption` text DEFAULT NULL,
  `inline_disposition` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `admin_storage_file_index1` (`folder_id`,`is_hidden`,`is_deleted`,`name_original`),
  KEY `admin_storage_file_index2` (`is_deleted`,`id`),
  KEY `index_upload_user_id` (`upload_user_id`),
  KEY `index_id_hash_name_is_deleted` (`id`,`hash_name`,`is_deleted`),
  KEY `index_name_new_compound` (`name_new_compound`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_storage_filter
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_filter`;

CREATE TABLE `admin_storage_filter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(100) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`),
  KEY `index_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_storage_filter` WRITE;
/*!40000 ALTER TABLE `admin_storage_filter` DISABLE KEYS */;

INSERT INTO `admin_storage_filter` (`id`, `identifier`, `name`)
VALUES
	(1,'large-crop','Crop large (800x800)'),
	(2,'large-thumbnail','Thumbnail large (800xnull)'),
	(3,'medium-crop','Crop medium (300x300)'),
	(4,'medium-thumbnail','Thumbnail medium (300xnull)'),
	(5,'small-crop','Crop small (100x100)'),
	(6,'small-landscape','Landscape small (150x50)'),
	(7,'small-thumbnail','Thumbnail small (100xnull)'),
	(8,'tiny-crop','Crop tiny (40x40)'),
	(9,'tiny-thumbnail','Thumbnail tiny (40xnull)');

/*!40000 ALTER TABLE `admin_storage_filter` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_storage_filter_chain
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_filter_chain`;

CREATE TABLE `admin_storage_filter_chain` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sort_index` int(11) DEFAULT NULL,
  `filter_id` int(11) DEFAULT NULL,
  `effect_id` int(11) DEFAULT NULL,
  `effect_json_values` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_filter_id` (`filter_id`),
  KEY `index_effect_id` (`effect_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_storage_filter_chain` WRITE;
/*!40000 ALTER TABLE `admin_storage_filter_chain` DISABLE KEYS */;

INSERT INTO `admin_storage_filter_chain` (`id`, `sort_index`, `filter_id`, `effect_id`, `effect_json_values`)
VALUES
	(1,NULL,1,1,'{\"width\":800,\"height\":800}'),
	(2,NULL,2,1,'{\"width\":800,\"height\":null}'),
	(3,NULL,3,1,'{\"width\":300,\"height\":300}'),
	(4,NULL,4,1,'{\"width\":300,\"height\":null}'),
	(5,NULL,5,1,'{\"width\":100,\"height\":100}'),
	(6,NULL,6,1,'{\"width\":150,\"height\":50}'),
	(7,NULL,7,1,'{\"width\":100,\"height\":null}'),
	(8,NULL,8,1,'{\"width\":40,\"height\":40}'),
	(9,NULL,9,1,'{\"width\":40,\"height\":null}');

/*!40000 ALTER TABLE `admin_storage_filter_chain` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_storage_folder
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_folder`;

CREATE TABLE `admin_storage_folder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `timestamp_create` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_storage_image
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_storage_image`;

CREATE TABLE `admin_storage_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_id` int(11) DEFAULT NULL,
  `filter_id` int(11) DEFAULT NULL,
  `resolution_width` int(11) DEFAULT NULL,
  `resolution_height` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_storage_image_index1` (`file_id`),
  KEY `index_filter_id` (`filter_id`),
  KEY `index_file_id_filter_id` (`file_id`,`filter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_tag
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_tag`;

CREATE TABLE `admin_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `translation` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_tag_relation
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_tag_relation`;

CREATE TABLE `admin_tag_relation` (
  `tag_id` int(11) NOT NULL,
  `table_name` varchar(120) NOT NULL,
  `pk_id` int(11) NOT NULL,
  PRIMARY KEY (`tag_id`,`table_name`,`pk_id`),
  KEY `index_tag_id` (`tag_id`),
  KEY `index_table_name` (`table_name`),
  KEY `index_pk_id` (`pk_id`),
  KEY `index_table_name_pk_id` (`table_name`,`pk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user`;

CREATE TABLE `admin_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `title` smallint(1) DEFAULT NULL,
  `email` varchar(120) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_salt` varchar(255) DEFAULT NULL,
  `auth_token` varchar(190) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `secure_token` varchar(40) DEFAULT NULL,
  `secure_token_timestamp` int(11) DEFAULT 0,
  `force_reload` tinyint(1) DEFAULT 0,
  `settings` text DEFAULT NULL,
  `cookie_token` varchar(255) DEFAULT NULL,
  `is_api_user` tinyint(1) DEFAULT 0,
  `api_rate_limit` int(11) DEFAULT NULL,
  `api_allowed_ips` varchar(255) DEFAULT NULL,
  `api_last_activity` int(11) DEFAULT NULL,
  `email_verification_token` varchar(40) DEFAULT NULL,
  `email_verification_token_timestamp` int(11) DEFAULT NULL,
  `login_attempt` int(11) DEFAULT NULL,
  `login_attempt_lock_expiration` int(11) DEFAULT NULL,
  `is_request_logger_enabled` tinyint(1) DEFAULT 0,
  `login_2fa_enabled` tinyint(1) DEFAULT 0,
  `login_2fa_secret` varchar(255) DEFAULT NULL,
  `login_2fa_backup_key` varchar(255) DEFAULT NULL,
  `password_verification_token` varchar(40) DEFAULT NULL,
  `password_verification_token_timestamp` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `auth_token` (`auth_token`),
  KEY `index_email` (`email`),
  KEY `index_auth_token` (`auth_token`),
  KEY `index_is_deleted_auth_token` (`is_deleted`,`auth_token`),
  KEY `index_is_deleted_id` (`is_deleted`,`id`),
  KEY `index_api_last_activity_id` (`api_last_activity`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_user` WRITE;
/*!40000 ALTER TABLE `admin_user` DISABLE KEYS */;

INSERT INTO `admin_user` (`id`, `firstname`, `lastname`, `title`, `email`, `password`, `password_salt`, `auth_token`, `is_deleted`, `secure_token`, `secure_token_timestamp`, `force_reload`, `settings`, `cookie_token`, `is_api_user`, `api_rate_limit`, `api_allowed_ips`, `api_last_activity`, `email_verification_token`, `email_verification_token_timestamp`, `login_attempt`, `login_attempt_lock_expiration`, `is_request_logger_enabled`, `login_2fa_enabled`, `login_2fa_secret`, `login_2fa_backup_key`, `password_verification_token`, `password_verification_token_timestamp`)
VALUES
	(1,'John','Doe',1,'test@luya.io','$2y$13$7TZy10K41AwgkIjn51OwFuHnafecDt.B5w/2RrA9frxExOh6biWRG','sWuayGA8P5PlEQBUirj0-BTdKimgQSj1',NULL,0,NULL,0,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,NULL,NULL,NULL);

/*!40000 ALTER TABLE `admin_user` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_user_auth_notification
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_auth_notification`;

CREATE TABLE `admin_user_auth_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `auth_id` int(11) NOT NULL,
  `is_muted` tinyint(1) DEFAULT 0,
  `model_latest_pk_value` varchar(255) DEFAULT NULL,
  `model_class` varchar(255) DEFAULT NULL,
  `created_at` int(11) DEFAULT NULL,
  `updated_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `auth_id` (`auth_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user_device
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_device`;

CREATE TABLE `admin_user_device` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `auth_key` varchar(190) NOT NULL,
  `user_agent` varchar(255) NOT NULL,
  `user_agent_checksum` varchar(255) NOT NULL,
  `created_at` int(11) DEFAULT NULL,
  `updated_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_key` (`auth_key`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_group`;

CREATE TABLE `admin_user_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_user_id` (`user_id`),
  KEY `index_group_id` (`group_id`),
  KEY `index_user_id_group_id` (`user_id`,`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `admin_user_group` WRITE;
/*!40000 ALTER TABLE `admin_user_group` DISABLE KEYS */;

INSERT INTO `admin_user_group` (`id`, `user_id`, `group_id`)
VALUES
	(1,1,1);

/*!40000 ALTER TABLE `admin_user_group` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table admin_user_login
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_login`;

CREATE TABLE `admin_user_login` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `timestamp_create` int(11) NOT NULL,
  `auth_token` varchar(120) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `is_destroyed` tinyint(1) DEFAULT 1,
  `user_agent` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_user_id` (`user_id`),
  KEY `index_ip` (`ip`),
  KEY `index_auth_token` (`auth_token`),
  KEY `index_is_destroyed` (`is_destroyed`),
  KEY `index_user_id_timestamp_create` (`user_id`,`timestamp_create`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user_login_lockout
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_login_lockout`;

CREATE TABLE `admin_user_login_lockout` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `attempt_count` int(11) DEFAULT 0,
  `created_at` int(11) DEFAULT NULL,
  `updated_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user_online
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_online`;

CREATE TABLE `admin_user_online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `last_timestamp` int(11) NOT NULL,
  `invoken_route` varchar(120) NOT NULL,
  `lock_pk` varchar(255) DEFAULT NULL,
  `lock_table` varchar(255) DEFAULT NULL,
  `lock_translation` varchar(255) DEFAULT NULL,
  `lock_translation_args` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table admin_user_request
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user_request`;

CREATE TABLE `admin_user_request` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `request_url` varchar(255) NOT NULL,
  `request_method` varchar(255) NOT NULL,
  `response_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `index_admin_user_admin_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_block
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_block`;

CREATE TABLE `cms_block` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `class` varchar(255) NOT NULL,
  `is_disabled` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_group_id` (`group_id`),
  KEY `index_class` (`class`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_block` WRITE;
/*!40000 ALTER TABLE `cms_block` DISABLE KEYS */;

INSERT INTO `cms_block` (`id`, `group_id`, `class`, `is_disabled`)
VALUES
	(1,1,'\\luya\\cms\\frontend\\blocks\\HtmlBlock',0),
	(2,1,'\\luya\\cms\\frontend\\blocks\\ModuleBlock',0);

/*!40000 ALTER TABLE `cms_block` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_block_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_block_group`;

CREATE TABLE `cms_block_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `identifier` varchar(120) NOT NULL,
  `created_timestamp` int(11) DEFAULT 0,
  `class` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_block_group` WRITE;
/*!40000 ALTER TABLE `cms_block_group` DISABLE KEYS */;

INSERT INTO `cms_block_group` (`id`, `name`, `is_deleted`, `identifier`, `created_timestamp`, `class`)
VALUES
	(1,'block_group_dev_elements',0,'development-group',1513077718,'\\luya\\cms\\frontend\\blockgroups\\DevelopmentGroup');

/*!40000 ALTER TABLE `cms_block_group` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_config`;

CREATE TABLE `cms_config` (
  `name` varchar(80) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_layout
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_layout`;

CREATE TABLE `cms_layout` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `json_config` text DEFAULT NULL,
  `view_file` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_layout` WRITE;
/*!40000 ALTER TABLE `cms_layout` DISABLE KEYS */;

INSERT INTO `cms_layout` (`id`, `name`, `json_config`, `view_file`)
VALUES
	(1,'Main','{\"placeholders\":[[{\"label\":\"Content\",\"var\":\"content\"}]]}','main.php'),
	(2,'Sidebar','{\"placeholders\":[[{\"label\":\"Content\",\"var\":\"content\"},{\"label\":\"Sidebar\",\"var\":\"sidebar\"}]]}','sidebar.php');

/*!40000 ALTER TABLE `cms_layout` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_log`;

CREATE TABLE `cms_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT 0,
  `is_insertion` tinyint(1) DEFAULT 0,
  `is_update` tinyint(1) DEFAULT 0,
  `is_deletion` tinyint(1) DEFAULT 0,
  `timestamp` int(11) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `data_json` text DEFAULT NULL,
  `table_name` varchar(120) DEFAULT NULL,
  `row_id` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_nav
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav`;

CREATE TABLE `cms_nav` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nav_container_id` int(11) NOT NULL,
  `parent_nav_id` int(11) NOT NULL,
  `sort_index` int(11) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `is_hidden` tinyint(1) DEFAULT 0,
  `is_home` tinyint(1) DEFAULT 0,
  `is_offline` tinyint(1) DEFAULT 0,
  `is_draft` tinyint(1) DEFAULT 0,
  `layout_file` varchar(255) DEFAULT NULL,
  `publish_from` int(11) DEFAULT NULL,
  `publish_till` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_nav_container` (`nav_container_id`),
  KEY `index_parent_nav_id` (`parent_nav_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_nav` WRITE;
/*!40000 ALTER TABLE `cms_nav` DISABLE KEYS */;

INSERT INTO `cms_nav` (`id`, `nav_container_id`, `parent_nav_id`, `sort_index`, `is_deleted`, `is_hidden`, `is_home`, `is_offline`, `is_draft`, `layout_file`, `publish_from`, `publish_till`)
VALUES
	(1,1,0,1,0,0,1,0,0,NULL,NULL,NULL),
	(2,1,0,2,0,0,0,0,0,NULL,NULL,NULL),
	(3,1,0,3,0,0,0,0,0,NULL,NULL,NULL),
	(4,1,0,4,0,0,0,0,0,NULL,NULL,NULL),
	(5,1,0,5,0,0,0,0,0,NULL,NULL,NULL),
	(6,1,0,6,0,0,0,0,0,NULL,NULL,NULL),
	(7,1,0,7,0,0,0,0,0,NULL,NULL,NULL),
	(8,1,2,1,0,0,0,0,0,NULL,NULL,NULL),
	(9,1,2,2,0,0,0,0,0,NULL,NULL,NULL),
	(10,1,2,3,0,0,0,0,0,NULL,NULL,NULL),
	(11,1,2,4,0,0,0,0,0,NULL,NULL,NULL),
	(12,1,2,5,0,0,0,0,0,NULL,NULL,NULL),
	(13,1,2,6,0,0,0,0,0,NULL,NULL,NULL),
	(14,1,0,8,0,0,0,0,0,NULL,NULL,NULL),
	(15,1,0,9,0,0,0,0,0,NULL,NULL,NULL),
	(16,1,0,10,0,0,0,0,0,NULL,NULL,NULL),
	(17,1,0,11,0,0,0,0,0,NULL,NULL,NULL);

/*!40000 ALTER TABLE `cms_nav` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_nav_container
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_container`;

CREATE TABLE `cms_nav_container` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `website_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(180) NOT NULL,
  `alias` varchar(180) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_nav_container` WRITE;
/*!40000 ALTER TABLE `cms_nav_container` DISABLE KEYS */;

INSERT INTO `cms_nav_container` (`id`, `website_id`, `name`, `alias`, `is_deleted`)
VALUES
	(1,1,'Default Container','default',0);

/*!40000 ALTER TABLE `cms_nav_container` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_nav_item
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item`;

CREATE TABLE `cms_nav_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nav_id` int(11) NOT NULL,
  `lang_id` int(11) NOT NULL,
  `nav_item_type` int(11) NOT NULL,
  `nav_item_type_id` int(11) NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `update_user_id` int(11) NOT NULL,
  `timestamp_create` int(11) DEFAULT 0,
  `timestamp_update` int(11) DEFAULT 0,
  `title` varchar(180) NOT NULL,
  `alias` varchar(80) NOT NULL,
  `description` text DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `title_tag` varchar(255) DEFAULT NULL,
  `image_id` int(11) DEFAULT 0,
  `is_url_strict_parsing_disabled` int(11) DEFAULT 0,
  `is_cacheable` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_alias` (`alias`),
  KEY `index_nav_id` (`nav_id`),
  KEY `index_lang_id` (`lang_id`),
  KEY `index_nav_item_type_id` (`nav_item_type_id`),
  KEY `index_create_user_id` (`create_user_id`),
  KEY `index_update_user_id` (`update_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_nav_item` WRITE;
/*!40000 ALTER TABLE `cms_nav_item` DISABLE KEYS */;

INSERT INTO `cms_nav_item` (`id`, `nav_id`, `lang_id`, `nav_item_type`, `nav_item_type_id`, `create_user_id`, `update_user_id`, `timestamp_create`, `timestamp_update`, `title`, `alias`, `description`, `keywords`, `title_tag`, `image_id`, `is_url_strict_parsing_disabled`, `is_cacheable`)
VALUES
	(1,1,1,1,1,1,1,1513077719,0,'Homepage','homepage',NULL,NULL,NULL,0,0,0),
	(2,2,1,1,2,1,1,1513077719,0,'Page 1','page1','Description of Page 1',NULL,NULL,0,0,0),
	(3,3,1,1,3,1,1,1513077719,0,'Page 2','page2','Description of Page 2',NULL,NULL,0,0,0),
	(4,4,1,1,4,1,1,1513077719,0,'Page 3','page3','Description of Page 3',NULL,NULL,0,0,0),
	(5,5,1,1,5,1,1,1513077719,0,'Page 4','page4','Description of Page 4',NULL,NULL,0,0,0),
	(6,6,1,1,6,1,1,1513077719,0,'Page 5','page5','Description of Page 5',NULL,NULL,0,0,0),
	(7,7,1,1,7,1,1,1513077719,0,'Page 6','page6','Description of Page 6',NULL,NULL,0,0,0),
	(8,8,1,1,8,1,1,1513077719,0,'Page 1','p1-page1','Description of Page 1',NULL,NULL,0,0,0),
	(9,9,1,1,9,1,1,1513077720,0,'Page 2','p1-page2','Description of Page 2',NULL,NULL,0,0,0),
	(10,10,1,1,10,1,1,1513077720,0,'Page 3','p1-page3','Description of Page 3',NULL,NULL,0,0,0),
	(11,11,1,1,11,1,1,1513077720,0,'Page 4','p1-page4','Description of Page 4',NULL,NULL,0,0,0),
	(12,12,1,1,12,1,1,1513077720,0,'Page 5','p1-page5','Description of Page 5',NULL,NULL,0,0,0),
	(13,13,1,1,13,1,1,1513077720,0,'Page 6','p1-page6','Description of Page 6',NULL,NULL,0,0,0),
	(14,14,1,3,1,1,1,1513077720,0,'Redirect to Page 1','redirect-1','Description of Redirect to Page 1',NULL,NULL,0,0,0),
	(15,15,1,3,2,1,1,1513077720,0,'Redirect to Page 2','redirect-2','Description of Redirect to Page 2',NULL,NULL,0,0,0),
	(16,16,1,3,3,1,1,1513077720,0,'Redirect to Sub Page 2','redirect-3','Description of Redirect to Sub Page 2',NULL,NULL,0,0,0),
	(17,17,1,3,4,1,1,1513077720,0,'Redirect to luya.io','redirect-4','Description of Redirect to luya.io',NULL,NULL,0,0,0);

/*!40000 ALTER TABLE `cms_nav_item` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_nav_item_module
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_module`;

CREATE TABLE `cms_nav_item_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(255) NOT NULL,
  `controller_name` varchar(255) DEFAULT NULL,
  `action_name` varchar(255) DEFAULT NULL,
  `action_params` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_nav_item_page
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_page`;

CREATE TABLE `cms_nav_item_page` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `layout_id` int(11) NOT NULL,
  `nav_item_id` int(11) NOT NULL,
  `timestamp_create` int(11) NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `version_alias` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_layout_id` (`layout_id`),
  KEY `index_nav_item_id` (`nav_item_id`),
  KEY `index_create_user_id` (`create_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_nav_item_page` WRITE;
/*!40000 ALTER TABLE `cms_nav_item_page` DISABLE KEYS */;

INSERT INTO `cms_nav_item_page` (`id`, `layout_id`, `nav_item_id`, `timestamp_create`, `create_user_id`, `version_alias`)
VALUES
	(1,1,1,1513077719,1,'Initial'),
	(2,1,2,1513077719,1,'Initial'),
	(3,1,3,1513077719,1,'Initial'),
	(4,1,4,1513077719,1,'Initial'),
	(5,1,5,1513077719,1,'Initial'),
	(6,1,6,1513077719,1,'Initial'),
	(7,1,7,1513077719,1,'Initial'),
	(8,1,8,1513077719,1,'Initial'),
	(9,1,9,1513077719,1,'Initial'),
	(10,1,10,1513077720,1,'Initial'),
	(11,1,11,1513077720,1,'Initial'),
	(12,1,12,1513077720,1,'Initial'),
	(13,1,13,1513077720,1,'Initial');

/*!40000 ALTER TABLE `cms_nav_item_page` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_nav_item_page_block_item
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_page_block_item`;

CREATE TABLE `cms_nav_item_page_block_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block_id` int(11) NOT NULL,
  `placeholder_var` varchar(80) NOT NULL,
  `nav_item_page_id` int(11) DEFAULT NULL,
  `prev_id` int(11) DEFAULT NULL,
  `json_config_values` text DEFAULT NULL,
  `json_config_cfg_values` text DEFAULT NULL,
  `is_dirty` tinyint(1) DEFAULT 0,
  `create_user_id` int(11) DEFAULT 0,
  `update_user_id` int(11) DEFAULT 0,
  `timestamp_create` int(11) DEFAULT 0,
  `timestamp_update` int(11) DEFAULT 0,
  `sort_index` int(11) DEFAULT 0,
  `is_hidden` tinyint(1) DEFAULT 0,
  `variation` varchar(255) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `index_block_id` (`block_id`),
  KEY `index_placeholder_var` (`placeholder_var`),
  KEY `index_nav_item_page_id` (`nav_item_page_id`),
  KEY `index_prev_id` (`prev_id`),
  KEY `index_create_user_id` (`create_user_id`),
  KEY `index_update_user_id` (`update_user_id`),
  KEY `index_nipi_pv_pi_ih_si` (`nav_item_page_id`,`placeholder_var`,`prev_id`,`is_hidden`,`sort_index`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_nav_item_redirect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_redirect`;

CREATE TABLE `cms_nav_item_redirect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `target` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_nav_item_redirect` WRITE;
/*!40000 ALTER TABLE `cms_nav_item_redirect` DISABLE KEYS */;

INSERT INTO `cms_nav_item_redirect` (`id`, `type`, `value`, `target`)
VALUES
	(1,1,'2',''),
	(2,1,'3',''),
	(3,1,'8',''),
	(4,2,'https://luya.io','');

/*!40000 ALTER TABLE `cms_nav_item_redirect` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table cms_nav_permission
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_permission`;

CREATE TABLE `cms_nav_permission` (
  `group_id` int(11) NOT NULL,
  `nav_id` int(11) NOT NULL,
  `inheritance` tinyint(1) DEFAULT 0,
  KEY `index_group_id` (`group_id`),
  KEY `index_nav_id` (`nav_id`),
  KEY `index_group_id_nav_id` (`group_id`,`nav_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_nav_property
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_property`;

CREATE TABLE `cms_nav_property` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nav_id` int(11) NOT NULL,
  `admin_prop_id` int(11) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_nav_id` (`nav_id`),
  KEY `index_admin_prop_id` (`admin_prop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_redirect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_redirect`;

CREATE TABLE `cms_redirect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp_create` int(11) DEFAULT NULL,
  `catch_path` varchar(255) NOT NULL,
  `redirect_path` varchar(255) NOT NULL,
  `redirect_status_code` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_theme
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_theme`;

CREATE TABLE `cms_theme` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `base_path` varchar(255) NOT NULL,
  `json_config` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `base_path` (`base_path`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table cms_website
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_website`;

CREATE TABLE `cms_website` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `host` varchar(255) NOT NULL,
  `aliases` varchar(255) DEFAULT NULL,
  `redirect_to_host` tinyint(1) NOT NULL DEFAULT 0,
  `theme_id` int(11) DEFAULT NULL,
  `default_lang` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `host` (`host`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `cms_website` WRITE;
/*!40000 ALTER TABLE `cms_website` DISABLE KEYS */;

INSERT INTO `cms_website` (`id`, `name`, `is_default`, `is_active`, `is_deleted`, `host`, `aliases`, `redirect_to_host`, `theme_id`, `default_lang`)
VALUES
	(1,'default',1,1,0,'',NULL,0,NULL,NULL);

/*!40000 ALTER TABLE `cms_website` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table estore_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_config`;

CREATE TABLE `estore_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) DEFAULT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'text',
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_currency
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_currency`;

CREATE TABLE `estore_currency` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_base` tinyint(1) DEFAULT 0,
  `iso` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `iso` (`iso`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `estore_currency` WRITE;
/*!40000 ALTER TABLE `estore_currency` DISABLE KEYS */;

INSERT INTO `estore_currency` (`id`, `is_base`, `iso`, `name`, `value`)
VALUES
	(1,0,'AFN','Afghan Afghani',1),
	(2,0,'ALL','Albanian Lek',1),
	(3,0,'DZD','Algerian Dinar',1),
	(4,0,'AOA','Angolan Kwanza',1),
	(5,0,'ARS','Argentine Peso',1),
	(6,0,'AMD','Armenian Dram',1),
	(7,0,'AWG','Aruban Florin',1),
	(8,0,'AUD','Australian Dollar',1),
	(9,0,'AZN','Azerbaijani Manat',1),
	(10,0,'AZM','Azerbaijani Manat (1993–2006)',1),
	(11,0,'BSD','Bahamian Dollar',1),
	(12,0,'BHD','Bahraini Dinar',1),
	(13,0,'BDT','Bangladeshi Taka',1),
	(14,0,'BBD','Barbadian Dollar',1),
	(15,0,'BYR','Belarusian Ruble',1),
	(16,0,'BZD','Belize Dollar',1),
	(17,0,'BMD','Bermudan Dollar',1),
	(18,0,'BTN','Bhutanese Ngultrum',1),
	(19,0,'BOB','Bolivian Boliviano',1),
	(20,0,'BAM','Bosnia-Herzegovina Convertible Mark',1),
	(21,0,'BWP','Botswanan Pula',1),
	(22,0,'BRL','Brazilian Real',1),
	(23,0,'GBP','British Pound Sterling',1),
	(24,0,'BND','Brunei Dollar',1),
	(25,0,'BGN','Bulgarian Lev',1),
	(26,0,'BUK','Burmese Kyat',1),
	(27,0,'BIF','Burundian Franc',1),
	(28,0,'XOF','CFA Franc BCEAO',1),
	(29,0,'XPF','CFP Franc',1),
	(30,0,'KHR','Cambodian Riel',1),
	(31,0,'CAD','Canadian Dollar',1),
	(32,0,'CVE','Cape Verdean Escudo',1),
	(33,0,'KYD','Cayman Islands Dollar',1),
	(34,0,'CLP','Chilean Peso',1),
	(35,0,'CNY','Chinese Yuan',1),
	(36,0,'COP','Colombian Peso',1),
	(37,0,'KMF','Comorian Franc',1),
	(38,0,'CDF','Congolese Franc',1),
	(39,0,'CRC','Costa Rican Colón',1),
	(40,0,'HRK','Croatian Kuna',1),
	(41,0,'CUP','Cuban Peso',1),
	(42,0,'CZK','Czech Republic Koruna',1),
	(43,0,'DKK','Danish Krone',1),
	(44,0,'DJF','Djiboutian Franc',1),
	(45,0,'DOP','Dominican Peso',1),
	(46,0,'XCD','East Caribbean Dollar',1),
	(47,0,'EGP','Egyptian Pound',1),
	(48,0,'GQE','Equatorial Guinean Ekwele',1),
	(49,0,'ERN','Eritrean Nakfa',1),
	(50,0,'EEK','Estonian Kroon',1),
	(51,0,'ETB','Ethiopian Birr',1),
	(52,1,'EUR','Euro',1),
	(53,0,'FKP','Falkland Islands Pound',1),
	(54,0,'FJD','Fijian Dollar',1),
	(55,0,'GMD','Gambian Dalasi',1),
	(56,0,'GEK','Georgian Kupon Larit',1),
	(57,0,'GEL','Georgian Lari',1),
	(58,0,'GHS','Ghanaian Cedi',1),
	(59,0,'GIP','Gibraltar Pound',1),
	(60,0,'GTQ','Guatemalan Quetzal',1),
	(61,0,'GNF','Guinean Franc',1),
	(62,0,'GYD','Guyanaese Dollar',1),
	(63,0,'HTG','Haitian Gourde',1),
	(64,0,'HNL','Honduran Lempira',1),
	(65,0,'HKD','Hong Kong Dollar',1),
	(66,0,'HUF','Hungarian Forint',1),
	(67,0,'ISK','Icelandic Króna',1),
	(68,0,'INR','Indian Rupee',1),
	(69,0,'IDR','Indonesian Rupiah',1),
	(70,0,'IRR','Iranian Rial',1),
	(71,0,'IQD','Iraqi Dinar',1),
	(72,0,'ILS','Israeli New Sheqel',1),
	(73,0,'JMD','Jamaican Dollar',1),
	(74,0,'JPY','Japanese Yen',1),
	(75,0,'JOD','Jordanian Dinar',1),
	(76,0,'KZT','Kazakhstani Tenge',1),
	(77,0,'KES','Kenyan Shilling',1),
	(78,0,'KWD','Kuwaiti Dinar',1),
	(79,0,'KGS','Kyrgystani Som',1),
	(80,0,'LAK','Laotian Kip',1),
	(81,0,'LVL','Latvian Lats',1),
	(82,0,'LBP','Lebanese Pound',1),
	(83,0,'LSL','Lesotho Loti',1),
	(84,0,'LRD','Liberian Dollar',1),
	(85,0,'LYD','Libyan Dinar',1),
	(86,0,'LTL','Lithuanian Litas',1),
	(87,0,'MOP','Macanese Pataca',1),
	(88,0,'MKD','Macedonian Denar',1),
	(89,0,'MGA','Malagasy Ariary',1),
	(90,0,'MWK','Malawian Kwacha',1),
	(91,0,'MYR','Malaysian Ringgit',1),
	(92,0,'MVR','Maldivian Rufiyaa',1),
	(93,0,'MRO','Mauritanian Ouguiya',1),
	(94,0,'MUR','Mauritian Rupee',1),
	(95,0,'MXN','Mexican Peso',1),
	(96,0,'MDL','Moldovan Leu',1),
	(97,0,'MNT','Mongolian Tugrik',1),
	(98,0,'MAD','Moroccan Dirham',1),
	(99,0,'MZN','Mozambican Metical',1),
	(100,0,'MMK','Myanmar Kyat',1),
	(101,0,'NAD','Namibian Dollar',1),
	(102,0,'NPR','Nepalese Rupee',1),
	(103,0,'ANG','Netherlands Antillean Guilder',1),
	(104,0,'TWD','New Taiwan Dollar',1),
	(105,0,'NZD','New Zealand Dollar',1),
	(106,0,'NIC','Nicaraguan Córdoba (1988–1991)',1),
	(107,0,'NGN','Nigerian Naira',1),
	(108,0,'KPW','North Korean Won',1),
	(109,0,'NOK','Norwegian Krone',1),
	(110,0,'OMR','Omani Rial',1),
	(111,0,'PKR','Pakistani Rupee',1),
	(112,0,'PAB','Panamanian Balboa',1),
	(113,0,'PGK','Papua New Guinean Kina',1),
	(114,0,'PYG','Paraguayan Guarani',1),
	(115,0,'PEN','Peruvian Nuevo Sol',1),
	(116,0,'PHP','Philippine Peso',1),
	(117,0,'PLN','Polish Zloty',1),
	(118,0,'QAR','Qatari Rial',1),
	(119,0,'RHD','Rhodesian Dollar',1),
	(120,0,'RON','Romanian Leu',1),
	(121,0,'ROL','Romanian Leu (1952–2006)',1),
	(122,0,'RUB','Russian Ruble',1),
	(123,0,'RWF','Rwandan Franc',1),
	(124,0,'SHP','Saint Helena Pound',1),
	(125,0,'SVC','Salvadoran Colón',1),
	(126,0,'WST','Samoan Tala',1),
	(127,0,'SAR','Saudi Riyal',1),
	(128,0,'RSD','Serbian Dinar',1),
	(129,0,'SCR','Seychellois Rupee',1),
	(130,0,'SLL','Sierra Leonean Leone',1),
	(131,0,'SGD','Singapore Dollar',1),
	(132,0,'SKK','Slovak Koruna',1),
	(133,0,'SBD','Solomon Islands Dollar',1),
	(134,0,'SOS','Somali Shilling',1),
	(135,0,'ZAR','South African Rand',1),
	(136,0,'KRW','South Korean Won',1),
	(137,0,'LKR','Sri Lankan Rupee',1),
	(138,0,'SDG','Sudanese Pound',1),
	(139,0,'SRD','Surinamese Dollar',1),
	(140,0,'SZL','Swazi Lilangeni',1),
	(141,0,'SEK','Swedish Krona',1),
	(142,0,'CHF','Swiss Franc',1),
	(143,0,'SYP','Syrian Pound',1),
	(144,0,'STD','São Tomé and Príncipe Dobra',1),
	(145,0,'TJS','Tajikistani Somoni',1),
	(146,0,'TZS','Tanzanian Shilling',1),
	(147,0,'THB','Thai Baht',1),
	(148,0,'TOP','Tongan Pa´anga',1),
	(149,0,'TTD','Trinidad and Tobago Dollar',1),
	(150,0,'TND','Tunisian Dinar',1),
	(151,0,'TRY','Turkish Lira',1),
	(152,0,'TRL','Turkish Lira (1922–2005)',1),
	(153,0,'TMM','Turkmenistani Manat (1993–2009)',1),
	(154,0,'USD','US Dollar',1),
	(155,0,'UGX','Ugandan Shilling',1),
	(156,0,'UAH','Ukrainian Hryvnia',1),
	(157,0,'AED','United Arab Emirates Dirham',1),
	(158,0,'UYU','Uruguayan Peso',1),
	(159,0,'UZS','Uzbekistan Som',1),
	(160,0,'VUV','Vanuatu Vatu',1),
	(161,0,'VEF','Venezuelan Bolívar',1),
	(162,0,'VEB','Venezuelan Bolívar (1871–2008)',1),
	(163,0,'VND','Vietnamese Dong',1),
	(164,0,'CHE','WIR Euro',1),
	(165,0,'CHW','WIR Franc',1),
	(166,0,'YER','Yemeni Rial',1),
	(167,0,'ZMK','Zambian Kwacha (1968–2012)',1),
	(168,0,'ZWD','Zimbabwean Dollar (1980–2008)',1);

/*!40000 ALTER TABLE `estore_currency` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table estore_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_group`;

CREATE TABLE `estore_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_group_id` int(11) DEFAULT 0,
  `cover_image_id` int(11) DEFAULT NULL,
  `images_list` text DEFAULT NULL,
  `name` text NOT NULL,
  `teaser` text DEFAULT NULL,
  `text` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_producer
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_producer`;

CREATE TABLE `estore_producer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_product
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_product`;

CREATE TABLE `estore_product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `type` smallint(6) NOT NULL DEFAULT 0 COMMENT '0 = simple, 1 = configurable, 2 = virtual',
  `visibility` smallint(6) NOT NULL DEFAULT 1,
  `sku` varchar(255) DEFAULT NULL,
  `qty_available` int(11) DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_product_attribute_value
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_product_attribute_value`;

CREATE TABLE `estore_product_attribute_value` (
  `product_id` int(11) NOT NULL,
  `set_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`product_id`,`attribute_id`,`set_id`),
  KEY `estore_product_attribute_value_set_id_fk` (`set_id`),
  KEY `estore_product_attribute_value_attribute_id_fk` (`attribute_id`),
  CONSTRAINT `estore_product_attribute_value_attribute_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `estore_set_attribute` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `estore_product_attribute_value_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `estore_product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `estore_product_attribute_value_set_id_fk` FOREIGN KEY (`set_id`) REFERENCES `estore_set` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_product_group_ref
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_product_group_ref`;

CREATE TABLE `estore_product_group_ref` (
  `group_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  PRIMARY KEY (`group_id`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_product_price
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_product_price`;

CREATE TABLE `estore_product_price` (
  `product_id` int(11) NOT NULL,
  `currency_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL COMMENT '0 = which means this price counts independent about how many items u have in your basket | 10 = When you hvae 10 or more items in your basket, this price is used to calculate for each item.',
  `price` float NOT NULL,
  PRIMARY KEY (`product_id`,`currency_id`,`qty`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_product_set_ref
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_product_set_ref`;

CREATE TABLE `estore_product_set_ref` (
  `product_id` int(11) NOT NULL,
  `set_id` int(11) NOT NULL,
  PRIMARY KEY (`product_id`,`set_id`),
  KEY `estore_product_set_ref_set_id_fk` (`set_id`),
  CONSTRAINT `estore_product_set_ref_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `estore_product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `estore_product_set_ref_set_id_fk` FOREIGN KEY (`set_id`) REFERENCES `estore_set` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_set
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_set`;

CREATE TABLE `estore_set` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_set_attribute
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_set_attribute`;

CREATE TABLE `estore_set_attribute` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `input` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `values` text DEFAULT NULL,
  `is_i18n` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table estore_set_attribute_ref
# ------------------------------------------------------------

DROP TABLE IF EXISTS `estore_set_attribute_ref`;

CREATE TABLE `estore_set_attribute_ref` (
  `set_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  PRIMARY KEY (`set_id`,`attribute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table migration
# ------------------------------------------------------------

DROP TABLE IF EXISTS `migration`;

CREATE TABLE `migration` (
  `version` varchar(180) NOT NULL,
  `apply_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `migration` WRITE;
/*!40000 ALTER TABLE `migration` DISABLE KEYS */;

INSERT INTO `migration` (`version`, `apply_time`)
VALUES
	('m000000_000000_base',1513077715),
	('m141104_104622_admin_group',1513077715),
	('m141104_104631_admin_user_group',1513077715),
	('m141104_114809_admin_user',1513077716),
	('m141203_121042_admin_lang',1513077716),
	('m141203_143052_cms_cat',1513077716),
	('m141203_143059_cms_nav',1513077716),
	('m141203_143111_cms_nav_item',1513077716),
	('m141208_134038_cms_nav_item_page',1513077716),
	('m150106_095003_cms_layout',1513077716),
	('m150108_154017_cms_block',1513077716),
	('m150108_155009_cms_nav_item_page_block_item',1513077716),
	('m150122_125429_cms_nav_item_module',1513077716),
	('m150204_144806_news_article',1567056495),
	('m150205_141350_block_group',1513077716),
	('m150304_152220_admin_storage_folder',1513077716),
	('m150304_152238_admin_storage_file',1513077716),
	('m150304_152244_admin_storage_filter',1513077716),
	('m150304_152250_admin_storage_effect',1513077716),
	('m150304_152256_admin_storage_image',1513077716),
	('m150309_142652_admin_storage_filter_chain',1513077716),
	('m150323_125407_admin_auth',1513077716),
	('m150323_132625_admin_group_auth',1513077716),
	('m150331_125022_admin_ngrest_log',1513077716),
	('m150428_095829_news_cat',1567056495),
	('m150615_094744_admin_user_login',1513077716),
	('m150617_200836_admin_user_online',1513077716),
	('m150626_084948_admin_search_data',1513077716),
	('m150915_081559_admin_config',1513077716),
	('m150924_112309_cms_nav_prop',1513077717),
	('m150924_120914_admin_prop',1513077717),
	('m151012_072207_cms_log',1513077717),
	('m151022_143429_cms_nav_item_redirect',1513077717),
	('m151026_161841_admin_tag',1513077717),
	('m160629_092417_cmspermissiontable',1513077717),
	('m160915_081618_create_admin_logger_table',1513077717),
	('m161212_084323_add_teaser_field',1567056496),
	('m161219_150240_admin_lang_soft_delete',1513077717),
	('m161220_183300_lcp_base_tables',1513077717),
	('m170116_120553_cms_block_variation_field',1513077717),
	('m170131_104109_user_model_updates',1513077717),
	('m170218_215610_cms_nav_layout_file',1513077717),
	('m170301_084325_cms_config',1513077717),
	('m170515_115236_basetables',1567056497),
	('m170619_103728_cms_blocksettings',1513077717),
	('m170926_144137_add_admin_user_session_id_column',1513077718),
	('m170926_164913_add_ngrest_log_diff_data',1513077718),
	('m171003_065811_add_class_column_to_block_group_table',1513077718),
	('m171009_083835_add_admin_user_login_destroy_info',1513077718),
	('m171121_170909_add_publish_at_date',1513077718),
	('m171129_104706_config_add_system_type',1513077718),
	('m171206_113949_cms_redirection_table',1513077718),
	('m180123_070338_SchedulerJob',1567056497),
	('m180214_134657_system_user_ngrest_deletion',1567056497),
	('m180317_170227_ScheduleJobType',1567056497),
	('m180326_170839_file_disposition',1567056497),
	('m180412_092824_user_security_columns_v12',1567056498),
	('m180527_225613_user_login_ipv6',1567056498),
	('m180619_134519_indexes',1567056498),
	('m180723_120432_indexes',1567056500),
	('m180723_123237_indexes',1567056501),
	('m181018_195533_basecurrencies',1567056501),
	('m181020_182244_config',1567056501),
	('m181023_135132_scheduler',1567056502),
	('m181113_120432_user_index',1567056502),
	('m190219_142706_og_image',1567056585),
	('m190220_105505_cms_redirect_target_field',1567056631),
	('m190227_123549_cms_nav_item_strict_url_parsing',1567056651),
	('m190327_140741_auth_pool_field',1567056655),
	('m190508_142342_admin_user_api_request',1567056655),
	('m190521_145029_admin_user_notification',1567056655),
	('m190529_123549_cms_nav_item_module_route_and_params',1567056656),
	('m190624_112612_news_article_scheduler',1595054234),
	('m190728_084936_cms_theme',1567056656),
	('m200128_141129_v3_update',1595054235),
	('m200226_211908_nav_item_is_cacheable',1595054281),
	('m200706_202002_cms_website',1595054287),
	('m311024_135132_tag',1567056656);

/*!40000 ALTER TABLE `migration` ENABLE KEYS */;
UNLOCK TABLES;


# Dump of table news_article
# ------------------------------------------------------------

DROP TABLE IF EXISTS `news_article`;

CREATE TABLE `news_article` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` text DEFAULT NULL,
  `text` text DEFAULT NULL,
  `cat_id` int(11) DEFAULT 0,
  `image_id` int(11) DEFAULT 0,
  `image_list` text DEFAULT NULL,
  `file_list` text DEFAULT NULL,
  `create_user_id` int(11) DEFAULT 0,
  `update_user_id` int(11) DEFAULT 0,
  `timestamp_create` int(11) DEFAULT 0,
  `timestamp_update` int(11) DEFAULT 0,
  `is_deleted` tinyint(1) DEFAULT 0,
  `teaser_text` text DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table news_cat
# ------------------------------------------------------------

DROP TABLE IF EXISTS `news_cat`;

CREATE TABLE `news_cat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table scheduler_job
# ------------------------------------------------------------

DROP TABLE IF EXISTS `scheduler_job`;

CREATE TABLE `scheduler_job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  `schedule` varchar(255) NOT NULL,
  `last_run` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `log` text DEFAULT NULL,
  `options` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table scheduler_job_type
# ------------------------------------------------------------

DROP TABLE IF EXISTS `scheduler_job_type`;

CREATE TABLE `scheduler_job_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `class` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
