<?php

namespace cmstests\src\menu;

use luya\cms\Menu;
use luya\cms\Website;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class ItemSqliteTest extends WebApplicationTestCase
{
    use CmsDatabaseTableTrait;

    public function getConfigArray()
    {
        return [
            'id' => 'ngresttest',
            'basePath' => dirname(__DIR__),
            'components' => [
                'urlManager' => [
                    'cache' => null,
                ],
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ],
                'menu' => [
                    'class' => Menu::class,
                ],
                'website' => [
                    'class' => Website::class,
                ]
            ]
        ];
    }

    public function testColumn()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createAdminGroupFixture(1);
            $scope->createAdminUserFixture();
            $scope->createPage('test', null, []);

            $column = $this->app->menu->find()->all()->column('id');

            $this->assertSame([1003 => '1003'], $column);
        });
    }

    public function testDescendents()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createAdminGroupFixture(1);
            $scope->createAdminUserFixture();
            $scope->createPage('test', null, []);
            $column = $this->app->menu->current->descendants;
            $this->assertSame(0, count($column));
        });
    }


    public function testDescendentsMultiple()
    {
        $this->createAdminGroupFixture(1);
        $this->createAdminUserFixture();

        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'short_code' => 'en',
                'is_default' => 1,
            ]
        ]);
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
        $this->createCmsNavFixture([
            1  => [
                'id' => 1,
                'nav_container_id' => 1,
                'parent_nav_id' => 0,
                'is_home' => 1,
                'is_offline' => 0,
                'is_hidden' => 0,
                'is_deleted' => 0,
                'is_draft' => 0,
                'sort_index' => 1,
            ],
            2 => [
                'id' => 2,
                'nav_container_id' => 1,
                'parent_nav_id' => 1,
                'is_offline' => 0,
                'is_hidden' => 0,
                'is_deleted' => 0,
                'is_draft' => 0,
            ]
        ]);

        $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'alias' => 'foo',
                'title' => 'bar',
                'nav_id' => 1,
                'lang_id' => 1,
            ],
            2 => [
                'id' => 2,
                'alias' => 'foo2',
                'title' => 'bar2',
                'nav_id' => 2,
                'lang_id' => 1,
            ],
        ]);

        $column = $this->app->menu->home->descendants;
        $this->assertSame(1, count($column));
    }

    public function testTeardownWithHidden()
    {
        $this->createAdminGroupFixture(1);
        $this->createAdminUserFixture();
        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'short_code' => 'en',
                'is_default' => 1,
            ]
        ]);
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
        $this->createCmsNavFixture([
            1  => [
                'id' => 1,
                'nav_container_id' => 1,
                'parent_nav_id' => 0,
                'is_home' => 1,
                'is_offline' => 0,
                'is_hidden' => 1,
                'is_deleted' => 0,
                'is_draft' => 0,
                'sort_index' => 1,
            ],
            2 => [
                'id' => 2,
                'nav_container_id' => 1,
                'parent_nav_id' => 1,
                'is_offline' => 0,
                'is_hidden' => 1,
                'is_deleted' => 0,
                'is_draft' => 0,
            ]
        ]);

        $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'alias' => 'abc',
                'title' => 'abc',
                'nav_id' => 1,
                'lang_id' => 1,
            ],
            2 => [
                'id' => 2,
                'alias' => 'def',
                'title' => 'def',
                'nav_id' => 2,
                'lang_id' => 1,
            ],
        ]);

        $column = $this->app->menu->home->with(['hidden'])->teardown;

        $this->assertSame(1, count($column));

        $second = $this->app->menu->find()->with(['hidden'])->where(['id' => 2])->one();

        $this->assertSame(2, count($second->with(['hidden'])->teardown));
    }
}
