<?php

namespace cmstests\src\admin\apis;

use cmstests\WebModelTestCase;
use luya\cms\admin\apis\NavController;
use luya\testsuite\scopes\PermissionScope;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class NavControllerTeste extends WebModelTestCase
{
    use CmsDatabaseTableTrait;

    /**
     * @runInSeparateProcess
     */
    public function testActionTags()
    {
        PermissionScope::run($this->app, function(PermissionScope $scope) {
            $scope->createAndAllowRoute('webmodel/nav/tags');
            $scope->createAndAllowRoute('webmodel/nav/save-tags');

            $this->createAdminLangFixture();

            $this->createAdminTagFixture([
                'tag1' => [
                    'id' => 1,
                    'name' => 'foobar'
                ]
            ]);
            $this->createadminTagRelationFixture();

            $this->createCmsNavFixture([
                'nav1' => [
                    'id' => 1,
                ]
            ]);

            $ctrl = new NavController('nav', $this->app);

            $this->app->request->setBodyParams([1]);
            $s = $scope->runControllerAction($ctrl, 'save-tags', ['id' => 1]);
            $this->assertSame(1, $s);
            $r = $scope->runControllerAction($ctrl, 'tags', ['id' => 1]);

            $this->assertSame([
                ['id' => '1', 'name' => 'foobar', 'translation' => ''],
            ], $r);

            $this->expectException('yii\web\NotFoundHttpException');
            $scope->runControllerAction($ctrl, 'tags', ['id' => 123]);
            $scope->runControllerAction($ctrl, 'save-tags', ['id' => 123]);
        });
    }
}