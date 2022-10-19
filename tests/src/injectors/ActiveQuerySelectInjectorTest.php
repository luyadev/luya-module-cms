<?php

namespace cmstests\src\injectors;

use cmstests\data\blocks\import\TestBlock;
use cmstests\ModelTestCase;
use luya\cms\injectors\ActiveQuerySelectInjector;
use luya\cms\models\Layout;
use luya\testsuite\fixtures\NgRestModelFixture;

class ActiveQuerySelectInjectorTest extends ModelTestCase
{
    public function afterSetup()
    {
        parent::afterSetup();

        $fixture = new NgRestModelFixture([
            'modelClass' => Layout::class,
            'fixtureData' => [
                1 => [
                    'id' => 1,
                    'name' => 'foo',
                    'json_config' => '{"node":"value"}',
                    'view_file' => 'none.php',
                ]
            ]
        ]);
    }

    public function testVariableResponse()
    {
        $block = new TestBlock();
        $block->setVarValues([
            'foobar' => 1,
        ]);

        $injector = new ActiveQuerySelectInjector([
            'query' => Layout::find(),
            'varName' => 'foobar',
            'varLabel' => 'test',
            'label' => 'name',
            'context' => $block,
        ]);
        $injector->setup();


        $f = $block->getExtraValue('foobar');
        $x = $block->getVarValue('foobar');
        $y = $block->getConfigVarsExport();

        $this->assertSame('foo', $y[0]['options'][0]['label']);
        $this->assertSame(1, $x);
        $this->assertSame(['node' => 'value'], $f->getJsonConfig());
        $this->assertSame('value', $f->getJsonConfig('node'));
    }

    public function testVariableNotFoundId()
    {
        $block = new TestBlock();
        $block->setVarValues([
            'foobar' => 0,
        ]);

        $injector = new ActiveQuerySelectInjector([
            'query' => Layout::find(),
            'varName' => 'foobar',
            'varLabel' => 'test',
            'label' => 'name',
            'context' => $block,
        ]);
        $injector->setup();

        $this->assertFalse($block->getExtraValue('foobar'));
    }
}
