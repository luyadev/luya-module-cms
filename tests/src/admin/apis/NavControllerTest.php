<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\NavController;
use luya\cms\admin\Module;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use luya\testsuite\scopes\PermissionScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class NavControllerTeste extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    /**
     * @runInSeparateProcess
     */
    public function testActionTags()
    {
        PermissionScope::run($this->app, function(PermissionScope $scope) {
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
                ['id' => '1', 'name' => 'foobar', 'translation' => ''],
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
        PermissionScope::run($this->app, function(PermissionScope $scope) {
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
        PermissionScope::run($this->app, function(PermissionScope $scope) {

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
            $this->createCmsLog();

            $scope->createAndAllowRoute('webmodel/nav/delete');
            $scope->createAndAllowRoute(Module::ROUTE_PAGE_DELETE);
            $ctrl = new NavController('nav', $this->app);
            $r = $scope->runControllerAction($ctrl, 'delete', ['navId' => 1]);

            $this->assertSame(1, $r);

            $this->assertContains('-deleted', NavItem::findOne(1)->alias);
            $this->assertSame("1", Nav::findOne(1)->is_deleted);
        });
    }
}