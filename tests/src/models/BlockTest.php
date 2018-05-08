<?php

namespace tests\web\cmsadmin\models;

use luya\testsuite\fixtures\ActiveRecordFixture;
use cmstests\ModelTestCase;

class BlockTest extends ModelTestCase
{
    public function testFindOne()
    {
        $fixture = new ActiveRecordFixture([
            'modelClass' => 'luya\cms\models\Block',
            'data' => [
                'model1' => [
                    'id' => 1,
                    'group_id' => 1,
                    'class' => 'path\to\Block',
                    'is_disabled' => 0,
                ]
            ]
        ]);
        
        $model = $fixture->getNewModel();
        $model->attributes = ['group_id' => 1, 'class' => 'FooBar'];
        $this->assertTrue($model->save());
    }
}