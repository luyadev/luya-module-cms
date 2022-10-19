<?php

namespace luya\cms\models;

/**
 * This is the model class for table "cms_nav_permission".
 *
 * @property int $group_id
 * @property int $nav_id
 * @property int $inheritance
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.4
 */
class NavPermission extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'cms_nav_permission';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['group_id', 'nav_id'], 'required'],
            [['group_id', 'nav_id', 'inheritance'], 'integer'],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'group_id' => 'Group ID',
            'nav_id' => 'Nav ID',
            'inheritance' => 'Inheritance',
        ];
    }
}
