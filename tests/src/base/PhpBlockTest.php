<?php

namespace cmstests\src\blocks;

use cmstests\CmsFrontendTestCase;
use cmstests\data\blocks\PhpTestBlock;
use yii\web\AssetBundle;

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

    /**
     * @todo Test register multiple asset bundles
     */
    public function testOnRegister()
    {
        $block = new PhpTestBlock();
        $block->cacheEnabled = true;

        $block->getView()->registerAssetBundle(AssetBundle::class);
        //        $block->getView()->registerAssetBundle(JqueryAsset::class);

        $block->onRegister();

        $this->assertSame([AssetBundle::class], \Yii::$app->cache->get(['blockassetbundles', $block->getEnvOption('id')]));
        //        $this->assertSame([AssetBundle::class, JqueryAsset::class], \Yii::$app->cache->get(['blockassetbundles', $block->getEnvOption('id')]));
    }

    public function testRelativeViewPath()
    {
        $block = new PhpTestBlock();
        $block->module = null;

        $this->assertStringContainsString('tests'.DIRECTORY_SEPARATOR.'data'.DIRECTORY_SEPARATOR.'blocks'.DIRECTORY_SEPARATOR.'views', $block->getViewPath());
    }
}
