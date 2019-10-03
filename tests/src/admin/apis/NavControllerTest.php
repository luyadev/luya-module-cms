<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\NavController;
use luya\testsuite\scopes\PermissionScope;

class NavControllerTeste extends WebModelTestCase
{
    public function testActionTags()
    {
        PermissionScope::run($this->app, function(PermissionScope $scope) {
            $scope->createAndAllowRoute('webmodel/nav/tags');
            $ctrl = new NavController($this->app, 'nav');

            $r = $scope->runControllerAction($ctrl, 'tags', ['id' => 1]);

            var_dump($r);
        });
    }
}