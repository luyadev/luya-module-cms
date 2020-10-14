<?php

namespace luya\cms\frontend\blocks;

use luya\admin\models\Lang;
use luya\cms\base\PhpBlock;
use luya\cms\frontend\blockgroups\DevelopmentGroup;
use luya\cms\helpers\BlockHelper;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;

class MirrorContentBlock extends PhpBlock
{
    /**
     * @var string The module where this block belongs to in order to find the view files.
     */
    public $module = 'cms';

    /**
     * @inheritDoc
     */
    public function blockGroup()
    {
        return DevelopmentGroup::class;
    }

    /**
     * @inheritDoc
     */
    public function name()
    {
        return 'Mirror Page';
    }
    
    /**
     * @inheritDoc
     */
    public function icon()
    {
        return 'compare'; // see the list of icons on: https://design.google.com/icons/
    }
 
    /**
     * @inheritDoc
     */
    public function config()
    {
        return [
            'vars' => [
                 ['var' => 'language', 'label' => 'Language', 'type' => self::TYPE_SELECT, 'options' => BlockHelper::selectArrayOption(Lang::find()->select(['name', 'id'])->indexBy('id')->column())],
            ],
        ];
    }
    
    /**
     * {@inheritDoc} 
     *
     * @param {{vars.language}}
    */
    public function admin()
    {
        return '<h5 class="mb-3">Page Copy Block</h5>' .
            '<table class="table table-bordered">' .
            '{% if vars.language is not empty %}' .
            '<tr><td><b>Language</b></td><td>{{vars.language}}</td></tr>' .
            '{% endif %}'.
            '</table>';
    }

    public function frontend()
    {
        $item = NavItemPageBlockItem::find()
            ->select(['placeholder_var', 'nav_item_page_id'])
            ->where(['id' => $this->getEnvOption('id')])
            ->asArray()
            ->one();

        $navItemId = NavItemPage::find()->where(['id' => $item['nav_item_page_id']])->select(['nav_item_id'])->scalar();
        
        $navId = NavItem::find()->where(['id' => $navItemId])->select(['nav_id'])->scalar();

        $langId = $this->getVarValue('language');

        $navItem = NavItem::find()->where(['nav_id' => $navId, 'nav_item_type' => NavItem::TYPE_PAGE, 'lang_id' => $langId])->one();

        if ($navItem) {
            return $navItem->type->renderPlaceholder($item['placeholder_var']);
        }
    }
}