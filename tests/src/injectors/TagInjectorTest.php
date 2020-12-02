<?php

namespace cmstests\src\injectors;

use cmstests\data\blocks\UnitTestBlock;
use luya\cms\injectors\TagInjector;
use cmstests\WebModelTestCase;
use luya\admin\models\Tag;
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

        $this->createAdminLangFixture([]);
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
       
        $this->assertContains(['items' => [
            ['value' => 1, 'label' => 'John'],
            ['value' => 2, 'label' => 'Jane'],
        ]], $vars[0]);
        
    }

    public function testEvalTagInjector()
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
        $block->setVarValues(['tags' => [['value' => 2]]]);
        $injector = new TagInjector(['context' => $block, 'varName' => 'tags']);
        $injector->setup();
        $this->assertArrayHasKey('Jane', $injector->getAssignedTags());
        
    }
}
