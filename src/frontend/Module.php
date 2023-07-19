<?php

namespace luya\cms\frontend;

use luya\base\CoreModuleInterface;
use luya\cms\models\Theme;
use luya\theme\SetupEvent;
use luya\theme\ThemeManager;
use Yii;
use yii\base\Application;

/**
 * Cms Module.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
final class Module extends \luya\base\Module implements CoreModuleInterface
{
    /**
     * @inheritdoc
     */
    public $urlRules = [
        ['pattern' => 'cms-page-preview', 'route' => 'cms/preview/index'],
        ['pattern' => 'block-ajax/<id:\d+>/<callback:[a-z0-9\-]+>', 'route' => 'cms/block/index'],
    ];

    /**
     * @inheritdoc
     */
    public $tags = [
        'menu' => ['class' => 'luya\cms\tags\MenuTag'],
        'page' => ['class' => 'luya\cms\tags\PageTag'],
        'alias' => ['class' => 'luya\cms\tags\AliasTag'],
    ];

    /**
     * @var string Define an error view file who is going to be renderd when the errorAction points to the `cms/error/index` route.
     *
     * In order to handle error messages in your application configure the error handler compononent in you configuration:
     *
     * ```php
     * 'errorHandler' => [
     *     'errorAction' => 'cms/error/index',
     * ]
     * ```
     *
     * Now configure the view file which will be rendered in your cms module:
     *
     * ```php
     * 'cms' => [
     *     'errorViewFile' => '@app/views/error/index.php',
     * ]
     * ```
     *
     * > Note that the view will be rendered with `renderPartial()`, this means the layout file will *not* be included.
     */
    public $errorViewFile = "@cms/views/error/index.php";

    /**
     * @var bool If enabled the cms content will be compressed (removing of whitespaces and tabs).
     */
    public $contentCompression = true;

    /**
     * @var boolean Whether the overlay toolbar of the CMS should be enabled or disabled.
     */
    public $overlayToolbar = true;

    /**
     * @var bool If enableTagParsing is enabled tags like `link(1)` or `link(1)[Foo Bar]` will be parsed
     * and transformed into links based on the cms.
     */
    public $enableTagParsing = true;

    /**
     * @var boolean Wheather full page caching should be enabled or not.
     *
     * The following circumstances will lead into a full page cache:
     *
     * + $fullPageCache is enabled.
     * + its a get request
     * + nav item is_cacheable is enabled.
     * + the type is page (not redirect & not module)
     *
     * > This well speed up the page dramatically but could also lead into huge problems when you are using blocks which needs to collect
     * > data from dynamic sources likes ActiveRecords. Assuming you have a block with latest news or any other data with where
     * > condition based on time, random or active/inactive status - the data won't be populatet until any of the blocks or the page is edited.
     *
     * @since 2.1.0
     */
    public $fullPageCache = true;

    /**
     * @var integer The number of seconds the full page should be cached, 0 means as long as the cache dependencie does not change. The default
     * value is for 2 hours.
     * @since 3.4.0
     */
    public $fullPageCacheDuration = 7200; // 2 hours

    /**
     * @var boolean Wheather host redirect for multi websites should be enabled or not.
     * @since 4.1.0
     */
    public $enableWebsiteHostRedirect = true;

    /**
     * @inheritdoc
     */
    public function registerComponents()
    {
        return [
            'menu' => [
                'class' => 'luya\cms\Menu',
            ],
            'website' => [
                'class' => 'luya\cms\Website',
            ],
        ];
    }

    /**
     * @inheritDoc
     */
    public function luyaBootstrap(Application $app)
    {
        if (!$app->request->isConsoleRequest && !$app->request->isAdmin) {
            if ($app->has('composition') && $app->has('website')) {
                if (empty($app->composition->hostInfoMapping)) {
                    $app->composition->hostInfoMapping = $app->website->createHostInfoMapping();
                }
            }

            if ($app->has('themeManager')) {
                // set active theme from database
                $app->get('themeManager')->on(ThemeManager::EVENT_BEFORE_SETUP, function (SetupEvent $event) {
                    /**
                     * get the base path of the website theme
                     * @since 4.0.0
                     */
                    $activeBasePath = false;
                    if (Yii::$app->website->current['theme_id']) {
                        $activeBasePath = Theme::find()->cache()->select('base_path')->where(['id' => Yii::$app->website->current['theme_id']])->scalar();
                    }
                    if (!$activeBasePath) {
                        // get the base path of the default theme
                        $activeBasePath = Theme::find()->cache()->select('base_path')->where(['is_default' => 1])->scalar();
                    }
                    if ($activeBasePath) {
                        $event->basePath = $activeBasePath;
                    }
                });
            }
        }
    }

    /**
     * @inheritdoc
     */
    public static function onLoad()
    {
        self::registerTranslation('cms', static::staticBasePath() . '/messages', [
            'cms' => 'cms.php',
        ]);
    }

    /**
     * Translations for CMS frontend Module.
     *
     * @param string $message
     * @return string
     */
    public static function t($message, array $params = [])
    {
        return parent::baseT('cms', $message, $params);
    }
}
