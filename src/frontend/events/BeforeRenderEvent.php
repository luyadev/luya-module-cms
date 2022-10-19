<?php

namespace luya\cms\frontend\events;

/**
 * Before Render Event.
 *
 * An event will be triggered before the rendering of cms controller content.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BeforeRenderEvent extends \yii\base\Event
{
    /**
     * @var boolean Whether current request is valid or not, if $isValid is false an {{MethodNotAllowedHttpException}} will
     * be thrown while rendering.
     */
    public $isValid = true;

    /**
     * @var \luya\cms\menu\Item The current menu item resolved from {{luya\cms\Menu::getCurrent()}}.
     */
    public $menu;
}
