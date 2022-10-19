<?php

namespace cmstests\src\widgets;

use cmstests\data\modules\CmsUrlRuleModule;
use luya\cms\models\NavItem;
use luya\cms\Website;
use luya\cms\widgets\LangSwitcher;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class LangSwitcherSqliteTest extends WebApplicationTestCase
{
    use CmsDatabaseTableTrait;

    public function getConfigArray()
    {
        return [
            'id' => 'ngresttest',
            'basePath' => dirname(__DIR__),
            'language' => 'de',
            'components' => [
                'db' => [
                    'class' => 'yii\db\Connection',
                    'dsn' => 'sqlite::memory:',
                ],
                'menu' => 'luya\cms\Menu',
                'composition' => [
                    'default' => ['langShortCode' => 'de']
                ],
                'urlManager' => [
                    'cache' => null,
                ],
                'website' => [
                    'class' => Website::class,
                ]
            ],
            'modules' => [
                'admin' => 'luya\admin\Module',
                'cmsurlrulemodule' => [
                    'class' => CmsUrlRuleModule::class,
                ]
            ]
        ];
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testSetUrlRuleParamsForI18nSlugUrlRules()
    {
        $langFixture = $this->createAdminLangFixture([
            'de' => [
                'id' => 1,
                'short_code' => 'de',
                'is_default' => 1,
                'is_deleted' => 0,
            ],
            'en' => [
                'id' => 2,
                'short_code' => 'en',
                'is_default' => 0,
                'is_deleted' => 0,
            ]
        ]);

        $this->createAdminGroupFixture(1);
        $this->createAdminUserFixture();

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

        $navFixture = $this->createCmsNavFixture([
            1 => [
                'id' => 1,
                'is_home' => 1,
                'is_hidden' => 0,
                'is_offline' => 0,
                'nav_container_id' => 1,
                'parent_nav_id' => 0,
                'is_draft' => 0,
                'is_deleted' => 0,
            ]
        ]);

        $navItem = $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'nav_id' => 1,
                'lang_id' => 1,
                'title' => 'de',
                'alias' => 'de-slug',
                'nav_item_type' => NavItem::TYPE_MODULE,
                'nav_item_type_id' => 1,
            ],
            2 => [
                'id' => 2,
                'nav_id' => 1,
                'lang_id' => 2,
                'title' => 'en',
                'alias' => 'en-slug',
                'nav_item_type' => NavItem::TYPE_MODULE,
                'nav_item_type_id' => 1,
            ]
        ]);

        $this->createCmsNavItemModuleFixture([
            1 => [
                'id' => 1,
                'module_name' => 'cmsurlrulemodule',
            ],
        ]);

        $x = $this->app->menu->getLanguageContainer('en');

        $this->app->menu->currentUrlRule = [
            'route' => 'go/there',
            'params' => [
                'slug' => 'default',
            ],
        ];

        LangSwitcher::setUrlRuleParam('en', 'slug', 'enslug');

        $w = new LangSwitcher();
        $switcher = $w->run();

        $this->assertStringContainsString('slug=default', $switcher);
        $this->assertStringContainsString('slug=enslug', $switcher);

        $tagFixture = $this->createAdminTagFixture([
            1 => [
                'id' => 1,
                'name' => 'test',
                'translation' => '{"de":"Deutsch","en":"English"}',
            ]
        ]);

        LangSwitcher::setUrlRuleParamByModel($tagFixture->getModel(1), 'translation');
        LangSwitcher::setUrlRuleParamByModel($tagFixture->getModel(1), 'translation', 'slug');

        $w = new LangSwitcher();
        $switcher = $w->run();

        $this->assertStringContainsString('slug=Deutsch', $switcher);
        $this->assertStringContainsString('slug=English', $switcher);
    }
}
