<?php

namespace luya\cms\models;

use Yii;
use luya\admin\ngrest\base\NgRestModel;

/**
 * Nav Item Property.
 * 
 * File has been created with `crud/create` command. 
 *
 * @property integer $id
 * @property integer $nav_item_id
 * @property integer $create_user_id
 * @property integer $update_user_id
 * @property integer $timestamp_create
 * @property integer $timestamp_update
 * @property string $name
 * @property string $value
 */
class NavItemProperty extends NgRestModel
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_item_property';
    }

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-navitemproperty';
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'nav_item_id' => Yii::t('app', 'Nav Item ID'),
            'create_user_id' => Yii::t('app', 'Create User ID'),
            'update_user_id' => Yii::t('app', 'Update User ID'),
            'timestamp_create' => Yii::t('app', 'Timestamp Create'),
            'timestamp_update' => Yii::t('app', 'Timestamp Update'),
            'name' => Yii::t('app', 'Name'),
            'value' => Yii::t('app', 'Value'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['nav_item_id', 'create_user_id', 'update_user_id', 'name'], 'required'],
            [['nav_item_id', 'create_user_id', 'update_user_id', 'timestamp_create', 'timestamp_update'], 'integer'],
            [['value'], 'string'],
            [['name'], 'string', 'max' => 50],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'nav_item_id' => 'number',
            'create_user_id' => 'number',
            'update_user_id' => 'number',
            'timestamp_create' => 'number',
            'timestamp_update' => 'number',
            'name' => 'text',
            'value' => 'textarea',
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['nav_item_id', 'create_user_id', 'update_user_id', 'timestamp_create', 'timestamp_update', 'name', 'value']],
            [['create', 'update'], ['nav_item_id', 'create_user_id', 'update_user_id', 'timestamp_create', 'timestamp_update', 'name', 'value']],
            ['delete', false],
        ];
    }
}