# LUYA CMS MODULE UPGRADE

This document will help you upgrading from a LUYA admin module version into another. For more detailed informations about the breaking changes **click the issue detail link**, there you can examples of how to change your code.

## 1.x to 2.0 (in progress)

+ This release contains the new migrations which are required for the user and file table. Therefore make sure to run the `./vendor/bin/luya migrate` command after `composer update`.
