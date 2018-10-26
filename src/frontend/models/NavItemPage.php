<?php

namespace luya\cms\frontend\models;

use Yii;
use luya\admin\ngrest\base\NgRestModel;

/**
 * Nav Item Page.
 * 
 * File has been created with `crud/create` command. 
 *
 * @property integer $id
 * @property integer $layout_id
 * @property integer $nav_item_id
 * @property integer $timestamp_create
 * @property integer $create_user_id
 * @property string $version_alias
 */
class NavItemPage extends NgRestModel
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_item_page';
    }

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-navitempage';
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'layout_id' => Yii::t('app', 'Layout ID'),
            'nav_item_id' => Yii::t('app', 'Nav Item ID'),
            'timestamp_create' => Yii::t('app', 'Timestamp Create'),
            'create_user_id' => Yii::t('app', 'Create User ID'),
            'version_alias' => Yii::t('app', 'Version Alias'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['layout_id', 'nav_item_id', 'timestamp_create', 'create_user_id'], 'required'],
            [['layout_id', 'nav_item_id', 'timestamp_create', 'create_user_id'], 'integer'],
            [['version_alias'], 'string', 'max' => 250],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'layout_id' => 'number',
            'nav_item_id' => 'number',
            'timestamp_create' => 'number',
            'create_user_id' => 'number',
            'version_alias' => 'text',
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['layout_id', 'nav_item_id', 'timestamp_create', 'create_user_id', 'version_alias']],
            [['create', 'update'], ['layout_id', 'nav_item_id', 'timestamp_create', 'create_user_id', 'version_alias']],
            ['delete', false],
        ];
    }
}