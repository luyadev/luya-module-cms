<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\ThemeImporter;
use luya\cms\models\Theme;
use luya\console\commands\ImportController;
use luya\helpers\FileHelper;
use luya\testsuite\fixtures\NgRestModelFixture;
use luya\theme\ThemeManager;
use Yii;

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
        $this->fixture->rebuild();

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        $this->assertSame(
            [
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
        ],
            $log
        );
    }

    public function testThemeImporterFromPackage()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        $this->fixture->rebuild();

        $this->app->getPackageInstaller()->setConfigs([['themes' => ['@CmsUnitModule/otherThemes/otherTheme']]]);

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        $this->assertSame(
            [
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Added theme @CmsUnitModule/otherThemes/otherTheme to database.',
                3 => 'Theme importer finished with 3 themes.',
            ],
        ],
            $log
        );
    }

    public function testEmptyThemeDirectory()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        $this->fixture->rebuild();

        FileHelper::createDirectory(Yii::getAlias('@app/themes/emptyThemeDir'));

        try {
            $controller = new ImportController('import-controller', $this->app);
            $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

            $this->assertNull($importer->run());

            $log = $importer->importer->getLog();

            $this->assertSame(
                [
                'luya\cms\admin\importers\ThemeImporter' => [
                    0 => 'Added theme @app/themes/appTheme to database.',
                    1 => 'Added theme @app/themes/testTheme to database.',
                    2 => 'Theme importer finished with 2 themes.',
                ],
            ],
                $log
            );
        } finally {
            FileHelper::removeDirectory(Yii::getAlias('@app/themes/emptyThemeDir'));
        }
    }

    public function testNotExistsThemePackage()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        $this->fixture->rebuild();

        $this->app->getPackageInstaller()->setConfigs([['themes' => ['@CmsUnitModule/not/exists']]]);

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        $this->assertSame(
            [
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
        ],
            $log
        );
    }

    public function testUpdateThemeConfig()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        $this->fixture->rebuild();

        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $importer->run();

        $this->assertSame(
            [
                'luya\cms\admin\importers\ThemeImporter' => [
                    0 => 'Added theme @app/themes/appTheme to database.',
                    1 => 'Added theme @app/themes/testTheme to database.',
                    2 => 'Theme importer finished with 2 themes.',
                ],
            ],
            $importer->importer->getLog()
        );

        $themeModel = Theme::findOne(['base_path' => '@app/themes/appTheme']);
        $this->assertSame('{"name":"appTheme","parentTheme":null,"pathMap":[],"description":null}', $themeModel->json_config);

        $themeModel->json_config = '{}';
        $themeModel->update(false);

        // re-run after changes
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));

        $themeManager = new ThemeManager();
        $importer->setThemeManager($themeManager);

        $importer->run();

        $this->assertSame(
            [
                'luya\cms\admin\importers\ThemeImporter' => [
                    0 => 'Updated theme @app/themes/appTheme.',
                    1 => 'Updated theme @app/themes/testTheme.',
                    2 => 'Theme importer finished with 2 themes.',
                ],
            ],
            $importer->importer->getLog()
        );

        $this->assertSame('{"name":"appTheme","parentTheme":null,"pathMap":[],"description":null}', Theme::findOne(['base_path' => '@app/themes/appTheme'])->json_config);
    }
}
