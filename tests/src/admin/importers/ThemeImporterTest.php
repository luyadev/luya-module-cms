<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\ThemeImporter;
use luya\cms\models\Theme;
use luya\console\commands\ImportController;
use luya\testsuite\fixtures\NgRestModelFixture;
use Yii;

class ThemeImporterTest extends CmsConsoleTestCase
{
    public function afterSetup()
    {
        parent::afterSetup();
        
        $fixture = new NgRestModelFixture([
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
                0 => 'Added theme @CmsUnitModule/themes/testTheme to database.',
                1 => 'Added theme @app/themes/appTheme to database.',
                2 => 'Added theme @app/themes/testTheme to database.',
                3 => 'Theme importer finished with 3 themes.',
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
                0 => 'Added theme @CmsUnitModule/themes/testTheme to database.',
                1 => 'Added theme @app/themes/appTheme to database.',
                2 => 'Added theme @app/themes/testTheme to database.',
                3 => 'Added theme @CmsUnitModule/otherThemes/otherTheme to database.',
                4 => 'Theme importer finished with 4 themes.',
            ],
        ],
            $log);
    }
}
