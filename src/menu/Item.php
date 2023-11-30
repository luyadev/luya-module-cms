<?php

namespace luya\cms\menu;

use luya\admin\models\User;
use luya\cms\Exception;
use luya\cms\LinkConverter;
use luya\cms\models\Nav;
use luya\web\LinkInterface;
use luya\web\LinkTrait;
use Yii;
use yii\base\Arrayable;
use yii\base\ArrayableTrait;
use yii\base\BaseObject;

/**
 * Menu item Object.
 *
 * Each menu itaration will return in an Item-Object. The Item-Object contains several methods like
 * returning title, url and ids or retrieve depending item iterations like parents or childs. As the
 * Item Object extends the {{yii\base\BaseObject}} all getter methods can be access as property.
 *
 * Read more in the [[app-menu.md]] Guide.
 *
 * @property integer $id Returns Unique identifier of item, represents data record of cms_nav_item table.
 * @property boolean $isHidden Returns boolean state of visbility.
 * @property string $container Returns the container name.
 * @property integer $navId Returns the Navigation Id which is not unique but is used for the menu tree
 * @property integer $parentNavId Returns the parent navigation id of this item (0 = root level).
 * @property string $title Returns the title of this page
 * @property integer $type Returns the type of page 1=Page with blocks, 2=Module, 3=Redirect
 * @property string $moduleName Returns the name of the module if its of type module(2)
 * @property string $description Returns the page description (used for making meta key description).
 * @property array $keywords Returns an array of user defined keywords for this page (user to generate meta keywords)
 * @property string $alias Returns the alias name of this page.
 * @property integer $dateCreated Returns an unix timestamp when the page was created.
 * @property integer $dateUpdated Returns an unix timestamp when the page was last time updated.
 * @property User $userCreated Returns an active record object for the admin user who created this page.
 * @property User $userUpdated Returns an active record object for the admin user who last time updated this page.
 * @property string $link  Returns the current item link relative path with composition (language). The path is always relativ to the host.
 * @property boolean $isActive Returns a boolean value whether the current item is an active link or not, this is also for all parent elements. If a child item is active, the parent element is activ as well.
 * @property integer $depth Returns the depth of the navigation tree start with 1. Also known as menu level.
 * @property Item $parent Returns a Item-Object of the parent element, if no parent element exists returns false.
 * @property QueryIteratorFilter $parents Return all parent elements **without** the current item.
 * @property QueryIteratorFilter $sibilings Get all sibilings for the current item, this also includes the current item iteself.
 * @property QueryIteratorFilter $teardown Return all parent elemtns **with** the current item.
 * @property QueryIteratorFilter $children Get all children of the current item. Children means going the depth/menulevel down e.g. from 1 to 2.
 * @property QueryIteratorFilter $descendants Get all childrens with childrens children.
 * @property boolean $isHome Returns true if the item is the home item, otherwise false.
 * @property string $absoluteLink The link path with prepand website host `https://luya.io/home/about-us`.
 * @property integer $sortIndex Sort index position for the current siblings list.
 * @property boolean $hasChildren Check whether an item has childrens or not returning a boolean value.
 * @property boolean $hasParent Check whether the parent has items or not.
 * @property string $seoTitle Returns the Alternative SEO-Title. If entry is empty, the $title will returned instead.
 * @property Item|boolean $nextSibling Returns the next sibling based on the current sibling, if not found false is returned.
 * @property Item|boolean $prevSibling Returns the previous sibling based on the current sibling, if not found false is returned.
 * @property Nav|boolean $model Returns the {{\luya\cms\models\Nav}} object for the current navigation item.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Item extends BaseObject implements LinkInterface, Arrayable
{
    use LinkTrait;
    use ArrayableTrait;

    /**
     * @var array The item property containing the informations with key  value parinings. This property will be assigned when creating the
     * Item-Object.
     */
    public $itemArray;

    /**
     * @var string|null Can contain the language context, so the sub querys for this item will be the same language context
     * as the parent object which created this object.
     */
    public $lang;

    /**
     * @var boolean This property indicates whether the item is the 404 page item or not. This status is set by {{luya\cms\Menu::resolveCurrent()}} method and retrieved
     * in the {{luya\cms\frontend\controllers\DefaultController::actionIndex()}} in order to send 404 response header.
     * @since 2.0.0
     */
    public $is404Page = false;

    /**
     * @var array Privat property containing with informations for the Query Object.
     */
    private array $_with = [];

    /**
     * @inheritdoc
     */
    public function fields()
    {
        return ['href', 'target'];
    }

    /**
     * @inheritdoc
     */
    public function getHref()
    {
        return $this->getLink();
    }

    private $_anchor;

    public function setAnchor($anchor)
    {
        $this->_anchor = ltrim($anchor, '#');
    }

    public function getAnchor()
    {
        return $this->_anchor;
    }

    private $_target;

    /**
     * Setter method for the link target.
     *
     * @param string $target
     */
    public function setTarget($target)
    {
        $this->_target = $target;
    }

    /**
     * @inheritdoc
     */
    public function getTarget()
    {
        return empty($this->_target) ? '_self' : $this->_target;
    }

    /**
     * Item-Object initiliazer, verify if the itemArray property is empty.
     *
     * @throws Exception
     */
    public function init()
    {
        if ($this->itemArray === null) {
            throw new Exception('The itemArray property can not be null.');
        }
        // call parent object initializer
        parent::init();
    }

    /**
     * Get the Id of the Item, the Id is an unique identifiere an represents the
     * id column in the cms_nav_item table.
     *
     * @return int
     */
    public function getId()
    {
        return (int) $this->itemArray['id'];
    }

    /**
     * Get the sorting index position for the item on the current siblings.
     *
     * @return integer Sort index position for the current siblings list.
     */
    public function getSortIndex()
    {
        return (int) $this->itemArray['sort_index'];
    }

    /**
     * Whether the item is hidden or not if hidden items can be retreived (with/without settings).
     *
     * @return boolean
     */
    public function getIsHidden()
    {
        return (bool) $this->itemArray['is_hidden'];
    }

    /**
     * Whether current item is home or not.
     *
     * @return boolean Returns true if the item is the home item, otherwise false.
     */
    public function getIsHome()
    {
        return (bool) $this->itemArray['is_home'];
    }

    /**
     * Override the default hidden state of an item.
     *
     * @param boolean $value True or False depending on the visbility of the item.
     */
    public function setIsHidden($value)
    {
        $this->itemArray['is_hidden'] = (int) $value;
    }

    /**
     * Return the current container name of this item.
     *
     * @return string Return alias name of the container
     */
    public function getContainer()
    {
        return $this->itemArray['container'];
    }

    /**
     * Get the Nav-id of the Item, the Nav-Id is not unique but in case of the language
     * container the nav id is unique. The Nav-Id identifier repersents the id coluumn
     * of the cms_nav table.
     *
     * @return int
     */
    public function getNavId()
    {
        return (int) $this->itemArray['nav_id'];
    }

    /**
     * Get the parent_nav_id of the current item. If the current Item-Object belongs to a
     * parent navigation item, the getParentNavId() method returns the getNavId() of the parent
     * item.
     *
     * ```
     * .
     * ├── item (navId 1)
     * └── item (navId 2)
     *     ├── item (navId 3 with parentNavId 2)
     *     └── item (navId 4 with parentNavId 2)
     * ```
     *
     * @return int
     */
    public function getParentNavId()
    {
        return (int) $this->itemArray['parent_nav_id'];
    }

    /**
     * Returns the current Title of the Menu Item.
     *
     * @return string e.g. "Hello World"
     */
    public function getTitle()
    {
        return $this->itemArray['title'];
    }

    /**
     * Override the current title of item.
     *
     * @param string $title The title to override of the existing.
     */
    public function setTitle($title)
    {
        $this->itemArray['title'] = $title;
    }

    /**
     * Returns the Alternative SEO-Title.
     *
     * If no SEO-Title is given, the page title from {{luya\cms\menu\Item::getTitle}} will be returned instead.
     *
     * @return string Return the SEO-Title, if empty the {{luya\cms\menu\Item::getTitle}} will be returned instead.
     */
    public function getSeoTitle()
    {
        return empty($this->itemArray['title_tag']) ? $this->title : $this->itemArray['title_tag'];
    }

    /**
     * Return the current nav item type by number.
     *
     * + 1 = Page with blocks
     * + 2 = Module
     * + 3 = Redirect
     *
     * @return int The type number
     */
    public function getType()
    {
        return (int) $this->itemArray['type'];
    }

    /**
     * If the type of the item is equals 2 we can detect the module name and returns
     * this information.
     *
     * @return boolean|string The name of the module or false if not found or wrong type
     */
    public function getModuleName(): bool|string
    {
        if ($this->getType() === 2) {
            return $this->itemArray['module_name'];
        }

        return false;
    }

    /**
     * Returns the description provided by the cms admin, if any.
     *
     * @return string The description string for this page.
     */
    public function getDescription()
    {
        return $this->itemArray['description'];
    }

    private $_keywords;

    private array $_delimiters = [',', ';', '|'];

    /**
     * @return array An array with all keywords for this page
     */
    public function getKeywords()
    {
        if ($this->_keywords === null) {
            if (empty($this->itemArray['keywords'])) {
                $this->_keywords = [];
            } else {
                foreach (explode($this->_delimiters[0], str_replace($this->_delimiters, $this->_delimiters[0], $this->itemArray['keywords'])) as $name) {
                    if (!empty(trim($name))) {
                        $this->_keywords[] = trim($name);
                    }
                }
            }
        }

        return $this->_keywords;
    }

    /**
     * Returns the current alias name of the item (identifier for the url)
     * also (& previous) called rewrite.
     *
     * @return string e.g. "hello-word"
     */
    public function getAlias()
    {
        return $this->itemArray['alias'];
    }

    /**
     * Returns an unix timestamp when the page was created.
     *
     * @return int Unix timestamp
     */
    public function getDateCreated()
    {
        return $this->itemArray['timestamp_create'];
    }

    /**
     * Returns an unix timestamp when the page was last time updated.
     *
     * @return int Unix timestamp
     */
    public function getDateUpdated()
    {
        return $this->itemArray['timestamp_update'];
    }

    /**
     * Returns an active record object for the admin user who created this page.
     *
     * @return \luya\admin\models\User|boolean Returns an ActiceRecord for the admin user who created the page, if not
     * found the return value is false.
     */
    public function getUserCreated(): \luya\admin\models\User|bool
    {
        return User::findOne($this->itemArray['create_user_id']);
    }

    /**
     * Returns an active record object for the admin user who last time updated this page.
     *
     * @return \luya\admin\models\User|boolean Returns an ActiceRecord for the admin user who last time updated this page, if not
     * found the return value is false.
     */
    public function getUserUpdated(): \luya\admin\models\User|bool
    {
        return User::findOne($this->itemArray['update_user_id']);
    }

    /**
     * Returns the image object if an object is uploaded.
     *
     * @return \luya\admin\image\Item|boolean The Image object or false if no image has been uploaded
     * @since 2.0.0
     */
    public function getImage(): \luya\admin\image\Item|bool
    {
        return Yii::$app->storage->getImage($this->itemArray['image_id']);
    }

    /**
     * Internal used to retriev redirect data.
     *
     * The redirect data commonly has the following keys:
     *
     * + type: Its a number which represents the redirect type (1 = internal, 2 = external, etc.)
     * + value: A value which associated for the type (file could a file id but external link could be a string with the url)
     *
     * @return multitype:
     */
    protected function redirectMapData($key)
    {
        return !empty($this->itemArray['redirect']) ? $this->itemArray['redirect'][$key] : false;
    }

    /**
     * Returns the current item link relative path with composition (language). The
     * path is always relativ to the host.
     *
     * Hidden links will be returned from getLink. So if you make a link
     * from a page to a hidden page, the link of the hidden page will be returned and the link
     * will be successfully displayed
     *
     * @return string The link path `/home/about-us` or with composition `/de/home/about-us`
     */
    public function getLink()
    {
        // take care of redirect
        if ($this->getType() === 3 && !empty($this->redirectMapData('value'))) {
            // generate convert object to determine correctn usage.
            $converter = new LinkConverter([
                'type' => $this->redirectMapData('type'),
                'value' => $this->redirectMapData('value'),
                'target' => $this->redirectMapData('target'),
                'anchor' => $this->redirectMapData('anchor')
            ]);

            if ($this->redirectMapData('target')) {
                $this->setTarget($this->redirectMapData('target'));
            }

            if ($this->redirectMapData('anchor')) {
                $this->setAnchor($this->redirectMapData('anchor'));
            }

            switch ($converter->type) {
                case $converter::TYPE_EXTERNAL_URL:
                    return $converter->getWebsiteLink($converter->value, $converter->target)->getHref();
                case $converter::TYPE_INTERNAL_PAGE:
                    if (empty($converter->value) || $converter->value == $this->navId) {
                        return;
                    }
                    $page = $converter->getPageLink($converter->value, $converter->target, $this->lang);
                    $link = $page ? $page->getHref() : '';
                    if ($this->getAnchor()) {
                        $link .= "#{$this->getAnchor()}";
                    }
                    return $link;
                case $converter::TYPE_LINK_TO_EMAIL:
                    return $converter->getEmailLink($converter->value)->getHref();
                case $converter::TYPE_LINK_TO_FILE:
                    return $converter->getFileLink($converter->value, $converter->target)->getHref();
                case $converter::TYPE_LINK_TO_TELEPHONE:
                    return $converter->getTelephoneLink($converter->value)->getHref();
            }
        }

        // if its the homepage and the default lang short code is equasl to this lang the link has no path.
        if ($this->itemArray['is_home'] && Yii::$app->composition->defaultLangShortCode == $this->itemArray['lang']) {
            return Yii::$app->urlManager->prependBaseUrl('');
        }

        $link = $this->itemArray['link'];

        if ($this->getAnchor()) {
            $link .= "#{$this->getAnchor()}";
        }

        return $link;
    }

    /**
     * Returns the link with an absolute scheme.
     *
     * The link with an absolute scheme path example `https://luya.io/link` where link is the output
     * from the {{luya\cms\menu\item::getLink}} method.
     *
     * @return string The link path with prepand website host `https://luya.io/home/about-us`.
     */
    public function getAbsoluteLink()
    {
        return Yii::$app->request->hostInfo . $this->getLink();
    }

    /**
     * Returns a boolean value whether the current item is an active link or not, this
     * is also for all parent elements. If a child item is active, the parent element
     * is activ as well.
     *
     * @return bool
     */
    public function getIsActive()
    {
        return in_array($this->id, Yii::$app->menu->current->teardown->column('id'));
    }

    /**
     * Returns whether the current page has strict parsing mode disabled or not.
     *
     * @return boolean
     * @since 2.1.0
     */
    public function getIsStrictParsing()
    {
        return !$this->itemArray['is_url_strict_parsing_disabled'];
    }

    /**
     * Returns the depth of the navigation tree start with 1. Also known as menu level.
     *
     * @return int
     */
    public function getDepth()
    {
        return $this->itemArray['depth'];
    }

    /**
     * Check whether the parent has items or not.
     *
     * @return boolean
     */
    public function getHasParent()
    {
        return (bool) $this->getParent();
    }

    /**
     * Returns a Item-Object of the parent element, if no parent element exists returns false.
     *
     * @return \luya\cms\menu\Item|boolean Returns the parent item-object or false if not exists.
     */
    public function getParent(): \luya\cms\menu\Item|bool
    {
        return (new Query())
            ->where(['nav_id' => $this->parentNavId, 'container' => $this->getContainer()])
            ->with($this->_with)
            ->lang($this->lang)
            ->one();
    }

    /**
     * Return all parent elements **without** the current item.
     *
     * @return QueryIteratorFilter An array with Item-Objects.
     */
    public function getParents()
    {
        $parent = $this->with($this->_with)->getParent();
        $data = [];
        while ($parent) {
            $data[] = $parent;
            $parent = $parent->with($this->_with)->getParent();
        }

        return Query::createArrayIterator(array_reverse($data), $this->lang, array_flip($this->_with), false);
    }

    /**
     * Go down to a given element which is evalutaed trough a callable.
     *
     * Iterate trough parent elements until the last.
     *
     * ```php
     * $item = Yii::$app->menu->current->down(function(Item $item) {
     *     if ($item->depth == 1) {
     *         return $item;
     *     }
     * });
     * ```
     *
     * @param callable $fn A function which holds the current iterated item.
     * @return Item|mixed|boolean If no item has been picked, false is returned otherwise the picked item or any other callable response.
     * @since 1.0.9
     */
    public function down(callable $fn)
    {
        $parent = $this->with($this->_with)->getParent();
        while ($parent) {
            $response = call_user_func_array($fn, [$parent]);
            if ($response) {
                return $response;
            }
            $parent = $parent->with($this->_with)->getParent();
        }

        return false;
    }

    /**
     * Get all sibilings for the current item, this also includes the current item iteself.
     *
     * @return QueryIteratorFilter An array with all item-object siblings
     */
    public function getSiblings()
    {
        return (new Query())
            ->where(['parent_nav_id' => $this->parentNavId, 'container' => $this->container])
            ->with($this->_with)
            ->lang($this->lang)
            ->all();
    }

    /**
     * Get the next sibling in the current siblings list.
     *
     * If there is no next sibling (assuming its the last sibling item in the list) false is returned, otherwise the {{luya\cms\menu\Item}} is returned.
     *
     * @return \luya\cms\menu\Item|boolean Returns the next sibling based on the current sibling, if not found false is returned.
     */
    public function getNextSibling(): \luya\cms\menu\Item|bool
    {
        return (new Query())
            ->where(['parent_nav_id' => $this->parentNavId, 'container' => $this->container])
            ->andWhere(['>', 'sort_index', $this->sortIndex])
            ->with($this->_with)
            ->lang($this->lang)
            ->orderBy(['sort_index' => SORT_ASC])
            ->one();
    }

    /**
     * Get the previous sibling in the current siblings list.
     *
     * If there is no previous sibling (assuming its the first sibling item in the list) false is returned, otherwise the {{luya\cms\menu\Item}} is returned.
     *
     * @return \luya\cms\menu\Item|boolean Returns the previous sibling based on the current sibling, if not found false is returned.
     */
    public function getPrevSibling(): \luya\cms\menu\Item|bool
    {
        return (new Query())
            ->where(['parent_nav_id' => $this->parentNavId, 'container' => $this->container])
            ->andWhere(['<', 'sort_index', $this->sortIndex])
            ->with($this->_with)
            ->lang($this->lang)
            ->orderBy(['sort_index' => SORT_DESC])
            ->one();
    }

    /**
     * Return all parent elements **with** the current item.
     *
     * @return QueryIteratorFilter An array with Item-Objects.
     */
    public function getTeardown()
    {
        $data = [];
        $parent = $this->with($this->_with)->getParent();
        $current = $this;
        $data[$current->id] = $current;
        while ($parent) {
            $data[$parent->id] = $parent;
            $parent = $parent->with($this->_with)->getParent();
        }

        return Query::createArrayIterator(array_reverse($data, true), $this->lang, array_flip($this->_with), false);
    }

    /**
     * Get all children of the current item. Children means going the depth/menulevel down e.g. from 1 to 2.
     *
     * @return QueryIteratorFilter Returns all children
     */
    public function getChildren()
    {
        return (new Query())
            ->where(['parent_nav_id' => $this->navId, 'container' => $this->getContainer()])
            ->with($this->_with)
            ->lang($this->lang)
            ->all();
    }

    /**
     * Check whether an item has childrens or not returning a boolean value.
     *
     * @return bool If there are childrens the method returns true, otherwhise false.
     */
    public function getHasChildren()
    {
        return count($this->getChildren()) > 0 ? true : false;
    }

    /**
     * Returns all children and childrens-children.
     *
     * @return QueryIteratorFilter
     * @since 3.1.0
     */
    public function getDescendants()
    {
        return Query::createArrayIterator($this->getInternalDescendants(), $this->lang, array_flip($this->_with), false);
    }

    /**
     * @return array
     */
    protected function getInternalDescendants()
    {
        $childrens = $this->with($this->_with)->getChildren();
        $data = [];
        foreach ($childrens as $child) {
            $data[] = $child;
            $data = array_merge($data, $child->getInternalDescendants());
        }

        return $data;
    }

    private $_model;

    /**
     * Get the ActiveRecord Model for the current Nav Model.
     *
     * @throws \luya\cms\Exception
     * @return \luya\cms\models\Nav Returns the {{\luya\cms\models\Nav}} object for the current navigation item.
     */
    public function getModel()
    {
        if ($this->_model === null) {
            $this->_model = Nav::findOne($this->navId);

            if (empty($this->_model)) {
                throw new Exception('The model active record could not be found for the corresponding nav item. Maybe you have inconsistent Database data.');
            }
        }

        return $this->_model;
    }

    /**
     * Setter method for the Model.
     *
     * @param null|\luya\cms\models\Nav $model The Nav model Active Record
     */
    public function setModel($model)
    {
        $this->_model = $model;
    }

    /**
     * Get Property Object.
     *
     * This method allows you the retrieve a property for an page property. If the property is not found false will be retunrend
     * otherwhise the property object itself will be returned {{luya\\admin\base\Property}} so you can retrieve the value of the
     * property by calling your custom method or the default `getValue()` method.
     *
     * In order to return the value, which is mostly the case, use: {{luya\cms\menu\Item::getPropertyValue}}
     *
     * @param string $varName The variable name of the property defined in the method {{luya\\admin\base\Property::varName}}
     * @return \luya\admin\base\Property
     */
    public function getProperty($varName)
    {
        return $this->model->getProperty($varName);
    }

    /**
     * Get the value of a Property Object.
     *
     * Compared to {{luya\cms\menu\Item::getProperty}} this method returns only the value for a given property. If the
     * property is not assigned for the current Menu Item the $defaultValue will be returned, which is null by default.
     *
     * @param string $varName The variable name of the property defined in the method {{luya\\admin\base\Property::varName}}
     * @param mixed $defaultValue The default value which will be returned if the property is not set for the current page.
     * @return string|mixed Returns the value of {{luya\admin\base\Property::getValue}} if set, otherwise $defaultValue.
     */
    public function getPropertyValue($varName, mixed $defaultValue = null)
    {
        return $this->getProperty($varName) ? $this->getProperty($varName)->getValue() : $defaultValue;
    }

    /**
     * You can use with() before the following methods:
     *
     * + {{luya\cms\menu\Item::getParent()}}
     * + {{luya\cms\menu\Item::getParents()}}
     * + {{luya\cms\menu\Item::getTeardown()}}
     * + {{luya\cms\menu\Item::getChildren()}}
     * + {{luya\cms\menu\Item::hasChildren()}}
     * + {{luya\cms\menu\Item::getDescendants()}}
     *
     * Example use of with in subquery of the current item:
     *
     * ```php
     * if ($item->with(['hidden'])->hasChildren) {
     *     print_r($item->getChildren());
     * }
     * ```
     *
     * The above example display also hidden pages.
     *
     * @see \luya\cms\menu\Query::with()
     * @return \luya\cms\menu\Item;
     */
    public function with($with)
    {
        $this->_with = (array) $with;

        return $this;
    }

    /**
     * Unset a value from the `with()` method.
     *
     * Assuming to return the first level with hidden items but the second level
     * without the hidden elements:
     *
     * ```php
     * foreach ($item->with('hidden')->children as $child) {
     *     // but get the sibilings without the hidden state
     *     $siblings = $child->without('hidden')->siblings;
     * }
     * ```
     *
     * @param string|array $without Can be a string `hidden` or an array `['hidden']`.
     * @return \luya\cms\menu\Item
     */
    public function without(string|array $without)
    {
        $without = (array) $without;

        foreach ($without as $expression) {
            $key = array_search($expression, $this->_with);
            if ($key !== false) {
                unset($this->_with[$key]);
            }
        }

        return $this;
    }
}
