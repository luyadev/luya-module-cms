<?php

namespace luya\cms\frontend\components;

use luya\helpers\ArrayHelper;
use luya\web\UrlRule;
use Yii;

/**
 * Catch rule for UrlManager.
 *
 * CMS UrlRule who catches all calls in order to allow cms oversteering of not previous catched requests of other url rules.
 *
 * The CatchAllUrlRule must be the LAST UrlRule of the UrlManager.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class CatchAllUrlRule extends UrlRule
{
    /**
     * @inheritdoc
     */
    public $pattern = '<alias:(.*)+>';

    /**
     * @inheritdoc
     */
    public $route = 'cms/default/index';

    /**
     * @inheritdoc
     */
    public $encodeParams = false;

    /**
     * @inheritdoc
     */
    public function parseRequest($manager, $request)
    {
        // add trace info
        Yii::info('LUYA-CMS CatchAllUrlRule is parsing the Request for path info \'' . $request->pathInfo .'\'', __METHOD__);

        $pathInfo = $request->pathInfo;

        // if no path is given, the route should not apply.
        if (empty($pathInfo)) {
            return false;
        }

        // if there is a trailing slash given, the request is invalid as long as the urlManager suffix
        // does not contain a trailing slash.
        if (rtrim($pathInfo, '//') !== $pathInfo && !str_ends_with($manager->suffix, '/')) {
            return false;
        }

        // return the custom route
        return [$this->route, ['path' => $request->pathInfo]];
    }

    /**
     * @inheritdoc
     */
    public function createUrl($manager, $route, $params)
    {
        if (ltrim($route, '/') !== $this->route) {
            $this->createStatus = self::CREATE_STATUS_ROUTE_MISMATCH;
            return false;
        }

        if (!isset($params['path']) || empty($params['path'])) {
            $this->createStatus = self::CREATE_STATUS_PARAMS_MISMATCH;
            return false;
        }

        $path = ArrayHelper::remove($params, 'path');

        if (empty($params)) {
            return $path;
        }

        return $path .'?'.http_build_query($params);
    }
}
