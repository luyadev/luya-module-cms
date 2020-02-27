<?php

namespace luya\cms\frontend\controllers;

use Yii;
use yii\web\View;
use yii\web\NotFoundHttpException;
use Exception;
use luya\cms\frontend\base\Controller;
use luya\cms\models\NavItem;
use luya\cms\models\Redirect;
use yii\web\Response;
use luya\web\filters\ResponseCache;

/**
 * CMS Default Rendering
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class DefaultController extends Controller
{
    /**
     * @inheritdoc
     */
    public $enableCsrfValidation = false;
    
    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();
        
        // enable content compression to remove whitespace
        if (!YII_DEBUG && YII_ENV_PROD && $this->module->contentCompression) {
            $this->view->on(View::EVENT_AFTER_RENDER, [$this, 'minify']);
        }
    }

    /**
     * Determines whether the full page cache is enabled or not.
     *
     * @return boolean
     * @since 2.1.0
     */
    private function isFullPageCacheEnabled()
    {
        $current = Yii::$app->menu->current;
        $isCacheable = (int) NavItem::find()->where(['nav_id' => $current->navId, 'lang_id' => Yii::$app->adminLanguage->activeId])->select(['is_cacheable'])->scalar();
        
        return $this->module->fullPageCache 
            && Yii::$app->request->isGet 
            && $current->type == NavItem::TYPE_PAGE
            && !$current->is404Page
            && $isCacheable;
    }

    /**
     * @inheritDoc
     */
    public function behaviors()
    {
        $behaviors = parent::behaviors();

        // enable full page cache behavior if supported by page and enabled in module.
        $behaviors['pageCache'] = [
            'class' => ResponseCache::class,
            'variations' => [
                Yii::$app->request->url,
            ],
            'dependency' => [
                'class' => 'yii\caching\DbDependency',
                'sql' => 'SELECT max(timestamp_update) FROM cms_nav_item',
            ],
            'enabled' => $this->isFullPageCacheEnabled(),
        ];

        return $behaviors;
    }

    /**
     * Minify the view content.
     *
     * @param \yii\base\ViewEvent $event
     * @return string
     */
    public function minify($event)
    {
        return $event->output = $this->view->compress($event->output);
    }

    /**
     *
     * @throws NotFoundHttpException
     * @return string
     */
    public function actionIndex()
    {
        try {
            $current = Yii::$app->menu->current;
        } catch (Exception $e) {
            // An exception while resolving, check for internal redirect otherwise throw not found exception.
            if (($redirect = $this->findInternalRedirect())) {
                return $redirect;
            }
            
            throw new NotFoundHttpException($e->getMessage());
        }

        // the current resolved item seems to be the 404 page
        if ($current->is404Page) {
            // find redirects
            if (($redirect = $this->findInternalRedirect())) {
                return $redirect;
            }

            // set status 404 and render the item
            Yii::$app->response->statusCode = 404;
        }

        $content = $this->renderItem($current->id, Yii::$app->menu->currentAppendix);

        // It seems to be a json response. Yii::$app->response->format should be FORMAT_JSON or FORMAT_JSONP
        if (is_array($content)) {
            return $this->asJson($content);
        }
        
        // Default format is FORMAT_HTML, if RAW is used we render the content without layout.
        // @see https://github.com/luyadev/luya-module-cms/issues/35
        if (Yii::$app->response->format == Response::FORMAT_RAW) {
            return $content;
        }
        
        return $this->renderContent($content);
    }
    
    protected function findInternalRedirect()
    {
        $path = Yii::$app->request->pathInfo;
        $compositePath = Yii::$app->composition->prependTo($path);
        foreach (Redirect::find()->all() as $redirect) {
            if ($redirect->matchRequestPath($path)) {
                return $this->redirect($redirect->getRedirectUrl(), $redirect->redirect_status_code);
            }

            // if its a multi linguage website and the language has not been omited form request path compare this version too.
            // this is requred since the luya UrlManager can change the pathInfo
            if ($path !== $compositePath) {
                if ($redirect->matchRequestPath($compositePath)) {
                    return $this->redirect($redirect->getRedirectUrl(), $redirect->redirect_status_code);
                }
            }
        }
        
        return false;
    }
}
