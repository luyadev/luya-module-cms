<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\NavController;
use luya\cms\admin\Module;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use luya\testsuite\scopes\PermissionScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;
use yii\web\NotFoundHttpException;

class NavControllerTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    /**
     * @runInSeparateProcess
     */
    public function testActionTags()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $scope->createAndAllowRoute('webmodel/nav/tags');
            $scope->createAndAllowRoute('webmodel/nav/save-tags');

            $this->createAdminLangFixture();

            $this->createAdminTagFixture([
                'tag1' => [
                    'id' => 1,
                    'name' => 'foobar'
                ]
            ]);
            $this->createAdminTagRelationFixture();

            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                ]
            ]);

            $ctrl = new NavController('nav', $this->app);

            $this->app->request->setBodyParams([1]);
            $s = $scope->runControllerAction($ctrl, 'save-tags', ['id' => 1]);
            $this->assertSame(1, $s);
            $r = $scope->runControllerAction($ctrl, 'tags', ['id' => 1]);

            $this->assertSame([
                ['id' => 1, 'name' => 'foobar', 'translation' => ''],
            ], $r);

            $this->expectException('yii\web\NotFoundHttpException');
            $scope->runControllerAction($ctrl, 'tags', ['id' => 123]);
            $scope->runControllerAction($ctrl, 'save-tags', ['id' => 123]);
        });
    }

    /**
     * @runInSeparateProcess
     */
    public function testSaveTagsNotFound()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $scope->createAndAllowRoute('webmodel/nav/save-tags');
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                ]
            ]);
            $ctrl = new NavController('nav', $this->app);
            $this->expectException('yii\web\NotFoundHttpException');
            $scope->runControllerAction($ctrl, 'save-tags', ['id' => 123]);
        });
    }

    /**
     * @runInSeparateProcess
     */
    public function testDelete()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsWebsiteFixture([
                1 => [
                    'id' => 1,
                    'name' => 'default',
                    'host' => '',
                    'aliases' => '',
                    'is_default' => 1,
                    'is_active' => 1,
                    'is_deleted' => 0,
                ]
            ]);
            $this->createCmsNavContainerFixture([
                1 => [
                    'id' => 1,
                    'name' => 'default',
                    'alias' => 'default',
                    'website_id' => 1,
                ]
            ]);
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                ]
            ]);
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/delete');
            $scope->createAndAllowRoute(Module::ROUTE_PAGE_DELETE);
            $ctrl = new NavController('nav', $this->app);
            $r = $scope->runControllerAction($ctrl, 'delete', ['navId' => 1]);

            $this->assertSame(1, $r);

            $this->assertStringContainsString('-deleted', NavItem::findOne(1)->alias);
            $this->assertSame("1", Nav::findOne(1)->is_deleted);
        });
    }

    public function testGetProperties()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                    'lang_id' => 1,
                ]
            ]);

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/get-properties');
            $ctrl = new NavController('nav', $this->app);
            $r = $scope->runControllerAction($ctrl, 'get-properties', ['navId' => 1]);

            $this->assertSame([], $r);
        });

        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                ]
            ]);

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/get-properties');
            $ctrl = new NavController('nav', $this->app);
            $r = $scope->runControllerAction($ctrl, 'get-properties', ['navId' => 1]);

            $this->assertSame([], $r);
        });

        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                ]
            ]);

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/get-properties');
            $ctrl = new NavController('nav', $this->app);
            $this->expectException(NotFoundHttpException::class);
            $r = $scope->runControllerAction($ctrl, 'get-properties', ['navId' => 123]);
        });
    }

    public function testActionDeepPageCopyAsTemplateError()
    {
        // erroring
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavContainerFixture([
                'container1' => [
                    'id' => 1,
                    'name' => 'container',
                    'alias' => 'container',
                    'website_id' => 1,
                ],
            ]);
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                ]
            ]);

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/deep-page-copy-as-template');
            $ctrl = new NavController('nav', $this->app);
            $scope->getApp()->request->setBodyParams(['navId' => 1]);
            $r = $scope->runControllerAction($ctrl, 'deep-page-copy-as-template');

            $this->assertSame(422, $scope->getApp()->response->statusCode);
        });
    }

    public function testActionDeepPageCopyAsTemplateSuccess()
    {
        // success
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsNavContainerFixture([
                'container1' => [
                    'id' => 1,
                    'name' => 'container',
                    'alias' => 'container',
                    'website_id' => 1,
                ],
            ]);
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0,
                ]
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                    'lang_id' => 1,
                    'nav_item_type' => 1,
                    'nav_item_type_id' => 1,
                ]
            ]);
            $this->createCmsNavItemPageFixture();

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/deep-page-copy-as-template');
            $ctrl = new NavController('nav', $this->app);
            $scope->getApp()->request->setBodyParams(['navId' => 1]);
            $r = $scope->runControllerAction($ctrl, 'deep-page-copy-as-template');
            $this->assertSame(200, $scope->getApp()->response->statusCode);
        });
    }

    public function testActionToggleHome()
    {
        PermissionScope::run($this->app, function (PermissionScope $scope) {
            $this->createAdminLangFixture();
            $this->createCmsNavItemRedirectFixture();
            $this->createCmsWebsiteFixture([
                1 => [
                    'id' => 1,
                    'name' => 'default',
                    'host' => '',
                    'aliases' => '',
                    'is_default' => 1,
                    'is_active' => 1,
                    'is_deleted' => 0,
                ]
            ]);
            $this->createCmsNavContainerFixture([
                'container1' => [
                    'id' => 1,
                    'name' => 'container',
                    'alias' => 'container',
                    'website_id' => 1,
                    'is_deleted' => 0,
                ],
            ]);
            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                    'parent_nav_id' => 0,
                    'is_home' => 0,
                    'nav_container_id' => 1,
                ],
                'nav2' => [
                    'id' => 2,
                    'parent_nav_id' => 0,
                    'is_home' => 1,
                    'nav_container_id' => 1,
                ],
            ]);
            $this->createCmsNavItemFixture([
                'item1' => [
                    'id' => 1,
                    'nav_id' => 1,
                    'alias' => 'foobar',
                    'lang_id' => 1,
                    'nav_item_type' => 1,
                    'nav_item_type_id' => 1,
                ],
                'item2' => [
                    'id' => 2,
                    'nav_id' => 2,
                    'alias' => 'barfoo',
                    'lang_id' => 1,
                    'nav_item_type' => 1,
                    'nav_item_type_id' => 1,
                ]
            ]);
            $this->createCmsNavItemPageFixture();

            $this->createCmsPropertyFixture();
            $this->createCmsLog();

            /** @var Nav $nav2Model */
            $nav2Model = Nav::findOne(2);
            $this->assertEquals(1, (int)$nav2Model->is_home);

            $scope->createAndAllowRoute('webmodel/nav/toggle-home');
            $ctrl = new NavController('nav', $this->app);

            // toggle home from nav2 to nav1
            $r = $scope->runControllerAction($ctrl, 'toggle-home', ['navId' => 1, 'homeState' => 1]);
            $this->assertSame(200, $scope->getApp()->response->statusCode);

            /** @var Nav $nav1Model */
            $nav1Model = Nav::findOne(1);
            $this->assertEquals(1, $nav1Model->is_home);

            /** @var Nav $nav2Model */
            $nav2Model = Nav::findOne(2);
            $this->assertEquals(0, (int)$nav2Model->is_home);

            // untoggle nav1 as home
            $r = $scope->runControllerAction($ctrl, 'toggle-home', ['navId' => 1, 'homeState' => 0]);
            $this->assertSame(200, $scope->getApp()->response->statusCode);

            /** @var Nav $nav1Model */
            $nav1Model = Nav::findOne(1);
            $this->assertEquals(0, (int)$nav1Model->is_home);

            /** @var Nav $nav2Model */
            $nav2Model = Nav::findOne(2);
            $this->assertEquals(0, (int)$nav2Model->is_home);
        });
    }
}
