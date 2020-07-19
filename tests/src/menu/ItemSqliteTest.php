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
    
    private $websiteFixture;
    
    public function afterSetup()
    {
        parent::afterSetup();
        $this->websiteFixture = new \luya\testsuite\fixtures\NgRestModelFixture([
            'modelClass' => \luya\cms\models\Website::class,
            'fixtureData' => [
                'website1' => [
                    'id' => 1,
                    'name' => 'default',
                    'host' => '',
                    'aliases' => '',
                    'is_default' => 1,
                    'is_active' => 1,
                    'is_deleted' => 0,
                ],
            ],
        ]);
    }
    
    protected function tearDown()
    {
        $this->websiteFixture->cleanup();
        parent::tearDown();
    }
    
    public function testColumn()
    {
        PageScope::run($this->app, function(PageScope $scope) {
            $scope->createPage('test', null, []);

            $column = $this->app->menu->find()->all()->column('id');

            $this->assertSame([1003 => '1003'], $column);
        });
    }

    public function testDescendents()
    {
        PageScope::run($this->app, function(PageScope $scope) {
            $scope->createPage('test', null, []);
            $column = $this->app->menu->current->descendants;
            $this->assertSame(0, count($column));
        });
    }


    public function testDescendentsMultiple()
    {
        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'short_code' => 'en',
                'is_default' => 1,
            ]
        ]);
        $this->createCmsNavContainerFixture([
            1 => [
                'id' => 1,
                'name' => 'default',
                'alias' => 'default',
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
    

}