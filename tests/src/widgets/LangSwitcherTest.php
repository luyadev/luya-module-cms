<?php

namespace cmstests\src\widgets;

use cmstests\CmsFrontendTestCase;
use luya\cms\widgets\LangSwitcher;

class LangSwitcherTest extends CmsFrontendTestCase
{
    public function testWidgetOutput()
    {
        $out =  LangSwitcher::widget();

        $this->assertSame(str_replace(["\r\n", "\r"], "\n", '<ul class="list-element">
<li class="lang-element-item lang-element-item--active"><a class="lang-link-item lang-link-item--active" href="http://localhost/luya/envs/dev/public_html/">English</a></li>
<li class="lang-element-item"><a class="lang-link-item" href="http://localhost/luya/envs/dev/public_html/de">Deutsch</a></li>
</ul>'), str_replace(["\r\n", "\r"], "\n", $out));
    }

    public function testCallable()
    {
        $out = LangSwitcher::widget(['linkLabel' => function ($lang) {
            return strtoupper($lang['short_code']);
        }]);

        $this->assertSame(str_replace(["\r\n", "\r"], "\n", '<ul class="list-element">
<li class="lang-element-item lang-element-item--active"><a class="lang-link-item lang-link-item--active" href="http://localhost/luya/envs/dev/public_html/">EN</a></li>
<li class="lang-element-item"><a class="lang-link-item" href="http://localhost/luya/envs/dev/public_html/de">DE</a></li>
</ul>'), str_replace(["\r\n", "\r"], "\n", $out));
    }

    public function testSortCallable()
    {
        $out = LangSwitcher::widget(['itemsCallback' => function ($items) {
            ksort($items);

            return $items;
        }]);


        $this->assertSame(str_replace(["\r\n", "\r"], "\n", '<ul class="list-element">
<li class="lang-element-item"><a class="lang-link-item" href="http://localhost/luya/envs/dev/public_html/de">Deutsch</a></li>
<li class="lang-element-item lang-element-item--active"><a class="lang-link-item lang-link-item--active" href="http://localhost/luya/envs/dev/public_html/">English</a></li>
</ul>'), str_replace(["\r\n", "\r"], "\n", $out));
    }

    public function testOutputWithoutUl()
    {
        $out = LangSwitcher::widget(['noListTag' => true]);

        $this->assertSame(str_replace(["\r\n", "\r"], "\n", '<li class="lang-element-item lang-element-item--active"><a class="lang-link-item lang-link-item--active" href="http://localhost/luya/envs/dev/public_html/">English</a></li>
<li class="lang-element-item"><a class="lang-link-item" href="http://localhost/luya/envs/dev/public_html/de">Deutsch</a></li>'), str_replace(["\r\n", "\r"], "\n", $out));
    }
}
