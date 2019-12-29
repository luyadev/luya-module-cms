<?php

namespace luya\cms\models;

use luya\admin\ngrest\base\NgRestModel;
use luya\theme\ThemeConfig;
use yii\base\InvalidArgumentException;
use yii\helpers\Json;

/**
 * Theme Model for LUYA-Theme.
 *
 * @property int $id
 * @property string $base_path
 * @property string $json_config
 * @property bool $is_active
 *
 * @author Bennet Klarhölter <boehsermoe@me.com>
 * @since 3.0.0
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
            'is_active' => ['toggleStatus', 'initValue' => 0, 'interactive' => false],
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
    
    /**
     * @inheritdoc
     */
    public function ngRestExtraAttributeTypes()
    {
        return [
            'name' => 'text',
            'parentTheme' => 'text',
            'author' => 'text',
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
                'attribute' => 'is_active',
                'uniqueStatus' => true,
                'modelNameAttribute' => 'name',
                'label' => 'Set active',
            ],
        ];
    }
    
    /**
     * @return string
     */
    public function getName()
    {
        return $this->getJsonConfig('name');
    }
    
    /**
     * @return string
     */
    public function getParentTheme()
    {
        return $this->getJsonConfig('parentTheme');
    }
    
    /**
     * @return string
     */
    public function getAuthor()
    {
        return $this->getJsonConfig('author');
    }
    
    private $_jsonConfig = null;
    
    /**
     * Get the json config as array.
     *
     * @param string $key Get a given key from the config array.
     * @return array|mixed If the given node is not found an empty array will be returned.
     */
    public function getJsonConfig($key = null)
    {
        if ($this->_jsonConfig === null) {
            try {
                $this->_jsonConfig = Json::decode($this->json_config);
            } catch (InvalidArgumentException $ex) {
                $this->_jsonConfig = [];
            }
        }

        if (!$key) {
            return $this->_jsonConfig;
        }
    
        return isset($this->_jsonConfig[$key]) ? $this->_jsonConfig[$key] : null;
    }
    
    /**
     * Set the json config by given theme config.
     *
     * @param ThemeConfig $config
     */
    public function setThemeConfig(ThemeConfig $config)
    {
        $this->json_config = Json::encode($config->toArray());
    }
}
