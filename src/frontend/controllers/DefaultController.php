<?php

namespace luya\cms\frontend\controllers;

use Exception;
use luya\cms\frontend\base\Controller;
use luya\cms\models\NavItem;
use luya\cms\models\Redirect;
use luya\web\filters\ResponseCache;
use Yii;
use yii\web\NotFoundHttpException;
use yii\web\Response;
use yii\web\View;

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
        // if the page could not be found, caching is disable otherwise the behaviors method would
        // throw an exception which then would stop execute the "find redirects" task.
        try {
            return $this->module->fullPageCache
                && Yii::$app->request->isGet
                && Yii::$app->menu->current
                && Yii::$app->menu->current->type == NavItem::TYPE_PAGE
                && !Yii::$app->menu->current->is404Page
                && $this->isAdminLoggedIn()
                && (int) NavItem::find()->where(['nav_id' => Yii::$app->menu->current->navId, 'lang_id' => Yii::$app->adminLanguage->activeId])->select(['is_cacheable'])->scalar();
        } catch (NotFoundHttpException) {
            return false;
        }
    }

    /**
     * Returns whether admin user is working in frontend context.
     *
     * @return boolean Whether caching should be enabled or not.
     * @since 3.5.0
     */
    private function isAdminLoggedIn()
    {
        return Yii::$app->has('adminuser') ? Yii::$app->adminuser->isGuest : true;
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
            'duration' => $this->module->fullPageCacheDuration,
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
            if ($wildcard = $redirect->matchRequestPath($path)) {
                return $this->redirect($redirect->getRedirectUrl($wildcard), $redirect->redirect_status_code);
            }

            // if its a multi linguage website and the language has not been omited form request path compare this version too.
            // this is requred since the luya UrlManager can change the pathInfo
            if ($path !== $compositePath) {
                if ($wildcard = $redirect->matchRequestPath($compositePath)) {
                    return $this->redirect($redirect->getRedirectUrl($wildcard), $redirect->redirect_status_code);
                }
            }
        }

        return false;
    }
}
