<?php

namespace luya\cms\models;

use luya\admin\traits\SoftDeleteTrait;
use luya\admin\ngrest\base\NgRestModel;
use luya\cms\Exception;

/**
 * Represents the Website-Containers.
 *
 * @property NavContainer[] $navContainers
 *
 * @author Bennet Klarhölter <boehsermoe@me.com>
 * @since 1.0.0
 */
class Website extends NgRestModel
{
    use SoftDeleteTrait;
    
    public static function tableName()
    {
        return 'cms_website';
    }
    
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-website';
    }
    
    public function transactions()
    {
        return [
            self::SCENARIO_DEFAULT => self::OP_INSERT,
        ];
    }
    
    public function rules()
    {
        return [
            [['name', 'host'], 'required'],
            [['name', 'host'], 'unique'],
            [['is_active', 'is_default', 'redirect_to_host'], 'boolean'],
        ];
    }
    
    public function scenarios()
    {
        return [
            'restcreate' => ['name', 'host', 'aliases', 'is_active', 'is_default', 'redirect_to_host'],
            'restupdate' => ['name', 'host', 'aliases', 'is_active', 'is_default', 'redirect_to_host'],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'name' => 'text',
            'host' => 'slug',
            'aliases' => 'slug',
            'is_active' => ['toggleStatus', 'initValue' => 0, 'interactive' => true],
            'is_default' => ['toggleStatus', 'initValue' => 0, 'interactive' => false],
            'redirect_to_host' => ['toggleStatus', 'initValue' => 0, 'interactive' => true],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['name', 'host', 'aliases', 'is_default']],
            ['create', ['name', 'host', 'aliases', 'is_active', 'redirect_to_host']],
            ['update', ['name', 'host', 'aliases', 'is_active', 'redirect_to_host']],
            ['delete', true],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestActiveButtons()
    {
        return [
            [
                'class' => 'luya\admin\buttons\ToggleStatusActiveButton',
                'attribute' => 'is_default',
                'uniqueStatus' => true,
                'modelNameAttribute' => 'name',
                'label' => 'Set default',
            ],
        ];
    }
    
    public function afterSave($insert, $changedAttributes)
    {
        if ($insert) {
            $defaultContainer = new NavContainer();
            $defaultContainer->name = 'Default Container';
            $defaultContainer->alias = 'default';
            $defaultContainer->website_id = $this->primaryKey;
            $defaultContainer->setScenario($this->scenario);
            if (!$defaultContainer->save()) {
                throw new Exception($defaultContainer->getErrorSummary(true));
            }
        }
        parent::afterSave($insert, $changedAttributes);
    }
    
    public function beforeDelete()
    {
        if ($this->is_default) {
            throw new Exception('Default website cannot delete.');
        }
        return parent::beforeDelete();
    }
    
    public function afterDelete()
    {
        $this->updateAttributes(['is_active' => false]);
        
        parent::afterDelete();
    }
}
