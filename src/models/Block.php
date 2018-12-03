<?php

namespace luya\cms\models;

use Yii;
use luya\cms\base\BlockInterface;
use luya\admin\ngrest\base\NgRestModel;
use luya\admin\aws\DetailViewActiveWindow;
use luya\admin\ngrest\plugins\SelectModel;
use luya\admin\ngrest\plugins\ToggleStatus;
use luya\cms\admin\aws\BlockPagesActiveWindow;

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
    private $cachedDeletedId = 0;

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
                'modelClass' => BlockGroup::className(),
                'labelField' => function ($model) {
                    return $model->getGroupLabel();
                }
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
            'usageCount' => 'number',
            'translationName' => 'text',
            'fileExists' => ['class' => ToggleStatus::class, 'interactive' => false],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'translationName' => 'Name',
            'class' => 'Class',
            'usageCount' => 'Used in content',
            'group_id' => 'Group',
            'is_disabled' => 'Is disabled',
            'fileExists' => 'File exists',
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
                    'id',
                    'translationName',
                    'class',
                    'blockGroup.groupLabel:text:Group',
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
     * @param array $ids
     * @return array
     */
    public static function findObjectClassesById(array $ids)
    {
        return self::find()->select('class')->indexBy('id')->where(['in', 'id', $ids])->column();
    }

    /**
     * Get the object from current object-context (classname).
     *
     * @param [type] $id
     * @param [type] $context
     * @param [type] $pageObject
     * @return void
     * @since 1.0.6
     */
    public function getObject($id, $context, $pageObject = null)
    {
        return self::createObject($this->class, $this->id, $id, $context, $pageObject);
    }

    /**
     * Creates the block object and stores the object within a static block container.
     *
     * @param string $class
     * @param integer $blockId The id of the cms_block table
     * @param integer $id The context id, for example the id of the text block element
     * @param string $context admin or frontend
     * @param mixed $pageObject
     * @return \luya\cms\base\BlockInterface
     */
    public static function createObject($class, $blockId, $id, $context, $pageObject = null)
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
        
        return $object;
    }
    
    private static $blocks = [];
    
    /**
     * Get the block object from the database with context informations.
     *
     * @param integer $blockId
     * @param integer $id
     * @param mixed $context
     * @param object $pageObject
     * @return \luya\cms\base\BlockInterface
     * @deprecated 1.1.0 use createObject() or getObject() instead!
     */
    public static function objectId($blockId, $id, $context, $pageObject = null)
    {
        if (isset(self::$blocks[$blockId])) {
            $block = self::$blocks[$blockId];
        } else {
            $block = self::find()->select(['class'])->where(['id' => $blockId])->asArray()->one();
            static::$blocks[$blockId] = $block;
        }
        
        if (!$block) {
            return false;
        }

        $class = $block['class'];
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

        return $object;
    }
}
