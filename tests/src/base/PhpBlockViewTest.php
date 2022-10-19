<?php

namespace cmstests\src\base;

use cmstests\CmsFrontendTestCase;
use cmstests\data\blocks\ConcretImplementationBlock;
use cmstests\data\blocks\PhpTestBlock;
use luya\cms\base\PhpBlockView;
use luya\web\View;
use Yii;
use yii\bootstrap\BootstrapAsset;
use yii\web\AssetBundle;
use yii\web\JqueryAsset;

class PhpBlockViewTest extends CmsFrontendTestCase
{
    public function testRegisterJsAssets()
    {
        // Simulate already registered js
        Yii::$app->view->js = [
            View::POS_READY => [
                "appJsOnReady" => "alert('app ready')",
                "duplicateJsOnReady" => "alert('app ready')",
            ],
            View::POS_END => [
                "appJsEnd1" => "alert('body end')",
                "appJsEnd2" => "alert('body end')"
            ],
        ];

        // Registered js from block
        $blockAssets = [
            'js' => [
                View::POS_END => ["blockJsOnEnd" => "alert('body end')"],
                View::POS_BEGIN => ["blockJsOnBegin" => "alert('body begin')"],
                View::POS_READY => [
                    "blockJsOnReady" => "alert('block ready')",
                    "duplicateJsOnReady" => "alert('block ready')",
                ],
            ]
        ];

        PhpBlockView::registerToAppView($blockAssets, []);

        $expectedJsOrder = [View::POS_READY, View::POS_END, View::POS_BEGIN];
        $this->assertSame($expectedJsOrder, array_keys(Yii::$app->view->js), 'Array keys have to the same order.');

        $expectedJsPosReady = [
            "appJsOnReady" => "alert('app ready')",
            // duplicate js will overwrite by block register
            "duplicateJsOnReady" => "alert('block ready')",
            "blockJsOnReady" => "alert('block ready')"
        ];
        $this->assertSame($expectedJsPosReady, Yii::$app->view->js[View::POS_READY]);

        $expectedJsPosEnd = [
            "appJsEnd1" => "alert('body end')",
            "appJsEnd2" => "alert('body end')",
            "blockJsOnEnd" => "alert('body end')",
        ];
        $this->assertSame($expectedJsPosEnd, Yii::$app->view->js[View::POS_END]);

        $expectedJsPosBegin = [
            "blockJsOnBegin" => "alert('body begin')"
        ];
        $this->assertSame($expectedJsPosBegin, Yii::$app->view->js[View::POS_BEGIN]);
    }

    public function testRegisterCssAndJs()
    {
        // Simulate already registered js
        Yii::$app->view->js = [
            View::POS_READY => [
                "appJsOnReady" => "alert('app ready')",
            ],
        ];

        Yii::$app->view->css = [
            "bodyCss" => "this will overwritten by block",
            "appCssH1" => "h1 { background: black; }",
        ];

        // Registered js from block
        $blockAssets = [
            'css' => [
                "bodyCss" => "body { background: white; }",
                "blockCss" => "h1 { background: black; }",
            ],
            'js' => [
                View::POS_READY => [
                    "blockJsOnReady" => "alert('block ready')",
                ]
            ],
        ];

        PhpBlockView::registerToAppView($blockAssets, []);

        $expectedJs = [
            "appJsOnReady" => "alert('app ready')",
            "blockJsOnReady" => "alert('block ready')",
        ];
        $this->assertSame($expectedJs, Yii::$app->view->js[View::POS_READY]);

        $expectedCss = [
            "bodyCss" => "body { background: white; }",
            "appCssH1" => "h1 { background: black; }",
            "blockCss" => "h1 { background: black; }",
        ];
        $this->assertSame($expectedCss, Yii::$app->view->css);
    }

    /**
     *  @todo Test register multiple asset bundles
     */
    public function testRegisterAssetBundles()
    {
        $blockAssetBundles = [
            AssetBundle::class,
            //JqueryAsset::class,
        ];

        PhpBlockView::registerToAppView([], $blockAssetBundles);

        $this->assertInstanceOf(AssetBundle::class, Yii::$app->view->assetBundles[AssetBundle::class]);
        //$this->assertInstanceOf(JqueryAsset::class, Yii::$app->view->assetBundles[BootstrapAsset::class]);
    }

    public function testGetBlock()
    {
        $block = new ConcretImplementationBlock();
        $view = new PhpBlockView();
        $view->context = $block;

        $this->assertInstanceOf(ConcretImplementationBlock::class, $view->getBlock());
    }

    public function testGetters()
    {
        $block = new PhpTestBlock();
        $view = new PhpBlockView();
        $view->context = $block;

        $this->assertSame(false, $view->getIndex());
        $this->assertSame(false, $view->getIsFirst());
        $this->assertSame(false, $view->getIsLast());
        $this->assertSame(false, $view->getItemsCount());
        $this->assertFalse($view->getIsNextEqual());
        $this->assertFalse($view->getIsPrevEqual());
        $this->assertFalse($view->getEqualIndex());
        $this->assertSame(false, $view->getBlockId());
        $this->assertSame(false, $view->getPageObject());
        $this->assertNull($view->env('barfoo'));

        $this->assertSame('<p>content</p>', $view->wrapTemplate('title', 'content', '<p>{{title}}</p>'));
        $this->assertSame(false, $view->placeholderValue('doesnotexsts'));
    }
}
