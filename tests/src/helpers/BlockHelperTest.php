<?php

namespace cmstests\src\helpers;

use cmstests\CmsFrontendTestCase;
use luya\cms\helpers\BlockHelper;

class BlockHelperTest extends CmsFrontendTestCase
{
    public function testSelectArrayOption()
    {
        $this->assertSame([['label' => 'World', 'value' => 'Hello']], BlockHelper::selectArrayOption(['Hello' => 'World']));

        $this->assertSame([
            ['label' => 'bar', 'value' => 'foo']
        ], BlockHelper::selectArrayOption(['foo' => 'bar']));

        $this->assertSame([
            ['label' => 'Prompt!', 'value' => 0],
            ['label' => 'bar', 'value' => 'foo']
        ], BlockHelper::selectArrayOption(['foo' => 'bar'], 'Prompt!'));
    }

    public function testCheckboxArrayOption()
    {
        $this->assertSame(['items' => [['label' => 'World', 'value' => 'Hello']]], BlockHelper::checkboxArrayOption(['Hello' => 'World']));
    }

    public function testImageUpload()
    {
        $this->assertFalse(BlockHelper::imageUpload(1));
    }
    public function testImageArrayUpload()
    {
        $this->assertSame([], BlockHelper::imageArrayUpload([
            ['imageId' => 1],
            ['imageId' => 2]
        ]));
    }

    public function testFileUpload()
    {
        $this->assertFalse(BlockHelper::fileUpload(1));
    }
    public function testFileArrayUpload()
    {
        $this->assertSame([], BlockHelper::fileArrayUpload(
            [
            ['fileId' => 1],
            ['fileId' => 2]
        ]
        ));
    }

    public function testInternalGenerateLinkObject()
    {
        $url = BlockHelper::linkObject(['type' => 1, 'value' => 2]);
        $this->assertInstanceOf('luya\web\LinkInterface', $url);

        $this->assertSame('_self', $url->getTarget());
    }

    public function testExternalGenerateLinkObject()
    {
        $url = BlockHelper::linkObject(['type' => 2, 'value' => 'https://luya.io']);
        $this->assertInstanceOf('luya\web\LinkInterface', $url);

        $this->assertSame('_blank', $url->getTarget());
    }

    public function testMarkdown()
    {
        $this->assertSameTrimmed('<p><strong>barfoo</strong></p>', BlockHelper::markdown('**barfoo**'));
    }

    public function testRadioArrayOption()
    {
        $this->assertSame([
            ['label' => 'bar', 'value' => 'foo']
        ], BlockHelper::radioArrayOption(['foo' => 'bar']));
    }
}
