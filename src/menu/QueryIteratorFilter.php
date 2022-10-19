<?php

namespace luya\cms\menu;

use ArrayAccess;
use Countable;
use FilterIterator;
use luya\cms\frontend\events\MenuItemEvent;
use luya\cms\Menu;
use luya\helpers\ArrayHelper;
use Yii;

/**
 * Iterator filter to verify valid events
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class QueryIteratorFilter extends FilterIterator implements Countable, ArrayAccess
{
    /**
     * Verifys if an menu item does have valid event response.
     *
     * {@inheritDoc}
     * @see FilterIterator::accept()
     */
    #[\ReturnTypeWillChange]
    public function accept()
    {
        $event = new MenuItemEvent();
        $event->item = $this->current();
        if (isset($this->getInnerIterator()->with['hidden'])) {
            $event->visible = true;
        }
        Yii::$app->menu->trigger(Menu::EVENT_ON_ITEM_FIND, $event);
        return $event->visible;
    }

    /**
     * Callculate to number of items when using count() function against the QueryIterator object.
     *
     * > Use iterator_count in order to ensure the filtered items are counted as well.
     *
     * @return int The number of elements in the iterator.
     */
    #[\ReturnTypeWillChange]
    public function count()
    {
        return iterator_count($this);
    }

    /**
     * Returns an array with the value of the column name.
     *
     * ```php
     * $ids = Yii::$app->find()->container('root')->all()->column('id');
     * ```
     *
     * The above example contains an array with all ids matching the given condition.
     *
     * @param string $name
     * @return array An array with the values of the given column name.
     * @since 3.1.0
     */
    public function column($name)
    {
        return ArrayHelper::getColumn($this->getInnerIterator()->data, $name);
    }

    /* ArrayAccess */

    /**
     * {@inheritDoc}
     * @since 3.2.0
     */
    #[\ReturnTypeWillChange]
    public function offsetSet($offset, $value)
    {
        $this->getInnerIterator()->data[$offset] = $value;
    }

    /**
     * {@inheritDoc}
     * @since 3.2.0
     */
    #[\ReturnTypeWillChange]
    public function offsetExists($offset)
    {
        return isset($this->getInnerIterator()->data[$offset]);
    }

    /**
     * {@inheritDoc}
     * @since 3.2.0
     */
    #[\ReturnTypeWillChange]
    public function offsetUnset($offset)
    {
        unset($this->getInnerIterator()->data[$offset]);
    }

    /**
     * {@inheritDoc}
     * @since 3.2.0
     */
    #[\ReturnTypeWillChange]
    public function offsetGet($offset)
    {
        return isset($this->getInnerIterator()->data[$offset]) ? $this->getInnerIterator()->generateItem($this->getInnerIterator()->data[$offset]) : null;
    }
}
