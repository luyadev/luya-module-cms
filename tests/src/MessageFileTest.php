<?php

namespace cmstests\src;

use cmstests\CmsFrontendTestCase;
use luya\testsuite\traits\MessageFileCompareTrait;
use Yii;

class MessageFileTest extends CmsFrontendTestCase
{
    use MessageFileCompareTrait;

    public function testAdminMessages()
    {
        $this->compareMessages(Yii::getAlias('@cmsadmin/messages'), 'en');
    }

    public function testFrontendMessages()
    {
        $this->compareMessages(Yii::getAlias('@cms/messages'), 'en');
    }
}
