<?php

namespace cmstests\src;

use Yii;
use cmstests\CmsFrontendTestCase;
use luya\testsuite\traits\MessageFileCompareTrait;

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
