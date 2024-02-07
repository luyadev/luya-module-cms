<?php

namespace luya\cms\models;

use luya\admin\aws\DetailViewActiveWindow;
use luya\admin\ngrest\base\NgRestModel;
use luya\admin\ngrest\plugins\SelectModel;
use luya\admin\ngrest\plugins\ToggleStatus;
use luya\cms\admin\aws\BlockPagesActiveWindow;
use luya\cms\admin\Module;
use luya\cms\base\BlockInterface;
use Yii;

/**
 * Block ActiveRecord contains the Block<->Group relation.
 *
 * @property integer $id
 * @property integer $group_id
 * @property string $class
 * @property integer $usageCount returns the amount of how much this block is used inside a page.
 * @property integer $is_disabled
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Block extends NgRestModel
{
    private int $cachedDeletedId = 0;

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-block';
    }

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_block';
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'group_id' => [
                'class' => SelectModel::class,
                'modelClass' => BlockGroup::class,
                'labelField' => fn ($model) => $model->getGroupLabel()
            ],
            'class' => 'text',
            'is_disabled' => 'toggleStatus',
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestExtraAttributeTypes()
    {
        return [
            'usageCount' => ['number', 'sortField' => false],
            'translationName' => ['text', 'sortField' => false],
            'fileExists' => ['class' => ToggleStatus::class, 'interactive' => false, 'sortField' => false],
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'translationName' => Module::t('model_block_translation_name_label'),
            'class' => Module::t('model_block_class_label'),
            'group_id' => Module::t('model_block_group_id_label'),
            'usageCount' => Module::t('model_block_usage_count_label'),
            'fileExists' => Module::t('model_block_file_exists_label'),
            'is_disabled' => Module::t('model_block_is_disable_label'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestActiveWindows()
    {
        return [
            [
                'class' => DetailViewActiveWindow::class,
                'attributes' => [
                    'id:integer:ID',
                    'translationName',
                    'class',
                    'blockGroup.groupLabel:text:' . Module::t('model_block_group_id_label'),
                    'usageCount',
                    'is_disabled:boolean',
                    'fileExists:boolean',
                ],
            ],
            [
                'class' => BlockPagesActiveWindow::class,
            ]
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['translationName', 'class', 'group_id', 'usageCount', 'fileExists', 'is_disabled']],
        ];
    }

    /**
     * Wehther the class file exists or not.
     *
     * @return number
     * @since 1.0.4
     */
    public function getFileExists()
    {
        return class_exists($this->class) ? 1 : 0;
    }

    /**
     * Returns the amount where the block is used inside the content.
     *
     * @return integer
     */
    public function getUsageCount()
    {
        return $this->getNavItemPageBlockItems()->count();
    }

    /**
     *
     * @return \yii\db\ActiveQuery
     * @since 1.0.4
     */
    public function getNavItemPageBlockItems()
    {
        return $this->hasMany(NavItemPageBlockItem::class, ['block_id' => 'id']);
    }

    /**
     * Returns the name from the block label.
     *
     * @return string
     */
    public function getTranslationName()
    {
        return $this->getClassObject() ? $this->getClassObject()->name() : $this->class;
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['group_id', 'class'], 'required'],
            [['group_id', 'is_disabled'], 'integer'],
            [['class'], 'string', 'max' => 255],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestGroupByField()
    {
        return 'group_id';
    }

    /**
     * Save id before deleting for clean up in afterDelete()
     *
     * @return bool
     */
    public function beforeDelete()
    {
        $this->cachedDeletedId = $this->id;
        return parent::beforeDelete();
    }

    /**
     * Search for entries with cached block id in cms_nav_item_page_block_item and delete them
     */
    public function afterDelete()
    {
        if ($this->cachedDeletedId) {
            foreach (NavItemPageBlockItem::find()->where(['block_id' => $this->cachedDeletedId])->all() as $item) {
                $item->delete();
            }
        }
        parent::afterDelete();
    }

    /**
     * BlockGroup ActiveQuery.
     *
     * @return \yii\db\ActiveQuery
     * @since 1.0.4
     */
    public function getBlockGroup()
    {
        return $this->hasOne(BlockGroup::class, ['id' => 'group_id']);
    }

    /**
     * Returns the origin block object based on the current active record entry.
     *
     * @return \luya\cms\base\BlockInterface
     */
    public function getClassObject()
    {
        return $this->getFileExists() ? Yii::createObject(['class' => $this->class]) : false;
    }

    /**
     * Try to get the name of the log.
     */
    public function getNameForLog()
    {
        if ($this->getClassObject() && $this->getClassObject() instanceof BlockInterface) {
            return $this->getClassObject()->name();
        }

        return $this->class;
    }

    /**
     * Find the the class names for a certain amount of block ids.
     *
     * @return array
     */
    public static function findObjectClassesById(array $ids)
    {
        return self::find()->select('class')->indexBy('id')->where(['in', 'id', $ids])->column();
    }

    /**
     * @param int $id
     * @param string $context
     * @param NavItemPage|null $pageObject
     * @since 1.0.6
     */
    public function getObject($id, $context, NavItemPage $pageObject = null): false|\luya\cms\base\BlockInterface
    {
        return self::createObject($this->class, $this->id, $id, $context, $pageObject);
    }

    /**
     * Creates the block object and stores the object within a static block container.
     *
     * @param string $class The block object class name.
     * @param int $blockId The id of the cms_block table
     * @param int $id The context id, the cms_nav_item_page_block_item unique id
     * @param string $context admin or frontend
     * @param NavItemPage|null $pageObject
     */
    public static function createObject($class, $blockId, $id, $context, NavItemPage $pageObject = null): false|\luya\cms\base\BlockInterface
    {
        if (!class_exists($class)) {
            return false;
        }

        $object = Yii::createObject([
            'class' => $class,
        ]);

        $object->setEnvOption('id', $id);
        $object->setEnvOption('blockId', $blockId);
        $object->setEnvOption('context', $context);
        $object->setEnvOption('pageObject', $pageObject);

        $object->setup();

        return $object;
    }
}
