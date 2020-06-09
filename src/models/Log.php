<?php

namespace luya\cms\models;

use luya\admin\aws\DetailViewActiveWindow;
use luya\admin\models\User;
use Yii;
use luya\admin\ngrest\base\NgRestModel;
use luya\admin\ngrest\plugins\SelectRelationActiveQuery;
use luya\admin\traits\TaggableTrait;
use luya\cms\admin\Module;
use luya\helpers\Json;
use yii\base\InvalidArgumentException;
use yii\db\ActiveRecord;
use yii\db\AfterSaveEvent;
use yii\helpers\VarDumper;

/**
 * Log.
 * 
 * File has been created with `crud/create` command. 
 *
 * @property integer $id
 * @property integer $user_id
 * @property tinyint $is_insertion
 * @property tinyint $is_update
 * @property tinyint $is_deletion
 * @property integer $timestamp
 * @property string $message
 * @property text $data_json
 * @property string $table_name
 * @property integer $row_id
 */
class Log extends NgRestModel
{
    const LOG_TYPE_INSERT = 1;
    const LOG_TYPE_UPDATE = 2;
    const LOG_TYPE_DELETE = 3;

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return '{{%cms_log}}';
    }

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-log';
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'id' => Yii::t('app', 'ID'),
            'user_id' => Yii::t('app', 'User'),
            'is_insertion' => Yii::t('app', 'Insert'),
            'is_update' => Yii::t('app', 'Update'),
            'is_deletion' => Yii::t('app', 'Delete'),
            'timestamp' => Yii::t('app', 'Timestamp'),
            'message' => Yii::t('app', 'Message'),
            'data_json' => Yii::t('app', 'Data Json'),
            'table_name' => Yii::t('app', 'Table Name'),
            'row_id' => Yii::t('app', 'Row ID'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['user_id', 'is_insertion', 'is_update', 'is_deletion', 'timestamp', 'row_id'], 'integer'],
            [['timestamp'], 'required'],
            [['data_json'], 'string'],
            [['message'], 'string', 'max' => 255],
            [['table_name'], 'string', 'max' => 120],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'user_id' => [
                'class' => SelectRelationActiveQuery::class,
                'query' => $this->getUser(),
                'relation' => 'user',
                'labelField' => ['email'],
            ],
            'is_insertion' => ['toggleStatus', 'interactive' => false],
            'is_update' => ['toggleStatus', 'interactive' => false],
            'is_deletion' => ['toggleStatus', 'interactive' => false],
            'timestamp' => 'datetime',
            'message' => 'raw',
            'data_json' => 'raw',
            'table_name' => 'raw',
            'row_id' => 'number',
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['user_id', 'is_insertion', 'is_update', 'is_deletion', 'timestamp', 'table_name']],
            
        ];
    }

    public function ngRestFilters()
    {
        return [
            'Insertion' => self::ngRestFind()->andWhere(['is_insertion' => true]),
            'Update' => self::ngRestFind()->andWhere(['is_update' => true]),
            'Delete' => self::ngRestFind()->andWhere(['is_deletion' => true]),
        ];
    }

    public function ngRestActiveWindows()
    {
        return [
            [
                'class' => DetailViewActiveWindow::class,
                'attributes' => [
                    'id',
                    [
                        'attribute' => 'user_id',
                        'value' => function($model) {
                            return $model->user->firstname . ' ' . $model->user->lastname;
                        }
                    ],
                    'is_insertion:boolean',
                    'is_update:boolean',
                    'is_deletion:boolean',
                    [
                        'attribute' => 'data_json',
                        'format' => 'raw',
                        'value' => function($model) {
                            return VarDumper::dumpAsString(Json::decode($model->data_json), 10, true);
                        }
                    ],
                    [
                        'attribute' => 'message',
                        'format' => 'raw',
                        'value' => function($model) {
                            return VarDumper::dumpAsString(Json::decode($model->message), 10, true);
                        }
                    ]
                ]
            ]
        ];
    }

    // custom

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
        } catch (InvalidArgumentException $err) {
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
                    $navModel = Nav::findOne($this->row_id);

                    if ($navModel->activeLanguageItem) {
                        return $navModel->activeLanguageItem->title;
                    }

                    if ($navModel->defaultLanguageItem) {
                        return $navModel->defaultLanguageItem->title;
                    }

                    return $navModel->id;
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
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }

    /**
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
     * Log data using AfterSaveEvent of Active Records.
     *
     * @param integer $type
     * @param array $message
     * @param AfterSaveEvent $event
     * @return boolean
     * @since 3.3.0
     */
    public static function addAfterSave($type, array $message, AfterSaveEvent $event)
    {
        $data = [
            'new_values' => $event->sender->getAttributes(),
            'old_values_diff' => $event->changedAttributes,
        ];
        $rowId = implode("-", $event->sender->getPrimaryKey(true));
        $tableName = $event->sender->tableName();

        return self::add($type, $message, $tableName, $rowId, $data);
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
