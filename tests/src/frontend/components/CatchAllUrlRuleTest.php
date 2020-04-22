<?php

namespace cmstests\src\frontend\components;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\components\CatchAllUrlRule;

class CatchAllUrlRuleTest extends CmsFrontendTestCase
{
    public function testCreateUrl()
    {
        $rule = new CatchAllUrlRule();

        $this->assertSame('foo/bar', $rule->createUrl($this->app->urlManager, 'cms/default/index', ['path' => 'foo/bar']));
        $this->assertSame('foo/bar?page=1', $rule->createUrl($this->app->urlManager, 'cms/default/index', ['path' => 'foo/bar', 'page' => 1]));
    }

    public function testParseRequest()
    {
        $rule = new CatchAllUrlRule();

        $this->assertFalse($rule->parseRequest($this->app->urlManager, $this->app->request));
    }

}