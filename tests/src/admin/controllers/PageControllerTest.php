<?php

namespace cmstests\src\admin\controllers;

use luya\testsuite\scopes\PermissionScope;
use cmstests\WebModelTestCase;
use luya\cms\admin\controllers\PageController;

class PageControllerTest extends WebModelTestCase
{
    /**
     * @runInSeparateProcess
     */
    public function testActionUpdate()
    {
        PermissionScope::run($this->app, function(PermissionScope $scope) {
            $ctrl = new PageController('page', $this->app->getModule('cmsadmin'));
            $this->assertNotEmpty($ctrl->actionUpdate());
            $this->assertNotEmpty($ctrl->actionDrafts());
            $this->assertNotEmpty($ctrl->actionCreate());
        });

        
    }
}