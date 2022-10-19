<?php

namespace cmstests\src\helpers;

use cmstests\CmsFrontendTestCase;
use luya\cms\helpers\Url;

class UrlTest extends CmsFrontendTestCase
{
    public function testToModule()
    {
        $this->assertSame('foobar', Url::toModule('foobar'));
        $this->assertSame('foobar', Url::toModule('foobar', true));
    }

    public function testToModuleRoute()
    {
        $this->expectException('luya\cms\Exception');
        Url::toModuleRoute('foobar', ['/module/controller/action']);
    }

    public function testToMenuItem()
    {
        $this->assertStringContainsString('en/module/controller/action', Url::toMenuNavItem(1, ['/module/controller/action']));
        $https = Url::toMenuNavItem(1, ['/module/controller/action'], 'https');
        $this->assertStringContainsString('en/module/controller/action', $https);
        $this->assertStringContainsString('https://', $https);
    }
}
