<?php

namespace luya\cms\models;

use Yii;
use luya\cms\Exception;
use luya\cms\base\NavItemType;
use luya\cms\base\NavItemTypeInterface;
use luya\cms\admin\Module;
use luya\web\EmailLink;
use luya\web\WebsiteLink;
use luya\cms\LinkConverter;
use yii\base\InvalidConfigException;

/**
 * Represents the type REDIRECT for a NavItem.
 *
 * @property integer $id
 * @property integer $type The type of redirect (1 = page, 2 = URL, 3 = Link to File)
 * @property string $value Depending on the type (1 = cms_nav.id, 2 = http://luya.io)
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavItemRedirect extends NavItemType implements NavItemTypeInterface
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_item_redirect';
    }

    /**
     * @inheritdoc
     */
    public static function getNummericType()
    {
        return NavItem::TYPE_REDIRECT;
    }
    
    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['type', 'value'], 'required'],
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'value' => Module::t('model_navitemredirect_value_label'),
            'type' => Module::t('model_navitemredirect_type_label'),
        ];
    }

    /**
     * Resolve the values with {{luya\cms\LinkConverter}}.
     *
     * @return \luya\web\LinkInterface|boolean
     */
    public function resolveValue()
    {
        $converter = new LinkConverter();
        $converter->value = $this->value;
        $converter->type = $this->type;

        return $converter->getLink();
    }

    /**
     * @inheritdoc
     */
    public function getContent()
    {
        $link = $this->resolveValue();
        
        if (!$link) {
            throw new InvalidConfigException(sprintf("Unable to redirect to the given page, invalid link object. Make sure the target page with id '%s' is online!", $this->value));
        }
        
        Yii::$app->getResponse()->redirect($link->getHref());
        Yii::$app->end();
        
        return;
    }
}
