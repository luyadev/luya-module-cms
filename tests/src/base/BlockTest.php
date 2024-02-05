<?php

namespace tests\web\cmsadmin\base;

use cmstests\CmsFrontendTestCase;
use cmstests\data\blocks\TestBlock;
use luya\cms\base\PhpBlock;
use yii\db\ActiveRecord;

class GetterSetter extends PhpBlock
{
    public function name()
    {
        return 'name';
    }

    public function config()
    {
        return [
            'vars' => [
                ['type' => 'zaa-text', 'var' => 'blabla', 'label' => 'yolo'],
            ],
        ];
    }

    public function admin()
    {
        return '';
    }

    public function callbackDerTest()
    {
        return 'bar';
    }
}

class BlockTest extends CmsFrontendTestCase
{
    public function testBlockSetup()
    {
        $block = new TestBlock();

        $this->assertFalse($block->isAdminContext());
        $this->assertFalse($block->isFrontendContext());

        foreach ($block->getConfigVarsExport() as $var) {
            $this->assertArrayHasKey('id', $var);
            $this->assertArrayHasKey('var', $var);
            $this->assertArrayHasKey('label', $var);
            $this->assertArrayHasKey('type', $var);
            $this->assertArrayHasKey('placeholder', $var);
            $this->assertArrayHasKey('options', $var);
            $this->assertArrayHasKey('initvalue', $var);
        }

        foreach ($block->getConfigCfgsExport() as $var) {
            $this->assertArrayHasKey('id', $var);
            $this->assertArrayHasKey('var', $var);
            $this->assertArrayHasKey('label', $var);
            $this->assertArrayHasKey('type', $var);
            $this->assertArrayHasKey('placeholder', $var);
            $this->assertArrayHasKey('options', $var);
            $this->assertArrayHasKey('initvalue', $var);
        }
    }

    public function testBlockValues()
    {
        $block = new TestBlock();

        $block->setVarValues(['var1' => 'content var 1', 'var2' => 'content var 2']);
        $block->setCfgValues(['cfg1' => 'content cfg 1']);

        $this->assertEquals('content var 1', $block->admin()[0]);
        $this->assertEquals('content var 2', $block->admin()[1]);
        $this->assertEquals('content cfg 1', $block->admin()[2]);
    }

    public function testBlockEnvOptions()
    {
        $block = new TestBlock();
        $pageObject = new ActiveRecord(); // @TODO specify class

        $block->setEnvOption('id', 1);
        $block->setEnvOption('blockId', 1);
        $block->setEnvOption('context', 'admin');
        $block->setEnvOption('pageObject', $pageObject);
        $block->setEnvOption('index', 1);
        $block->setEnvOption('itemsCount', 1);
        $block->setEnvOption('isFirst', true);
        $block->setEnvOption('isLast', true);
        $block->setEnvOption('isPrevEqual', false);
        $block->setEnvOption('isNextEqual', false);
        $block->setEnvOption('equalIndex', 1);

        $this->assertTrue($block->isAdminContext());
        $this->assertFalse($block->isFrontendContext());

        $envOptions = $block->admin()[3];
        $this->assertSame(1, $envOptions['id']);
        $this->assertSame(1, $envOptions['blockId']);
        $this->assertSame('admin', $envOptions['context']);
        // @TODO assertInstanceOf() for pageObject
        $this->assertNotEquals(false, $envOptions['pageObject']);
        $this->assertSame(1, $envOptions['index']);
        $this->assertSame(1, $envOptions['itemsCount']);
        $this->assertTrue($envOptions['isFirst']);
        $this->assertTrue($envOptions['isLast']);
        $this->assertFalse($envOptions['isPrevEqual']);
        $this->assertFalse($envOptions['isNextEqual']);
        $this->assertSame(1, $envOptions['equalIndex']);
    }

    public function testGetterSetter()
    {
        $gs = new GetterSetter();

        $a = $gs->config();
        $b = $gs->name();
        $c = $gs->extraVars();
        $d = $gs->admin();

        $gs->setPlaceholderValues(['foo' => 'bar']);

        $this->assertSame(['foo' => 'bar'], $gs->getPlaceholderValues());
    }

    public function testAjaxCreation()
    {
        $gs = new GetterSetter();

        $this->assertNotEquals(false, $gs->createAjaxLink('DerTest'));
    }
}
