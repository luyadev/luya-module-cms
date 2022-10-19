<?php

namespace cmstests\src;

use cmstests\CmsFrontendTestCase;
use luya\cms\LinkConverter;
use luya\web\EmailLink;
use luya\web\TelephoneLink;
use luya\web\WebsiteLink;

class LinkConverterTest extends CmsFrontendTestCase
{
    public function testInternalLink()
    {
        $converter = LinkConverter::fromArray(['type' => LinkConverter::TYPE_INTERNAL_PAGE, 'value' => 1, 'target' => null]);

        $this->assertInstanceOf(\luya\cms\menu\Item::class, $converter->getLink());
    }

    public function testExternalLink()
    {
        $converter = LinkConverter::fromArray(['type' => LinkConverter::TYPE_EXTERNAL_URL, 'value' => "luya.io", 'target' => null]);

        $this->assertInstanceOf(WebsiteLink::class, $converter->getLink());
    }

    public function testFileLink()
    {
        $this->markTestSkipped('Require a file entry in the test database.');

        $converter = LinkConverter::fromArray(['type' => LinkConverter::TYPE_LINK_TO_FILE, 'value' => 1, 'target' => null]);

        $this->assertInstanceOf(\luya\admin\file\Item::class, $converter->getLink());
    }

    public function testEmailLink()
    {
        $converter = LinkConverter::fromArray(['type' => LinkConverter::TYPE_LINK_TO_EMAIL, 'value' => 'mail@luya.io', 'target' => null]);

        $this->assertInstanceOf(EmailLink::class, $converter->getLink());
    }

    public function testTelephoneLink()
    {
        $converter = LinkConverter::fromArray(['type' => LinkConverter::TYPE_LINK_TO_TELEPHONE, 'value' => '0123456', 'target' => null]);

        $this->assertInstanceOf(TelephoneLink::class, $converter->getLink());
    }
}
