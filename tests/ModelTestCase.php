<?php

namespace cmstests;

use luya\testsuite\cases\ConsoleApplicationTestCase;

class ModelTestCase extends ConsoleApplicationTestCase
{
    public function getConfigArray()
    {
        return [
           'id' => 'basetestcase',
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
