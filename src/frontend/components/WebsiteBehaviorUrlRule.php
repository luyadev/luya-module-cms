<?php

namespace luya\cms\frontend\components;

use luya\helpers\Url;
use luya\web\UrlRule;
use Yii;
use yii\web\UrlNormalizerRedirectException;

/**
 * Host routing rule for websites.
 *
 * UrlRule to enable routing behavior for website hosts.
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 4.0.0
 */
class WebsiteBehaviorUrlRule extends UrlRule
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
        $matchedWebsite = Yii::$app->website->findOneByHostName($request->hostName);
        if (boolval($matchedWebsite['redirect_to_host']) && $matchedWebsite['host'] !== $request->hostName) {
            $request->setHostInfo($matchedWebsite['host']);
            throw new UrlNormalizerRedirectException(Url::to($request->getAbsoluteUrl()), 301);
        }

        return false;
    }
}
