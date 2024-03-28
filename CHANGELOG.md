# CHANGELOG

All notable changes to this project will be documented in this file. This project adheres to [Semantic Versioning](https://semver.org/).
In order to read more about upgrading and BC breaks have a look at the [UPGRADE Document](UPGRADE.md).

## 5.1.1 (28. March 2024)

+ [#415](https://github.com/luyadev/luya-module-cms/pull/415) Fixed navItem relation for inactive page versions.
+ [#412](https://github.com/luyadev/luya-module-cms/pull/412) Fixed website relation for nav container (when accessing `navContainer->website`).
+ [#410](https://github.com/luyadev/luya-module-cms/pull/410) Disabled sorting functionality for the "group" extra field in the block CRUD interface due to an exception being thrown. This issue occurred because the field is declared as an `extraAttribute`.
+ [#409](https://github.com/luyadev/luya-module-cms/issues/409) Implemented a new validation check to prevent slug duplication within the same language and navigation hierarchy when creating a new page. This enhancement ensures unique page identification and avoids conflicts in site structure.

## 5.1.0 (7. February 2024)

> This release contains a very small change when using the block `getEnvOption('pageObject')`. Check the [UPGRADE document](UPGRADE.md) to read more about.

+ [#408](https://github.com/luyadev/luya-module-cms/pull/408) Resolved an issue where the CMS `pageObject` returned an ActiveQuery instead of the expected `NavItemPage` object. For more details, refer to the [UPGRADE document](UPGRADE.md).
+ [#404](https://github.com/luyadev/luya-module-cms/pull/404) Cmsadmin padding fix for blockholder collapsed
+ [#406](https://github.com/luyadev/luya-module-cms/pull/406) Fixed website and theme status ActiveButtons (PHP 8)
+ [#400](https://github.com/luyadev/luya-module-cms/pull/400) Improved translations (bg, cn, es, fr, hu, id, kr, nl, pl) and updated link to new guide.
+ [#401](https://github.com/luyadev/luya-module-cms/issues/401) Fixed issue with missing env options.

## 5.0.0 (30. November 2023)

> **This release contains new migrations and requires to run the migrate command after updating. Check the [UPGRADE document](UPGRADE.md) to read more about breaking changes.**

+ Support for PHP 7.x versions has been deprecated and dropped. Users are encouraged to upgrade to PHP 8.0 or higher for optimal performance and security.
+ A new feature includes the addition of an anchor option for CMS page redirects. Now, redirects can be specified with anchors to navigate to specific sections within the destination page.
+ Introducing a CMS injector option that facilitates the setting of `parentNavId`. This functionality enables more precise navigation structuring within the CMS.
+ The zaaCmsPage component now supports a clearable option, providing users with the capability to clear content when necessary.

## 4.5.3 (20. April 2023)

+ [#399](https://github.com/luyadev/luya-module-cms/pull/399) PHP 8.1 compatibility issues.

## 4.5.2 (18. January 2023)

+ [#396](https://github.com/luyadev/luya-module-cms/pull/396) Fixed bug where it was not possible to select a website when creating or updating a nav container.
+ [#392](https://github.com/luyadev/luya-module-cms/pull/392) Indexes break if there are disabled users
+ [#398](https://github.com/luyadev/luya-module-cms/pull/398) Ensure cms log message can not exceed 250 chars.

## 4.5.1 (20. October 2022)

+ [387](https://github.com/luyadev/luya-module-cms/pull/387) Decode possible not or wrong configured json values silently instead of throw an exception

## 4.5.0 (20. October 2022)

+ Fixed PHP 7.4 as minimum version in composer.json, this was previously done by the luyadev/luya-module-admin dependency. Therefore using rector to align functionality with PHP 7.4.
+ [#385](https://github.com/luyadev/luya-module-cms/pull/385) Fixed a bug where deep page copy does not copy the languages. 
+ [#386](https://github.com/luyadev/luya-module-cms/pull/386) Added rector testing.

## 4.4.0 (5. October 2022)

+ [#382](https://github.com/luyadev/luya-module-cms/pull/382) Added option for `luya\cms\helpers\Url` to create absolute URLs instead just relativ paths.
+ [#381](https://github.com/luyadev/luya-module-cms/pull/381) Add check whether the activeLanguageItem exists in PageTag parser.

## 4.3.0 (24. August 2022)

+ [#378](https://github.com/luyadev/luya-module-cms/pull/378) Dropped PHP 7.0 and 7.1 in order to have PHP 8.1 compatibility.
+ [#380](https://github.com/luyadev/luya-module-cms/pull/380) Fixed problem with caching of menu (added missing hostname to cache key in menu).
+ [#375](https://github.com/luyadev/luya-module-cms/pull/375) Fixed Website delete event
+ [#377](https://github.com/luyadev/luya-module-cms/pull/377) Fixed XSS on error page

## 4.2.0 (9. December 2021)

+ [#322](https://github.com/luyadev/luya-module-cms/issues/322) Added `save` and `save&close` buttons to blocks.
+ [#365](https://github.com/luyadev/luya-module-cms/pull/365) Changed misleading icon for page properties in page settings overlay.
+ [#362](https://github.com/luyadev/luya-module-cms/issues/362) Fixed misleading use of the note_add icon. Changed icon for cms menu item *Pages* in the admin menu.

## 4.1.1 (23. September 2021)

+ [#361](https://github.com/luyadev/luya-module-cms/issues/361) Fixed an issue where link directive does not load menu data in crud context (without an inital load of the cms view).

## 4.1.0 (21. September 2021)

+ [#360](https://github.com/luyadev/luya-module-cms/pull/360) Changed misleading icon for page properties in dropdown menu.
+ [#354](https://github.com/luyadev/luya-module-cms/pull/354) Added property `$enableWebsiteHostRedirect` to cms module to enable or disable the `WebsiteBehaviorUrlRule`.
+ [#359](https://github.com/luyadev/luya-module-cms/pull/359) Fix issue with logging cms nav item when deleted.

## 4.0.0 (27. July 2021)

> **This release contains new migrations and requires to run the migrate command after updating. Check the [UPGRADE document](UPGRADE.md) to read more about breaking changes.**

+ [#246](https://github.com/luyadev/luya-module-cms/issues/246) The `$module` property in blocks is now by default `null`. This means block view files are looked up in a `views` folder which is located in the same location as the block. See [UPGRADE document](UPGRADE.md)
+ [#350](https://github.com/luyadev/luya-module-cms/pull/350) New migrations for page update timestamp and changed nav item alias max length to 180 chars.
+ [#349](https://github.com/luyadev/luya-module-cms/pull/349) Fix default/initial website permissions on first setup for users and groups.
+ [#345](https://github.com/luyadev/luya-module-cms/pull/345) Added Website user and group permission support
+ [#344](https://github.com/luyadev/luya-module-cms/pull/344) Added website collapse to page permission.
+ [#274](https://github.com/luyadev/luya-module-cms/pull/274) Multiple website support.
+ [#341](https://github.com/luyadev/luya-module-cms/pull/341) All deprecated methods has been removed `Url::toMenuItem`, `Block::objectId`, `NavItemPage::getBlock`.
+ [#320](https://github.com/luyadev/luya-module-cms/pull/320) Replace cms menu item `publish_from` and `publish_till` with sheduler.
+ [#329](https://github.com/luyadev/luya-module-cms/issues/329) Ensure its not possible to drag a placeholder block into itself (this can create circular references)
+ [#336](https://github.com/luyadev/luya-module-cms/pull/336) New event which is triggered when the cms page is composed and ready to render.
+ [#325](https://github.com/luyadev/luya-module-cms/issues/325) Added target value into the NavTree widget.
+ [#327](https://github.com/luyadev/luya-module-cms/issues/327) Fix LinkConverter class when using CMS as headless API.
+ [#323](https://github.com/luyadev/luya-module-cms/pull/323) Add LUYA Test Suite 2.0 with PHP 8 Support.
+ [#321](https://github.com/luyadev/luya-module-cms/pull/321) Added scheduler for block item visibility.
+ [#331](https://github.com/luyadev/luya-module-cms/pull/331) When caching is enabled, the NavTree content will be cached by default.
+ [#325](https://github.com/luyadev/luya-module-cms/issues/326) Updates for compatibility with PostgreSQL
+ [#332](https://github.com/luyadev/luya-module-cms/pull/332) Added option to match wildcards in catch path for cms redirects, this allows you to use `/de/*.html` which could be redirect to `/de/*`.
+ [#339](https://github.com/luyadev/luya-module-cms/issues/339) Fixed a bug in CMS page permission system, unable to access to subpage without enabling parent page permissions.
+ [#343](https://github.com/luyadev/luya-module-cms/pull/343) Removed deprecated `luya\behaviors\Timestamp` behavior, replaced with `yii\behaviors\TimestampBehavior`.

## 3.5.1 (24. November 2020)

+ [#319](https://github.com/luyadev/luya-module-cms/issues/319) Disabled Block injector rows limit.

## 3.5.0 (17. November 2020)

+ [#314](https://github.com/luyadev/luya-module-cms/pull/314) Do not serve the blocks from the cache when an adminuser is logged in.
+ [#309](https://github.com/luyadev/luya-module-cms/pull/309) Added new help information for page properties as tooltip.
+ [#310](https://github.com/luyadev/luya-module-cms/issues/310) Fixed a bug where full page cache could cache the content including the LUYA Toolbar.
+ [#317](https://github.com/luyadev/luya-module-cms/pull/317) Add the option to use the defined wildcard value in redirects for the target. From path `foo/*` to destination `luya.io?path=*`. The given example would redirect `foo/hello-world` to `luya.io?path=hello-word`.

## 3.4.0 (24. October 2020)

> This release contains a very small and unlikely used signature change. Check the [UPGRADE document](UPGRADE.md) to read more about.

+ [#288](https://github.com/luyadev/luya-module-cms/pull/288) Introduced a new `setup()` method in `luya\cms\base\BlockInterface`. This method is called when the block object is instantiated in frontend context.
+ [#300](https://github.com/luyadev/luya-module-cms/issues/300) Hide navigation informations when creating a translation from an existing page (inline translating).
+ [#290](https://github.com/luyadev/luya-module-cms/issues/290) Add `titleContent` callable function for `luya\cms\widgets\NavTree` widget in order to customize the link content.
+ [#292](https://github.com/luyadev/luya-module-cms/pull/292) Improve the CMS Block-Editor styles.
+ [#297](https://github.com/luyadev/luya-module-cms/issues/297) Fixed a bug where menu queries with hidden informations won't retrieve correct data and count (hidden information was not passed correctly to the ArrayIterator from inside an luya\menu\Item).
+ [#138](https://github.com/luyadev/luya-module-cms/pull/299) Added missing translations for all CMS tags.
+ [#302](https://github.com/luyadev/luya-module-cms/pull/302) Added new "Language Mirroring" block for the developer group, in order to mirror content from a language placeholder into another.
+ [#304](https://github.com/luyadev/luya-module-cms/issues/304) Add new default value for full page cache duration (2 hours instead of 1 minute).
+ [#306](https://github.com/luyadev/luya-module-cms/pull/306) New option for block variable and configuration setup allows to make attributes required using `'required' => true` in block config. 

## 3.3.7 (15. September 2020)

+ [#285](https://github.com/luyadev/luya-module-cms/pull/285) Fix error in translation key `nav_item_model_error_modulenameexists`.

## 3.3.6 (6. August 2020)

+ [#284](https://github.com/luyadev/luya-module-cms/pull/284) Fixed a bug where controller action params are already decoded from json to array.
+ [#283](https://github.com/luyadev/luya-module-cms/pull/283) Fix issue where creating a page copy as template throw an unknown error.

## 3.3.5 (28. July 2020)

+ [#282](https://github.com/luyadev/luya-module-cms/pull/282) Fix issue with angularjs version 1.8.0 compatibility.

## 3.3.4 (23. July 2020)

+ [#280](https://github.com/luyadev/luya-module-cms/pull/280) Since latest AngularJs updates in Admin Module there are DOM problems with `ng-include`. The "translate now" dialog where not showing anymore.

## 3.3.3 (16. July 2020)

+ [#276](https://github.com/luyadev/luya-module-cms/issues/276) Fixed a bug with wrong nested ng-show conditions who made form inputs disappearing.
+ [#275](https://github.com/luyadev/luya-module-cms/issues/275) Fixed a bug where cms page fields disappear due to missing id informations. Replaced by Angular Helper input field generator.

## 3.3.2 (28. June 2020)

+ [#273](https://github.com/luyadev/luya-module-cms/issues/273) Fixed a bug with `Unknown Model Error` when copy a CMS Page.
+ [#272](https://github.com/luyadev/luya-module-cms/pull/272) Remove canonical URL from meta informations for CMS Pages

## 3.3.1 (17. June 2020)

+ [#270](https://github.com/luyadev/luya-module-cms/pull/270) Fixed a bug where CMS redirects does not work due to full page cache throws a not found exception.

## 3.3.0 (11. June 2020)

+ [#266](https://github.com/luyadev/luya-module-cms/issues/266) Fixed a bug where page copy should throw an error but does not.
+ [#267](https://github.com/luyadev/luya-module-cms/pull/267) Fixed bug where dashboard log object try to display a title which does not exist.
+ [#259](https://github.com/luyadev/luya-module-cms/issues/259) Improve the logging of data when working with cms blocks. Added new CMS log listing view to see all logs.

## 3.2.1 (5. May 2020)

+ [#258(#7b87d62)](https://github.com/luyadev/luya-module-cms/commit/f118249297db7c348ba66c2d6bcadecd7f490db9) Detected a rare case where cms\menu\Item might be already resolved. Thefore ensure if menu item is already an object or not.

## 3.2.0 (5. May 2020)

+ [#258](https://github.com/luyadev/luya-module-cms/pull/258) Added ArrayAccess for MenuIterator in order to prevent upgrade issues from 3.0 to 3.1.

## 3.1.2 (29. April 2020)

+ [#256](https://github.com/luyadev/luya-module-cms/pull/256) Fix issue when creating url for `cms/default/index` route (which is the cms catch all rule).
+ [#257](https://github.com/luyadev/luya-module-cms/pull/257) Fix issue with nav properties API action when translation item is not yet available. 

## 3.1.1 (21. April 2020)

+ [#254](https://github.com/luyadev/luya-module-cms/issues/254) Fixed #254 utf8mb4 charset max key length is 767 bytes.

## 3.1.0 (14. April 2020)

> This release contains an API change regarding menu builder, see [UPGRADE document](UPGRADE.md) to read more about changes.

+ [#251](https://github.com/luyadev/luya-module-cms/pull/251) New menu\Item getDescendants() and QueryIteratorFilter::column() functions.

## 3.0.3 (24. March 2020)

+ [#250](https://github.com/luyadev/luya-module-cms/issues/250) Improve cms menu admin performance when more then 300 menu items are available. 
+ [#248](https://github.com/luyadev/luya-module-cms/issues/248) Fixed a bug where cmslayout files where unable to render with absolute paths.
+ [#245](https://github.com/luyadev/luya-module-cms/issues/245) Block can have empty $module property to lookup view file paths in the block location (like Widgets).
+ [#242](https://github.com/luyadev/luya-module-cms/issues/242) Improve stability of {{luya\cms\menu\Query}} where condition builder.

## 3.0.2 (28. February 2020)

+ Removed unnecessary call of deprecated function.

## 3.0.1 (28. February 2020)

+ Fixed a bug with new deprecation warning when using luya\cms\helpers\Url::toModuleRoute

## 3.0 (27. February 2020)

> This release contains new migrations and requires to run the migrate command after updating. Check the [UPGRADE document](UPGRADE.md) to read more about breaking changes.

+ [#222](https://github.com/luyadev/luya-module-cms/issues/222) Full page chache is enabled in module settings by default and a new `enable caching` flag for pages can be set to enable the caching of the page.
+ [#239](https://github.com/luyadev/luya-module-cms/issues/239) Added negative margin to cancel out default admin padding. Fixed a small overflow issue in Safari ([admin/#461](https://github.com/luyadev/luya-module-admin/issues/461)).
+ [#238](https://github.com/luyadev/luya-module-cms/issues/238) Show vertical scrollbars.
+ [#211](https://github.com/luyadev/luya-module-cms/pull/211) Add the theme loading and management to the cms module based on core theme [luya/issues/1916](https://github.com/luyadev/luya/issues/1916)
+ [#235](https://github.com/luyadev/luya-module-cms/issues/235) Fixed cms toolbar bug in ajax context.

## 2.2.0 (12. November 2019)

+ [#214](https://github.com/luyadev/luya-module-cms/issues/214) Fixed bug when switch from module page to content page.
+ [#223](https://github.com/luyadev/luya-module-cms/issues/223) CMS Pages (Nav) can have tags and can also be filtered in menu query by tags. (luya\cms\menu\Query::tags()).
+ [#233](https://github.com/luyadev/luya-module-cms/issues/233) Fix problem with cms nav item model validation rules.
+ [#166](https://github.com/luyadev/luya-module-cms/issues/166) New LanguageSwitcher method `setUrlRuleParam()` to make url rules translatable.
+ [#224](https://github.com/luyadev/luya-module-cms/pull/224) Add `getBlock()` method in PhpBlockView to access block context.

## 2.1.1 (17. September 2019)

+ [#218](https://github.com/luyadev/luya-module-cms/issues/218) Ensure log system works properly when a page is deleted.
+ [#106](https://github.com/luyadev/luya-module-cms/issues/106) Prevent infinite recursion when storing wrong block data.
+ [#213](https://github.com/luyadev/luya-module-cms/issues/213) If a 404 is thrown in admin context, the cms error page should not render, otherwise this could lead into a 500er server error which will then log out the user.

## 2.1.0 (22. July 2019)

### Added

+ [#210](https://github.com/luyadev/luya-module-cms/pull/210) Added new Active Query Select Injector class.
+ [#208](https://github.com/luyadev/luya-module-cms/pull/208) New $fullPageCache option for the cms frontend module, this can speed uf the page dramatically but can lead into problems with dynamic values inside blocks (like ActiveRecords).

### Fixed

+ [#209](https://github.com/luyadev/luya-module-cms/pull/209) Fixed phpdoc in view file generator of blocks.

## 2.0.0 (26. June 2019)

> This release contains new migrations and requires to run the migrate command after updating. Check the [UPGRADE document](UPGRADE.md) to read more about breaking changes.

### Changed

+ [#81](https://github.com/luyadev/luya-module-cms/issues/81) Added new migrations for module pages in order to allow controller and action definitions.
+ [#182](https://github.com/luyadev/luya-module-cms/issues/182) Moved to SemVer. Use ^2.0 instead ~2.0.0 constraint in your project! 
+ [#51](https://github.com/luyadev/luya-module-cms/issues/51) Enable strict url parsing as long as the previous page is a module or strict parsing is disabled.

### Added

+ [#82](https://github.com/luyadev/luya-module-cms/issues/82) Option to define target (new window or not) for redirect pages.
+ [#159](https://github.com/luyadev/luya-module-cms/issues/159) Added new og:image and twitter:image meta informations. Its possible now to upload an image for a page.

### Fixed

+ [#203](https://github.com/luyadev/luya-module-cms/issues/203) Show error page when NotFound exception is thrown.
+ [#201](https://github.com/luyadev/luya-module-cms/issues/201) Fix issued where language switcher widget does not prefix host info (defined by hostInfoMapping). 
+ [#193](https://github.com/luyadev/luya-module-cms/pull/193) Prefix certain application env folders when running block importer in order to make sure windows system paths work.
+ [#194](https://github.com/luyadev/luya-module-cms/issues/194) Updated CSS to unify spaces between page languages and treenav
+ [#71](https://github.com/luyadev/luya-module-cms/issues/71) If a not found page is defined a 404 is returned instead of redirect to the error page.
+ [#20](https://github.com/luyadev/luya-module-cms/issues/20) Refactor parent page selection and menu-dropdown directive (added search, change styles).
+ [#189](https://github.com/luyadev/luya-module-cms/issues/189) Block preview path with backward compatibility for PHP 5.6.

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
