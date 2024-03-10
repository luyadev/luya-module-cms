<?php

namespace luya\cms\base;

use luya\web\View;
use Yii;

/**
 * View context helper of php block view file.
 *
 * @property PhpBlock $context Get the block context.
 * @property PhpBlock $block The block context.
 * @property integer $index Get the current index number/position of the block within this placeholder.
 * @property boolean $isFirst Whether this is the first block element inside this placeholder or not.
 * @property boolean $isLast Whether this is the last block element inside this placeholder or not.
 * @property integer $itemsCount Returns the number of items inside this placeholder.
 * @property boolean $isNextEqual Whether the next element (the element after the current element) is the same or not.
 * @property boolean $isPrevEqual Whether the previous element (the element before the current element) is the same or not.
 * @property integer $equalIndex Get the current index number/position of this element within the list of *same* elements.
 * @property integer $id Returns the Unique ID for this block (absolute unique value).
 * @property integer $blockId Returns the block type ID from database, assume two text blocks would have the same ID.
 * @property \luya\cms\models\NavItemPage $pageObject Returns the `NavItemPage` object where the block is located.
 * @property View $appView The application view object in order to register data to the layout view.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class PhpBlockView extends View
{
    /**
     * @var boolean Is disabled by default as its already registered by global view and layout files are not used in block views.
     * @see https://github.com/luyadev/luya/issues/1807
     */
    public $autoRegisterCsrf = false;

    public function init()
    {
        parent::init();

        $this->on(self::EVENT_AFTER_RENDER, function () {
            self::registerToAppView($this->getBlockAssets(), $this->getAssetBundleNames());
        });
    }

    /**
     * Get the block object which is
     *
     * @return PhpBlock
     * @since 2.2.0
     */
    public function getBlock()
    {
        return $this->context;
    }

    /**
     * Get the current index number of the block inside the current placeholder.
     *
     * @return integer
     */
    public function getIndex()
    {
        return $this->context->getEnvOption('index');
    }

    /**
     * Whether this is the first block element inside this placeholder or not.
     *
     * @return boolean
     */
    public function getIsFirst()
    {
        return $this->context->getEnvOption('isFirst');
    }

    /**
     * Whether this is the last block element inside this placeholder or not.
     *
     * @return boolean
     */
    public function getIsLast()
    {
        return $this->context->getEnvOption('isLast');
    }

    /**
     * Returns the number of items inside this placeholder.
     *
     * @return integer
     */
    public function getItemsCount()
    {
        return $this->context->getEnvOption('itemsCount');
    }

    /**
     * Whether the next element (the element after the current element) is the same or not.
     *
     * If there is no next element, false will be returned.
     *
     * @return boolean
     */
    public function getIsNextEqual()
    {
        return $this->context->getEnvOption('isNextEqual');
    }

    /**
     * Whether the previous element (the element before the current element) is the same or not.
     *
     * If there is no previous element, false will be returned.
     *
     * @return boolean
     */
    public function getIsPrevEqual()
    {
        return $this->context->getEnvOption('isPrevEqual');
    }

    /**
     * Get the index number within the equal elements.
     *
     * If the list of elements are the same after each other, the equal index counter +1.
     *
     * @return integer
     */
    public function getEqualIndex()
    {
        return $this->context->getEnvOption('equalIndex');
    }

    /**
     * Returns the Unique ID for this block.
     *
     * This value is absolute unique.
     *
     * @return integer The unique identifier for this block from the database.
     * @since 1.0.2
     */
    public function getId()
    {
        return $this->context->getEnvOption('id');
    }

    /**
     * Returns the ID for the block type in the database.
     *
     * This means when having two text blocks they would have the same Id.
     *
     * @return mixed Returns the Id for the block type in the database. So the same type of block (like text) would return the same Id.
     * @since 1.0.2
     */
    public function getBlockId()
    {
        return $this->context->getEnvOption('blockId');
    }

    /**
     * Returns the context {{luya\cms\models\NavItemPage}} object.
     *
     * Returns the context page object where the block is implemented.
     *
     * @return \luya\cms\models\NavItemPage
     * @since 1.0.2
     */
    public function getPageObject()
    {
        return $this->context->getEnvOption('pageObject');
    }

    /**
     * Get a block environment value.
     *
     * + **id**: Returns the unique identifier for this block, each blocks has its id from the database, this is absolute unique. {{luya\cms\models\NavItemPageBlockItem}} -> id
     * + **blockId**: Returns the id of the block in the database. Two blocks of the same type would have the same blockId. {{luya\cms\models\Block}} -> id
     * + **context**: Returns `frontend` or `admin` to find out in which context you are.
     * + **pageObject**: Returns the {{luya\cms\models\NavItemPage}} object where the block is located. Thereof you can also retrieve the related {{luya\cms\models\NavItem}} and {{luya\cms\models\Nav}} objects via `getNavItem()` and `getNav()`.
     * + **isFirst**: Returns whether this block is the first in its placeholder or not.
     * + **isLast**: Returns whether this block is the last in its placeholder or not.
     * + **index**: Returns the index number/position within this placeholder.
     * + **itemsCount**: Returns the number of items inside this placeholder.
     * + **isPrevEqual**: Returns whether the previous item is of the same origin (block type, like text block) as the current.
     * + **isNextEqual**: Returns whether the next item is of the same origin (block type, like text block) as the current.
     * + **equalIndex**: Returns the current index number/position of this element within the list of *same* elements.
     *
     * @param string $key The key identifier of the context variable.
     * @param mixed $defaultvalue If the env value is not found this value will be returned.
     * @return mixed
     */
    public function env($key, mixed $defaultvalue = null)
    {
        return $this->context->getEnvOption($key, $defaultvalue);
    }

    /**
     * Get the content of a placeholder.
     *
     * @param string $placeholder The name of the placeholder to return, defined as `varName` inside the `config()` method of the placeholders section.
     * @return string
     */
    public function placeholderValue($placeholder)
    {
        return $this->context->getPlaceholderValue($placeholder);
    }

    /**
     * Wrap a very basic template arounte the value if value is not `empty()`.
     *
     * Assuming to have variable `title` with the value `Hello World` and a template `<p>{{title}}</p>` renders:
     *
     * ```
     * <p>Hello World</p>
     * ```
     *
     * If a template is provided and $value is not empty return the wrapped template, otherwise the original $value input is returned.
     *
     * @param string $key The variable name to idenfier as {{key}}.
     * @param mixed $value The value which should be replaced for the $key.
     * @param string $template The template as a string which replates the $key enclosed in {{
     * @return string If a template is provided and $value is not empty return the wrapped template, otherwise the original $value input.
     */
    public function wrapTemplate($key, mixed $value, $template)
    {
        if (!$template || empty($value)) {
            return $value;
        }

        return str_replace(['{{' . $key . '}}'], $value, $template);
    }

    /**
     * The the content value of a var.
     *
     * @param string $key The name of the var value to return, defined as `varName` inside the `config()` method of the vars section.
     * @param string $defaultValue Env value is not found this value will be returned.
     * @param string $template Provde a template which replaces the current variable if value is not `empty()`. e.g. `<p>{{variable}}≤/p>` See {{luya\cms\base\PhpBlockView::wrapTemplate}}.
     * @return mixed
     */
    public function varValue($key, $defaultValue = null, $template = false)
    {
        return $this->wrapTemplate($key, $this->context->getVarValue($key, $defaultValue), $template);
    }

    /**
     * Get the content of a cfg.
     *
     * @param string $key The name of the cfg value to return, defined as `varName` inside the `config()` method of the cfgs section.
     * @param string $defaultValue Env value is not found this value will be returned.
     * @param string $template Provde a template which replaces the current variable if value is not `empty()`. e.g. `<p>{{variable}}≤/p>` See {{luya\cms\base\PhpBlockView::wrapTemplate}}.
     * @return mixed
     */
    public function cfgValue($key, $defaultValue = null, $template = false)
    {
        return $this->wrapTemplate($key, $this->context->getCfgValue($key, $defaultValue), $template);
    }

    /**
     * Get the value of an extra var.
     *
     * @param string $key The name of the extra var to return, defined as key inside the `extraVars()` method return array.
     * @param string $defaultValue Env value is not found this value will be returned.
     * @param string $template Provde a template which replaces the current variable if value is not `empty()`. e.g. `<p>{{variable}}≤/p>` See {{luya\cms\base\PhpBlockView::wrapTemplate}}.
     * @return mixed
     */
    public function extraValue($key, $defaultValue = null, $template = false)
    {
        return $this->wrapTemplate($key, $this->context->getExtraValue($key, $defaultValue), $template);
    }

    /**
     * Get an array with extracted informations to register in the view
     * @return array
     * @since 1.0.5
     */
    public function getBlockAssets()
    {
        return [
            'metaTags' => $this->metaTags,
            'linkTags' => $this->linkTags,
            'cssFiles' => $this->cssFiles,
            'css' => $this->css,
            'jsFiles' => $this->jsFiles,
            'js' => $this->js,
        ];
    }

    /**
     * Get an array of alles asset bundle names.
     *
     * @return array
     */
    public function getAssetBundleNames()
    {
        return array_keys($this->assetBundles);
    }

    /**
     *Register assets to the given app view
     *
     * @throws \yii\base\InvalidConfigException
     * @since 1.0.5
     */
    public static function registerToAppView(array $blockAssets, array $assetBundles)
    {
        $appView = Yii::$app->view;

        foreach ($blockAssets as $attribute => $blockAsset) {
            if (!empty($blockAsset)) {
                if ($attribute == 'js' || $attribute == 'jsFiles') {
                    /**
                     * js and jsFiles must keep the array keys as position and have subarray
                     * @see \yii\web\View::POS_HEAD
                     */
                    $appAssets = &$appView->{$attribute};

                    foreach ($blockAsset as $key => $value) {
                        if (isset($appAssets[$key])) {
                            $appAssets[$key] = array_merge($appAssets[$key], $value);
                        } else {
                            $appAssets[$key] = $value;
                        }
                    }
                } else {
                    $appView->{$attribute} = array_merge($appView->{$attribute}, $blockAsset);
                }
            }
        }

        foreach ($assetBundles as $bundle) {
            $appView->registerAssetBundle($bundle);
        }
    }
}
