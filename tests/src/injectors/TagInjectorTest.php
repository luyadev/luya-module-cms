<?php

namespace cmstests\src\injectors;

use cmstests\data\blocks\UnitTestBlock;
use cmstests\WebModelTestCase;
use luya\admin\models\Tag;
use luya\cms\injectors\TagInjector;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\testsuite\traits\AdminDatabaseTableTrait;

class StubTagBlock extends UnitTestBlock
{
    public function name()
    {
        return 'test';
    }

    public function config()
    {
        return [];
    }
}

class TagInjectorTest extends WebModelTestCase
{
    use AdminDatabaseTableTrait;

    public function afterSetup()
    {
        parent::afterSetup();

        $this->createAdminLangFixture([
            1 => [
                'id' => 1,
                'name' => 'en',
                'short_code' => 'en',
                'is_default' => 1,
                'is_deleted' => 0,
            ]
        ]);
    }

    public function testTagInjector()
    {
        new ActiveRecordFixture([
            'modelClass' => Tag::class,
            'fixtureData' => [
                'tag1' => [
                    'id' => '1',
                    'name' => 'John',
                ],
                'tag2' => [
                    'id' => '2',
                    'name' => 'Jane',
                ],
            ]
        ]);

        $block = new StubTagBlock();
        $injector = new TagInjector(['context' => $block]);
        $injector->setup();

        $vars = $block->getConfigVarsExport();

        $this->assertSame(['items' => [
            ['label' => 'John', 'value' => 1],
            ['label' => 'Jane', 'value' => 2],
        ]], $vars[0]['options']);
    }

    public function testEvalTagInjector()
    {
        new ActiveRecordFixture([
            'modelClass' => Tag::class,
            'fixtureData' => [
                'tag1' => [
                    'name' => 'John',
                    'id' => '1',
                ],
                'tag2' => [

                    'name' => 'Jane',
                    'id' => '2',
                ],
            ]
        ]);

        $block = new StubTagBlock();
        $block->setVarValues(['tags' => [['value' => 2]]]);
        $injector = new TagInjector(['context' => $block, 'varName' => 'tags']);
        $injector->setup();
        $this->assertArrayHasKey('Jane', $injector->getAssignedTags());
    }
}
