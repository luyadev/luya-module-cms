<?php

namespace tests\web\cmsadmin\models;

use cmstests\ModelTestCase;
use luya\cms\models\Theme;
use luya\testsuite\fixtures\NgRestModelFixture;

class ThemeTest extends ModelTestCase
{
    public function testJsonConfig()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Theme::class
        ]);

        $theme = new Theme();
        $values = [
            'name' => 'lorem',
            'parentTheme' => 'ipsum',
            'author' => 'me',
        ];
        $theme->json_config = json_encode($values, JSON_FORCE_OBJECT);

        $theme->afterFind();

        $this->assertSame('lorem', $theme->getName());
        $this->assertSame('ipsum', $theme->getParentTheme());
        $this->assertSame('me', $theme->getAuthor());

        $this->assertSame($values, $theme->getJsonConfig());
        $this->assertNull($theme->getJsonConfig('foo'));
    }

    public function testInvalidJsonConfig()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => Theme::class
        ]);

        $theme = new Theme();
        $theme->json_config = '}[';

        $theme->afterFind();

        $this->assertEmpty($theme->getJsonConfig());
    }
}
