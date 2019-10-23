<?php

namespace cmstests\src\menu;

use luya\admin\models\Tag;
use luya\admin\models\TagRelation;
use luya\cms\Menu;
use luya\cms\models\Nav;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class QuerySqliteTest extends WebApplicationTestCase
{
    use CmsDatabaseTableTrait;

    public function getConfigArray()
    {
        return [
            'id' => 'ngresttest',
            'basePath' => dirname(__DIR__),
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ],
                'menu' => [
                    'class' => Menu::class,
                ]
            ]
        ];
    }

    public function testFindByTags()
    {
        PageScope::run($this->app, function(PageScope $scope) {

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

            $this->createAdminLangFixture([
                'lang1' => [
                    'id' => 1,
                    'short_code' => 'en',
                ]
            ]);
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

}