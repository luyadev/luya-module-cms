<?php

namespace cmstests\src\frontend\commands;

use cmstests\CmsConsoleTestCase;
use luya\cms\frontend\commands\PageController;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CommandStdStreamTrait;

class PageControllerTest extends CmsConsoleTestCase
{
    public function testActionCleanup()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createCmsNavFixture([]);
            $scope->createCmsNavItemFixture([]);
            $scope->createCmsNavItemPageFixture([]);
            $scope->createCmsNavItemPageBlockItemFixture([
                'item1' => [
                    'id' => 1,
                    'json_config_values' => '',
                    'json_config_cfg_values' => '',
                    'block_id' => 0,
                    'placeholder_var' => 'default',
                    'nav_item_page_id' => 1,
                ]
            ]);
            $scope->createCmsPropertyFixture([]);
            $scope->createCmsNavPermissionFixture([]);
            $ctrl = new PageControllerStub('page', $this->app);
            $ctrl->sendInput('yes');
            $r = $ctrl->actionCleanup();

            $this->assertSame(0, $r);
        });


        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createCmsNavFixture([]);
            $scope->createCmsNavItemFixture([]);
            $scope->createCmsNavItemPageFixture([]);
            $scope->createCmsNavItemPageBlockItemFixture([
                'item1' => [
                    'id' => 1,
                    'json_config_values' => '',
                    'json_config_cfg_values' => '',
                    'block_id' => 0,
                    'placeholder_var' => 'default',
                    'nav_item_page_id' => 1,
                ]
            ]);
            $scope->createCmsPropertyFixture([]);
            $scope->createCmsNavPermissionFixture([]);
            $ctrl = new PageControllerStub('page', $this->app);
            $ctrl->truncateStreams();
            $r = $ctrl->actionCleanup();

            $this->assertSame(1, $r);
        });
    }
}

class PageControllerStub extends PageController
{
    use CommandStdStreamTrait;
}
