<?php

namespace cmstests\src\frontend\blocks;

use cmstests\ModelTestCase;
use luya\cms\frontend\blocks\MirrorLanguageBlock;
use luya\testsuite\traits\AdminDatabaseTableTrait;

class MirrorLanguageBlockTest extends ModelTestCase
{
    use AdminDatabaseTableTrait;

    public function testRenderFrontend()
    {
        $this->createAdminLangFixture();
        $block = new MirrorLanguageBlock();

        $this->assertEmpty($block->frontend());
    }
}