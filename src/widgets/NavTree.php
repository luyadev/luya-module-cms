<?php

namespace luya\cms\widgets;

use luya\base\Widget;
use luya\cms\menu\Item;
use luya\cms\menu\QueryIteratorFilter;
use luya\helpers\ArrayHelper;
use luya\traits\CacheableTrait;
use Yii;
use yii\caching\DbDependency;
use yii\helpers\Html;

/**
 * Build a Navigation from top down, based on the given item or with a specific menu query.
 *
 * Build the navigation from top:
 *
 * ```php
 * Nav::widget();
 * ```
 *
 * Build the navigation for a given item (all subpages)
 *
 * ```php
 * Nav::widget(['startItem' => Yii::$app->menu->current]);
 * ```
 *
 * Example with all options:
 *
 * ```php
 * NavTree::widget([
 *    'findQuery' => Yii::$app->menu->find()->where(['container' => 'default', 'parent_nav_id' => 0])->all(),
 *    // or
 *    'startItem' => Yii::$app->menu->home, // if defined, startItem will be used, otherwise findQuery
 *    'maxDepth' => 2,
 *    'linkActiveClass' => 'link-active',
 *    'itemActiveClass' => 'item-active',
 *    'listDepthClassPrefix' => 'list-depth-',
 *    'wrapperOptions' => [
 *        'tag' => 'nav',
 *        'class' => 'navigation'
 *    ],
 *    'itemOptions' => [
 *        'tag' => 'li',
 *        'class' => 'item depth-{{depth}} alias-{{alias}}'
 *    ],
 *    'linkOptions' => [
 *        'tag' => 'a',
 *        'class' => 'link depth-{{depth}} alias-{{alias}}'
 *    ],
 * ]);
 * ```
 *
 * @property Item $startItem Generate submenus for all children below of this menu Item. If not defined $findQuery will be used.
 * @property QueryIteratorFilter $findQuery
 *
 * @author Marc Stampfli <kontakt@marcstampfli.guru>
 * @since 1.0.0
 */
class NavTree extends Widget
{
    use CacheableTrait;

    private ?\luya\cms\menu\Item $_startItem = null;

    /**
     * @var null|QueryIteratorFilter The menu Query. If not defined the following query will be used `Yii::$app->menu->find()->where(['container' => 'default', 'parent_nav_id' => 0])->all()`
     */
    private ?\luya\cms\menu\QueryIteratorFilter $_findQuery = null;

    /**
     * @var string If the nav tree widget is used multiple times on the same side (for example for the main navigation and the mobile menu)
     * then its possible to define a variation which then makes the cache identifier unique.
     * @since 4.0.0
     */
    public $variation;

    /**
     * @var null|integer If set the depth of the menu will be limited
     */
    public $maxDepth;

    /**
     * @var string The class that should be set on the *active link*
     */
    public $linkActiveClass = 'nav__link--active';

    /**
     * @var string The class that should be set on the *active item*
     */
    public $itemActiveClass = '';

    /**
     * @var string This prefix will be set in front of the depth number on the list class e.g. list-depth-2
     */
    public $listDepthClassPrefix = 'nav__list--';

    /**
     * @var boolean Decides whether the first <ul> tag will be outputted or not
     */
    public $ignoreFirstListTag = false;

    /**
     * @var null|array If set, a wrapper will be wrapped around the list
     * - tag: The tag for the wrapper, e.g. `nav`
     * - class: Class or classes for the wrapper
     *
     * You can set all possible html attributes as options
     */
    public $wrapperOptions;

    /**
     * @var array Options for the lists that are generated
     * - tag: The tag for the list, default is `ul`
     * - class: Class or classes for the list
     *
     * You can set all possible html attributes as options
     */
    public $listOptions = [
        'class' => 'nav__list'
    ];

    /**
     * @var array Options for the items that are generated
     * - tag: The tag for the item, default is `li`
     * - class: Class or classes for the item
     *
     * You can set all possible html attributes as options
     */
    public $itemOptions = [
        'class' => 'nav__item nav__item--{{alias}}'
    ];

    /**
     * @var array Options for the links that are generated
     * - tag: The tag for the link, default is `a`
     * - class: Class or classes for the link
     *
     * You can set all possible html attributes as options
     * **Note: href and content will be set regardless of the options**
     */
    public $linkOptions = [
        'class' => 'nav__link'
    ];

    /**
     * @var callable A callable which can be used to generate the link content, the first argument of the function
     * is the {{luya\cms\menu\Item}}:
     *
     * ```php
     * 'titleContent' => function(luya\cms\menu\Item $item) {
     *     return '<i class="fa fa-edit">'. $item->title;
     * }
     * ```
     *
     * If no callable is defined, which is default, then the {{luya\cms\menu\Item::$title}} is returned.
     * @since 3.4.0
     */
    public $titleContent;

    /**
     * @var null|string The list tag will be set during init
     */
    private $_listTag;

    /**
     * @var null|string The item tag will be set during init
     */
    private $_itemTag;

    /**
     * @var null|string The link tag will be set during init
     */
    private $_linkTag;

