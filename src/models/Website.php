<?php

namespace luya\cms\models;

use luya\admin\ngrest\plugins\SelectRelationActiveQuery;
use luya\admin\traits\SoftDeleteTrait;
use luya\admin\ngrest\base\NgRestModel;
use luya\cms\Exception;
use luya\helpers\StringHelper;

/**
 * Represents the Website-Containers.
 *
 * @property NavContainer[] $navContainers
 *
 * @author Bennet Klarhölter <boehsermoe@me.com>
 * @since 4.0.0
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
            'restcreate' => ['name', 'host', 'aliases', 'is_active', 'is_default', 'redirect_to_host', 'theme_id'],
            'restupdate' => ['name', 'host', 'aliases', 'is_active', 'is_default', 'redirect_to_host', 'theme_id'],
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
            'theme_id' => [
                'class' => SelectRelationActiveQuery::class,
                'query' => $this->getTheme(),
                'relation' => 'theme',
                'labelField' => ['base_path']
            ],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['name', 'host', 'aliases', 'is_default', 'theme_id']],
            ['create', ['name', 'host', 'aliases', 'is_active', 'redirect_to_host', 'theme_id']],
            ['update', ['name', 'host', 'aliases', 'is_active', 'redirect_to_host', 'theme_id']],
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
    
    private static $_current = null;
    
    public static function getCurrent()
    {
        if (self::$_current === null) {
            self::$_current = self::findOneByHostName(\Yii::$app->request->hostName);
        }
        
        return self::$_current;
    }
    
    /**
     * Get website information by hostname.
     *
     * @param string $hostName
     * @return array|boolean If the website exists an array with informations as returned, otherwise false.
     */
    public static function findOneByHostName($hostName)
    {
        $defaultWebsite = false;
    
        $websites = self::find(['is_active' => true, 'is_delete' => false])->cache()->asArray()->all();
        foreach ($websites as $website) {
            if (StringHelper::matchWildcard($website['host'], $hostName)) {
                return $website;
            }
            foreach (explode(',', $website['aliases']) as $alias) {
                if (StringHelper::matchWildcard(trim($alias), $hostName)) {
                    return $website;
                }
            }
        
            if ($website['is_default']) {
                $defaultWebsite = $website;
            }
        }
    
        return $defaultWebsite;
    }
    
    public function getTheme()
    {
        return $this->hasOne(Theme::class, ['id' => 'theme_id']);
    }
}
