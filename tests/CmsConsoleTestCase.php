<?php

namespace cmstests;

use luya\testsuite\cases\ConsoleApplicationTestCase;

class CmsConsoleTestCase extends ConsoleApplicationTestCase
{
    public function getConfigArray()
    {
        return include(__DIR__ .'/data/configs/cms.php');
    }
}
