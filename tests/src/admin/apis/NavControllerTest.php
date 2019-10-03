<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\NavController;
use luya\testsuite\scopes\PermissionScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class NavControllerTeste extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function testActionTags()
    {
        PermissionScope::run($this->app, function(PermissionScope $scope) {
            $scope->createAndAllowRoute('webmodel/nav/tags');

            $this->createAdminTagFixture();
            $this->createadminTagRelationFixture();

            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                ]
            ]);

            $ctrl = new NavController('nav', $this->app);
            $r = $scope->runControllerAction($ctrl, 'tags', ['id' => 1]);

            $this->assertSame([], $r);
        });
    }
}