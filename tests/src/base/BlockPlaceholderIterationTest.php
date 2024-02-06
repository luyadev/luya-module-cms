<?php

namespace cmstests\data\blocks;

use cmstests\CmsFrontendTestCase;
use luya\cms\base\InternalBaseBlock;
use luya\cms\models\Block;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\fixtures\NgRestModelFixture;

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
                ],
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
                ],
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
        $block3 = $blockFixture->getModel('block3');
        $page = $pageFixture->getModel('page1');
        $blockItem1 = $blockItemFixture->getModel('item1');
        $blockItem2 = $blockItemFixture->getModel('item2');

        $this->assertSame('<div class="render-frontend"><box><div class="block">foo</div></box><box><div class="block">bar</div></box></div>', $page->renderPlaceholder('content'));
    }

    public function testEnvOptionsPlaceholderIteration()
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
                    'class' => TestingEnvOptionsBlock::class,
                    'is_disabled' => 0,
                ],
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
                ],
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
                    'prev_id' => 0,
                    'json_config_values' => '{}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ],
                'item3' => [
                    'id' => 3,
                    'block_id' => 1,
                    'placeholder_var' => 'content',
                    'nav_item_page_id' => 1,
                    'prev_id' => 0,
                    'json_config_values' => '{}',
                    'json_config_cfg_values' => '{}',
                    'variation' => '',
                    'is_hidden' => 0,
                ],
            ]
        ]);

        $block1 = $blockFixture->getModel('block1');
        $page = $pageFixture->getModel('page1');
        $blockItem1 = $blockItemFixture->getModel('item1');
        $blockItem2 = $blockItemFixture->getModel('item2');
        $blockItem3 = $blockItemFixture->getModel('item3');

        // admin:

        $adminBlockItems = NavItemPage::getPlaceholder('content', 0, $page);

        $envOptions1 = $adminBlockItems[0]['twig_admin'];
        $envOptions2 = $adminBlockItems[1]['twig_admin'];
        $envOptions3 = $adminBlockItems[2]['twig_admin'];

        $this->assertSame(1, $envOptions1['id']);
        $this->assertSame(1, $envOptions1['blockId']);
        $this->assertSame('admin', $envOptions1['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions1['pageObject']);
        $this->assertSame(1, $envOptions1['index']);
        $this->assertSame(3, $envOptions1['itemsCount']);
        $this->assertTrue($envOptions1['isFirst']);
        $this->assertFalse($envOptions1['isLast']);
        $this->assertFalse($envOptions1['isPrevEqual']);
        $this->assertTrue($envOptions1['isNextEqual']);
        $this->assertSame(1, $envOptions1['equalIndex']);

        $this->assertSame(2, $envOptions2['id']);
        $this->assertSame(1, $envOptions2['blockId']);
        $this->assertSame('admin', $envOptions2['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions2['pageObject']);
        $this->assertSame(2, $envOptions2['index']);
        $this->assertSame(3, $envOptions2['itemsCount']);
        $this->assertFalse($envOptions2['isFirst']);
        $this->assertFalse($envOptions2['isLast']);
        $this->assertTrue($envOptions2['isPrevEqual']);
        $this->assertTrue($envOptions2['isNextEqual']);
        $this->assertSame(2, $envOptions2['equalIndex']);

        $this->assertSame(3, $envOptions3['id']);
        $this->assertSame(1, $envOptions3['blockId']);
        $this->assertSame('admin', $envOptions3['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions2['pageObject']);
        $this->assertSame(3, $envOptions3['index']);
        $this->assertSame(3, $envOptions3['itemsCount']);
        $this->assertFalse($envOptions3['isFirst']);
        $this->assertTrue($envOptions3['isLast']);
        $this->assertTrue($envOptions3['isPrevEqual']);
        $this->assertFalse($envOptions3['isNextEqual']);
        $this->assertSame(3, $envOptions3['equalIndex']);

        // frontend:

        $frontendEnvOptions = json_decode($page->renderPlaceholder('content'), true);

        $envOptions1 = $frontendEnvOptions[0];
        $envOptions2 = $frontendEnvOptions[1];
        $envOptions3 = $frontendEnvOptions[2];

        $this->assertSame(1, $envOptions1['id']);
        $this->assertSame(1, $envOptions1['blockId']);
        $this->assertSame('frontend', $envOptions1['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions1['pageObject']);
        $this->assertSame(1, $envOptions1['index']);
        $this->assertSame(3, $envOptions1['itemsCount']);
        $this->assertTrue($envOptions1['isFirst']);
        $this->assertFalse($envOptions1['isLast']);
        $this->assertFalse($envOptions1['isPrevEqual']);
        $this->assertTrue($envOptions1['isNextEqual']);
        $this->assertSame(1, $envOptions1['equalIndex']);

        $this->assertSame(2, $envOptions2['id']);
        $this->assertSame(1, $envOptions2['blockId']);
        $this->assertSame('frontend', $envOptions2['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions2['pageObject']);
        $this->assertSame(2, $envOptions2['index']);
        $this->assertSame(3, $envOptions2['itemsCount']);
        $this->assertFalse($envOptions2['isFirst']);
        $this->assertFalse($envOptions2['isLast']);
        $this->assertTrue($envOptions2['isPrevEqual']);
        $this->assertTrue($envOptions2['isNextEqual']);
        $this->assertSame(2, $envOptions2['equalIndex']);

        $this->assertSame(3, $envOptions3['id']);
        $this->assertSame(1, $envOptions3['blockId']);
        $this->assertSame('frontend', $envOptions3['context']);
        //@TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions3['pageObject']);
        $this->assertSame(3, $envOptions3['index']);
        $this->assertSame(3, $envOptions3['itemsCount']);
        $this->assertFalse($envOptions3['isFirst']);
        $this->assertTrue($envOptions3['isLast']);
        $this->assertTrue($envOptions3['isPrevEqual']);
        $this->assertFalse($envOptions3['isNextEqual']);
        $this->assertSame(3, $envOptions3['equalIndex']);
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

class TestingEnvOptionsBlock extends InternalBaseBlock
{
    public function name()
    {
        return 'EnvOptions';
    }

    public function config()
    {
        return [];
    }

    public function renderFrontend()
    {
        return (($this->getEnvOption('isFirst')) ? '[' : '') . json_encode($this->getEnvOptions(), JSON_NUMERIC_CHECK) . (($this->getEnvOption('isLast')) ? ']' : ',');
    }

    public function renderAdmin()
    {
        return $this->getEnvOptions();
    }
}
