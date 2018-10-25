<?php

namespace cmstests\data\blocks;

use cmstests\CmsFrontendTestCase;


class BlockVariationRegisterTest extends CmsFrontendTestCase
{
    public function testRegisterDefaultVariations()
    {
        $this->app->getModule('cmsadmin')->blockVariations = [
            TestBlock::variations()
                ->add('idf', 'My Test')
                    ->vars(['var1' => 'barfoo'])
                ->add('idf2', 'My default')
                    ->vars(['var1' => 'default'])
                    ->default()
                ->register()
        ];


        $vars = $this->app->getModule('cmsadmin')->blockVariations;
        
        $this->assertSame([
            'cmstests\data\blocks\TestBlock' => [
                'idf' => [
                    'title' => 'My Test',
                    'cfgs' => [],
                    'vars' => [
                        'var1' => 'barfoo'
                    ],
                    'extras' => [],
                    'is_default' => false,
                ],
                'idf2' => [
                    'title' => 'My default',
                    'cfgs' => [],
                    'vars' => [
                        'var1' => 'default'
                    ],
                    'extras' => [],
                    'is_default' => true,
                ]
            ]
        ], $vars);

        // render the page with the placeholder: return Nav::findOne(ID_OF_THE_PAGE)->activeLanguageItem->type->renderPlaceholder('content'));
    }
}