    /**
     * Configure not defined properties
     */
    private function autoConfigure()
    {
        $this->_listTag = ArrayHelper::remove($this->listOptions, 'tag', 'ul');
        $this->_itemTag = ArrayHelper::remove($this->itemOptions, 'tag', 'li');
        $this->_linkTag = ArrayHelper::remove($this->linkOptions, 'tag', 'a');

        if ($this->findQuery === null && $this->startItem === null) {
            $this->findQuery = Yii::$app->menu->find()->where(['container' => 'default', 'parent_nav_id' => 0])->all();
        }
    }

    /**
     * @return string HTML representation of the generated menu
     */
    public function run()
    {
        return $this->getOrSetHasCache($this->generateCacheKey(), function () {
            $this->autoConfigure();

            $html = "";

            if ($this->startItem === null) {
                $html = $this->buildList($this->findQuery);
            } elseif ($this->startItem->hasChildren) {
                $html = $this->buildList($this->startItem->children);
            }

            if ($this->wrapperOptions !== null) {
                $wrapperTag = ArrayHelper::remove($this->wrapperOptions, 'tag', 'nav');
                $html = Html::tag($wrapperTag, $html, $this->wrapperOptions);
            }

            return $html;
        }, 0, new DbDependency(['sql' => 'SELECT max(timestamp_update) FROM cms_nav_item']));
    }

    /**
     * Generate a cache key with certain criteriums
     *
     * @return array
     */
    private function generateCacheKey()
    {
        $key = [
            self::class,
            Yii::$app->composition->langShortCode,
            $this->variation,
            $this->linkActiveClass,
            $this->itemActiveClass,
            $this->listDepthClassPrefix,
            Yii::$app->menu->current->id,
        ];

        if ($this->startItem) {
            $key[] = $this->startItem->id;
        };

        return $key;
    }

    /**
     * Builds the list for the given Iterator and recursively calls itself to also generate the menu for all children
     *
     * @param QueryIteratorFilter $iterator The iterator used to build the list
     * @param int $i The counter that is used to set the list depth
     * @return string Part of the menu
     */
    private function buildList(QueryIteratorFilter $iterator, $i = 1)
    {
        // Abort if maxDepth is set & reached
        if ($this->maxDepth !== null && $i >= ($this->maxDepth + 1)) {
            return "";
        }

        // Add the listDepthClassPrefix manually
        $listOptions = $this->listOptions;

        if (!isset($listOptions['class'])) {
            $listOptions['class'] = "";
        }

        $listOptions['class'] .= " " . $this->listDepthClassPrefix . $i;

        // <ul>
        $html = "";

        if ($this->ignoreFirstListTag && $i !== 1 || !$this->ignoreFirstListTag) {
            $html = Html::beginTag($this->_listTag, $listOptions);
        }

        /** @var Item $item */
        foreach ($iterator as $item) {
            $itemOptions = $this->itemOptions;
            $linkOptions = array_merge($this->linkOptions, ['href' => $item->link, 'target' => $item->getTarget()]);

            // Set the active classes if item is active
            if ($item->isActive) {
                $itemOptions['class'] .= $this->itemActiveClass !== null ? ' ' . $this->itemActiveClass : '';
                $linkOptions['class'] .= $this->linkActiveClass !== null ? ' ' . $this->linkActiveClass : '';
            }

            // <li>
            $html .= Html::beginTag($this->_itemTag, $this->compileOption($item, $itemOptions));

            // <a></a>
            $html .= Html::tag($this->_linkTag, $this->titleContent ? call_user_func($this->titleContent, $item) : $item->title, $this->compileOption($item, $linkOptions));

            // Recursive iterate if item has Children
            if ($item->hasChildren) {
                $html .= $this->buildList($item->children, $i + 1);
            }

            // </li>
            $html .= Html::endTag($this->_itemTag);
        }

        if ($this->ignoreFirstListTag && $i !== 1 || !$this->ignoreFirstListTag) {
            // </ul>
            $html .= Html::endTag($this->_listTag);
        }

        return $html;
    }

    /**
     * Replaces the placeholders, for example {{alias}}, with the value stored in $item
     * If the placeholder name isn't found as a property, it will be returned (e.g. alias)
     *
     * @param Item|null $item
     * @return array
     */
    private function compileOption(Item $item, array $options)
    {
        foreach ($options as $key => $option) {
            $options[$key] = preg_replace_callback('/{{([^}]*)}}/', function ($match) use ($item) {
                if ($item && $item->hasProperty($match[1])) {
                    $f = $match[1];
                    return $item->$f;
                }

                return $match[1];
            }, $option);
        }

        return $options;
    }

    public function setStartItem(Item $item)
    {
        $this->_startItem = $item;
    }

    /**
     * @return Item
     */
    public function getStartItem()
    {
        return $this->_startItem;
    }

    public function setFindQuery(QueryIteratorFilter $findQuery = null)
    {
        $this->_findQuery = $findQuery;
    }

    /**
     * @return QueryIteratorFilter|null
     */
    public function getFindQuery()
    {
        return $this->_findQuery;
    }
}
