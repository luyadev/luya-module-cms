<?php

namespace cmstests;

use luya\testsuite\cases\NgRestTestCase;

class CmsNgRestTestCase extends NgRestTestCase
{
    public function getConfigArray()
    {
        return [
            'id' => 'ngresttest',
            'basePath' => dirname(__DIR__),
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ],
                'urlManager' => [
                    'cache' => null,
                ]
            ]
        ];
    }
}
