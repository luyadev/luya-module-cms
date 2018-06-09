# CHANGELOG

All notable changes to this project will be documented in this file. This project make usage of the [Yii Versioning Strategy](https://github.com/yiisoft/yii2/blob/master/docs/internals/versions.md). In order to read more about upgrading and BC breaks have a look at the [UPGRADE Document](UPGRADE.md).

## 1.0.5.1 (9. June 2018)

### Fixed

+ [#88](https://github.com/luyadev/luya-module-cms/issues/88) Fix regression with block caching if cache is not available.

## 1.0.5 (5. June 2018)

### Fixed

+ [#76](https://github.com/luyadev/luya-module-cms/issues/76) Fix strict di bug when creating a new cms page container.
+ [#13](https://github.com/luyadev/luya-module-cms/issues/13) Register assets of blocks and register them to app view (also with enabled cache).

### Added

+ [#80](https://github.com/luyadev/luya-module-cms/issues/80) Add luya\cms\LinkConverter in order to convert type and value informations to a luya\web\LinkInterface object.
+ [#79](https://github.com/luyadev/luya-module-cms/pull/79) Add new `TelephoneLink` class to support html anchor with "tel:".
+ [#77](https://github.com/luyadev/luya-module-cms/issues/77) Add new after resolve current event for menu item injection.
+ [#74](https://github.com/luyadev/luya-module-cms/issues/74) New active window in block view to see on which page a block is implemented.

### Changed

+ [#75](https://github.com/luyadev/luya-module-cms/issues/75) Nav model create* functions does now return the id of the given nav or nav item model.

## 1.0.4 (17. May 2018)

### Added

+ [#72](https://github.com/luyadev/luya-module-cms/issues/72) New `cms/page/cleanup` command to remove/cleanup all navigation items which are deleted.
+ [#70](https://github.com/luyadev/luya-module-cms/issues/70) New migrate and cleanup commands blocks as outdated blocks wont be deleted by the importer anymore.
+ [#68](https://github.com/luyadev/luya-module-cms/issues/68) Provide blocks by configure new `$blocks` property of the cms admin module. The path can either be a folder or a file. Multiple folders or files can be added by providing an array.
+ [#67](https://github.com/luyadev/luya-module-cms/issues/67) New `cms/block/find` command in order to search for blocks and display how many times its used in the content.

### Changed

+ [#52](https://github.com/luyadev/luya-module-cms/issues/52) Replaced `btn-toolbar` with `btn-outline-config`
+ [#64](https://github.com/luyadev/luya-module-cms/issues/64) Uglify javascript code.
+ [#61](https://github.com/luyadev/luya-module-cms/issues/61) Deprecated method `toNavItem()` in class `luya\cms\helpers\Url` in favor of `toMenuNavItem()` and also added new method `toMenuNav()`.

### Fixed

+ [#73](https://github.com/luyadev/luya-module-cms/issues/73) Wrong link definition for internal links directive.

## 1.0.3 (26. March 2018)

### Fixed

+ [#49](https://github.com/luyadev/luya-module-cms/pull/49) Editing a block, will clear the cache of first parent now.

### Added

+ [#50](https://github.com/luyadev/luya-module-cms/issues/50) Added new APIs for headless usage.

## 1.0.2 (9. March 2018)

### Fixed

+ [#46](https://github.com/luyadev/luya-module-cms/issues/46) Fixed caption issue with BlockHelper imageArrayUpload
+ [#45](https://github.com/luyadev/luya-module-cms/issues/45) Fixed PHP 7.2 compatibility bug.
+ [#44](https://github.com/luyadev/luya-module-cms/issues/44) Removed layouts add button.
+ [#40](https://github.com/luyadev/luya-module-cms/issues/40) Renamed main.min.js to main.js and updated the assets file
+ [#37](https://github.com/luyadev/luya-module-cms/issues/37) Updated toolbar color and added new LUYA Logo as SVG
+ [#39](https://github.com/luyadev/luya-module-cms/issues/39) Disallow trailing slashes in url parsing in order to prevent DC.
+ [#38](https://github.com/luyadev/luya-module-cms/pull/38) Fixed wrong namespace reference in BlockController.
+ [#1768](https://github.com/luyadev/luya/issues/1768) Use static render path for toolbar due to controller override for module context.
+ [#31](https://github.com/luyadev/luya-module-cms/issues/31) Fixed missing error handling for create page translation from existing version.
+ [#35](https://github.com/luyadev/luya-module-cms/issues/35) Do not render layout when RAW response format is given.

### Added

+ [#34](https://github.com/luyadev/luya-module-cms/issues/34) Add option to configure the preview url.
+ [#17](https://github.com/luyadev/luya-module-cms/issues/17) Create new page version if changing from other page types to "page" and no version is available.
+ [#12](https://github.com/luyadev/luya-module-cms/issues/12) Add new orderBy() method for sorting the query data.

## 1.0.1 (17. January 2018)

### Fixed

+ [#25](https://github.com/luyadev/luya-module-cms/issues/25) Hide deleted pages in dashboard object "last page updates".
+ [#3](https://github.com/luyadev/luya-module-cms/issues/3) Bootstrap apply only when module exists in modules list.
+ [#24](https://github.com/luyadev/luya-module-cms/issues/24) Fixed SCSS dependency issues with external luya-module-admin project links and missing bootstrap style functions
+ [#22](https://github.com/luyadev/luya-module-cms/issues/22) Fixed memory issue when creating new version from existing page with large amount of blocks.

### Added

+ [#19](https://github.com/luyadev/luya-module-cms/pull/19) Add Chinese Translations
+ [#18](https://github.com/luyadev/luya-module-cms/issues/18) When page is default version and online, the original site path will be used to preview the page.

## 1.0.0 (12, December 2017)

- First stable release.
