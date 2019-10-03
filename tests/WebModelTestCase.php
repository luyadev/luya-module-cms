<?php

namespace cmstests;

use luya\testsuite\cases\WebApplicationTestCase;

abstract class WebModelTestCase extends WebApplicationTestCase
{
    public function getConfigArray()
    {
        return [
           'id' => 'webmodel',
            'basePath' => dirname(__DIR__),
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ]
            ],
            'modules' => [
                'admin' => 'luya\admin\Module',
                'cms' => 'luya\cms\frontend\Module',
                'cmsadmin' => 'luya\cms\admin\Module',
            ]
        ];
    }
}
