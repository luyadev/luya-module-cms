<?php

namespace cmstests\src\admin\controllers;

use luya\testsuite\scopes\PermissionScope;
use cmstests\WebModelTestCase;
use luya\cms\admin\controllers\DefaultController;

class DefaultControllerTest extends WebModelTestCase
{
    /**
     * @runInSeparateProcess
     */
    public function testActions()
    {
        $ctrl = new DefaultController('default', $this->app->getModule('cmsadmin'));
        $this->assertNotEmpty($ctrl->actionIndex());
    }
}