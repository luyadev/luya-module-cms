<?php

namespace luya\cms\menu;

use Iterator;
use luya\cms\models\Nav;
use luya\helpers\ArrayHelper;
use yii\base\BaseObject;

/**
 * Iterator class for menu items.
 *
 * The main goal is to to createa an object for the item on the current() iteration.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class QueryIterator extends BaseObject implements Iterator
{
    /**
     * @var array An array containing the data to iterate.
     */
    public $data = [];

    /**
     * @var string|null Can contain the language context, so the sub querys for this item will be the same language context
     * as the parent object which created this object.
     */
    public $lang;

    /**
     * @see \luya\cms\menu\Query::with()
     */
    public $with = [];

    /**
     * @var boolean Whether all models for each menu element should be preloaded or not, on large systems with propertie access it
     * can reduce the sql requests but uses more memory instead.
     */
    public $preloadModels = false;

    /**
     * @internal
     */
    public function init()
    {
        parent::init();

        if ($this->preloadModels) {
            $this->loadModels();
        }
    }

    private $_loadModels;

    /**
     * Load all models for ghe given Menu Query.
     *
     *
     * @return array An array where the key is the id of the nav model and value the {{luya\cms\models\Nav}} object.
     */
    public function loadModels()
    {
        if ($this->_loadModels === null) {
            $this->_loadModels = Nav::find()->indexBy('id')->where(['in', 'id', ArrayHelper::getColumn($this->data, 'nav_id')])->with(['properties.adminProperty'])->all();
        }

        return $this->_loadModels;
    }

    /**
     * Get the model for a given id.
     *
     * If the model was not preloaded by {{loadModels}} null is returned.
     *
     * @param integer $id
     * @return null|\luya\cms\models\Nav
     */
    public function getLoadedModel($id)
    {
        return $this->_loadModels[$id] ?? null;
    }

    /* Iterator */

    /**
     * Iterator get current element, generates a new object for the current item on accessing.s.
     *
     * @return \luya\cms\menu\Item
     */
    #[\ReturnTypeWillChange]
    public function current()
    {
        $item = current($this->data);

        return $this->generateItem($item);
    }

    /**
     * Generate the Item Object based on array input.
     *
     * @param array $item The data of the item
     * @return Item
     * @since 3.2.0
     */
    public function generateItem($item)
    {
        // if item is already an object, return the created object.
        // This allows to pass arrays with luya\cms\menu\Item objects which has been created in
        // an earlier stage.
        if (is_object($item)) {
            return $item;
        }

        return Query::createItemObject($item, $this->lang, $this->getLoadedModel($item['id']));
    }

    /**
     * Iterator get current key.
     *
     * @return string The current key
     */
    #[\ReturnTypeWillChange]
    public function key()
    {
        return key($this->data);
    }

    /**
     * Iterator go to next element.
     *
     * @return array
     */
    #[\ReturnTypeWillChange]
    public function next()
    {
        return next($this->data);
    }

    /**
     * Iterator rewind.
     *
     * @return array
     */
    #[\ReturnTypeWillChange]
    public function rewind()
    {
        return reset($this->data);
    }

    /**
     * Iterator valid.
     *
     * @return bool
     */
    #[\ReturnTypeWillChange]
    public function valid()
    {
        return key($this->data) !== null;
    }
}
