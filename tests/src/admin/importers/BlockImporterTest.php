<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\admin\models\Config;
use luya\cms\admin\importers\BlockImporter;
use luya\cms\models\Block;
use luya\cms\models\BlockGroup;
use luya\console\commands\ImportController;
use luya\helpers\StringHelper;
use luya\testsuite\fixtures\ActiveRecordFixture;

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
                3 => 'block \luya\cms\frontend\blocks\MirrorLanguageBlock: Added to database',
                4 => 'Insert new block group block_group_dev_elements.',
                5 => 'block \luya\cms\frontend\blocks\ModuleBlock: Added to database',
                6 => 'Insert new block group block_group_basic_elements.',
                7 => 'block \cmstests\data\blocks\import\TestBlock: Added to database',
                8 => 'Block importer finished with 4 blocks.',
            ]
        ], $log);
    }

    public function testBasicBlockImporterWithFailingDefintion()
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
        $module = $this->app->getModule('cmsadmin');
        $module->blocks = ['notfoundatall'];
        $importer = new BlockImporter($controller, $module);

        $this->assertNull($importer->run());

        $log = $importer->importer->getLog();

        // remove 4 key because of path

        $has = false;
        foreach ($log as $class => $entries) {
            foreach ($entries as $log) {
                if (StringHelper::contains('Unable to find', $log)) {
                    $has = true;
                }
            }
        }

        // the unable to find log entrie must exists
        $this->assertTrue($has);
    }
}
