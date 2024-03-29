<?php

namespace cmstests\data\blocks;

use cmstests\CmsFrontendTestCase;
use luya\helpers\FileHelper;
use luya\helpers\Html;

class InternalBaseBlockTest extends CmsFrontendTestCase
{
    public function testConcretImplementation()
    {
        $object = new ConcretImplementationBlock();

        $this->assertInstanceOf('luya\cms\base\BlockInterface', $object);
    }

    public function testVarAppendingOfVars()
    {
        $block = new TestBlock();
        $block->addVar(['var' => 'append', 'label' => 'test', 'type' => 'zaa-text'], true);
        $block->addVar(['var' => 'append2', 'label' => 'test2', 'type' => 'zaa-text'], true);
        $cfg = $block->getConfigVarsExport();
        $this->assertSame('append', $cfg[2]['var']);
        $this->assertSame('append2', $cfg[3]['var']);
    }

    public function testVarNotAppendingOfVars()
    {
        $block = new TestBlock();
        $block->addVar(['var' => 'append', 'label' => 'test', 'type' => 'zaa-text'], false);
        $block->addVar(['var' => 'append2', 'label' => 'test2', 'type' => 'zaa-text'], false);
        $cfg = $block->getConfigVarsExport();
        $this->assertSame('append', $cfg[0]['var']);
        $this->assertSame('append2', $cfg[1]['var']);
    }

    public function testCfgAppendingOfVars()
    {
        $block = new TestBlock();
        $block->addCfg(['var' => 'append', 'label' => 'test', 'type' => 'zaa-text'], true);
        $block->addCfg(['var' => 'append2', 'label' => 'test2', 'type' => 'zaa-text'], true);
        $cfg = $block->getConfigCfgsExport();
        $this->assertSame('append', $cfg[1]['var']);
        $this->assertSame('append2', $cfg[2]['var']);
    }

    public function testCfgNotAppendingOfVars()
    {
        $block = new TestBlock();
        $block->addCfg(['var' => 'append', 'label' => 'test', 'type' => 'zaa-text'], false);
        $block->addCfg(['var' => 'append2', 'label' => 'test2', 'type' => 'zaa-text'], false);
        $cfg = $block->getConfigCfgsExport();
        $this->assertSame('append', $cfg[0]['var']);
        $this->assertSame('append2', $cfg[1]['var']);
    }

    public function testValueGetters()
    {
        $block = new TestBlock();
        $block->setVarValues(['null' => null, 'empty' => '', 'false' => false, '0' => 0, 'as0' => 0]);

        $this->assertFalse($block->getVarValue('null', false));
        $this->assertFalse($block->getVarValue('empty', false));
        $this->assertFalse($block->getVarValue('false', false));
        // php7 will return true for 0 == '' while php 8 will return false
        // https://3v4l.org/XfAXs
        //$this->assertFalse($block->getVarValue('0', false));
        //$this->assertFalse($block->getVarValue('as0', false));
    }

    public function testRenderAdminPreview()
    {
        $block = new TestBlock();

        $expect = Html::img('data:image/jpg;base64,' . base64_encode(FileHelper::getFileContent('@cmstests/data/images/blocks/TestBlock.jpg')));
        $this->assertEquals($expect, $block->renderAdminPreview());
    }
}
