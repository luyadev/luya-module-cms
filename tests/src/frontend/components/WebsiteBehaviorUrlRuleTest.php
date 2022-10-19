<?php

namespace cmstests\src\frontend\components;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\components\WebsiteBehaviorUrlRule;
use luya\testsuite\scopes\PageScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;
use Yii;
use yii\web\NotFoundHttpException;
use yii\web\UrlNormalizerRedirectException;

class WebsiteBehaviorUrlRuleTest extends CmsFrontendTestCase
{
    use CmsDatabaseTableTrait;

    public function testParseRequest()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $this->createAdminGroupFixture(1);
            $this->createAdminUserFixture();
            $this->createCmsWebsiteFixture([
                [
                    'id' => 1,
                    'name' => 'default',
                    'host' => 'default',
                    'aliases' => '',
                    'is_default' => 1,
                    'is_active' => 1,
                    'is_deleted' => 0,
                    'redirect_to_host' => 0
                ],
                [
                    'id' => 2,
                    'name' => 'test.de',
                    'host' => 'test.de',
                    'aliases' => 'www.test.de',
                    'redirect_to_host' => 1,
                    'is_default' => 0,
                    'is_active' => 1,
                    'is_deleted' => 0,
                ]
            ]);

            $rule = new WebsiteBehaviorUrlRule();

            $this->assertFalse($rule->parseRequest($this->app->urlManager, $this->app->request));

            Yii::$app->request->setHostInfo("http://test.de");
            $this->assertFalse($rule->parseRequest($this->app->urlManager, $this->app->request));

            $redirectUrl = false;
            try {
                Yii::$app->request->setHostInfo("http://www.test.de");
                $rule->parseRequest($this->app->urlManager, $this->app->request);
            } catch (UrlNormalizerRedirectException $exception) {
                $redirectUrl = $exception->url;
            }
            $this->assertStringStartsWith('test.de', $redirectUrl);
        });
    }

    public function testNoDefaultHost()
    {
        PageScope::run($this->app, function (PageScope $scope) {
            $this->createAdminGroupFixture(1);
            $this->createAdminUserFixture();
            $this->createCmsWebsiteFixture([
                [
                    'id' => 1,
                    'name' => 'default',
                    'host' => 'default',
                    'aliases' => '',
                    'is_default' => 0,
                    'is_active' => 1,
                    'is_deleted' => 0,
                    'redirect_to_host' => 0
                ]
            ]);

            $rule = new WebsiteBehaviorUrlRule();

            Yii::$app->request->setHostInfo("http://test.de");

            $this->expectException(NotFoundHttpException::class);
            $this->expectExceptionMessage("The requested host 'test.de' does not exist in website table");
            $rule->parseRequest($this->app->urlManager, $this->app->request);
        });
    }
}
