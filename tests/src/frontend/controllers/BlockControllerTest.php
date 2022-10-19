<?php

namespace cmstests\src\frontend\controllers;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\controllers\BlockController;

class BlockControllerTest extends CmsFrontendTestCase
{
    public function testCallbackMethodNameCreation()
    {
        $ctrl = new BlockController('id', $this->app);

        $this->assertSame('callbackMyAction', $this->invokeMethod($ctrl, 'callbackToMethod', ['my-action']));
        $this->assertSame('callbackMyAction', $this->invokeMethod($ctrl, 'callbackToMethod', ['myAction']));
        $this->assertSame('callbackMyAction', $this->invokeMethod($ctrl, 'callbackToMethod', ['callback-my-action']));
        $this->assertSame('callbackMyAction', $this->invokeMethod($ctrl, 'callbackToMethod', ['callbackMyAction']));
    }
}
