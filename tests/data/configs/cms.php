<?php

return [
    'id' => 'testenv',
    'siteTitle' => 'Luya Tests',
    'remoteToken' => 'testtoken',
    'basePath' => dirname(__DIR__),
    'defaultRoute' => 'cms',
    'aliases' => [
        'cmstests' => dirname(__DIR__) . '/../',
    ],
    'language' => 'en',
    'modules' => [
        'admin' => [
            'class' => 'luya\admin\Module',
            'queueMutexClass' => 'yii\mutex\FileMutex',
        ],
        'cms' => [
            'class' => '\luya\cms\frontend\Module'
        ],
        'cmsadmin' => 'luya\cms\admin\Module',
        'CmsUnitModule' => '\cmstests\data\modules\CmsUnitModule',
    ],
    'components' => [
        'request' => [
            'forceWebRequest' => true,
        ],
        'composition' => [
            'hidden' => false,
        ],
        'db' => [
            'class' => 'yii\db\Connection',
            'dsn' => DB_DSN,
            'username' => DB_USER,
            'password' => DB_PASS,
            'charset' => 'utf8',
        ],
        'cache' => \yii\caching\ArrayCache::class,
        'assetManager' => [
            'basePath' => dirname(__DIR__) . '/assets',
        ],
        'website' => [
            'class' => \luya\cms\Website::class,
        ]
    ],
];
