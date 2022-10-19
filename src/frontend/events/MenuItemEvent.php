<?php

namespace luya\cms\frontend\events;

use luya\cms\menu\Item;

/**
 * Event after a menu item is loaded and ready.
 *
 * Each Menu Item does have en event which will be trigger after create. You can also access
 * this event in your config like this for instance:
 *
 * ```php
 * 'menu' => [
 *     'class' => 'luya\cms\Menu',
 *     'on eventOnItemFind' => function(MenuItemEvent $event) {
 *         if ($event->item->alias == 'this-is-my-alias') {
 *             // will turn this item to invisble
 *             $event->visible = false;
 *         }
 *     }
 *  ],
 * ```
 *
 * @property integer $visible Menu item visibility getter/setter.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class MenuItemEvent extends \yii\base\Event
{
    /**
     * @var Item
     */
    public $item;

    /**
     * Whether the item is visible or not
     *
     * @return boolean
     */
    public function getVisible()
    {
        return !$this->item->isHidden;
    }

    /**
     * Setter method for the item visibility
     *
     * @param integer $state
     */
    public function setVisible($state)
    {
        $this->item->isHidden = !$state;
    }
}
