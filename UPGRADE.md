# LUYA CMS MODULE UPGRADE

This document will help you upgrading from a LUYA admin module version into another. For more detailed informations about the breaking changes **click the issue detail link**, there you can examples of how to change your code.

## 5.0 to 5.1

**Upgrade Notice: Changes to `Block->getEnvOption('pageObject')` Behavior**

In previous versions, the method `getEnvOption('pageObject')` incorrectly returned an `ActiveQuery` object, which was intended to resolve into a `NavItem` instance. We have corrected this issue in the latest update. Now, `getEnvOption('pageObject')` properly returns a `NavItemPage` object as expected.

**Action Required for Developers:**

If your code utilizes the `getEnvOption('pageObject')` method, you will need to make adjustments to ensure compatibility with the current version. To access the `NavItem` object, which was the original behavior facilitated through an `ActiveQuery`, you should now use the following approach: `getEnvOption('pageObject')->navItem`.

**Example of Required Code Adjustments:**

- **Previous Approach:** To obtain the title of a `NavItem`, you might have used:
  ```php
  getEnvOption('pageObject')->one()->title
  ```

- **New Approach:** To achieve the same outcome in the updated version, you should modify your code to:
  ```php
  getEnvOption('pageObject')->navItem->title
  ```

This change ensures more intuitive access to the `NavItem` properties directly through the `NavItemPage` object, streamlining the process of fetching page-related data. Please review your projects and update any relevant code segments to align with this new method of accessing `NavItem` properties.

## 4.x to 5.0

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.
+ Support for PHP 7.x has been discontinued. The minimum required PHP version is now 8.0.

## 3.x to 4.0

+ [#320](https://github.com/luyadev/luya-module-cms/pull/320) **ENSURE YOU DON'T HAVE HIDDEN PAGES WHICH ARE HIDDEN BY TIME "SHOW UNTIL ..." SETTINGS** - Visibility for menu items has been replaced by the scheduler. this means when you have some active visibility timings, they needs to be replaced by yourself. f.e you have stored a from and to date somewhere and the menu item is now invisible, you can need to manualy change the visibility of that page to "hidden" since those where conditions do not exists in the query of menu items anymore.
+ [#246](https://github.com/luyadev/luya-module-cms/issues/246) **ENSURE TO EITHER SET `$module ='app'` IN YOUR APP BLOCKS OR MOVE THE VIEW FILES INTO THE BLOCKS FOLDER `/blocks/views/...`.** - New blocks won't contain the `$module` property by default. Since version 4.0 the view files of blockes are by default looked up in a folder called `views` which is in the same location as block is stored. When your block does not have a `$module` property defined, you can use `$module = 'app'` to restore the old/previous behavior.
+ [#341](https://github.com/luyadev/luya-module-cms/pull/341) All deprecated methods has been removed `Url::toMenuItem`, `Block::objectId`, `NavItemPage::getBlock`.

## 3.3.7 to 3.4.0

+ [#288](https://github.com/luyadev/luya-module-cms/pull/288) Introduced a new `setup()` method in `luya\cms\base\BlockInterface`. Its very unlikely to adjust the code, but if there is class which only implements the `luya\cms\base\BlockInterface` this method is now required.

```php
public function setup()
{

}
```

In general all blocks at least extend from `luya\cms\base\InternalBaseBlock` which already includes the new setup() method, therefore ensure all blocks extend from InternalBaseBlock.

## 3.0 to 3.1

+ CMS menu item methods `teardown`, `parents` return now an instance of QueryIteratorFilter, this is the expected behavior as for all the other methods return more then one row. If an array is expected in code logic, use `iterator_to_array` to parse the iterator object into an array.

## 2.x to 3.0

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.

## 1.x to 2.0

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.
+ [#51](https://github.com/luyadev/luya-module-cms/issues/51) When a page contains the **module block** (not a page which is a module) and the module block can create and follow urls the strict parsing option **must be disabled** in the nav item setting panel otherwise links won't work aynmore. We suggest you to visits the "Pages" Active Window of the Module-Block in order to determine whether the block is used somewhere and check the strict parsing option for this page.
