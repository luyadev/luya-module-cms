# LUYA CMS MODULE UPGRADE

This document will help you upgrading from a LUYA admin module version into another. For more detailed informations about the breaking changes **click the issue detail link**, there you can examples of how to change your code.

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
