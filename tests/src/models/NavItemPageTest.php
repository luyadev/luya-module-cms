<?php

namespace NavItemPageTest;

use cmstests\WebModelTestCase;
use luya\testsuite\traits\CmsDatabaseTableTrait;
use yii\base\ViewNotFoundException;

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

        $this->expectException(ViewNotFoundException::class);
        $this->expectExceptionMessage('The view file does not exist: /var/www/luya-env-dev/repos/luya-module-cms/testfile');
        $model->getContent();
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
                'view_file' => 'absolute',
            ]
        ]);
        
        $model = $pageFixture->getModel(1);

        $this->expectException(ViewNotFoundException::class);
        $this->expectExceptionMessage('The view file does not exist: absolute');
        $model->getContent();
    }
}