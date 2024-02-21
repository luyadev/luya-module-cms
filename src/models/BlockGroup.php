<?php

namespace luya\cms\models;

use luya\admin\ngrest\base\NgRestModel;
use luya\admin\traits\SoftDeleteTrait;
use luya\cms\admin\Module;
use Yii;

/**
 * Represents a group of blocks.
 *
 * @property integer $id
 * @property string $name
 * @property integer $is_deleted
 * @property string $identifier
 * @property integer $created_timestamp
 * @property string $class
 * @property \luya\cms\base\BlockGroup $classObject returns the class object based on the current Active Record.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockGroup extends NgRestModel
{
    use SoftDeleteTrait;

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-blockgroup';
    }

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_block_group';
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['name', 'identifier', 'class'], 'required'],
            [['name', 'identifier', 'class'], 'string'],
            [['created_timestamp', 'is_deleted'], 'integer'],
            ['identifier', 'unique'],
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'name' => Module::t('model_blockgroup_name_label'),
            'identifier' => Module::t('model_blockgroup_identifier_label'),
            'class' => Module::t('model_blockgroup_class_label'),
            'created_timestamp' => Module::t('model_blockgroup_created_timestamp_label'),
            'is_deleted' => Module::t('model_blockgroup_is_deleted_label'),
            'groupLabel' => Module::t('model_blockgroup_group_label'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'name' => 'text',
            'identifier' => 'text',
            'class' => 'text',
            'created_timestamp' => 'datetime'
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestExtraAttributeTypes()
    {
        return [
            'groupLabel' => ['text', 'sortField' => false],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            [['list'], ['groupLabel', 'identifier', 'created_timestamp', 'class']],
        ];
    }

    /**
     * @inheritdoc
     */
    public function extraFields()
    {
        return ['groupLabel'];
    }



    /**
     * Get the Group label with translation evaled.
     *
     * @return string Returns the group name.
     */
    public function getGroupLabel()
    {
        return $this->classObject->label();
    }

    /**
     * Returns the block group object in order to retrieve translation data.
     *
     * @return \luya\cms\base\BlockGroup
     */
    public function getClassObject()
    {
        return Yii::createObject(['class' => $this->class]);
    }

    /**
     * The all blocks for the given group
     *
     * @return \luya\cms\models\Block
     */
    public function getBlocks()
    {
        return $this->hasMany(Block::class, ['group_id' => 'id']);
    }
}
