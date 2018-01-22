<?php

namespace luya\cms\admin\apis;

use luya\admin\base\RestActiveController;
use luya\cms\models\NavItemPage;

/**
 * NavItemPageItem api represents the cms_nav_item_page table api.
 *
 * @author Martin Petrasch <martin.petrasch@zephir.ch>
 * @since 1.0.1
 */
class NavItemPageController extends RestActiveController
{
    public $modelClass = 'luya\cms\models\NavItemPage';

    /**
     * Returns all versions/pages for a given navItemId
     *
     * @param $navItemId
     * @return array
     */
    public function actionVersions($navItemId)
    {
        return NavItemPage::find()->where(['nav_item_id' => $navItemId])->asArray()->all();
    }
}
