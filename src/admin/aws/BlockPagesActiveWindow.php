<?php

namespace luya\cms\admin\aws;

use luya\admin\ngrest\base\ActiveWindow;
use luya\cms\admin\Module;

/**
 * Block Pages Active Window.
 *
 * File has been created with `aw/create` command.
 */
class BlockPagesActiveWindow extends ActiveWindow
{
    /**
     * @var string The name of the module where the ActiveWindow is located in order to finde the view path.
     */
    public $module = '@cmsadmin';

    /**
     * Default label if not set in the ngrest model.
     *
     * @return string The name of of the ActiveWindow. This is displayed in the CRUD list.
     */
    public function defaultLabel()
    {
        return Module::t('aws_block_pages');
    }

    /**
     * Default icon if not set in the ngrest model.
     *
     * @var string The icon name from goolges material icon set (https://material.io/icons/)
     */
    public function defaultIcon()
    {
        return 'speaker_notes';
    }

    public function getTitle()
    {
        return $this->model->translationName;
    }

    /**
     * The default action which is going to be requested when clicking the ActiveWindow.
     *
     * @return string The response string, render and displayed trough the angular ajax request.
     */
    public function index()
    {
        return $this->render('index', [
            'blocks' => $this->model->getNavItemPageBlockItems()
                ->select(['nav_item_page_id', 'is_hidden', 'title'])
                ->with(['navItemPage.forceNavItem.lang', 'navItemPage.forceNavItem.nav'])
                ->joinWith(['navItemPage.forceNavItem'])
                ->distinct()
                ->orderBy(['title' => SORT_ASC])
                ->all(),
        ]);
    }
}
