<?php

namespace tests\web\cmsadmin\models;

use cmstests\CmsFrontendTestCase;
use luya\cms\models\NavContainer;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;
use Yii;

class NavContainerTest extends CmsFrontendTestCase
{
    use CmsDatabaseTableTrait;

    public function testFindWebsiteContainer()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $this->createAdminGroupFixture(1);
            $this->createAdminUserFixture();

            $this->createCmsWebsiteFixture([
                [
                    'id' => 2,
                    'name' => 'test',
                    'host' => 'test',
                    'aliases' => '',
                    'is_default' => 0,
                    'is_active' => 1,
                    'is_deleted' => 0,
                ]
            ]);
            $this->createCmsNavContainerFixture([
                [
                    'id' => 2,
                    'name' => 'test container',
                    'alias' => 'test container',
                    'website_id' => 2,
                    'is_deleted' => 0,
                ]
            ]);
            Yii::$app->request->setHostInfo("http://test");

            $this->assertFalse(NavContainer::find()->andWhere(['id' => 1])->exists());

            $navContainer = NavContainer::findOne(2);

            $this->assertEquals(2, $navContainer->website_id);
            $this->assertSame('test container', $navContainer->name);

            $website = $navContainer->website;

            $this->assertEquals(2, $website->id);
            $this->assertSame('test', $website->name);
        });
    }
}
