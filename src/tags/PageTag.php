<?php

namespace luya\cms\tags;

use luya\cms\frontend\Module;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use luya\tag\BaseTag;

/**
 * Get the Content of CMS Page.
 *
 * Allows you to get the content of a page with the cmslayout or get the content of a placeholder inside the cmslayout of a page.
 *
 * This allows you to Return the content of another page wherever your are. You can also use the PageTag in its Php from without the TagParser.
 *
 * Example native call:
 *
 * ```php
 * echo (new \luya\cms\Tags\PageTag())->parse(1, 'placeholderName'); // where 1 is the Nav ID if no placeholder name is given us null to render the whole page.
 * ```
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class PageTag extends BaseTag
{
    /**
     * @inheritdoc
     */
    public function example()
    {
        return 'page[1](placeholder)';
    }

    /**
     * @inheritdoc
     */
    public function readme()
    {
        return Module::t('tag_page_readme');
    }

    /**
     * Get the content of Nav for the current active language with cmslayout or placeholder.
     *
     * If the page does not have a corresponding activeLanguageItem, null is returned.
     *
     * @param string $value The value of the Nav ID e.g 1 (hover the cms menu to see the ID).
     * @param string|null $sub If null this parameter will be ignored otherwise its the name of the placeholder inside this cmslayout.
     * @return string The content rendered with the cmslayout, or if $sub is provided and not null with its placeholder name.
     * @see \luya\tag\TagInterface::parse()
     */
    public function parse($value, $sub)
    {
        $page = Nav::findOne(['id' => $value]);

        // verify if the page is of type content

        if ($page && $page->activeLanguageItem) {
            if ($page->activeLanguageItem->nav_item_type !== NavItem::TYPE_PAGE) {
                return null;
            }

            if (empty($sub)) {
                return $page->activeLanguageItem->getContent();
            } else {
                return $page->activeLanguageItem->type->renderPlaceholder($sub);
            }
        }

        return null;
    }
}
