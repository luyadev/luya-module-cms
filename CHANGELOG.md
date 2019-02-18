# CHANGELOG

All notable changes to this project will be documented in this file. This project make usage of the [Yii Versioning Strategy](https://github.com/yiisoft/yii2/blob/master/docs/internals/versions.md). In order to read more about upgrading and BC breaks have a look at the [UPGRADE Document](UPGRADE.md).

## 1.0.9 (18. February 2019)

### Fixed

+ [#139](https://github.com/luyadev/luya-module-cms/issues/139) Stop hiding the block toolbar on drag because that caused issues in certain browsers.
+ [#177](https://github.com/luyadev/luya-module-cms/issues/177) Use dynamic file paths for cmslayouts import command.
+ [#170](https://github.com/luyadev/luya-module-cms/issues/170) Next and prev sibling functions in menu item not sorted correctly.
+ [#181](https://github.com/luyadev/luya-module-cms/issues/181) Fixed a bug with menu when using limit and order methods together.

### Added

+ [#180](https://github.com/luyadev/luya-module-cms/issues/180) Add option for block placeholder iteration rendering.
+ [#173](https://github.com/luyadev/luya-module-cms/issues/173) LangSwitcher widget auto register hreflang link meta informations.
+ [#169](https://github.com/luyadev/luya-module-cms/issues/169) Add down() method to iterate trough parent items until a certain item condition.

## 1.0.8 (3. December 2018)

### Fixed

+ [#156](https://github.com/luyadev/luya-module-cms/pull/156) Fix bug with resolve the correct block path without set the `$module` property.
+ [#158](https://github.com/luyadev/luya-module-cms/issues/158) Fix bug with redirect table and not language prefix paths.
+ [#154](https://github.com/luyadev/luya-module-cms/issues/154) Fix bug where disabled blocks are visible in the block list of the CMS.

### Added

+ [#159](https://github.com/luyadev/luya-module-cms/issues/159) Added twitter card and canonical url informations with override options by keys.
+ [#86](https://github.com/luyadev/luya-module-cms/issues/86) Add option to set a variation as default value `asDefault()`.
+ [#83](https://github.com/luyadev/luya-module-cms/issues/83) Show block preview on hover menu.

## 1.0.7.2 (17. October 2018)

### Changed

+ [#42](https://github.com/luyadev/luya-module-cms/issues/42) Added styles to change the cursor from pointer to move after .5s of hover on the treeview item.
+ [#111](https://github.com/luyadev/luya-module-cms/issues/111) Updated CMS Cards and style for blocks. Spacing is now better if you have no placeholder title.

### Fixed

+ [#15](https://github.com/luyadev/luya-module-cms/issues/15) Store latest working cms page version in service in order to restore afterwards.
+ [#21](https://github.com/luyadev/luya-module-cms/issues/21) Fix issue when using templates with block placeholders.
+ [#147](https://github.com/luyadev/luya-module-cms/issues/147) Enable auto encoding for menu component, this disallow the usage of html code for page titles, descriptions and seo titles.
+ [#145](https://github.com/luyadev/luya-module-cms/issues/145) Fixed issue where preloading of models wont have any effect for page properties.

## 1.0.7.1 (8. October 2018)

+ [#144](https://github.com/luyadev/luya-module-cms/issues/144) Fixed problem with using of exiting object, this broke cms pages where the same block is used multiple times.

## 1.0.7 (8. October 2018)

+ [#143](https://github.com/luyadev/luya-module-cms/issues/143) Added block_class and block_class_name to block response in order to use as identifier for registering headless blocks instead of ID.

## 1.0.6 (3. September 2018)

### Changed

+ [#103](https://github.com/luyadev/luya-module-cms/issues/103) Switched page visibility indicator and logo position
+ [#107](https://github.com/luyadev/luya-module-cms/issues/107) Add all table fields into the rules defintion.

### Added

+ [#132](https://github.com/luyadev/luya-module-cms/pull/132) Added Polish translations.
+ [#84](https://github.com/luyadev/luya-module-cms/issues/84) Added index for FK fields.
+ [#107](https://github.com/luyadev/luya-module-cms/issues/107) Extend rules for nav item model.
+ [#109](https://github.com/luyadev/luya-module-cms/issues/109) Added cms admin module $cmsLayouts propertie to import cms layouts (if no frontend module is available, example headless usage).
+ [#110](https://github.com/luyadev/luya-module-cms/issues/110) Option to defined a folder with cms layouts (for headless usage).
+ [#6](https://github.com/luyadev/luya-module-cms/issues/6) Create page template from existing pages.

### Fixed

+ [#121](https://github.com/luyadev/luya-module-cms/issues/121) Blocks with configuration variables only where not editable.
+ [#14](https://github.com/luyadev/luya-module-cms/issues/14) Hide block toolbar on drag.
+ [#97](https://github.com/luyadev/luya-module-cms/issues/97) Fixed bug where not existing redirect page throws an exception.

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
