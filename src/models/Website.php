<?php

namespace luya\cms\models;

use luya\admin\models\Lang;
use luya\admin\ngrest\base\NgRestModel;
use luya\admin\ngrest\plugins\SelectRelationActiveQuery;
use luya\admin\traits\SoftDeleteTrait;
use luya\cms\admin\Module;
use luya\cms\Exception;
use yii\db\AfterSaveEvent;

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
    
    public function init()
    {
        parent::init();
        $this->on(self::EVENT_AFTER_INSERT, [$this, 'eventAfterInsert']);
        $this->on(self::EVENT_BEFORE_DELETE, [$this, 'eventBeforeDelete']);
        $this->on(self::EVENT_AFTER_DELETE, [$this, 'eventAfterDelete']);
    }
    
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
            [['theme_id'], 'integer'],
            [['is_active', 'is_default', 'is_deleted', 'redirect_to_host'], 'boolean'],
            [['aliases', 'default_lang'], 'string']
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'theme_id' => 'Theme',
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
                'emptyListValue' => '(' . Module::t('model_website_use_default_theme') . ')',
                'labelField' => ['base_path']
            ],
            'default_lang' => [
                'class' => SelectRelationActiveQuery::class,
                'query' => $this->getLang(),
                'relation' => 'lang',
                'labelField' => ['name']
            ]
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
    
    public function ngRestConfigOptions()
    {
        return [
            'saveCallback' => "['ServiceMenuData', function(ServiceMenuData) { ServiceMenuData.load(true); }]",
        ];
    }
    
    public function eventAfterInsert($event)
    {
        $defaultContainer = new NavContainer();
        $defaultContainer->name = 'Default Container';
        $defaultContainer->alias = 'default';
        $defaultContainer->website_id = $this->primaryKey;
        $defaultContainer->setScenario($this->scenario);
        if (!$defaultContainer->save()) {
            throw new Exception($defaultContainer->getErrorSummary(true));
        }
    }
    
    public function eventBeforeDelete()
    {
        if ($this->is_default) {
            throw new Exception('Default website cannot delete.');
        }
    }
    
    public function afterDelete()
    {
        $this->updateAttributes(['is_active' => false]);
    }
    
    public function getTheme()
    {
        return $this->hasOne(Theme::class, ['id' => 'theme_id']);
    }
    
    public function getLang()
    {
        return $this->hasOne(Lang::class, ['short_code' => 'default_lang']);
    }
}
