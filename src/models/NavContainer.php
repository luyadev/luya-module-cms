<?php

namespace luya\cms\models;

use luya\admin\ngrest\base\NgRestModel;
use luya\admin\traits\SoftDeleteTrait;
use luya\cms\admin\Module;
use luya\cms\behaviours\WebsiteScopeBehavior;
use yii\db\ActiveQuery;

/**
 * Navigation-Containers Model.
 *
 * @property integer $id
 * @property string $name
 * @property string $alias
 * @property integer $website_id
 * @property bool $is_deleted
 * @property Website $website
 * @property Nav[] $navs
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavContainer extends NgRestModel
{
    use SoftDeleteTrait;

    /**
     * {@inheritDoc}
     */
    public static function tableName()
    {
        return 'cms_nav_container';
    }

    /**
     * {@inheritDoc}
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-navcontainer';
    }

    /**
     * {@inheritDoc}
     */
    public static function findActiveQueryBehaviors()
    {
        return [
            'websiteScope' => WebsiteScopeBehavior::class
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function rules()
    {
        return [
            [['name', 'alias', 'website_id'], 'required'],
            [['website_id'], 'integer'],
            [['is_deleted'], 'boolean']
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function attributeLabels()
    {
        return [
            'website_id' => Module::t('model_navcontainer_website_label'),
            'name' => Module::t('model_navcontainer_name_label'),
            'alias' => Module::t('model_navcontainer_alias_label')
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function ngrestAttributeTypes()
    {
        return [
            'name' => ['text', 'inline' => true],
            'alias' => 'slug',
            'website_id' => ['selectModel', 'modelClass' => Website::class, 'valueField' => 'id', 'labelField' => 'name']
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function ngRestScopes()
    {
        return [
            [['list', 'create', 'update'],  ['name', 'alias', 'website_id']],
            ['delete', true],
        ];
    }

    /**
     * Returns all `cms_nav` rows belongs to this container sort by index without deleted or draft items.
     *
     * @return ActiveQuery
     */
    public function getNavs()
    {
        return $this->hasMany(Nav::class, ['nav_container_id' => 'id'])->where(['is_deleted' => false, 'is_draft' => false])->orderBy(['sort_index' => SORT_ASC]);
    }

    /**
     * @return ActiveQuery
     */
    public function getWebsite()
    {
        return $this->hasOne(Website::class, ['id' => 'website_id']);
    }
}
