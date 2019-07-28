<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\ThemeImporter;
use luya\console\commands\ImportController;
use Yii;

class ThemeImporterTest extends CmsConsoleTestCase
{
    public function testBasicThemeImporter()
    {
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        
        $controller = new ImportController('import-controller', $this->app);
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));
        
        $this->assertNull($importer->run());
        
        $log = $importer->importer->getLog();
        
        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Loaded theme @CmsUnitModule/themes/testTheme',
                1 => 'Loaded theme @app/themes/appTheme',
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
                0 => 'Loaded theme @CmsUnitModule/themes/testTheme',
                1 => 'Loaded theme @app/themes/appTheme',
                2 => 'Loaded theme @CmsUnitModule/otherThemes/otherTheme',
                3 => 'Theme importer finished with 3 themes.',
            ],
        ],
            $log);
    }
}
