<?php

namespace luya\cms\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\base\NavItemType;
use luya\testsuite\traits\CmsDatabaseTableTrait;
use Yii;
use yii\web\NotFoundHttpException;

class NavItemControllerTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function afterSetup()
    {
        parent::afterSetup();

        $this->createAdminLangFixture();
        $this->createCmsNavItemPageFixture([
            2 => [
                'id' => 2,
                'layout_id' => 1,
                'nav_item_id' => 1,
                'version_alias' => 'test',
            ]
        ]);

        $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
            ]
        ]);
    }

    public function testChangePageVersionLayoutNotFound()
    {
        $ctrl = new NavItemController('nav-item', $this->app->getModule('cmsadmin'));

        Yii::$app->request->setBodyParams(['pageItemId' => 1, 'layoutId' => 1, 'alias' => 1]);
        $this->expectException(NotFoundHttpException::class);
        $ctrl->actionChangePageVersionLayout();
    }

    public function testChangePageVersionLayout()
    {
        $ctrl = new NavItemController('nav-item', $this->app->getModule('cmsadmin'));

        Yii::$app->request->setBodyParams(['pageItemId' => 2, 'layoutId' => 1, 'alias' => 'foobar']);
        $r = $ctrl->actionChangePageVersionLayout();

        $this->assertInstanceOf(NavItemType::class, $r);

        $this->assertSame(1, $r->layout_id);
    }
}
