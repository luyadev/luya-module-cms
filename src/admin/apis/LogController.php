<?php

namespace luya\cms\admin\apis;

/**
 * Log Controller.
 *
 * File has been created with `crud/create` command.
 */
class LogController extends \luya\admin\ngrest\base\Api
{
    /**
     * @var string The path to the model which is the provider for the rules and fields.
     */
    public $modelClass = 'luya\cms\models\Log';
}
