<?php

namespace cmstests\src\frontend;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\CmsThemeManager;
use luya\cms\models\Theme;
use luya\testsuite\fixtures\ActiveRecordFixture;
use Yii;

class CmsThemeManagerTest extends CmsFrontendTestCase
{
    /** @var ActiveRecordFixture */
    private $fixture;
    
    public function afterSetup()
    {
        parent::afterSetup();
    
        // theme fixture
        $this->fixture = new ActiveRecordFixture([
            'modelClass' => Theme::class,
        ]);
    }
    
    public function beforeTearDown()
    {
        $this->fixture->cleanup();
        
        parent::beforeTearDown();
    }

    public function testSetupWithoutActiveTheme()
    {
        $themeManager = new CmsThemeManager();
        $themeManager->setup();

        $this->assertNull(Yii::$app->view->theme, 'Theme must be null set.');
        $this->assertNull($themeManager->activeTheme);
        $this->assertFalse(Yii::getAlias('@activeTheme', false), 'Alias path must not set.');
    }

    public function testSetup()
    {
        /** @var Theme $themeModel */
        $themeModel = $this->fixture->newModel;
        $themeModel->base_path = '@cmstests/data/themes/testTheme';
        $themeModel->json_config = json_encode([]);
        $themeModel->is_active = 1;
        $themeModel->insert();

        $themeManager = new CmsThemeManager();
        $themeManager->activeThemeName = '@cmstests/data/themes/testTheme';
        $themeManager->setup();

        $this->assertNotNull(Yii::$app->view->theme, 'Theme must be set.');
        $expectedPath = (Yii::getAlias('@cmstests/data/themes/testTheme'));
        $this->assertEquals($expectedPath, Yii::$app->view->theme->basePath, 'Theme base path not correct.');
        $this->assertEquals($expectedPath, Yii::getAlias('@activeTheme'), 'Alias path is not correct.');

        $this->assertInstanceOf(\luya\theme\Theme::class, $themeManager->activeTheme);
    }

    /**
     * @expectedException \yii\base\InvalidArgumentException
     * @expectedExceptionMessage Theme @theme/not/exists could not loaded.
     */
    public function testInvalidThemeBasePath()
    {
        $themeManager = new CmsThemeManager();
        $themeManager->getThemeByBasePath('@theme/not/exists');
    }
    
    /**
     * @expectedException \luya\Exception
     * @expectedExceptionMessageRegExp #^Theme directory not exists or readable\: [\w\-/\.]+/themes/not-readable$#
     */
    public function testNotReadableThemeDir()
    {
        /** @var Theme $themeModel */
        $themeModel = $this->fixture->newModel;
        $themeModel->base_path = '@cmstests/data/themes/not-readable';
        $themeModel->json_config = json_encode([]);
        $themeModel->insert();
preg_match('#^Theme directory not exists or readable: [\w-/\.]+/themes/not-readable$#', )
        $themeManager = new CmsThemeManager();
        
        // only writable dir
        mkdir(Yii::getAlias('@cmstests/data/themes/not-readable'), 0200);
        
        try {
            $themeManager->getThemes();
        } finally {
            rmdir(Yii::getAlias('@cmstests/data/themes/not-readable'));
        }
    }
}
