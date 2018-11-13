<?php

namespace luya\cms\frontend\controllers;

use Yii;
use yii\web\View;
use yii\web\NotFoundHttpException;
use Exception;
use luya\cms\frontend\base\Controller;
use luya\cms\models\Redirect;
use yii\web\Response;

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
            
            throw new NotFoundHttpException($e->getMessage());
        }

        $content = $this->renderItem($current->id, Yii::$app->menu->currentAppendix);

        // It seems to be a json response. Yii::$app->response->format should be FORMAT_JSON or FORMAT_JSONP
        if (is_array($content)) {
            return $content;
        }
        
        // Default format is FORMAT_HTML, if RAW is used we render the content without layout.
        // @see https://github.com/luyadev/luya-module-cms/issues/35
        if (Yii::$app->response->format == Response::FORMAT_RAW) {
            return $content;
        }
        
        return $this->renderContent($content);
    }
}
