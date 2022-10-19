<?php

namespace cmstests\src\admin\controllers;

use cmstests\WebModelTestCase;
use luya\cms\admin\controllers\DefaultController;
use luya\testsuite\scopes\PermissionScope;

class DefaultControllerTest extends WebModelTestCase
{
    /**
     * @runInSeparateProcess
     */
    public function testActions()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $ctrl = new DefaultController('default', $this->app->getModule('cmsadmin'));
            $this->assertNotEmpty($ctrl->actionIndex());
        });
    }
}
