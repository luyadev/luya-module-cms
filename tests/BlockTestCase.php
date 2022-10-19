<?php

namespace cmstests;

use luya\testsuite\cases\CmsBlockTestCase;

class BlockTestCase extends CmsBlockTestCase
{
    public function getConfigArray()
    {
        return include(__DIR__ .'/data/configs/cms.php');
    }

    public function beforeSetup()
    {
        include(__DIR__ .'/data/env.php');
    }
}
