# LUYA ADMIN MODULE UPGRADE

This document will help you upgrading from a LUYA admin module version into another. For more detailed informations about the breaking changes **click the issue detail link**, there you can examples of how to change your code.

## 1.1.x (in progress)

+ [#78](https://github.com/luyadev/luya-module-cms/pull/78) We have removed the `$appView` property from the `luya\cms\base\PhpBlockView` class. In order to register assets, js and css into the view use `MyAsset::register($this)` instead of previous `MyAsset::register($this->appView)`.
+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.
