<?php

namespace cmstests\src\blocks;

use cmstests\CmsFrontendTestCase;
use cmstests\data\blocks\PhpTestBlock;
use yii\bootstrap\BootstrapAsset;
use yii\web\JqueryAsset;

class PhpBlockTest extends CmsFrontendTestCase
{
    public function testAdminResponse()
    {
        $block = new PhpTestBlock();
        return $this->assertSame('admin', $block->renderAdmin());
    }
    
    public function testFrontendResponse()
    {
        $block = new PhpTestBlock();
        return $this->assertSame('frontend', $block->renderFrontend());
    }
    
    public function testExtraVarsGetter()
    {
        $block = new PhpTestBlock();
        $this->assertArrayHasKey('foo', $block->extraVars());
    }
    
    public function testExtraVarsValueGetter()
    {
        $block = new PhpTestBlock();
        $this->assertSame('bar', $block->getExtraValue('foo'));
    }
    
    public function textExtraVarValuesGetter()
    {
        $block = new PhpTestBlock();
        $this->assertArrayHasKey('foo', $block->getExtraVarValues());
    }
    
    public function testOnRegister()
    {
        $block = new PhpTestBlock();
        $block->cacheEnabled = true;
    
        $block->getView()->registerAssetBundle(JqueryAsset::class);
        $block->getView()->registerAssetBundle(BootstrapAsset::class);
        
        $block->onRegister();

        $this->assertSame([JqueryAsset::class, BootstrapAsset::class], \Yii::$app->cache->get(['blockassetbundles', $block->getEnvOption('id')]));
    }
}
