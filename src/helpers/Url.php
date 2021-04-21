<?php

namespace luya\cms\helpers;

use Yii;
use luya\cms\Exception;
use luya\cms\Menu;

/**
 * CMS Url Helper class extends luya\helpers\Url by CMS routing methods.
 *
 * In addition to the luya\helpers\Url method which is extend it also allows you to make url rule calls to
 * the cms specific contents. The CMS URL helper can only be used when the CMS module is loaded and used within
 * your project application.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Url extends \luya\helpers\Url
{
    /**
     * Link to a registered Module.
     *
     * Its important to know that the `moduleName` must be registered in the modules section in your config and also 
     * that a **module page** is created for this module, the module-block won't work.
     *
     * If the module could not be found (not registered in the cms) the method returns the provided module name.
     *
     * If the module is placed several times, it will take the first pick. So ensure to place a module only once and use
     * the module block for more integration use cases.
     *
     * > Read more about [[app-module-urlrules.md]].
     *
     * @param string $moduleName The name of module you'd like to link to. 
     * @return string Returns the full url to the
     * @see toModuleRoute()
     */
    public static function toModule($moduleName)
    {
        $item = Yii::$app->menu->find()->where(['module_name' => $moduleName])->with(['hidden'])->one();

        if ($item) {
            return $item->link;
        }

        return $moduleName;
    }

    /**
     * Link to a registered Module with custom Route and Params.
     *
     * > In order to link to a Module with a given route (and params) its recommend to generate an URL rule defintion first.
     *
     * Ensure that the $moduleName exists in the modules list of your config and a Module Page has been created for the given Name,
     * otherwise the CMS does not know where to link.
     *
     * Assuming the following url rule defintion defined in {{luya\base\Module::$urlRules}}:
     *
     * ```php
     * public $urlRules = [
     *     ['blog/<year:\d{4}>/<month:\d{2}>' => 'blog/default/index'],
     * ];
     * ```
     *
     * Now its possible to generate the link with toModuleRoute:
     *
     * ```php
     * Url::toModuleRoute('blog', ['/blog/default/index', 'year' => 2016, 'month' => '07]);
     * ```
     *
     * This generates the following URL, assuming the blog module is located on the CMS page /my-super-blog:
     *
     * ```
     * /my-super-blog/2016/07
     * ```
     *
     * > Keep in mind that the $urlRule must be prefixed with the module name, read more about [[app-module-urlrules.md]].
     *
     * @param string $moduleName The ID of the module, which should be found inside the nav items.
     * @param string|array $route The route of the module `module/controller/action` or an array like in Url::to with param infos `['/module/controller/action', 'foo' => 'bar']`.
     * @param array  $params The parameters for the url rule. If the route is provided as an array with params the further defined params or overwritten by the array_merge process.
     * @throws Exception
     * @return string
     * @see toModule()
     */
    public static function toModuleRoute($moduleName, array $route)
    {
        $item = Yii::$app->menu->find()->where(['module_name' => $moduleName])->with(['hidden'])->one();
        
        if ($item) {
            return static::toMenuNavItem($item->id, $route);
        }

        throw new Exception("The module route creation could not find the module '$moduleName'. Have you created a page with this module in this language context?");
    }

    
    /**
     * Create an url to a cms page based on the unique nav item id.
     *
     * This method uses the UNIQUE CMS NAV ITEM identifier.
     *
     * @param integer $navItemId The nav item id of the given page which is the base path for the generated url.
     * @param array $route An array with a route and optional params `['/module/controller/action', 'param' => 'bar]`.
     * @return string The url with the base path from the nav item id and the appended route.
     * @since 1.0.4
     */
    public static function toMenuNavItem($navItemId, array $route)
    {
        return Yii::$app->urlManager->createMenuItemUrl($route, $navItemId);
    }
    
    
    /**
     * Create an url to a cms page based on the nav id.
     *
     * This method uses the language independent navId which is displayed in the cms page tree.
     *
     * @param integer $navId The nav id of the given page which is the base path for the generated url.
     * @param array $route An array with a route and optional params `['/module/controller/action', 'param' => 'bar]`.
     * @return string The url with the base path from the nav id and the appended route.
     * @since 1.0.4
     */
    public static function toMenuNav($navId, array $route)
    {
        $menu = Yii::$app->menu->find()->where([Menu::FIELD_NAVID => $navId])->with(['hidden'])->one();
        
        return static::toMenuNavItem($menu->id, $route);
    }
}
