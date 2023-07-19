<?php

namespace NavItemPageTest;

use cmstests\WebModelTestCase;
use luya\cms\models\NavItemPage;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class NavItemPageTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function testAppAliasViewPath()
    {
        $pageFixture = $this->createCmsNavItemPageFixture([
            1 => [
                'id' => 1,
                'layout_id' => 1,
                'nav_item_id' => 1,
            ]
        ]);
        $layoutFixture = $this->createCmsLayoutFixture([
            1 => [
                'id' => 1,
                'name' => 'id1',
                'json_config' => '{}',
                'view_file' => '@app/testfile',
            ]
        ]);

        $model = $pageFixture->getModel(1);

        try {
            $model->getContent();
        } catch (\Exception $e) {
            // since its resolved, @app should not be included anymore
            $this->assertStringNotContainsString('@app', $e->getMessage());
        }
    }

    public function testGetOption()
    {
        $fixtures = new NgRestModelFixture([
            'modelClass' => NavItemPage::class,
        ]);

        $model = $fixtures->newModel;

        $this->assertFalse($model->getOption('foobar'));

        $model->setOptions(['bar' => 'foo']);

        $this->assertSame('foo', $model->getOption('bar'));
    }

    public function testAbsolutePath()
    {
        $pageFixture = $this->createCmsNavItemPageFixture([
            1 => [
                'id' => 1,
                'layout_id' => 1,
                'nav_item_id' => 1,
            ]
        ]);
        $layoutFixture = $this->createCmsLayoutFixture([
            1 => [
                'id' => 1,
                'name' => 'id1',
                'json_config' => '{}',
                'view_file' => '/absolute',
            ]
        ]);

        $model = $pageFixture->getModel(1);

        try {
            $model->getContent();
        } catch (\Exception $e) {
            $this->assertStringContainsString('/absolute', $e->getMessage());
        }
    }

    public function testRelativeViewPath()
    {
        $pageFixture = $this->createCmsNavItemPageFixture([
            1 => [
                'id' => 1,
                'layout_id' => 1,
                'nav_item_id' => 1,
            ]
        ]);
        $layoutFixture = $this->createCmsLayoutFixture([
            1 => [
                'id' => 1,
                'name' => 'id1',
                'json_config' => '{}',
                'view_file' => 'relative',
            ]
        ]);

        $model = $pageFixture->getModel(1);

        try {
            $model->getContent();
        } catch (\Exception $e) {
            $this->assertStringContainsString('views/cmslayouts'.DIRECTORY_SEPARATOR.'relative.php', $e->getMessage());
        }
    }
}
