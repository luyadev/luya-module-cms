<?php

namespace luya\cms;

use luya\cms\menu\InjectItemInterface;
use luya\cms\menu\Item;
use luya\cms\menu\Query as MenuQuery;
use luya\cms\menu\QueryOperatorFieldInterface;
use luya\cms\models\Config;
use luya\cms\models\NavItemModule;
use luya\helpers\Html;
use luya\traits\CacheableTrait;
use Yii;
use yii\base\Component;
use yii\db\Query as DbQuery;
use yii\web\NotFoundHttpException;

/**
 * Menu container component by language.
 *
 * The {{luya\cms\Menu}} component returns an array with all menu items for a specific language, the class
 * is designed to run in "singleton" mode. The {{luya\cms\Menu}} component provides also basic find methods like findAll,
 * findOne to return specific data via the Query class. The menu components resolves also the current item
 * based on the current request object.
 *
 * Read more in the [[app-menu.md]] Guide.
 *
 * ### findAll()
 *
 * Example of getting all menu items for a specific where condition. The findAll() method does not provide
 * the ability to add with statements, or chaning the language container as its a capsulated MenuQuery.
 *
 * ```php
 * $itemsArray = Yii::$app->menu->findAll([self::FIELD_PARENTNAVID => 0, self::FIELD_PARENTNAVID => 1]);
 * ```
 *
 * ### findOne()
 *
 * Example of getting one menu item for a specific where condition. The findOne() method does not provide
 * the ability to add with statements, or chaning the language container as its a capsulated MenuQuery.
 *
 * ```php
 * $itemArray = Yii::$app->menu->findOne([self::FIELD_ID => 1]);
 * ```
 *
 * ### find()
 *
 * The find() methods is wrapper for creating a new \luya\cms\menu\Query().
 *
 * ```php
 * $itemsArray = Yii::$app->menu->find()->where([self::FIELD_ID => 1])->lang('en')->all();
 * // is equal to:
 * $itemsArray = (new \luya\cms\menu\Query())->where([self::FIELD_ID => 1])->lang('en')->all();
 * ```
 *
 * ### current
 *
 * One of the main goals of the menu component is to retrieve the current active loaded item, based on the
 * current request object. You can always us getCurrent() or current to retrieve the current menu item.
 *
 * ```php
 * $currentItem = Yii::$app->menu->getCurrent();
 * // is equal to:
 * $currentItem = Yii::$app->menu->current;
 * ```
 *
 * ### currentAppendix
 *
 * The getCurrentAppendix() method returns the parts from the url who are not related to the menu link, the
 * appendix part is commonly a part for a module url rule used to switch between controlelrs and actions. The
 * currentAppendix information will be resolved with the getCurrent() method.
 *
 * ### home
 *
 * The the home item for the current active language (defined by composition). As of Yii object inheritance
 * you can use getHome() or home;
 *
 * ```php
 * $homeItem = Yii::$app->menu->getHome();
 * // is equal to:
 * $homeItem = Yii::$app->menu->home;
 * ```
 *
 * @property array $currentUrlRule Get the url rules for the current menu item.
 * @property \luya\cms\menu\Item $current Get the current active menu item.
 * @property \luya\cms\menu\Item $home Get the home menu item.
 * @property \luya\web\Composition $composition Get the composition.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Menu extends Component implements \ArrayAccess, QueryOperatorFieldInterface
{
    use CacheableTrait;

    /**
     * @var string The {{luya\cms\frontend\events\MenuItemEvent}} is triggered when an item is created via {{luya\cms\Menu::find()}} method.
     */
    public const EVENT_ON_ITEM_FIND = 'eventOnItemFind';

    /**
     * @var string Event which is triggere after the menu component is loaded and registered.
     */
    public const EVENT_AFTER_LOAD = 'eventAfterLoad';

    /**
     * @var string Event which is triggered after the resolvment of the current item. Sometimes using the
     * EVENT_AFTER_LOAD will add an item into the menu, but the path is also part of the resolvement. This means
     * if you are injecting a fake menu item from a module the injected item would be resolved and the nav item
     * could not be found. In order to fix behavior you can use this event, as it will still inject the items
     * into the menu, but they wont be resolved when the request parsing start.
     * @since 1.0.5
     */
    public const EVENT_AFTER_RESOLVE_CURRENT = 'eventAfterResolveCurrent';

    /**
     * @var integer Item type cms page (renders blocks).
     */
    public const ITEM_TYPE_PAGE = 1;

    /**
     * @var integer Item type cms module (the page is a cms module).
     */
    public const ITEM_TYPE_MODULE = 2;

    /**
     * @var integer Item type redirect (the page contains a redirect model).
     */
    public const ITEM_TYPE_REDIRECT = 3;

    /**
     * @var boolean Whether all menu item text values should be html encoded or not, since version 1.0.7.2 this is enabled by default in order to
     * ensure administrators can not inject xss code into frontend. If you where "abusing" the description or any other fields in order to use
     * html you can disable this feature with `'encoding' => false` when configure the menu component in your config.
     * @since 1.0.7.2
     */
    public $encoding = true;

    private string $_cachePrefix = 'MenuContainerCache';

    private $_currentUrlRule;

    private $_composition;

    private $_current;

    private $_currentAppendix;

    private array $_languageContainer = [];

    private $_languages;

    private $_redirectMap;

    private $_modulesMap;

    /**
     * Class constructor to DI the request object.
     *
     * @param \luya\web\Request $request The request object resolved by DI.
     * @param array $config
     */
    public function __construct(public \luya\web\Request $request, array $config = [])
    {
        parent::__construct($config);
    }

    /**
     * Set url rules for the current page item in order to retrieve at another point of the appliation when building language links.
     */
    public function setCurrentUrlRule(array $rule)
    {
        $this->_currentUrlRule = $rule;
    }

    /**
     * Get the url rules for the current menu item.
     *
     * @return array
     */
    public function getCurrentUrlRule()
    {
        return $this->_currentUrlRule;
    }

    /**
     * ArrayAccess check if the offset key exists in the language array.
     *
     * @param string $offset Language short code the verify
     * @return bool
     */
    #[\ReturnTypeWillChange]
    public function offsetExists($offset)
    {
        return ($this->getLanguage($offset)) ? true : false;
    }

    /**
     * ArrayAccess get the current offset key if not yet loaded.
     *
     * @param string $offset Language short code to get
     * @return array|mixed
     */
    #[\ReturnTypeWillChange]
    public function offsetGet($offset)
    {
        return $this->getLanguageContainer($offset);
    }

    /**
     * ArrayAccess offsetSet is not implemented in singleton component.
     *
     * @param string $offset
     * @param string $value
     *
     * @throws Exception Always throws exception as this method is not implemented.
     */
    #[\ReturnTypeWillChange]
    public function offsetSet($offset, $value)
    {
        throw new Exception('The set method is disabled for this component.');
    }

    /**
     * ArrayAccess offsetSet is not implemented in singleton component.
     *
     * @param string $offset
     * @throws \luya\cms\Exception Always throws exception as this method is not implemented.
     */
    #[\ReturnTypeWillChange]
    public function offsetUnset($offset)
    {
        throw new Exception('The unset method is disabled for this component.');
    }

    /**
     * Get the composition component if not yet loaded.
     *
     * @return \luya\web\Composition Object with composition informationes.
     */
    public function getComposition()
    {
        if ($this->_composition === null) {
            $this->_composition = Yii::$app->get('composition');
        }

        return $this->_composition;
    }

    /**
     * Determines and encodes the given value if enabled.
     *
     * @param string $value The value to encode.
     * @return string The encoded value if enabled.
     * @since 1.0.7.2
     */
    public function encodeValue($value)
    {
        return $this->encoding ? Html::encode($value) : $value;
    }

    /**
     * Setter method for the language container.
     *
     * This is maily used when working with unit test.
     *
     * Example Data array:
     *
     * ```php
     * [
     *		43 => [
     *    		'id' => '43',
     *    		'nav_id' => '1',
     *    		'lang' => 'fr',
     *	  		'link' => '/public_html/fr/home',
     *    		'title' => 'Homepage',
     *     		'alias' => 'home',
     *     		'description' => '',
     *     		'keywords' => NULL,
     *     		'create_user_id' => '4',
     *     		'update_user_id' => '4',
     *     		'timestamp_create' => '1457091369',
     *     		'timestamp_update' => '1483367249',
     *     		'is_home' => '1',
     *     		'parent_nav_id' => '0',
     *     		'sort_index' => '1',
     *     		'is_hidden' => '1',
     *    		'type' => '1',
     *     		'nav_item_type_id' => '42',
     *     		'redirect' => false,
     *     		'module_name' => false,
     *     		'container' => 'default',
     *     		'depth' => 1,
     *          'image_id' => 0,
     *          'is_url_strict_parsing_disabled' => 1,
     * 		],
     * ]
     * ```
     *
     * @param string $langShortCode
     * @param array $data An array with items based on the database `[0 => ['id' => 1, 'nav_id' => 2, ... ]]`
     */
    public function setLanguageContainer($langShortCode, array $data)
    {
        $this->_languageContainer[$langShortCode] = $data;
    }

    /**
     * Load and return the language container for the specific langShortCode, this method is used
     * when using the ArrayAccess offsetGet() method.
     *
     * @param string $langShortCode A language short code which have to access in $this->getLanguages().
     * @return array An array containing all items in theyr keys for the provided language short code.
     */
    public function getLanguageContainer($langShortCode)
    {
        if (!array_key_exists($langShortCode, $this->_languageContainer)) {
            $this->_languageContainer[$langShortCode] = $this->loadWebsiteLanguageContainer($langShortCode);
            $this->trigger(self::EVENT_AFTER_LOAD);
        }

        return $this->_languageContainer[$langShortCode];
    }

    /**
     * Get languag information for a specific language short code.
     *
     * @param string $shortCode E.g. de or en
     * @return array|boolean If the shortCode exists an array with informations as returned, otherwise false.
     */
    public function getLanguage($shortCode): array|bool
    {
        return (array_key_exists($shortCode, $this->getLanguages())) ? $this->getLanguages()[$shortCode] : false;
    }

    /**
     * Get an array with all available system languages based on the admin_lang table.
     *
     * @return array An array where the key is the short_code and the value an array containing shortcode and id.
     */
    public function getLanguages()
    {
        if ($this->_languages === null) {
            $this->_languages = (new DbQuery())->select(['short_code', 'id'])->indexBy('short_code')->from('admin_lang')->all();
        }

        return $this->_languages;
    }

    /**
     * Get an array containing all redirect items from the database table cms_nav_item_redirect.
     *
     * @return array An array where the key is the id and the value an array containing id, type and value.
     */
    public function getRedirectMap()
    {
        if ($this->_redirectMap === null) {
            $this->_redirectMap = (new DbQuery())->select(['id', 'type', 'value', 'target', 'anchor'])->from('cms_nav_item_redirect')->indexBy('id')->all();
        }

        return $this->_redirectMap;
    }

    /**
     * Returns the parts of the rules who do not belong to the current active menu item link.
     *
     * For instance the current menu link is `/de/company/news` where this
     * page is declared as a module with urlRules, controllers and actions. If the url path is `/de/company/news/detail/my-first-news` the
     * appendix would be `detail/my-first-news`.
     *
     * @return string The url part not related for the current active link
     */
    public function getCurrentAppendix()
    {
        if ($this->_current === null) {
            $this->_current = $this->resolveCurrent();
        }

        return $this->_currentAppendix;
    }

    /**
     * Ability to override the current item in order to make real preview urls (as when resolver does
     * not work of changed urls).
     *
     * @param \luya\cms\menu\Item $item The current item object
     * @since 1.0.0
     */
    public function setCurrent(Item $item)
    {
        $this->_current = $item;
    }

    /**
     * Get the current menu item resolved by active language (from composition).
     *
     * @return \luya\cms\menu\Item An item-object for the current active item.
     */
    public function getCurrent()
    {
        if ($this->_current === null) {
            $this->_current = $this->resolveCurrent();
            $this->trigger(self::EVENT_AFTER_RESOLVE_CURRENT);
        }

        return $this->_current;
    }

    /**
     * Get all items for a specific level.
     *
     * @param integer $level Define the level you like to get the items from, the hirarchy starts by the level 1, which is the root line.
     * @param \luya\cms\menu\Item $baseItem Provide an optional element which represents the base calculation item for Theme
     * siblings/children calculation, this can be case when you have several contains do not want to use the "current" Item
     * as base calucation, because getCurrent() could be in another container so it would get you all level container items for
     * this container.
     * @return array|\luya\cms\menu\QueryIteratorFilter All siblings or children items, if not found an empty array will return.
     */
    public function getLevelContainer($level, Item $baseItem = null): array|\luya\cms\menu\QueryIteratorFilter
    {
        // define if the requested level is the root line (level 1) or not
        $rootLine = ($level === 1) ? true : false;
        // countdown the level (as we need the parent of the element to get the children
        $level--;
        // foreach counter
        $i = 1;

        if ($baseItem === null) {
            $baseItem = $this->getCurrent();
        }

        // foreach
        foreach ($baseItem->with('hidden')->getTeardown() as $item) {
            // if its the root line an match level 1 get all siblings
            if ($rootLine && $i == 1) {
                return $item->without(['hidden'])->siblings;
            } elseif ($i == $level) {
                return $item->without(['hidden'])->children;
            }
            $i++;
        }
        // no no container found for the defined level
        return [];
    }

    /**
     * Get the current item for specified level/depth. Menus always start on level/depth 1. This works
     * only in reversed order, to get the parent level from a child!
     *
     * @param integer $level Level menu starts with 1
     * @return \luya\cms\menu\Item|boolean An item-object for the specific level current, false otherwise.
     */
    public function getLevelCurrent($level): \luya\cms\menu\Item|bool
    {
        $i = 1;
        foreach ($this->getCurrent()->with('hidden')->getTeardown() as $item) {
            if ($i == $level) {
                return $item;
            }
            ++$i;
        }

        return false;
    }

    /**
     * Return the home site for the current resolved language resolved by {{luya\web\Composition}} component.
     *
     * @return \luya\cms\menu\Item An item-object for the home item for the current resolved language.
     */
    public function getHome()
    {
        return (new MenuQuery())->where([self::FIELD_ISHOME => 1])->with('hidden')->one();
    }

    /**
     * Wrapper method for `new \luya\cms\menu\Query()` object.
     *
     * @return \luya\cms\menu\Query
     */
    public function find()
    {
        return (new MenuQuery());
    }

    /**
     * Wrapper method to get all menu items for the current language without hidden items for
     * the specific where statement.
     *
     * @param array $where See {{\luya\cms\menu\Query::where()}}
     * @param boolean $preloadModels Whether to preload all models for the given menu Query. See {{luya\cms\menu\Query::preloadModels()}}
     * @see \luya\cms\menu\Query::where()
     * @return \luya\cms\menu\QueryIterator
     */
    public function findAll(array $where, $preloadModels = false)
    {
        return (new MenuQuery())->where($where)->preloadModels($preloadModels)->all();
    }

    /**
     * Wrapper method to get one menu item for current language without hidden items for the
     * sepcific where statement.
     *
     * @param array $where See {{\luya\cms\menu\Query::where()}}
     * @see \luya\cms\menu\Query::where()
     * @return \luya\cms\menu\Item
     */
    public function findOne(array $where)
    {
        return (new MenuQuery())->where($where)->one();
    }

    /* private methods */

    /**
     * Find the current element based on the request get property 'path'.
     *
     * 1. if request path is empty us the getHome() to return alias.
     * 2. find menu item based on the end of the current path (via array_pop)
     * 3. if no item could be found the home item will be returned
     * 4. otherwise return the alias match from step 2.
     * @return Item
     * @throws NotFoundHttpException
     */
    private function resolveCurrent()
    {
        $requestPath = $this->request->get('path', null);

        if (empty($requestPath)) {
            $home = $this->getHome();
            if (!$home) {
                throw new NotFoundHttpException('Home item could not be found, have you forget to set a default page?');
            }
            $requestPath = $home->alias;
        }

        $requestPath = rtrim($requestPath, '/');

        $urlParts = explode('/', $requestPath);

        $item = $this->aliasMatch($urlParts);

        if (!$item) {
            while (array_pop($urlParts)) {
                if (($item = $this->aliasMatch($urlParts, true)) !== false) {
                    break;
                }
            }
        }

        if ($item) {
            $this->_currentAppendix = substr($requestPath, strlen($item->alias) + 1);
            return $item;
        }

        // no item could have been resolved, but the home side type is module, which can have links.
        if (!$item && $this->home && $this->home->type == 2) {
            $this->_currentAppendix = $requestPath;
            return $this->getHome();
        }

        // we could not resolve a page, check if the website has customized 404 error page defined.
        $navId = Config::get(Config::HTTP_EXCEPTION_NAV_ID, 0);
        $menu = Yii::$app->menu->find()->with(['hidden'])->where(['nav_id' => $navId])->one();
        if ($menu) {
            $menu->is404Page = true;
            return $menu;
        }

        throw new NotFoundHttpException("Unable to resolve requested path '".$requestPath."'.");
    }

    /**
     * prepand the base url for the provided alias.
     *
     * @param string $alias
     * @return string
     */
    public function buildItemLink($alias, $langShortCode)
    {
        return Yii::$app->getUrlManager()->prependBaseUrl($this->composition->prependTo($alias, $this->composition->createRouteEnsure(['langShortCode' => $langShortCode])));
    }

    /**
     * Return all nav item modules to request data later in items
     *
     * @return array An array with all modules index by the id
     */
    public function getModulesMap()
    {
        if ($this->_modulesMap === null) {
            $this->_modulesMap = NavItemModule::find()->select(['module_name', 'id'])->indexBy('id')->asArray()->all();
        }

        return $this->_modulesMap;
    }

    /**
     * load all navigation items for a specific language id.
     *
     * @param integer $langId
     * @param integer $websiteId
     * @return array
     */
    private function getNavData($langId, $websiteId)
    {
        return (new DbQuery())
            ->from(['cms_nav_item item'])
            ->select(['item.id', 'item.nav_id', 'item.title', 'item.description', 'item.keywords', 'item.image_id', 'item.is_url_strict_parsing_disabled', 'item.alias', 'item.title_tag', 'item.timestamp_create', 'item.timestamp_update', 'item.create_user_id', 'item.update_user_id', 'nav.is_home', 'nav.parent_nav_id', 'nav.sort_index', 'nav.is_hidden', 'item.nav_item_type', 'item.nav_item_type_id', 'nav_container.alias AS container'])
            ->leftJoin('cms_nav nav', 'nav.id=item.nav_id')
            ->leftJoin('cms_nav_container nav_container', 'nav_container.id=nav.nav_container_id')
            ->where(['nav.is_deleted' => false, 'nav_container.website_id' => $websiteId, 'item.lang_id' => $langId, 'nav.is_offline' => false, 'nav.is_draft' => false])
            ->orderBy(['container' => 'ASC', 'parent_nav_id' => 'ASC', 'nav.sort_index' => 'ASC'])
            ->indexBy('id')
            ->all();
    }

    private array $_paths = [];

    private array $_nodes = [];

    /**
     * Helper method to build an index with all the alias paths to build the correct links.
     *
     * @param array $data
     * @return array An array with the index where the key is the nav_id
     */
    private function buildIndexForContainer($data)
    {
        $this->_paths = [];
        $this->_nodes = [];

        foreach ($data as $item) {
            $this->_nodes[$item['nav_id']] = ['parent_nav_id' => $item['parent_nav_id'], 'alias' => $item['alias'], 'nav_id' => $item['nav_id']];
        }

        foreach ($this->_nodes as $node) {
            $this->_paths[$node['nav_id']] = $this->processParent($node['nav_id'], null);
        }

        return $this->_paths;
    }

    private function processParent($nodeId, $path)
    {
        $parentId = $this->_nodes[$nodeId]['parent_nav_id'];
        $alias = $this->_nodes[$nodeId]['alias'];

        if ($parentId > 0 && array_key_exists($parentId, $this->_nodes)) {
            return $this->processParent($parentId, $path) . '/' . $alias;
        }

        return $alias;
    }

    /**
     * helper method to see if the request url can be found in the active container.
     */
    private function aliasMatch(array $urlParts, $strictParsing = false): bool|\luya\cms\menu\Item
    {
        if ($strictParsing) {
            $query = (new MenuQuery())
                ->where([self::FIELD_ALIAS => implode('/', $urlParts)])
                ->with('hidden')
                ->andWhere([self::FIELD_TYPE => self::ITEM_TYPE_MODULE])
                ->one();

            if ($query) {
                return $query;
            }

            return (new MenuQuery())
                ->where([self::FIELD_ALIAS => implode('/', $urlParts)])
                ->with('hidden')
                ->andWhere([self::FIELD_IS_URL_STRICT_PARSING_DISABLED => 1])
                ->one();
        }
        return (new MenuQuery())
            ->where([self::FIELD_ALIAS => implode('/', $urlParts)])
            ->with('hidden')
            ->one();
    }

    /**
     * Helper method to load all container data for a specific website and language.
     *
     * @param string $langShortCode e.g. de
     * @return array
     * @throws NotFoundHttpException
     *
     * @since 4.0.0
     */
    private function loadWebsiteLanguageContainer($langShortCode)
    {
        $hostName = $this->request->hostName;
        $cacheKey = $this->_cachePrefix.$hostName.$langShortCode;

        $languageContainer = $this->getHasCache($cacheKey);

        if ($languageContainer === false) {
            $lang = $this->getLanguage($langShortCode);
            if (!$lang) {
                throw new NotFoundHttpException(sprintf("The requested language '%s' does not exist in language table", $langShortCode));
            }

            $website = Yii::$app->website->findOneByHostName($hostName);

            $data = $this->getNavData($lang['id'], $website['id']);

            $index = $this->buildIndexForContainer($data);

            $languageContainer = [];

            // $key = cms_nav_item.id (as of indexBy('id'))
            foreach ($data as $key => $item) {
                $alias = $item['alias'];

                if ($item['parent_nav_id'] > 0 && array_key_exists($item['parent_nav_id'], $index)) {
                    $alias = $index[$item['parent_nav_id']].'/'.$item['alias'];
                }

                $languageContainer[$key] = [
                    'id' => $item['id'],
                    'nav_id' => $item['nav_id'],
                    'website_id' => $website['id'],
                    'lang' => $lang['short_code'],
                    'link' => $this->buildItemLink($alias, $langShortCode),
                    'title' => $this->encodeValue($item['title']),
                    'title_tag' => $this->encodeValue($item['title_tag']),
                    'alias' => $alias,
                    'description' => $this->encodeValue($item['description']),
                    'keywords' => $this->encodeValue($item['keywords']),
                    'create_user_id' => $item['create_user_id'],
                    'update_user_id' => $item['update_user_id'],
                    'timestamp_create' => $item['timestamp_create'],
                    'timestamp_update' => $item['timestamp_update'],
                    'is_home' => $item['is_home'],
                    'parent_nav_id' => $item['parent_nav_id'],
                    'sort_index' => $item['sort_index'],
                    'is_hidden' => $item['is_hidden'],
                    'type' => $item['nav_item_type'],
                    'image_id' => $item['image_id'],
                    'redirect' => ($item['nav_item_type'] == 3 && isset($this->redirectMap[$item['nav_item_type_id']])) ? $this->redirectMap[$item['nav_item_type_id']] : false,
                    'module_name' => ($item['nav_item_type'] == 2 && isset($this->modulesMap[$item['nav_item_type_id']])) ? $this->modulesMap[$item['nav_item_type_id']]['module_name'] : false,
                    'container' => $item['container'],
                    'depth' => count(explode('/', $alias)),
                    'is_url_strict_parsing_disabled' => $item['is_url_strict_parsing_disabled'],
                ];
            }

            $this->setHasCache($cacheKey, $languageContainer);
        }

        return $languageContainer;
    }

    public function injectItem(InjectItemInterface $item)
    {
        $this->_languageContainer[$item->getLang()][$item->getId()] = $item->toArray();
    }

    /**
     * Flush all caching data for the menu for each language
     */
    public function flushCache()
    {
        foreach ($this->getLanguages() as $lang) {
            $this->deleteHasCache($this->_cachePrefix . $this->request->hostName . $lang['short_code']);
        }
    }
}
