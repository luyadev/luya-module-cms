<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\BlockImporter;
use luya\console\commands\ImportController;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\admin\models\Config;
use luya\cms\models\Block;
use luya\cms\models\BlockGroup;

class BlockImporterTest extends CmsConsoleTestCase
{
    public function testBasicBlockImporter()
    {
        // config fixture
        $configFixture = new ActiveRecordFixture([
            'modelClass' => Config::class
        ]);
        
        // block fixture
        $blockFixture = new ActiveRecordFixture([
            'modelClass' => Block::class,
        ]);
        
        // block group fixture
        $blockGroupFixture = new ActiveRecordFixture([
            'modelClass' => BlockGroup::class,
        ]);
        
        $controller = new ImportController('import-controller', $this->app);
        $importer = new BlockImporter($controller);

        $this->assertNull($importer->run());
    }
}