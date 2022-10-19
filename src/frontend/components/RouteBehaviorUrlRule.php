<?php

namespace luya\cms\frontend\components;

use luya\web\UrlRule;
use Yii;

/**
 * Routing Rule for UrlManager.
 *
 * UrlRule to enable default routing behavior as the CatchAllRule will catch default routing behavior otherwhise.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class RouteBehaviorUrlRule extends UrlRule
{
    /**
     * @inheritdoc
     */
    public $pattern = '<module>/<controller>/<action>';

    /**
     * @inheritdoc
     */
    public $route = '<module>/<controller>/<action>';

    /**
     * @inheritdoc
     */
    public $defaults = ['controller' => 'default', 'action' => 'index'];

    /**
     * @inheritdoc
     */
    public $mode = UrlRule::PARSING_ONLY;

    /**
     * @inheritdoc
     */
    public function parseRequest($manager, $request)
    {
        // return route in parts where key 0 should be the module assuming routed strings.
        $parts = explode("/", $request->pathInfo);

        // if there is no key 0, the module does not exists in module list or the module name is cms, its an invalid request.
        if (!isset($parts[0]) || !Yii::$app->hasModule($parts[0]) || $parts[0] === 'cms') {
            return false;
        }

        // add trace info
        Yii::info('LUYA-CMS RouteBehaviorUrlRule is parsing the Request for path info \'' . $request->pathInfo .'\'', __METHOD__);

        return parent::parseRequest($manager, $request);
    }
}
