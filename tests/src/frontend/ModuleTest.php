<?php

namespace cmstests\src\frontend;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\Module;
use luya\cms\models\Theme;
use luya\testsuite\fixtures\NgRestModelFixture;
use Yii;

class ModuleTest extends CmsFrontendTestCase
{
    /**
     * @var NgRestModelFixture
     */
    private $fixture;

    public function afterSetup()
    {
        parent::afterSetup();

        $this->fixture = new NgRestModelFixture([
            'modelClass' => Theme::class,
        ]);
    }

    public function testBootstrap()
    {
        /** @var Theme $themeModel */
        $themeModel = $this->fixture->newModel;
        $themeModel->is_default = 1;
        $themeModel->base_path = '@app/themes/appTheme';
        $themeModel->json_config = '{}';
        $this->assertTrue($themeModel->save());

        Yii::$app->request->forceWebRequest = true;
        Yii::$app->request->setIsConsoleRequest(false);

        /** @var Module $module */
        $module = Yii::$app->getModule('cms');
        $module->luyaBootstrap(Yii::$app);

        Yii::$app->themeManager->activeThemeName = '@app/themes/moduleTest';
        Yii::$app->themeManager->setup();

        $this->assertTrue(Yii::$app->themeManager->hasActiveTheme);
        $this->assertEquals(Yii::getAlias('@app/themes/appTheme'), Yii::$app->themeManager->activeTheme->basePath);

        $this->fixture->cleanup();
    }
}
