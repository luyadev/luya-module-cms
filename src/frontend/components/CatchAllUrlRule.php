<?php

namespace luya\cms\frontend\components;

use Yii;
use luya\web\UrlRule;

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
        if (rtrim($pathInfo, '//') !== $pathInfo && substr($manager->suffix, -1) !== '/') {
            return false;
        }
        
        // return the custom route
        return ['/cms/default/index', ['path' => $request->pathInfo]];
    }
}
