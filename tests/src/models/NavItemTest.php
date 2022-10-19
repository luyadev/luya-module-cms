<?php

namespace tests\web\cmsadmin\models;

use cmstests\WebModelTestCase;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class NavItemTest extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    public function testSlugifyAlias()
    {
        $this->createCmsNavItemFixture();
        $model = new NavItem();

        $model->alias = "äÄöÖüÜß<>";
        $model->slugifyAlias();
        $this->assertSame("ääööüüß", $model->alias);

        $model->alias = "這是      LUYA";
        $model->slugifyAlias();
        $this->assertSame("這是-luya", $model->alias);

        $model->alias = "a1Zあ新~!@#$^&*()_[];',:?";
        $model->slugifyAlias();
        $this->assertSame("a1zあ新~!@#$^&*()[];',:?", $model->alias);
    }

    public function testGetDefaultLanguageRelationGetter()
    {
        $this->createCmsNavFixture([
            1  => [
                'id' => 1,
            ]
        ]);

        $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'nav_id' => 1,
                'lang_id' => 1,
            ]
        ]);

        $this->createAdminLangFixture([
            1  => [
                'id' => 1,
                'name' => 'English',
                'short_code' => 'en',
                'is_default' => 1,
                'is_deleted' => 0,
            ]
        ]);

        $nav = Nav::findOne(1);

        $this->assertSame(1, $nav->id);
        $this->assertSame(1, $nav->defaultLanguageItem->id);
        $this->assertSame(1, $nav->activeLanguageItem->id);
    }

    public function testEmptyValidatorForNavItemTypeId()
    {
        $fixture = new NgRestModelFixture([
            'modelClass' => NavItem::class,
        ]);

        $model = $fixture->newModel;

        $model->isNewRecord = false;
        $model->nav_item_type_id = 0;
        $this->assertFalse($model->validate(['nav_item_type_id']));
    }
}
