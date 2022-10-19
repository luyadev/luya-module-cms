<?php

namespace tests\web\cmsadmin\models;

use cmstests\CmsNgRestTestCase;

class BlockGroupTest extends CmsNgRestTestCase
{
    public $modelClass = 'luya\cms\models\BlockGroup';

    public $apiClass = 'luya\cms\admin\apis\BlockgroupController';

    public $controllerClass = 'luya\cms\admin\controllers\BlockgroupController';
}
