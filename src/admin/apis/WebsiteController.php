<?php

namespace luya\cms\admin\apis;

/**
 * Theme for LUYA CMS.
 *
 * This module / component allow user to manage websites.
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 4.0.0
 */
class WebsiteController extends \luya\admin\ngrest\base\Api
{
    public $modelClass = 'luya\cms\models\Website';
}
