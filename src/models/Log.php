<?php

namespace luya\cms\models;

use Yii;
use luya\admin\models\User;
use luya\admin\traits\TaggableTrait;
use yii\helpers\Json;
use luya\cms\admin\Module;
use yii\base\InvalidParamException;
use yii\db\ActiveRecord;

/**
 * Eventer-Logger for CMS Activitys
 *
 * @property integer $id
 * @property integer $user_id
 * @property integer $is_insertion
 * @property integer $is_update
 * @property integer $is_deletion
 * @property integer $timestamp
 * @property string $message
 * @property string $data_json
 * @property string $table_name
 * @property integer $row_id
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Log extends \yii\db\ActiveRecord
{
    const LOG_TYPE_INSERT = 1;
    const LOG_TYPE_UPDATE = 2;
    const LOG_TYPE_DELETE = 3;
    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();
        $this->on(self::EVENT_BEFORE_INSERT, [$this, 'onBeforeInsert']);
    }

    public function onBeforeInsert()
    {
        $this->timestamp = time();
        $this->user_id = (Yii::$app instanceof \luya\web\Application) ? Yii::$app->adminuser->getId() : 0;
        $this->data_json = json_encode($this->data_json);
    }
    
    /**
     * Get the message as array
     *
     * @return array
     */
    public function getMessageArray()
    {
        try {
            return Json::decode($this->message);
        } catch (InvalidParamException $err) {
            return [];
        }
    }
    
    /**
     * Find informations for a given row, for detailed informations about the data set.
     *
     * @return string
     */
    public function getRowDescriber()
    {
        if (!empty($this->row_id)) {
            switch (TaggableTrait::cleanBaseTableName($this->table_name)) {
                case "cms_nav":
                    return Nav::findOne($this->row_id)->activeLanguageItem->title;
                case "cms_nav_item":
                    return NavItem::findOne($this->row_id)->title;
                case "cms_nav_item_page_block_item":
                    $block = NavItemPageBlockItem::findOne($this->row_id);
                    if (!$block || $block->block == null) {
                        $arr = $this->getMessageArray();
                        if (!empty($arr) && isset($arr['blockName'])) {
                            return $arr['blockName'] . " ({$arr['pageTitle']})";
                        } else {
                            return;
                        }
                    }
                    return $block->block->getNameForLog() . " (" .$block->droppedPageTitle. ")";
            }
        }
    }
    
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_log';
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'user_id' => 'User ID',
            'is_insertion' => 'Is Insertion',
            'is_update' => 'Is Update',
            'is_deletion' => 'Is Deletion',
            'timestamp' => 'Timestamp',
            'message' => 'Message',
            'data_json' => 'Data Json',
            'table_name' => 'Table Name',
            'row_id' => 'Row ID',
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['is_insertion', 'is_deletion', 'is_update', 'message', 'data_json', 'row_id', 'table_name', 'timestamp', 'user_id'], 'safe'],
        ];
    }
    
    /**
     * @inheritdoc
     */
    public function fields()
    {
        return [
            'is_insertion',
            'is_update',
            'is_deletion',
            'timestamp',
            'action',
            'user',
        ];
    }
    
    /**
     * Get the log message as a string
     *
     * @return string
     */
    public function getAction()
    {
        $tableName = TaggableTrait::cleanBaseTableName($this->table_name);

        if ($this->is_insertion) {
            switch ($tableName) {
                case "cms_nav_item":
                    return Module::t('log_action_insert_cms_nav_item', ['info' => $this->rowDescriber]);
                case "cms_nav":
                    return Module::t('log_action_insert_cms_nav', ['info' => $this->rowDescriber]);
                case "cms_nav_item_page_block_item":
                    return Module::t('log_action_insert_cms_nav_item_page_block_item', ['info' => $this->rowDescriber]);
                default:
                    return Module::t('log_action_insert_unkown', ['info' => $this->rowDescriber]);
            }
        }
        
        if ($this->is_update) {
            switch ($tableName) {
                case "cms_nav_item":
                    return Module::t('log_action_update_cms_nav_item', ['info' => $this->rowDescriber]);
                case "cms_nav":
                    return Module::t('log_action_update_cms_nav', ['info' => $this->rowDescriber]);
                case "cms_nav_item_page_block_item":
                    return Module::t('log_action_update_cms_nav_item_page_block_item', ['info' => $this->rowDescriber]);
                default:
                    return Module::t('log_action_update_unkown', ['info' => $this->rowDescriber]);
            }
        }

        if ($this->is_deletion) {
            switch ($tableName) {
                case "cms_nav_item":
                    return Module::t('log_action_delete_cms_nav_item', ['info' => $this->rowDescriber]);
                case "cms_nav":
                    return Module::t('log_action_delete_cms_nav', ['info' => $this->rowDescriber]);
                case "cms_nav_item_page_block_item":
                    return Module::t('log_action_delete_cms_nav_item_page_block_item', ['info' => $this->rowDescriber]);
                default:
                    return Module::t('log_action_delete_unkown');
            }
        }
    }
    
    /**
     * User relatiion.
     * 
     * @return User
     */
    public function getUser()
    {
        return $this->hasOne(User::className(), ['id' => 'user_id']);
    }

    /**
     *
     * @param integer $type Types of message:
     * + 1 = insertion
     * + 2 = update
     * + 3 = deletion
     * @param array $message
     * @param string $tableName
     * @param integer $rowId
     * @param array $additionalData
     * @return boolean
     */
    public static function add($type, array $message, $tableName, $rowId = 0, array $additionalData = [])
    {
        $model = new self();
        $model->setAttributes([
            'is_insertion' => ($type == 1) ? true : false,
            'is_update' => ($type == 2) ? true : false,
            'is_deletion' => ($type == 3) ? true : false,
            'table_name' => $tableName,
            'row_id' => $rowId,
            'message' => Json::encode($message),
            'data_json' => $additionalData,
        ]);
        return $model->insert(false);
    }

    /**
     * Add log entry based on active record models.
     *
     * @param integer $type
     * @param ActiveRecord $model
     * @return boolean
     * @since 2.1.1
     */
    public static function addModel($type, ActiveRecord $model)
    {
        switch ($type) {
            case self::LOG_TYPE_DELETE:
                $actionName = 'delete';
                break;
            case self::LOG_TYPE_INSERT:
                $actionName = 'insert';
                break;
            case self::LOG_TYPE_UPDATE:
                $actionName = 'update';
                break;
                
        }
        return Log::add($type, [
            'tableName' => $model::tableName(),
            'action' => $actionName,
            'row' => $model->getPrimaryKey()
        ], $model::tableName(), $model->getPrimaryKey(), $model->toArray());
    }
}
