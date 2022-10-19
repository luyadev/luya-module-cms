<?php

namespace cmstests\src\controllers;

use luya\admin\models\Group;
use luya\admin\models\Lang;
use luya\admin\models\User;
use luya\cms\frontend\blocks\HtmlBlock;
use luya\cms\models\Nav;
use luya\cms\models\NavContainer;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemPage;
use luya\cms\models\Property;
use luya\cms\models\Theme;
use luya\cms\models\Website as WebsiteModel;
use luya\cms\Website;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\scopes\PageScope;
use Yii;
use yii\base\Event;

class ControllerStub extends \luya\cms\frontend\base\Controller
{
}

class DefaultControllerTest extends WebApplicationTestCase
{
    /** @var ActiveRecordFixture */
    protected $fixture;

    public function getConfigArray()
    {
        return [
            'id' => 'pagescope',
            'basePath' => dirname(__DIR__),
            'modules' => [
                'admin' => 'luya\admin\Module',
                'cms' => 'luya\cms\frontend\Module',
                'cmsadmin' => 'luya\cms\admin\Module',
            ],
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ],
                'menu' => 'luya\cms\Menu',
                'website' => [
                    'class' => Website::class,
                ],
                'composition' => [
                    'default' => ['langShortCode' => 'en']
                ],
                'urlManager' => [
                    'cache' => null,
                ]
            ]
        ];
    }

    /**
     * @runInSeparateProcess
     */
    public function testRenderPageCycle()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $scope->createAdminGroupFixture(1);
            $scope->createAdminUserFixture();
            $scope->createPage('home', '@app/../data/views/cmslayouts/main.php', ['content'])->addBlockAndContent(HtmlBlock::class, 'content', [
                'html' => '<p>foobar</p>',
            ]);
            $page = NavItemPage::findOne($scope->pageId);
            $content = $page->getContent();
            $copy = (string) $content;
            $this->assertNotNull($content);
        });
    }

    public function testRenderToolbar()
    {
        //region Fictures

        $adminGroupFixture = new ActiveRecordFixture([
            'modelClass' => Group::class,
            'fixtureData' => [
                'tester' => [
                    'id' => 1,
                    'name' => 'Test Group',
                ],
            ],
        ]);
        $adminUserFixture = new ActiveRecordFixture([
            'modelClass' => User::class,
            'fixtureData' => [],
        ]);

        $langFixture = new ActiveRecordFixture([
            'modelClass' => Lang::class,
            'fixtureData' => [
                'en' => [
                    'id' => 1,
                    'short_code' => 'en',
                    'is_default' => 1,
                ],
            ]
        ]);

        $websiteFixture = new ActiveRecordFixture([
            'modelClass' => WebsiteModel::class,
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
            ]
        ]);

        $langFixture = new ActiveRecordFixture([
            'modelClass' => NavContainer::class,
            'fixtureData' => [
                [
                    'id' => 1,
                    'name' => 'default',
                    'alias' => 'default',
                    'website_id' => 1,
                ],
            ]
        ]);

        $navFixture = new ActiveRecordFixture([
            'modelClass' => Nav::class,
            'fixtureData' => [
                [
                    'id' => 1,
                    'is_home' => 1,
                    'is_hidden' => 0,
                    'is_offline' => 0,
                    'nav_container_id' => 1,
                    'parent_nav_id' => 0,
                    'is_draft' => 0,
                    'is_deleted' => 0,
                ]
            ]
        ]);

        $navItemFixture = new ActiveRecordFixture([
            'modelClass' => NavItem::class,
            'fixtureData' => [
                [
                    'id' => 1,
                    'nav_id' => 1,
                    'lang_id' => 1,
                    'title' => 'en',
                    'alias' => 'en-slug',
                    'nav_item_type' => NavItem::TYPE_PAGE,
                    'nav_item_type_id' => 1,
                ]
            ]
        ]);

        $navItemFixture = new ActiveRecordFixture([
            'modelClass' => Property::class,
        ]);

        $this->fixture = new ActiveRecordFixture([
            'modelClass' => Theme::class,
            'fixtureData' => [
                [
                    'is_default' => true,
                    'base_path' => '@app/themes/appTheme',
                    'json_config' => '{}',
                ]
            ]
        ]);

        //endregion

        $this->app->menu->currentUrlRule = [
            'route' => 'default/default',
            'params' => [
                'slug' => 'default',
            ],
        ];

        $controller = new ControllerStub('default', $this->app->getModule('cms'));
        $controller->view->context = $controller;

        $event = new Event([
            'sender' => $controller->view,
            'data' => ['content' => 'FOO']
        ]);

        Yii::setAlias('@app', Yii::$app->basePath . '/../data');

        $this->app->themeManager->activeThemeName = '@app/themes/appTheme';
        $this->app->themeManager->setup();

        ob_start();
        $controller->renderToolbar($event);
        $toolbarHtml = ob_get_clean();

        $internalErrors = libxml_use_internal_errors(true);

        $doc = new \DOMDocument();
        $loaded = $doc->loadHTML($toolbarHtml);

        libxml_use_internal_errors($internalErrors);

        $this->assertTrue($loaded);

        $this->fixture->cleanup();
    }
}
