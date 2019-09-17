<?php

namespace cmstests\src\frontend\commands;

use cmstests\CmsConsoleTestCase;
use luya\cms\frontend\blocks\HtmlBlock;
use luya\cms\frontend\commands\PageController;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CommandStdStreamTrait;

class PageControllerTest extends CmsConsoleTestCase
{
    public function testActionCleanup()
    {
        PageScope::run($this->app, function(PageScope $scope) {
            $scope->createCmsNavFixture([]);
            $scope->createCmsNavItemFixture([]);
            $scope->createCmsNavItemPageFixture([]);
            $scope->createCmsNavItemPageBlockItemFixture([]);
            $scope->createCmsPropertyFixture([]);
            $scope->createCmsNavPermissionFixture([]);
            $ctrl = new PageControllerStub('page', $this->app);
            $ctrl->sendInput('yes');
            $r = $ctrl->actionCleanup();
            
            $this->assertNull($r);
        });
    }
}

class PageControllerStub extends PageController
{
    use CommandStdStreamTrait;
}
