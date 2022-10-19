<?php

namespace luya\cms\models;

use luya\admin\ngrest\base\NgRestModel;
use luya\cms\admin\Module;
use yii\helpers\Json;

/**
 * Layout Model for CMS-Layouts.
 *
 * @property int $id
 * @property string $name
 * @property string $json_config
 * @property string $view_file
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Layout extends NgRestModel
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_layout';
    }

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-layout';
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['name', 'json_config', 'view_file'], 'required'],
            [['json_config'], 'string'],
            [['name', 'view_file'], 'string', 'max' => 255],
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'name' => Module::t('model_layout_name_label'),
            'json_config' => Module::t('model_layout_json_config_label'),
            'view_file' => Module::t('model_layout_view_file_label'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'name' => 'text',
            'json_config' => ['textarea', 'encoding' => false],
            'view_file' => 'text',
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['name', 'json_config', 'view_file']],
            [['update'], ['name']],
        ];
    }

    /**
     * Get the json config as array.
     *
     * @param string $node Get a given key from the config array.
     * @return array If the given node is not found an empty array will be returned.
     */
    public function getJsonConfig($node = null)
    {
        $json = Json::decode($this->json_config);

        if (!$node) {
            return $json;
        }

        if (isset($json[$node])) {
            return $json[$node];
        }

        return [];
    }
}
