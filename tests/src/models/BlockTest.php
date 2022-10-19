<?php

namespace tests\web\cmsadmin\models;

use cmstests\CmsNgRestTestCase;
use luya\cms\models\Block;
use luya\testsuite\fixtures\ActiveRecordFixture;

class BlockTest extends CmsNgRestTestCase
{
    public $modelFixtureData = [
        'model1' => [
            'id' => 1,
            'group_id' => 1,
            'class' => 'path\to\Block',
            'is_disabled' => 0,
        ]
    ];

    public $modelClass = 'luya\cms\models\Block';
    public $apiClass = 'luya\cms\admin\apis\BlockController';
    public $controllerClass = 'luya\cms\admin\controllers\BlockController';

    /*
    public function testFindOne()
    {
        $fixture = $this->modelFixture;

        $relationFixture = new ActiveRecordFixture([
            'modelClass' => 'luya\cms\models\NavItemPageBlockItem',
            'fixtureData' => [
                'model1' => [
                    'id' => '1',
                    'block_id' => '1',
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 0,
                    'prev_id' => '',
                    'json_config_values' => '{}',
                    'json_config_cfg_values' => '{}',
                    'is_dirty' => 0,
                    'create_user_id' => 1,
                    'update_user_id' => 1,
                    'timestamp_create' => time(),
                    'timestamp_update' => time(),
                ]
            ]
        ]);

        $pageFixture = new ActiveRecordFixture([
            'modelClass' => 'luya\cms\models\NavItemPage',
        ]);

        $pageFixture = new ActiveRecordFixture([
            'modelClass' => 'luya\cms\models\Log',
        ]);

        // get existing
        $block = $fixture->getModel('model1');
        $this->assertSame(1, $block->id);
        $this->assertEquals(1, $block->usageCount);
        $this->assertSame(1, $block->delete());



        // add new model
        $model = $fixture->getNewModel();
        $model->attributes = ['group_id' => 2, 'class' => 'FooBar', 'is_disabled' => 0];
        $this->assertTrue($model->save());
        //$this->assertSame(0, $model->fileExists);

    }
    */

    public function testControllerMethods()
    {
        $this->assertNull($this->api->actionToFav());
        $this->assertNull($this->api->actionRemoveFav());
        $this->assertNull($this->api->actionToggleGroup());
    }
}
