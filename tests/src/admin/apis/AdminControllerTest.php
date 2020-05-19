<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\AdminController;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class AdminControllerTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function testActionDashboardLog()
    {
        $this->createAdminLangFixture([]);
        $this->createCmsLog();
        $this->createAdminUserFixture();
        $ctrl = new AdminController('id', $this->app);

        $log = $ctrl->actionDashboardLog();

        $this->assertSame([], $log);
    }   
}