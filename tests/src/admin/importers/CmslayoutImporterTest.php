<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\CmslayoutImporter;
use luya\cms\admin\importers\ThemeImporter;
use luya\cms\models\Layout;
use luya\cms\models\Theme;
use luya\console\commands\ImportController;
use luya\helpers\Json;
use luya\testsuite\fixtures\ActiveRecordFixture;
use Yii;

class CmslayoutImporterTest extends CmsConsoleTestCase
{
    public function testBasicLayoutImporter()
    {
        // config fixture
        $layout = new ActiveRecordFixture([
            'modelClass' => Layout::class
        ]);
    
        // theme fixture
        $theme = new ActiveRecordFixture([
            'modelClass' => Theme::class
        ]);
        
        $controller = new ImportController('import-controller', $this->app);
        $importer = new CmslayoutImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());
        
        $log = $importer->importer->getLog();
        
        $this->assertArrayHasKey('luya\cms\admin\importers\CmslayoutImporter', $log);

        $data = $log['luya\cms\admin\importers\CmslayoutImporter'];

        $this->assertContains('New file Layoutwithjson found and registered.', $data);
        $this->assertContains('New file Layoutwithjson found and registered.', $data);
        $this->assertContains('cms layout importer finished with 2 layout files.', $data);
    }

    public function testLayoutCompare()
    {
        $controller = new ImportController('import-controller', $this->app);
        $importer = new CmslayoutImporter($controller, $this->app->getModule('cmsadmin'));

        $j1 = Json::decode('{"cols": 12, "var": "content", "label": "Conent"}');
        $j2 = Json::decode('{"cols": 5, "var": "content", "label": "Conent"}');

        $this->assertFalse($importer->comparePlaceholders($j1, $j2));
        $this->assertFalse($importer->comparePlaceholders($j2, $j1));
    }
    
    public function testThemeLayoutImporter()
    {
        // config fixture
        $layout = new ActiveRecordFixture([
            'modelClass' => Layout::class
        ]);
    
        // theme fixture
        $theme = new ActiveRecordFixture([
            'modelClass' => Theme::class,
        ]);
        
        $controller = new ImportController('import-controller', $this->app);
    
        // Import theme first
        Yii::setAlias('@app', Yii::getAlias('@cmstests/tests/data'));
        $importer = new ThemeImporter($controller, $this->app->getModule('cmsadmin'));
        $importer->run();

        $importer = new CmslayoutImporter($controller, $this->app->getModule('cmsadmin'));
    
        $this->assertNull($importer->run());
    
        $log = $importer->importer->getLog();
    
        $this->assertSame([
            'luya\cms\admin\importers\ThemeImporter' => [
                0 => 'Added theme @app/themes/appTheme to database.',
                1 => 'Added theme @app/themes/testTheme to database.',
                2 => 'Theme importer finished with 2 themes.',
            ],
            'luya\cms\admin\importers\CmslayoutImporter' => [
                0 => 'New file Main found and registered.',
                1 => 'New file Layoutwithjson found and registered.',
                2 => 'New file Phplayout found and registered.',
                3 => 'New file App Theme - App Theme Layout found and registered.',
                4 => 'cms layout importer finished with 4 layout files.',
            ]
        ], $log);
    }
}
