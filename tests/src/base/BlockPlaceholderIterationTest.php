<?php

namespace cmstests\data\blocks;

use cmstests\CmsFrontendTestCase;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\cms\models\NavItemPage;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\cms\models\NavItemPageBlockItem;
use luya\cms\models\Block;
use luya\cms\base\InternalBaseBlock;

class BlockPlaceholderIterationTest extends CmsFrontendTestCase
{
    public function testRenderPlaceholderIteration()
    {
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
                    'class' => TestingTextBlock::class,
                    'is_disabled' => 0,
                ],
                'block2' => [
                    'id' => 2,
                    'group_id' => 1,
                    'class' => TestingLayoutBlock::class,
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
                    'block_id' => 2,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 0,
                    'json_config_values' => '{}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ],
                'item2' => [
                    'id' => 2,
                    'block_id' => 1,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 1,
                    'json_config_values' => '{"var1":"foo"}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ],
                'item3' => [
                    'id' => 3,
                    'block_id' => 1,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 1,
                    'json_config_values' => '{"var1":"bar"}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ],
            ]
        ]);

        $block1 = $blockFixture->getModel('block1');
        $block2 = $blockFixture->getModel('block2');
        $page = $pageFixture->getModel('page1');
        $blockItem1 = $blockItemFixture->getModel('item1');
        $blockItem2 = $blockItemFixture->getModel('item2');

        $this->assertSame('<div class="render-frontend"><box><div class="block">foo</div></box><box><div class="block">bar</div></box></div>', $page->renderPlaceholder('content'));
    }
}

class TestingTextBlock extends InternalBaseBlock
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
        return '<div class="block">'.$this->getVarValue('var1').'</div>';
    }
    public function renderAdmin()
    {
        return '<div>{{ vars.content | raw }}</div>';
    }
}

class TestingLayoutBlock extends InternalBaseBlock
{
    public function name()
    {
        return 'Layout';
    }
    public function config()
    {
        return [
            'placeholders' => [
                ['var' => 'content', 'label' => 'content'],
            ]
        ];
    }
    public function renderFrontend()
    {
        return '<div class="render-frontend">'.$this->getPlaceholderValue('content').'</div>';
    }

    public function renderAdmin()
    {
        return '<div>{{ vars.content | raw }}</div>';
    }

    public function placeholderRenderIteration(\luya\cms\base\BlockInterface $block)
    {
        return '<box>'.$block->renderFrontend().'</box>';
    }
}
