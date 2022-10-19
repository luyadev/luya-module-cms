<?php

namespace luya\cms\tags;

use luya\cms\frontend\Module;
use luya\tag\BaseTag;
use Yii;
use yii\helpers\Html;

/**
 * Menu links tag
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class MenuTag extends BaseTag
{
    public function example()
    {
        return 'menu[123](Go to Page 123)';
    }

    public function readme()
    {
        return Module::t('tag_menu_readme');
    }

    public function parse($value, $sub)
    {
        $menuItem = Yii::$app->menu->find()->where(['nav_id' => $value])->with('hidden')->one();

        if ($menuItem) {
            $alias = (empty($sub)) ? $menuItem->title : $sub;

            return Html::a($alias, $menuItem->link);
        }

        return false;
    }
}
