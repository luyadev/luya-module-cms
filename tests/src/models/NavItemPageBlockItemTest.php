<?php

namespace cmstests\src\models;

use cmstests\ModelTestCase;
use luya\cms\models\Block;
use luya\cms\models\Log;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use luya\testsuite\fixtures\NgRestModelFixture;

class NavItemPageBlockItemTest extends ModelTestCase
{
    public function testCircularRef()
    {
        $fixtures = new NgRestModelFixture([
            'modelClass' => NavItemPageBlockItem::class,
        ]);

        new NgRestModelFixture([
            'modelClass' => NavItemPage::class,
        ]);

        new NgRestModelFixture([
            'modelClass' => Block::class,
            'fixtureData' => [
                1 => [
                    'id' => 1,
                ]
            ]
        ]);

        new NgRestModelFixture([
            'modelClass' => Log::class,
        ]);

        $model = $fixtures->newModel;
        $model->block_id = 1;
        $model->placeholder_var = 'container';

        $this->assertTrue($model->save());

        $model->prev_id = 1;
        $this->assertFalse($model->update());

        $this->assertArrayHasKey('prev_id', $model->getErrors());
    }
}
