<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\ThemeImporter;
use luya\cms\models\Theme;
use luya\console\commands\ImportController;
use luya\helpers\FileHelper;
use luya\testsuite\fixtures\NgRestModelFixture;
use Yii;

/**
 * @runTestsInSeparateProcesses
 */
class ThemeImporterTest extends CmsConsoleTestCase
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
    
    public function testBasicThemeImporter()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));
        
        $this->assertNull($importer->run());
        
        $log = $importer->importer->getLog();
        
        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
        ],
            $log);
    }
    
    public function testThemeImporterFromPackage()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        
        $this->app->getPackageInstaller()->setConfigs([['themes' => ['@CmsUnitModule/otherThemes/otherTheme']]]);
        
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));
        
        $this->assertNull($importer->run());
        
        $log = $importer->importer->getLog();

        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Added theme @CmsUnitModule/otherThemes/otherTheme to database.',
                3 => 'Theme importer finished with 3 themes.',
            ],
        ],
            $log);
    }

    public function testEmptyThemeDirectory()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));

        FileHelper::removeDirectory(Yii::getAlias('@cmstests/tests/data/themes/emptyThemeDir'));
        FileHelper::createDirectory(Yii::getAlias('@cmstests/tests/data/themes/emptyThemeDir'));

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
        ],
            $log);
    }
    
    /**
     * @runInSeparateProcess
     */
    public function testNotExistsThemePackage()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));

        $this->app->getPackageInstaller()->setConfigs([['themes' => ['@CmsUnitModule/not/exists']]]);

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
        ],
            $log);
    }
    
    /**
     * @runInSeparateProcess
     */
    public function testUpdateThemeConfig()
    {
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $importer->run();

        $this->assertSame(
            [
                'luya\cms\admin\importers\ThemeImporter' => [
                    0 => 'Added theme @app/themes/appTheme to database.',
                    1 => 'Theme importer finished with 1 themes.',
                ],
            ],
            $importer->importer->getLog()
        );

        $this->assertSame('{"name":"newName","parentTheme":null,"pathMap":[],"description":null}', Theme::findOne(['base_path' => '@app/themes/appTheme'])->json_config);

        Theme::updateAll(['json_config' => '{}']);

        // re-run after changes
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $importer->run();

        $this->assertSame(
            [
                'luya\cms\admin\importers\ThemeImporter' => [
                    0 => 'Updated theme @app/themes/appTheme.',
                    1 => 'Theme importer finished with 1 themes.',
                ],
            ],
            $importer->importer->getLog()
        );

        $this->assertSame('{"name":"newName","parentTheme":null,"pathMap":[],"description":null}', Theme::findOne(['base_path' => '@app/themes/appTheme'])->json_config);
    }
}
