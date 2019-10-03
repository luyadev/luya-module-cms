<?php

namespace cmstests;

use luya\testsuite\cases\WebApplicationTestCase;

class WebModelTestCase extends WebApplicationTestCase
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
            ]
        ];
    }
}
