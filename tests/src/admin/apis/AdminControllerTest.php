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
        $this->createCmsLog([
            1 => [
                'id' => 1,
                'user_id' => 1,
                'is_insertion' => 1,
                'is_update' => 0,
                'is_deletion' => 0,
                'timestamp' => time(),
                'table_name' => 'xyz',
                'row_id' => 1,
            ]
        ]);
        $this->createAdminUserFixture();
        $ctrl = new AdminController('id', $this->app);

        $log = $ctrl->actionDashboardLog();

        $this->assertNotEmpty($log);
    }
}
