<?php

namespace luya\cms\frontend\blocks;

use luya\admin\models\Lang;
use luya\cms\base\PhpBlock;
use luya\cms\frontend\blockgroups\DevelopmentGroup;
use luya\cms\frontend\Module;
use luya\cms\helpers\BlockHelper;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use Yii;

/**
 * Mirror Language Content.
 *
 * @author Basil Suter <git@nadar.io>
 * @since 3.4.0
 */
class MirrorLanguageBlock extends PhpBlock
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
        return Module::t('block_mirror_language_name');
    }

    /**
     * @inheritDoc
     */
    public function icon()
    {
        return 'compare';
    }

    /**
     * @inheritDoc
     */
    public function config()
    {
        return [
            'vars' => [
                 ['var' => 'language', 'label' => Module::t('block_mirror_config_language_label'), 'type' => self::TYPE_SELECT, 'options' => BlockHelper::selectArrayOption(Lang::find()->select(['name', 'id'])->indexBy('id')->column())],
            ],
        ];
    }

    /**
     * {@inheritDoc}
    */
    public function admin()
    {
        if (empty($this->getVarValue('language'))) {
            return '<div>'.Module::t('block_mirror_admin_empty_language').'</div>';
        }

        return '<div>'.Module::t('block_mirror_admin_configured_language', ['name' => Lang::find()->where(['id' => $this->getVarValue('language')])->select(['name'])->scalar()]).'</div>';
    }

    /**
     * {@inheritDoc}
    */
    public function frontend()
    {
        $langId = $this->getVarValue('language');

        // if no language is selected, just do nothing
        if (empty($langId)) {
            return;
        }

        if ($langId == Yii::$app->adminLanguage->activeId) {
            return Yii::debug('Circular content mirroring detected.', __METHOD__);
        }

        $item = NavItemPageBlockItem::find()
            ->select(['placeholder_var', 'nav_item_page_id'])
            ->where(['id' => $this->getEnvOption('id')])
            ->asArray()
            ->one();

        // unabel to find item, just do nothing
        if (!$item) {
            return;
        }

        $navItemId = NavItemPage::find()->where(['id' => $item['nav_item_page_id']])->select(['nav_item_id'])->scalar();

        $navId = NavItem::find()->where(['id' => $navItemId])->select(['nav_id'])->scalar();

        $navItem = NavItem::find()->where(['nav_id' => $navId, 'nav_item_type' => NavItem::TYPE_PAGE, 'lang_id' => $langId])->one();

        if ($navItem) {
            return $navItem->type->renderPlaceholder($item['placeholder_var']);
        }
    }
}
