<?php

namespace cmstests\src\admin\controllers;

use cmstests\WebModelTestCase;
use luya\cms\admin\controllers\PermissionController;

class PermissionControllerTest extends WebModelTestCase
{
    /**
     * @runInSeparateProcess
     */
    public function testActions()
    {
        $ctrl = new PermissionController('permission', $this->app->getModule('cmsadmin'));
        $this->assertNotEmpty($ctrl->actionIndex());
    }
}
