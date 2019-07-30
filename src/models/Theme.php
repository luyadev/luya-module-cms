<?php

namespace luya\cms\models;

use luya\admin\ngrest\base\NgRestModel;
use yii\base\InvalidArgumentException;
use yii\helpers\Json;

/**
 * Theme Model for LUYA-Theme.
 *
 * @property int    $id
 * @property string $base_path
 * @property string $json_config
 * @property bool   $is_active
 *
 * @author Bennet Klarhölter <boehsermoe@me.com>
 * @since  1.1.0
 */
class Theme extends NgRestModel
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_theme';
    }
    
    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-theme';
    }
    
    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['base_path', 'json_config'], 'required'],
            [['json_config'], 'string'],
            [['base_path'], 'string', 'max' => 255],
            [['is_active'], 'boolean'],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'base_path' => 'text',
            'json_config' => ['textarea', 'encoding' => false],
            'is_active' => ['toggleStatus', 'initValue' => 0],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['name', 'is_active', 'base_path', 'parentTheme']],
        ];
    }
    
    public function ngRestExtraAttributeTypes()
    {
        return [
            'name' => 'text',
            'parentTheme' => 'text',
            'author' => 'text',
        ];
    }
    
    public function ngRestActiveButtons()
    {
        return [
            [
                'class' => 'luya\admin\buttons\ToggleStatusActiveButton',
                'attribute' => 'is_active',
                'uniqueStatus' => true,
                'modelNameAttribute' => 'name',
                'label' => 'Set active',
            ],
        ];
    }
    
    public function getName()
    {
        return $this->getJsonConfig('name');
    }
    
    public function getParentTheme()
    {
        return $this->getJsonConfig('parentTheme');
    }
    
    public function getAuthor()
    {
        return $this->getJsonConfig('author');
    }
    
    public function afterFind()
    {
        try {
            $this->_jsonConfig = Json::decode($this->json_config);
        } catch (InvalidArgumentException $ex) {
            $this->_jsonConfig = null;
        }
        
        return parent::afterFind();
    }
    
    private $_jsonConfig = [];
    
    /**
     * Get the json config as array.
     *
     * @param string $node Get a given key from the config array.
     *
     * @return array If the given node is not found an empty array will be returned.
     */
    public function getJsonConfig($node = null)
    {
        if (!$node) {
            return $this->_jsonConfig;
        }
        
        if (isset($this->_jsonConfig[$node])) {
            return $this->_jsonConfig[$node];
        }
        
        return null;
    }
}
