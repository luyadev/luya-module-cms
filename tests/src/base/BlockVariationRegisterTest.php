<?php

namespace cmstests\data\blocks;

use cmstests\CmsFrontendTestCase;
use luya\cms\base\InternalBaseBlock;
use luya\cms\models\Block;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\fixtures\NgRestModelFixture;

class BlockVariationRegisterTest extends CmsFrontendTestCase
{
    public function testRegisterDefaultVariations()
    {
        $this->app->getModule('cmsadmin')->blockVariations = [
            TestingBlock::variations()
                ->add('idf', 'My Test')
                    ->vars(['var1' => 'barfoo'])
                ->add('idf2', 'My default')
                    ->vars(['var1' => 'default'])
                    ->asDefault()
                ->register()
        ];


        $vars = $this->app->getModule('cmsadmin')->blockVariations;

        $this->assertSame([
            'cmstests\data\blocks\TestingBlock' => [
                'idf' => [
                    'title' => 'My Test',
                    'cfgs' => [],
                    'vars' => [
                        'var1' => 'barfoo'
                    ],
                    'extras' => [],
                    'is_default' => false,
                ],
                'idf2' => [
                    'title' => 'My default',
                    'cfgs' => [],
                    'vars' => [
                        'var1' => 'default' // THIS IS THE EXPECTED VALUE
                    ],
                    'extras' => [],
                    'is_default' => true,
                ]
            ]
        ], $vars);

        $this->app->setComponents([
                 'db' => [
                     'class' => 'yii\db\Connection',
                     'dsn' => 'sqlite::memory:',
                 ]
            ]);

        $blockFixture = new NgRestModelFixture([
            'modelClass' => Block::class,
            'fixtureData' => [
                'block1' => [
                    'id' => 1,
                    'group_id' => 1,
                    'class' => TestingBlock::class,
                    'is_disabled' => 0,
                ]
            ]
        ]);

        $pageFixture = new ActiveRecordFixture([
            'modelClass' => NavItemPage::class,
            'fixtureData' => [
                'page1' => [
                    'id' => 1,
                    'layout_id' => 1,
                    'nav_item_id' => 1,
                    'timestamp_create' => time(),
                    'version_alias' => 'barfoo',
                ]
            ]
        ]);

        $blockItemFixture = new NgRestModelFixture([
            'modelClass' => NavItemPageBlockItem::class,
            'fixtureData' => [
                'item1' => [
                    'id' => 1,
                    'block_id' => 1,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 0,
                    'json_config_values' => '{"var1":"foo"}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ]
            ]
        ]);

        $block = $blockFixture->getModel('block1');
        $page = $pageFixture->getModel('page1');
        $blockItem = $blockItemFixture->getModel('item1');

        $this->assertSame('default', $page->renderPlaceholder('content'));
    }

    public function testVariationWhichIsSetAndNotDefault()
    {
        $this->app->getModule('cmsadmin')->blockVariations = [
            TestingBlock::variations()
                ->add('idf', 'My Test')
                    ->vars(['var1' => 'barfoo']) // THIS IS THE EXPECTED VALUE
                ->add('idf2', 'My default')
                    ->vars(['var1' => 'default'])
                    ->asDefault()
                ->register()
        ];

        $this->app->setComponents([
                 'db' => [
                     'class' => 'yii\db\Connection',
                     'dsn' => 'sqlite::memory:',
                 ]
            ]);

        $blockFixture = new NgRestModelFixture([
            'modelClass' => Block::class,
            'fixtureData' => [
                'block1' => [
                    'id' => 1,
                    'group_id' => 1,
                    'class' => TestingBlock::class,
                    'is_disabled' => 0,
                ]
            ]
        ]);

        $pageFixture = new ActiveRecordFixture([
            'modelClass' => NavItemPage::class,
            'fixtureData' => [
                'page1' => [
                    'id' => 1,
                    'layout_id' => 1,
                    'nav_item_id' => 1,
                    'timestamp_create' => time(),
                    'version_alias' => 'barfoo',
                ]
            ]
        ]);

        $blockItemFixture = new NgRestModelFixture([
            'modelClass' => NavItemPageBlockItem::class,
            'fixtureData' => [
                'item1' => [
                    'id' => 1,
                    'block_id' => 1,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 0,
                    'json_config_values' => '{"var1":"foo"}',
                    'json_config_cfg_values' => '{}',
                    'variation' => 'idf',
                    'is_hidden' => 0,
                ]
            ]
        ]);

        $block = $blockFixture->getModel('block1');
        $page = $pageFixture->getModel('page1');
        $blockItem = $blockItemFixture->getModel('item1');

        $this->assertSame('barfoo', $page->renderPlaceholder('content'));
    }
}

class TestingBlock extends InternalBaseBlock
{
    public function name()
    {
        return 'Content';
    }
    public function config()
    {
        return [
            'vars' => [
                ['var' => 'var1', 'label' => 'content', 'type' => self::TYPE_TEXTAREA],
            ]
        ];
    }
    public function renderFrontend()
    {
        return $this->getVarValue('var1');
    }
    public function renderAdmin()
    {
        return '<div>{{ vars.content | raw }}</div>';
    }
}
