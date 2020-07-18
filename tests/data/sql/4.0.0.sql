# ************************************************************
# Sequel Pro SQL dump
# Version 5446
#
# https://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: 127.0.0.1 (MySQL 5.5.5-10.3.22-MariaDB-1:10.3.22+maria~bionic)
# Database: luya
# Generation Time: 2020-07-18 06:29:45 +0000
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table admin_group
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_group`;

CREATE TABLE `admin_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `text` text DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table admin_proxy_build
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_proxy_build`;

CREATE TABLE `admin_proxy_build` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `machine_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `build_token` varchar(190) NOT NULL,
  `config` text NOT NULL,
  `is_complet` tinyint(1) DEFAULT 0,
  `expiration_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `build_token` (`build_token`),
  KEY `index_machine_id` (`machine_id`),
  KEY `index_build_token` (`build_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table admin_proxy_machine
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_proxy_machine`;

CREATE TABLE `admin_proxy_machine` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `access_token` varchar(255) NOT NULL,
  `identifier` varchar(190) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `is_disabled` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`),
  KEY `index_access_token` (`access_token`),
  KEY `index_identifier` (`identifier`),
  KEY `index_is_deleted` (`is_deleted`),
  KEY `index_identifier_is_deleted` (`identifier`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table admin_tag
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_tag`;

CREATE TABLE `admin_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `translation` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_config
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_config`;

CREATE TABLE `cms_config` (
  `name` varchar(80) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_layout
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_layout`;

CREATE TABLE `cms_layout` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `json_config` text DEFAULT NULL,
  `view_file` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_nav
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav`;

CREATE TABLE `cms_nav` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nav_container_id` int(11) NOT NULL,
  `parent_nav_id` int(11) DEFAULT NULL,
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
  KEY `index_parent_nav_id` (`parent_nav_id`),
  CONSTRAINT `cms_nav_fk_container` FOREIGN KEY (`nav_container_id`) REFERENCES `cms_nav_container` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_nav_container
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_container`;

CREATE TABLE `cms_nav_container` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(180) NOT NULL,
  `alias` varchar(180) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0,
  `website_id` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
  `image_id` int(11) DEFAULT NULL,
  `is_url_strict_parsing_disabled` tinyint(1) DEFAULT 0,
  `is_cacheable` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `index_alias` (`alias`),
  KEY `index_nav_id` (`nav_id`),
  KEY `index_lang_id` (`lang_id`),
  KEY `index_nav_item_type_id` (`nav_item_type_id`),
  KEY `index_create_user_id` (`create_user_id`),
  KEY `index_update_user_id` (`update_user_id`),
  CONSTRAINT `cms_nav_item_fk_lang` FOREIGN KEY (`lang_id`) REFERENCES `admin_lang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cms_nav_item_fk_nav` FOREIGN KEY (`nav_id`) REFERENCES `cms_nav` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cms_nav_item_fk_type` FOREIGN KEY (`nav_item_type_id`) REFERENCES `cms_nav_item_page` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_nav_item_page
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_page`;

CREATE TABLE `cms_nav_item_page` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `layout_id` int(11) NOT NULL,
  `nav_item_id` int(11) DEFAULT NULL,
  `timestamp_create` int(11) NOT NULL,
  `create_user_id` int(11) NOT NULL,
  `version_alias` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_layout_id` (`layout_id`),
  KEY `index_nav_item_id` (`nav_item_id`),
  KEY `index_create_user_id` (`create_user_id`),
  CONSTRAINT `cms_nav_item_page_ibfk_1` FOREIGN KEY (`nav_item_id`) REFERENCES `cms_nav_item` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_nav_item_page_block_item
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_page_block_item`;

CREATE TABLE `cms_nav_item_page_block_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `block_id` int(11) NOT NULL,
  `placeholder_var` varchar(80) NOT NULL,
  `nav_item_page_id` int(11) NOT NULL,
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
  KEY `index_nipi_pv_pi_ih_si` (`nav_item_page_id`,`placeholder_var`,`prev_id`,`is_hidden`,`sort_index`),
  CONSTRAINT `cms_nav_item_page_block_item_fk_page` FOREIGN KEY (`nav_item_page_id`) REFERENCES `cms_nav_item_page` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table cms_nav_item_redirect
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cms_nav_item_redirect`;

CREATE TABLE `cms_nav_item_redirect` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `target` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
  KEY `index_admin_prop_id` (`admin_prop_id`),
  CONSTRAINT `cms_nav_property_fk_nav` FOREIGN KEY (`nav_id`) REFERENCES `cms_nav` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table migration
# ------------------------------------------------------------

DROP TABLE IF EXISTS `migration`;

CREATE TABLE `migration` (
  `version` varchar(180) NOT NULL,
  `apply_time` int(11) DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



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
