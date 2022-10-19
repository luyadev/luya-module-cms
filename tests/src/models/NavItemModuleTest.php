<?php

namespace cmstests\src\models;

use cmstests\WebModelTestCase;
use luya\cms\models\NavItemModule;
use luya\testsuite\fixtures\NgRestModelFixture;

class NavItemModuleTest extends WebModelTestCase
{
    public function testDecodeActionParams()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => NavItemModule::class,
        ]);

        $model = $fixture->newModel;
        $model->action_params = ['foo' => 'bar'];
        $model->validate();

        // test encoding
        $this->assertSame('{"foo":"bar"}', $model->action_params);
        $this->assertSame(['foo' => 'bar'], $model->getDecodedActionParams());
        $model->action_params = $model->getDecodedActionParams();
        $this->assertSame(['foo' => 'bar'], $model->getDecodedActionParams()); // if already is array


        // empty model test
        $emptyModel = $fixture->newModel;

        $this->assertSame([], $emptyModel->getDecodedActionParams());
    }
}
