<?php

namespace cmstests\src\frontend\blocks;

use cmstests\ModelTestCase;
use luya\cms\frontend\blocks\MirrorLanguageBlock;
use luya\testsuite\traits\CmsDatabaseTableTrait;

class MirrorLanguageBlockTest extends ModelTestCase
{
    use CmsDatabaseTableTrait;

    public function testRenderFrontend()
    {
        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'name' => 'en',
                'short_code' => 'en',
                'is_default' => 1,
                'is_deleted' => 0,
            ],
            2 => [
                'id' => 2,
                'name' => 'de',
                'short_code' => 'de',
                'is_default' => 0,
                'is_deleted' => 0,
            ]
        ]);
        $this->createCmsNavItemPageBlockItemFixture([
            1 => [
                'id' => 1,
                'placeholder_var' => 'xyz',
                'nav_item_page_id' => 1,
            ]
        ]);
        $this->createCmsNavItemPageFixture([
            1 => [
                'id' => 1,
                'nav_item_id' => 1
            ]
        ]);

        $this->createCmsNavItemFixture([
            1 => [
                'id' => 1,
                'lang_id' => 1,
                'nav_item_type' => 1,
            ],
            2 => [
                'id' => 2,
                'lang_id' => 2,
                'nav_item_type' => 1,
            ]
        ]);

        $block = new MirrorLanguageBlock();

        $this->assertEmpty($block->frontend());
        $this->assertNotEmpty($block->name());
        $this->assertNotEmpty($block->icon());
        $this->assertNotEmpty($block->config());
        $this->assertNotEmpty($block->admin());

        $block->setVarValues(['language' => 2]);

        $r = $block->frontend();

        $block->setVarValues(['language' => 1]);

        $r = $block->frontend();
    }
}
