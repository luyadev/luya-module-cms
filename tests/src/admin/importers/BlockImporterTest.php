<?php

namespace cmstests\src\admin\importers;

use cmstests\CmsConsoleTestCase;
use luya\cms\admin\importers\BlockImporter;
use luya\console\commands\ImportController;

class BlockImporterTest extends CmsConsoleTestCase
{
    public function testFooBar()
    {
        $controller = new ImportController('import-controller', $this->app);
        $importer = new BlockImporter($controller);

        //$run = $importer->run();
    }
}