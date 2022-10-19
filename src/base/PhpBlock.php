<?php

namespace luya\cms\base;

use ReflectionClass;
use Yii;
use yii\base\ViewContextInterface;

/**
 * Represents a CMS block with PHP views.
 *
 * @property \luya\cms\base\PhpBlockView $view View Object.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
abstract class PhpBlock extends InternalBaseBlock implements PhpBlockInterface, ViewContextInterface
{
    private $_view;

    /**
     * View Object getter.
     *
     * @return \luya\cms\base\PhpBlockView
     */
    public function getView()
    {
        if ($this->_view === null) {
            $this->_view = Yii::createObject(PhpBlockView::class);
        }

        return $this->_view;
    }

    /**
     * Get relative view path ofr rendering view files.
     *
     * @see \yii\base\ViewContextInterface
     * @return string the view path that may be prefixed to a relative view name.
     */
    public function getViewPath()
    {
        if (empty($this->module)) {
            $class = new ReflectionClass($this);
            return dirname($class->getFileName()) . DIRECTORY_SEPARATOR . 'views';
        }

        return $this->ensureModule() . '/views/blocks';
    }

    /**
     * @inheritdoc
     */
    public function frontend()
    {
        return $this->view->render($this->getViewFileName('php'), [], $this);
    }

    /**
     * @inheritdoc
     */
    public function renderFrontend()
    {
        $this->injectorSetup();
        return $this->frontend();
    }

    /**
     * @inheritdoc
     */
    public function renderAdmin()
    {
        $this->injectorSetup();
        return $this->admin();
    }

    /**
     * Save the registered assets form block to the cache.
     *
     * @since 1.0.5
     */
    public function onRegister()
    {
        if ($this->isCachingEnabled()) {
            $phpBlockView = $this->getView();

            $blockId = $this->getEnvOption('id');

            $cacheKeyAssets = ['blockassets', $blockId];
            $cacheKeyAssetBundles = ['blockassetbundles', $blockId];

            $assets = Yii::$app->cache->getOrSet($cacheKeyAssets, [$phpBlockView, 'getBlockAssets'], $this->getCacheExpirationTime());
            $assetBundles = Yii::$app->cache->getOrSet($cacheKeyAssetBundles, [$phpBlockView, 'getAssetBundleNames'], $this->getCacheExpirationTime());

            /**
             * @todo i think this is not need because in PhpBlockView::init() the EVENT_AFTER_RENDER is listen also.
             */
            PhpBlockView::registerToAppView($assets, $assetBundles);
        }
    }

    /**
     * Load the block assets from cache and register to the app view.
     *
     * @since 1.0.5
     */
    public function onRegisterFromCache()
    {
        if ($this->isCachingEnabled()) {
            $blockId = $this->getEnvOption('id');

            $cacheKeyAssets = ['blockassets', $blockId];
            $cacheKeyAssetBundles = ['blockassetbundles', $blockId];

            $assets = Yii::$app->cache->get($cacheKeyAssets) ?: [];
            $assetBundles = Yii::$app->cache->get($cacheKeyAssetBundles) ?: [];

            PhpBlockView::registerToAppView($assets, $assetBundles);
        }
    }


    /**
     * Will be replaced with cachable trait in future.
     *
     * @return boolean
     */
    private function isCachingEnabled()
    {
        return $this->getIsCacheEnabled() && Yii::$app->has('cache');
    }
}
