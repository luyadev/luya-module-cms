<?php

namespace luya\cms\models;

use luya\admin\base\GenericSearchInterface;

use luya\admin\helpers\Angular;
use luya\admin\models\Lang;
use luya\admin\models\User;
use luya\admin\ngrest\base\NgRestActiveQuery;
use luya\cms\admin\Module;
use luya\helpers\Inflector;
use Yii;
use yii\base\Exception;
use yii\db\ActiveQuery;
use yii\db\ActiveRecord;

/**
 * NavItem Model represents a Item bound to Nav and Language, each Nav(Menu) can contain a nav_item for each language.Each
 * cms_nav_item is related to a type of item (module, page or redirect) which is stored in nav_item_type (number) and another field
 * nav_item_type_id (pk of the table).
 *
 * @property \luya\cms\models\NavItemPage|\luya\cms\models\NavItemModule\luya\cms\models\NavItemRedirect $type The type object based on the current type id
 * @property integer $id
 * @property integer $nav_id
 * @property integer $lang_id
 * @property integer $nav_item_type
 * @property integer $nav_item_type_id
 * @property integer $create_user_id
 * @property integer $update_user_id
 * @property integer $timestamp_create
 * @property integer $timestamp_update
 * @property string $title
 * @property string $alias
 * @property string $description
 * @property string $keywords
 * @property string $title_tag
 * @property integer $image_id
 * @property integer $is_url_strict_parsing_disabled
 * @property integer $is_cacheable
 *
 * @property \luya\cms\models\Nav $nav Nav Model.
 * @property \luya\admin\models\User $createUser
 * @property \luya\admin\models\User $updateUser
 * @property \luya\admin\models\Lang $lang
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavItem extends ActiveRecord implements GenericSearchInterface
{
    public const TYPE_PAGE = 1;

    public const TYPE_MODULE = 2;

    public const TYPE_REDIRECT = 3;

    public $parent_nav_id;

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();
        $this->on(self::EVENT_BEFORE_VALIDATE, [$this, 'validateAlias']);
        $this->on(self::EVENT_BEFORE_INSERT, [$this, 'beforeCreate']);
        $this->on(self::EVENT_BEFORE_UPDATE, [$this, 'eventBeforeUpdate']);

        $this->on(self::EVENT_BEFORE_DELETE, [$this, 'eventLogger']);
        $this->on(self::EVENT_AFTER_INSERT, [$this, 'eventLogger']);
        $this->on(self::EVENT_AFTER_UPDATE, [$this, 'eventLogger']);

        $this->on(self::EVENT_AFTER_DELETE, function ($event) {
            $type = $event->sender->getType();
            if ($type) {
                $type->delete();
            }

            foreach (NavItemPage::find()->where(['nav_item_id' => $event->sender->id])->all() as $version) {
                $version->delete();
            }
        });
    }

    /**
     * Log the current event in a database to retrieve data in case of emergency. This method will be trigger
     * on: EVENT_BEFORE_DELETE, EVENT_AFTER_INSERT & EVENT_AFTER_UPDATE
     *
     * @param \yii\base\Event $event
     */
    protected function eventLogger($event)
    {
        switch ($event->name) {
            case 'afterInsert':
                return Log::addAfterSave(Log::LOG_TYPE_INSERT, ['tableName' => 'cms_nav_item', 'action' => 'insert', 'row' => $this->id], $event);
            case 'afterUpdate':
                return Log::addAfterSave(Log::LOG_TYPE_UPDATE, ['tableName' => 'cms_nav_item', 'action' => 'update', 'row' => $this->id], $event);
            case 'beforeDelete':
            case 'afterDelete':
                return Log::add(Log::LOG_TYPE_DELETE, ['tableName' => 'cms_nav_item', 'action' => 'delete', 'row' => $this->id], 'cms_nav_item', $this->id, $this->toArray());
        }
    }

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_item';
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            ['nav_item_type_id', 'required', 'isEmpty' => fn ($value) => empty($value), 'when' => fn () => !$this->isNewRecord],
            [['description', 'keywords'], 'string'],
            [['title'], 'string', 'max' => 180],
            [['alias'], 'string', 'max' => 180],
            [['title_tag'], 'string', 'max' => 255],
            [['lang_id', 'title', 'alias', 'nav_item_type'], 'required'],
            [['nav_id', 'lang_id', 'nav_item_type', 'nav_item_type_id', 'create_user_id', 'update_user_id', 'timestamp_create', 'timestamp_update', 'image_id', 'is_url_strict_parsing_disabled', 'is_cacheable'], 'integer'],
            [['alias'], 'match', 'pattern' => '/\_|\/|\\\/i', 'not' => true],
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'title' => Module::t('model_navitem_title_label'),
            'alias' => Module::t('model_navitem_alias_label'),
            'title_tag' => Module::t('model_navitem_title_tag_label'),
            'image_id' => Module::t('model_navitem_image_id_label'),
        ];
    }

    /**
     * Create User relation.
     *
     * @return NgRestActiveQuery|ActiveQuery
     */
    public function getCreateUser(): \luya\admin\ngrest\base\NgRestActiveQuery|\yii\db\ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'create_user_id']);
    }

    /**
     * Update User relation.
     *
     * @return NgRestActiveQuery|ActiveQuery
     */
    public function getUpdateUser(): \luya\admin\ngrest\base\NgRestActiveQuery|\yii\db\ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'update_user_id']);
    }

    /**
     * Slugify the current alias attribute.
     */
    public function slugifyAlias()
    {
        $this->alias = Inflector::slug($this->alias, '-', true, false);
    }

    private $_type;

    /**
     * GET the type object based on the nav_item_type defintion and the nav_item_type_id which is the
     * primary key for the corresponding type table (page, module, redirect). This approach has been choosen
     * do dynamically extend type of pages whithout any limitation.
     *
     * @return \luya\cms\models\NavItemPage|\luya\cms\models\NavItemModule|\luya\cms\models\NavItemRedirect|bool Returns the object based on the type
     * @throws Exception
     */
    public function getType(): \luya\cms\models\NavItemPage|\luya\cms\models\NavItemModule|\luya\cms\models\NavItemRedirect|bool
    {
        if ($this->_type === null) {
            // what kind of item type are we looking for
            if ($this->nav_item_type == self::TYPE_PAGE) {
                $this->_type = NavItemPage::findOne($this->nav_item_type_id);
            } elseif ($this->nav_item_type == self::TYPE_MODULE) {
                $this->_type = NavItemModule::findOne($this->nav_item_type_id);
            } elseif ($this->nav_item_type == self::TYPE_REDIRECT) {
                $this->_type = NavItemRedirect::findOne($this->nav_item_type_id);
            }

            if ($this->_type === null) {
                $this->_type = false;
            }

            // set context for the object
            /// 5.4.2016: Discontinue, as the type model does have getNavItem relation
            //$this->_type->setNavItem($this);
        }

        return $this->_type;
    }

    /**
     * Get the related nav entry for this nav_item.
     *
     * @return NgRestActiveQuery|ActiveQuery
     */
    public function getNav(): \luya\admin\ngrest\base\NgRestActiveQuery|\yii\db\ActiveQuery
    {
        return $this->hasOne(Nav::class, ['id' => 'nav_id']);
    }

    /**
     * Get the render content for the specific type, see the definition of `getContent()` in the available types.
     *
     * @return mixed
     */
    public function getContent()
    {
        return $this->getType()->getContent();
    }

    /**
     * Update attributes of the current nav item type relation.
     *
     * @return boolean Whether the update has been successfull or not
     */
    public function updateType(array $postData)
    {
        $model = $this->getType();
        $model->setAttributes($postData);
        return $model->update();
    }

    /**
     * Get the parent nav id information from the existing getNav relation and overrides the public properties parent_nav_id of this model.
     * This is applied because of the validation process to make sure this rewrite does not already exists.
     */
    public function setParentFromModel()
    {
        $this->parent_nav_id = $this->nav->parent_nav_id;
    }

    /**
     * Alias verification.
     *
     * @param string $alias
     * @param integer $langId
     */
    public function verifyAlias($alias, $langId)
    {
        if (Yii::$app->hasModule($alias) && $this->parent_nav_id == null) {
            $this->addError('alias', Module::t('nav_item_model_error_modulenameexists', ['alias' => $alias]));
            return false;
        }

        // when no parent nav id is given, the post value is `null` therefore we have the explicit set the value to `0`.
        $parentNavId = $this->parent_nav_id ?: 0;

        /**
         * Group by website_id
         * @since 4.0.0
         */
        $exists = static::find()
            ->leftJoin('cms_nav', 'cms_nav_item.nav_id=cms_nav.id')
            ->leftJoin('cms_nav_container', 'cms_nav.nav_container_id=cms_nav_container.id')
            ->where(['cms_nav_item.alias' => $alias, 'cms_nav_item.lang_id' => $langId, 'cms_nav.parent_nav_id' => $parentNavId])
            ->groupBy('cms_nav_container.website_id')
            ->exists();
        if ($exists) {
            $this->addError('alias', Module::t('nav_item_model_error_urlsegementexistsalready'));
            return false;
        }
    }

    /**
     * Alias Validator.
     */
    public function validateAlias()
    {
        $dirty = $this->getDirtyAttributes(['alias']);
        if (!isset($dirty['alias'])) {
            return true;
        }

        if (!$this->verifyAlias($this->alias, $this->lang_id)) {
            return false;
        }
    }

    /**
     * Before create event.
     */
    public function beforeCreate()
    {
        $this->timestamp_create = time();
        $this->timestamp_update = 0;
        $this->create_user_id = Module::getAuthorUserId();
        $this->update_user_id = Module::getAuthorUserId();
        $this->slugifyAlias();
    }

    /**
     * Before update event.
     */
    public function eventBeforeUpdate()
    {
        $this->timestamp_update = time();
        $this->update_user_id = Module::getAuthorUserId();
        $this->slugifyAlias();
    }

    /**
     * Udpate the current model timestamp and user.
     *
     * This is triggered from outside model as short cut.
     */
    public function updateTimestamp()
    {
        $this->updateAttributes([
            'timestamp_update' => time(),
            'update_user_id' => Module::getAuthorUserId(),
        ]);
    }

    public function fields()
    {
        $fields = parent::fields();
        $fields['is_cacheable'] = function ($model) {
            return (int) $model->is_cacheable;
            // return Angular::typeCast($model->is_cacheable); use for admin@4.0 release
        };
        $fields['is_url_strict_parsing_disabled'] = function ($model) {
            return (int) $model->is_url_strict_parsing_disabled;
            // return Angular::typeCast($model->is_url_strict_parsing_disabled); use for admin@4.0 release
        };
        return $fields;
    }

    /* GenericSearchInterface */

    /**
     * @inheritdoc
     */
    public function genericSearchFields()
    {
        return ['title', 'container'];
    }

    /**
     * @inheritdoc
     */
    public function genericSearchHiddenFields()
    {
        return ['nav_id'];
    }

    /**
     * @inheritdoc
     */
    public function genericSearch($searchQuery)
    {
        $data = [];

        foreach (self::find()->select(['nav_id', 'title'])->orWhere(['like', 'title', $searchQuery])->with('nav')->distinct()->each() as $item) {
            if ($item->nav) {
                $data[] = [
                    'title' => $item->title,
                    'nav_id' => $item->nav_id,
                    'container' => $item->nav->navContainer->name,
                ];
            }
        }

        return $data;
    }

    /**
     * @inheritdoc
     */
    public function genericSearchStateProvider()
    {
        return [
            'state' => 'custom.cmsedit',
            'params' => [
                'navId' => 'nav_id',
            ],
        ];
    }

    /**
     * Lang Active Query.
     *
     * @return NgRestActiveQuery|ActiveQuery
     */
    public function getLang(): \luya\admin\ngrest\base\NgRestActiveQuery|\yii\db\ActiveQuery
    {
        return $this->hasOne(Lang::class, ['id' => 'lang_id']);
    }

    /**
     *
     * Copy content of type cms_nav_item_page to a target nav item. This will create a new entry in cms_nav_item_page and for every used block a new entry in cms_nav_item_page_block_item
     *
     * @param NavItem $targetNavItem nav item object
     * @return bool
     */
    public function copyPageItem(NavItem $targetNavItem)
    {
        if ($this->nav_item_type !== self::TYPE_PAGE) {
            return false;
        }

        $sourcePageItem = NavItemPage::findOne($this->nav_item_type_id);

        if (!$sourcePageItem) {
            return false;
        }
        $pageItem = new NavItemPage();
        $pageItem->attributes = $sourcePageItem->toArray();
        $pageItem->nav_item_id = $targetNavItem->id;

        if (!$pageItem->save()) {
            return false;
        }

        $targetNavItem->nav_item_type_id = $pageItem->id;
        if (!$targetNavItem->save()) {
            return false;
        }

        $batch = NavItemPageBlockItem::find()
            ->where(['nav_item_page_id' => $sourcePageItem->id])
            ->asArray()
            ->batch();

        $idLink = [];
        foreach ($batch as $pageBlocks) {
            foreach ($pageBlocks as $block) {
                $blockItem = new NavItemPageBlockItem();
                $blockItem->attributes = $block;
                $blockItem->nav_item_page_id = $pageItem->id;
                if ($blockItem->save()) {
                    // store the old block id with the new block id
                    $idLink[$block['id']] = $blockItem->id;
                }

                unset($blockItem);
            }
        }
        // check if prev_id is used, check if id is in set - get new id and set new prev_ids in copied items
        $batch = NavItemPageBlockItem::find()
            ->select(['id', 'prev_id'])
            ->where(['nav_item_page_id' => $pageItem->id])
            ->asArray()
            ->batch();

        foreach ($batch as $newPageBlocks) {
            foreach ($newPageBlocks as $block) {
                $prevId = $block['prev_id'];
                if ($block['prev_id'] && isset($idLink[$prevId])) {
                    NavItemPageBlockItem::updateAll(['prev_id' => $idLink[$prevId]], ['id' => $block['id']]);
                }
            }
        }

        return true;
    }

    /**
     *
     * Copy content of type cms_nav_item_module to a target nav item. This will create a new entry in cms_nav_item_module.
     *
     * @param NavItem $targetNavItem
     * @return bool
     */
    public function copyModuleItem(NavItem $targetNavItem)
    {
        if ($this->nav_item_type !== self::TYPE_MODULE) {
            return false;
        }

        $sourceModuleItem = NavItemModule::findOne($this->nav_item_type_id);
        if (!$sourceModuleItem) {
            return false;
        }
        $moduleItem = new NavItemModule();
        $moduleItem->attributes = $sourceModuleItem->toArray();

        if (!$moduleItem->save()) {
            return false;
        }

        $targetNavItem->nav_item_type_id = $moduleItem->id;
        return $targetNavItem->save();
    }

    /**
     *
     * Copy content of type cms_nav_item_redirect to a target nav item. This will create a new entry in cms_nav_item_redirect.
     *
     * @param NavItem $targetNavItem
     * @return bool
     */
    public function copyRedirectItem(NavItem $targetNavItem)
    {
        if ($this->nav_item_type !== self::TYPE_REDIRECT) {
            return false;
        }

        $sourceRedirectItem = NavItemRedirect::findOne($this->nav_item_type_id);
        if (!$sourceRedirectItem) {
            return false;
        }
        $redirectItem = new NavItemRedirect();
        $redirectItem->attributes = $sourceRedirectItem->toArray();

        if (!$redirectItem->save()) {
            return false;
        }

        $targetNavItem->nav_item_type_id = $redirectItem->id;
        return $targetNavItem->save();
    }

    /**
     *
     * Copy nav item type content.
     *
     * @param NavItem $targetNavItem
     * @return bool
     * @throws Exception type not recognized (1,2,3)
     */
    public function copyTypeContent(NavItem $targetNavItem)
    {
        return match ($this->nav_item_type) {
            self::TYPE_PAGE => $this->copyPageItem($targetNavItem),
            self::TYPE_MODULE => $this->copyModuleItem($targetNavItem),
            self::TYPE_REDIRECT => $this->copyRedirectItem($targetNavItem),
            default => throw new Exception("Unable to find nav item type."),
        };
    }

    /**
     * Display all pages where the given module name is integrated.
     *
     * > Due to the module block which can integrate a module as well, we just return all the pages available.
     * > This method should be removed and not used.
     *
     * @param string $moduleName
     * @return \luya\cms\models\NavItem
     */
    public static function fromModule($moduleName)
    {
        return self::find()->all();
    }
}
