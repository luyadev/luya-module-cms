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
        $importer = new BlockImporter($controller, $this->app->getModule('cmsadmin'));

        $this->assertNull($importer->run());
        
        $log = $importer->importer->getLog();
        
        $this->assertSame([
            'luya\cms\admin\importers\BlockImporter' => [
                0 => 'Insert new block group block_group_dev_elements.',
                1 => 'block \luya\cms\frontend\blocks\HtmlBlock: Added to database',
                2 => 'Insert new block group block_group_dev_elements.',
                3 => 'block \luya\cms\frontend\blocks\ModuleBlock: Added to database',
                4 => 'Insert new block group block_group_basic_elements.',
                5 => 'block \cmstests\data\blocks\import\TestBlock: Added to database',
                6 => 'Block importer finished with 3 blocks.',
            ]
        ], $log);
    }
}
