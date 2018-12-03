<?php

namespace tests\web\cmsadmin\models;

use cmstests\ModelTestCase;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\cms\models\Redirect;

class RedirectTest extends ModelTestCase
{
    public function testMatchRequestPath()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Redirect::class
        ]);

        $rule = new Redirect();

        // true
        $rule->catch_path = '/foobar';
        $this->assertTrue($rule->matchRequestPath('foobar'));
        $this->assertTrue($rule->matchRequestPath('/foobar'));
        $rule->catch_path = '/foo bar';
        $this->assertTrue($rule->matchRequestPath('foo bar'));
        $this->assertTrue($rule->matchRequestPath('foo+bar'));
        $rule->catch_path = '/foo+bar';
        $this->assertTrue($rule->matchRequestPath('foo bar'));
        $this->assertTrue($rule->matchRequestPath('foo+bar'));

        $rule->catch_path = '/foo*';
        $this->assertTrue($rule->matchRequestPath('foobar'));
        $this->assertTrue($rule->matchRequestPath('foo'));
        $this->assertTrue($rule->matchRequestPath('/foobar'));

        // false
        $rule->catch_path = '/foo*';
        $this->assertFalse($rule->matchRequestPath('bar'));
        $this->assertFalse($rule->matchRequestPath('fo'));
        $rule->catch_path = '/page';
        $this->assertFalse($rule->matchRequestPath('/en/page'));
    }
}
