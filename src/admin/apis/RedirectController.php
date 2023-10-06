<?php

namespace luya\cms\admin\apis;

use luya\cms\models\Redirect;
use Yii;

/**
 * Redirect Controller.
 *
 * File has been created with `crud/create` command on LUYA version 1.0.0.
 */
class RedirectController extends \luya\admin\ngrest\base\Api
{
    /**
     * @var string The path to the model which is the provider for the rules and fields.
     */
    public $modelClass = 'luya\cms\models\Redirect';

    /**
     * Find a redirect object for a given path info.
     *
     * An example using path would be: Yii::$app->request->pathInfo
     *
     * url: https://example.com/hello/world
     * path: hello/world
     *
     * @param string $path The path to check inside the redirect list.
     * @since 1.0.9
     */
    public function actionCatch($path)
    {
        $compositePath = Yii::$app->composition->prependTo($path);
        foreach (Redirect::find()->all() as $redirect) {
            if ($redirect->matchRequestPath($path)) {
                return $redirect;
            }

            // if its a multi linguage website and the language has not been omited form request path compare this version too.
            // this is requred since the luya UrlManager can change the pathInfo
            if ($path !== $compositePath) {
                if ($redirect->matchRequestPath($compositePath)) {
                    return $redirect;
                }
            }
        }

        return false;
    }
}
