<?php

namespace cmstests\src\menu;

use luya\admin\models\Tag;
use luya\admin\models\TagRelation;
use luya\cms\Menu;
use luya\cms\models\Nav;
use luya\cms\Website;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class QuerySqliteTest extends WebApplicationTestCase
{
    use CmsDatabaseTableTrait;

    private $websiteFixture;

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

    public function testFindByTags()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createAdminGroupFixture(1);
            $scope->createAdminUserFixture();
            $this->createCmsPropertyFixture([]);

            $tag = new ActiveRecordFixture([
                'modelClass' => Tag::class,
                'fixtureData' => [
                    'tag1' => [
                        'id' => 1,
                        'name' => 'foo'
                    ]
                ]
            ]);

            $rel = new ActiveRecordFixture([
                'modelClass' => TagRelation::class,
            ]);

            // assign tag
            TagRelation::batchUpdateRelations([1], Nav::tableName(), 1); // assign to nav id 1

            $scope->createPage('title', '@app/data/cmslayoutviewfile.php', []);

            $all = $this->app->menu->find()->all();

            $this->assertSame(1, count($all));

            $first = $all->current();

            foreach ($all as $i) {
                $t = $i->model->getTags()->asArray()->all();
                $this->assertSame('foo', $t[0]['name']);
            }

            // now search only by tags with foo

            $this->assertSame(1, count($this->app->menu->find()->tags([1])->all()));
            $this->assertSame(1, count($this->app->menu->find()->tags([1,2,3])->all()));
            $this->assertSame(0, count($this->app->menu->find()->tags([2,3])->all()));
        });
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
}
