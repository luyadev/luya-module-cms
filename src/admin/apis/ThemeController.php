<?php

namespace luya\cms\admin\apis;

/**
 * Theme for LUYA CMS.
 *
 * This module / component allow user to manage actual display themes.
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 3.0.0
 */
class ThemeController extends \luya\admin\ngrest\base\Api
{
    public $modelClass = 'luya\cms\models\Theme';
}
