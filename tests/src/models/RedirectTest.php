<?php

namespace tests\web\cmsadmin\models;

use cmstests\ModelTestCase;
use luya\cms\models\Redirect;
use luya\testsuite\fixtures\NgRestModelFixture;

class RedirectTest extends ModelTestCase
{
    public function testMatchRequestPath()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Redirect::class
        ]);

        $rule = new Redirect();

        // test new wildcard

        $rule->catch_path = '/storage/*';

        $this->assertSame('mypdf.pdf', $rule->matchRequestPath('/storage/mypdf.pdf'));

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
        $this->assertSame('bar', $rule->matchRequestPath('foobar'));
        $this->assertTrue($rule->matchRequestPath('foo'));
        $this->assertSame('bar', $rule->matchRequestPath('/foobar'));

        // false
        $rule->catch_path = '/foo*';
        $this->assertFalse($rule->matchRequestPath('bar'));
        $this->assertFalse($rule->matchRequestPath('fo'));
        $rule->catch_path = '/page';
        $this->assertFalse($rule->matchRequestPath('/en/page'));

        // test redirect

        $rule->redirect_path = 'foobar';

        $this->assertSame('foobar', $rule->getRedirectUrl());
        $this->assertSame('foobar', $rule->getRedirectUrl('slug'));

        $rule->redirect_path = 'foobar/*';

        $this->assertSame('foobar/*', $rule->getRedirectUrl());
        $this->assertSame('foobar/slug', $rule->getRedirectUrl('slug'));
    }

    public function testWildcardForPageSuffix()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Redirect::class
        ]);

        $rule = new Redirect();

        // test new wildcard

        $rule->catch_path = '/*.html';

        $this->assertSame('hello-world', $rule->matchRequestPath('/hello-world.html'));
    }

    public function testTimeBehavior()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Redirect::class,
        ]);

        $model = new Redirect();
        $model->catch_path = '/foo';
        $model->redirect_path = 'bar';
        $model->redirect_status_code = 301;
        $save = $model->save();

        $this->assertTrue($save);
        $this->assertNotEmpty($model->timestamp_create);
    }
}
