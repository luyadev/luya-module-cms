<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\admin\models\Group;
use luya\admin\models\User;
use luya\cms\admin\apis\MenuController;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class MenuControllerTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function afterSetup()
    {
        parent::afterSetup();

        $this->createAdminUserFixture([
            1  => [
                'id' => 1,
                'firstname' => 'Foo',
                'lastname' => 'Bar',
                'email' => 'foo@example.com',
                'is_deleted' => false,
                'is_api_user' => false,
            ]
        ]);

        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'short_code' => 'en',
                'is_default' => 1,
                'is_deleted' => 0,
            ]
        ]);

        new NgRestModelFixture([
            'modelClass' => Group::class,
            'fixtureData' => [
                'tester' => [
                    'id' => 1,
                    'name' => 'Test Group',
                    'is_deleted' => false,
                ],
            ],
        ]);

        $this->createAdminUserGroupTable();
        $this->createAdminAuthTable();
        $this->createAdminGroupAuthTable();

        $this->insertRow('admin_user_group', [
            'user_id' => 1,
            'group_id' => 1,
        ]);

        $this->createCmsNavPermissionFixture();

        $this->createCmsWebsiteFixture([
            1 => [
                'id' => 1,
                'name' => 'default',
                'host' => '',
                'aliases' => '',
                'is_default' => 1,
                'is_active' => 1,
                'is_deleted' => 0,
                'group_ids' => '[{"value":1}]'
            ],
            2 => [
                'id' => 2,
                'name' => 'other website',
                'host' => '',
                'aliases' => '',
                'is_default' => 0,
                'is_active' => 1,
                'is_deleted' => 0,
                'user_ids' => '[{"value":2}]',
            ]
        ]);
        $this->createCmsNavContainerFixture([
            'container1' => [
                'id' => 99,
                'name' => 'container',
                'alias' => 'container',
                'website_id' => 1,
                'is_deleted' => 0,
            ],
        ]);
        $this->createCmsNavFixture([
            'nav1' => [
                'id' => 1,
                'nav_container_id' => 99,
                'parent_nav_id' => 0,
                'is_deleted' => 0,
                'is_draft' => 0,
            ],
            'nav2' => [
                'id' => 2,
                'nav_container_id' => 99,
                'parent_nav_id' => 0,
                'is_deleted' => 0,
                'is_draft' => 1,
            ]
        ]);
        $this->createCmsNavItemFixture([
            'item1' => [
                'id' => 1,
                'nav_id' => 1,
                'lang_id' => 1,
                'alias' => 'foobar',
            ],
            'item2' => [
                'id' => 2,
                'nav_id' => 2,
                'lang_id' => 1,
                'alias' => 'nav is draft',
                'title' => 'nav is draft',
            ]
        ]);
    }

    public function testActionDataMenu()
    {
        $ctrl = new MenuController('id', $this->app);

        \Yii::$app->adminuser->identity = User::findOne(1);
        $menu = $ctrl->actionDataMenu();

        $this->assertCount(1, $menu['items']);
        $this->assertEquals(1, $menu['items'][0]['id']);

        $this->assertCount(1, $menu['drafts']);
        $this->assertEquals('nav is draft', $menu['drafts'][0]['title']);

        $this->assertCount(1, $menu['containers']);
        $this->assertEquals('container', $menu['containers'][0]['name']);

        $this->assertCount(1, $menu['websites']);
        $this->assertEquals('default', $menu['websites'][0]['name']);

        $this->assertCount(0, $menu['hiddenCats']);
    }

    public function testActionDataPermissionTree()
    {
        $this->createCmsNavPermissionFixture([]);

        $ctrl = new MenuController('id', $this->app);

        \Yii::$app->adminuser->identity = User::findOne(1);
        $menu = $ctrl->actionDataPermissionTree();

        $this->assertCount(1, $menu['websites']);
        /** @var \luya\cms\models\Website $websiteInfo */
        $websiteInfo = $menu['websites'][1]['websiteInfo'];
        $this->assertEquals('default', $websiteInfo->name);

        $containers = $menu['websites'][1]['containers'];
        $this->assertCount(1, $containers);

        $containerInfo = $containers[0]['containerInfo'];
        $this->assertEquals('container', $containerInfo['name']);

        $items = $containers[0]['items'];
        $this->assertCount(1, $items);
        $this->assertEquals(1, $items[0]['id']);
    }
}
