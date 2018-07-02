<?php

namespace cmstests;

use luya\testsuite\cases\ConsoleApplicationTestCase;

class CmsConsoleTestCase extends ConsoleApplicationTestCase
{
    public function getConfigArray()
    {
        return [
            'id' => 'basetestcase',
            'basePath' => dirname(__DIR__),
            'aliases' => [
                '@cmstests' => dirname(__DIR__),
            ],
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ]
            ],
            'modules' => [
                'admin' => 'luya\admin\Module',
                'cms' => [
                    'class' => '\luya\cms\frontend\Module'
                ],
                'cmsadmin' => [
                    'class' => 'luya\cms\admin\Module',
                    'blocks' => ['@cmstests/tests/data/blocks/import'],
                    'cmsLayouts' => ['@cmstests/tests/data/cmslayouts'],
                ],
                'CmsUnitModule' => '\cmstests\data\modules\CmsUnitModule',
            ],
        ];
    }
}
