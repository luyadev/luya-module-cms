# LUYA CMS MODULE UPGRADE

This document will help you upgrading from a LUYA admin module version into another. For more detailed informations about the breaking changes **click the issue detail link**, there you can examples of how to change your code.

## 2.x to 3.0

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.

## 1.x to 2.0

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.
+ [#51](https://github.com/luyadev/luya-module-cms/issues/51) When a page contains the **module block** (not a page which is a module) and the module block can create and follow urls the strict parsing option **must be disabled** in the nav item setting panel otherwise links won't work aynmore. We suggest you to visits the "Pages" Active Window of the Module-Block in order to determine whether the block is used somewhere and check the strict parsing option for this page.