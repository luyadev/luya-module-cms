<p align="center">
  <img src="https://raw.githubusercontent.com/luyadev/luya/master/docs/logo/luya-logo-0.2x.png" alt="LUYA Logo"/>
</p>

# LUYA Content Management System


[![LUYA](https://img.shields.io/badge/Powered%20by-LUYA-brightgreen.svg)](https://luya.io)
![Tests](https://github.com/luyadev/luya-module-cms/workflows/Tests/badge.svg)
[![Maintainability](https://api.codeclimate.com/v1/badges/17b07525cbb9d23c7b3d/maintainability)](https://codeclimate.com/github/luyadev/luya-module-cms/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/17b07525cbb9d23c7b3d/test_coverage)](https://codeclimate.com/github/luyadev/luya-module-cms/test_coverage)
[![Latest Stable Version](https://poser.pugx.org/luyadev/luya-module-cms/v/stable)](https://packagist.org/packages/luyadev/luya-module-cms)
[![Total Downloads](https://poser.pugx.org/luyadev/luya-module-cms/downloads)](https://packagist.org/packages/luyadev/luya-module-cms)

The LUYA CMS module provides a full functional Content Management System for adding contents based on blocks.

![LUYA CMS MODULE](https://raw.githubusercontent.com/luyadev/luya/master/docs/images/cms.png)

To use the LUYA CMS module you have to run a LUYA Application which is provided by the LUYA core.

For installation and usage please check: [LUYA.IO](https://luya.io)

## Installation

For the installation of modules Composer is required.

```sh
composer require luyadev/luya-module-cms
```

### Configuration 

Add the frontend and admin module of the cms module to your configuration modules section and bootstrap the cms frontend module:

```php
'modules' => [
    // ...
    'cms' => 'luya\cms\frontend\Module',
    'cmsadmin' => 'luya\cms\admin\Module',
    // ...
]
```


### Initialization 

After successfully installation and configuration run the migrate, import and setup command to initialize the module in your project.

1.) Migrate your database.

```sh
./vendor/bin/luya migrate
```

2.) Import the module and migrations into your LUYA project.

```sh
./vendor/bin/luya import
```

> Please note that the module names *cms* and *cmsadmin* are required and should not be changed!

## Developers

If you want to contribute, make sure to read the [guidelines](https://luya.io/guide/dev/guideline).

## Unit Testing

1. `cp phpunit.xml.dist phpunit.xml`
2. `docker compose up`
3. `docker compose run luyacmsphpunit tests` to run all tests or `docker compose run luyacmsphpunit tests/src/helpers/UrlTest.php` to run a specific test.
