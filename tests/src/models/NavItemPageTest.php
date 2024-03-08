<?php

namespace NavItemPageTest;

use cmstests\WebModelTestCase;
use luya\cms\models\NavItem;
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

    public function testNavItemForPageVersions()
    {
        $navItemFixture = $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'nav_id' => 11,
                'alias' => 'foobar',
                'nav_item_type' => 1,
                'nav_item_type_id' => 2,
            ]
        ]);

        $pageFixture = $this->createCmsNavItemPageFixture([
            'version1' => [
                'id' => 1,
                'nav_item_id' => 1,
                'version_alias' => 'first',
            ],
            'version2' => [
                'id' => 2,
                'nav_item_id' => 1,
                'version_alias' => 'second',
            ]
        ]);

        $navItem = $navItemFixture->getModel(1);
        $pageVersion1 = $pageFixture->getModel('version1'); // inactive page version
        $pageVersion2 = $pageFixture->getModel('version2'); // active page version

        $this->assertInstanceOf(NavItem::class, $pageVersion1->navItem);
        $this->assertSame(1, $pageVersion1->navItem->id);
        $this->assertSame(11, $pageVersion1->navItem->nav_id);
        $this->assertSame('foobar', $pageVersion1->navItem->alias);

        $this->assertInstanceOf(NavItem::class, $pageVersion2->navItem);
        $this->assertSame(1, $pageVersion2->navItem->id);
        $this->assertSame(11, $pageVersion2->navItem->nav_id);
        $this->assertSame('foobar', $pageVersion2->navItem->alias);
    }
}
