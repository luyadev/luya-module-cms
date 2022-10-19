<?php

namespace cmstests\data\modules;

use luya\base\Module;

class CmsUrlRuleModule extends Module
{
    public $urlRules = [
        'go/<id:\d+>/<slug:[a-zA-Z0-9\-]+>' => 'cmsurlrulemodule/default/index',
    ];
}
