<?php

namespace luya\cms\models;

use yii\helpers\Json;
use luya\admin\ngrest\base\NgRestModel;

/**
 * Theme Model for LUYA-Theme.
 *
 * @property int $id
 * @property string $base_path
 * @property string $json_config
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
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
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['name', 'base_path', 'parentTheme']],
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
        $this->_jsonConfig = Json::decode($this->json_config);

        return parent::afterFind();
    }
    
    private $_jsonConfig = [];
    
    /**
     * Get the json config as array.
     *
     * @param string $node Get a given key from the config array.
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
