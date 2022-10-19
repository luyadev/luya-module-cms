<?php

namespace luya\cms\models;

use luya\base\ModuleReflection;
use luya\cms\admin\Module;
use luya\cms\base\NavItemType;
use luya\cms\base\NavItemTypeInterface;
use luya\cms\Exception;
use luya\helpers\Json;
use Yii;

/**
 * Represents the type MODULE for a NavItem.
 *
 * @property int $id
 * @property string $module_name
 * @property string $controller_name
 * @property string $action_name
 * @property string $action_params
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavItemModule extends NavItemType implements NavItemTypeInterface
{
    /**
     * @inheritdoc
     */
    public static function getNummericType()
    {
        return NavItem::TYPE_MODULE;
    }

    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_item_module';
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['module_name'], 'required'],
            [['action_params'], 'string'],
            [['module_name', 'controller_name', 'action_name'], 'string', 'max' => 255],
        ];
    }

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();

        $this->on(self::EVENT_AFTER_FIND, function () {
            $this->action_params = $this->getDecodedActionParams();
        });

        $this->on(self::EVENT_BEFORE_VALIDATE, function () {
            $this->action_params = $this->getEncodedActionParams();
        });
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'module_name' => Module::t('model_navitemmodule_module_name_label'),
            'controller_name' => 'Controller Name',
            'action_name' => 'Action Name',
            'action_params' => 'Action Params',
        ];
    }

    /**
     * Return the action params as php array instead of json object
     *
     * @return array
     * @since 2.0.0
     */
    public function getDecodedActionParams()
    {
        if (empty($this->action_params)) {
            return [];
        }

        if (is_array($this->action_params)) {
            return $this->action_params;
        }

        return Json::decode($this->action_params);
    }

    /**
     * Get the encoded value from actions params, this is used to store to store the json params.
     *
     * @return string
     * @since 2.0.0
     */
    public function getEncodedActionParams()
    {
        return is_scalar($this->action_params) ? $this->action_params : Json::encode($this->action_params, JSON_FORCE_OBJECT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private $_content;

    /**
     * @inheritdoc
     */
    public function getContent()
    {
        if ($this->_content == null) {
            $module = $this->getModule();

            /** @var \luya\base\ModuleReflection $reflection */
            $reflection = Yii::createObject(['class' => ModuleReflection::class, 'module' => $module]);
            $reflection->suffix = $this->getOption('restString');

            // if a controller s defined change default route
            if ($this->controller_name) {
                $reflection->defaultRoute($this->controller_name, $this->action_name, $this->getDecodedActionParams());
            }

            $this->_content = $reflection->run();

            $this->controller = $reflection->controller;

            Yii::$app->menu->setCurrentUrlRule($reflection->getUrlRule());
        }

        return $this->_content;
    }

    private $_module;

    /**
     * Get the module object from config
     *
     * @return \luya\base\Module
     */
    private function getModule()
    {
        if ($this->_module !== null) {
            return $this->_module;
        }

        $module = $this->module_name;

        if (!Yii::$app->hasModule($module)) {
            throw new Exception("The module '$module' does not exist in your modules configuration list.");
        }

        $this->_module = Yii::$app->getModule($module);
        $this->_module->context = 'cms';

        return $this->_module;
    }
}
