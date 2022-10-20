<?php

namespace luya\cms\widgets;

use luya\admin\helpers\I18n;
use luya\admin\ngrest\base\NgRestModel;
use luya\cms\models\NavItem;
use luya\helpers\ArrayHelper;
use luya\helpers\Url;
use luya\web\Composition;
use Yii;
use yii\helpers\Html;

/**
 * CMS Lang Switcher Widget.
 *
 * This widget will find all registered languages and display the corresponding like to the provided languages,
 * if there as no translation found for the current link, it will point to the home page for this language. The
 * language switcher can even detect composition url rules for other languages based on the current menu item.
 *
 * ```php
 * LangSwitcher::widget();
 * ```
 *
 * Generates a list with all items:
 *
 * ```html
 * <ul class="list-element">
 *     <li><li class="lang-element-item lang-element-item--active"><a class="lang-link-item lang-link-item--active" href="/luya/envs/dev/public_html/">English</a></li></li>
 *     <li><li class="lang-element-item"><a class="lang-link-item" href="/luya/envs/dev/public_html/de">Deutsch</a></li></li>
 * </ul>
 * ```
 *
 * You can configure the elements to match your custom css:
 *
 * ```php
 * LangSwitcher::widget([
 *     'listElementOptions' => ['class' => 'langnav__list'],
 *     'elementOptions' => ['class' => 'langnav__item'],
 *     'linkOptions' => ['class' => 'langnav__link'],
 *     'linkLabel' => function($lang) {
 *         return strtoupper($lang['short_code']);
 *     }
 * ]);
 * ```
 *
 * This configure widget would output the following code:
 *
 * ```html
 * <ul class="langnav__list">
 *     <li class="langnav__item lang-element-item--active"><a class="langnav__link lang-link-item--active" href="/public_html/">DE</a></li>
 *     <li class="langnav__item"><a class="langnav__link" href="/public_html/en">EN</a></li>
 * </ul>
 * ```
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class LangSwitcher extends \luya\base\Widget
{
    /**
     * @var null|array Singleton container when used for mobile and desktop in order to reduce db requests.
     */
    private static $_dataArray;

    /**
     * @var array The Wrapping list element (ul tag) Options to pass.
     *  - tag: Default is ul
     *  - separator: The separator for items defaults `\n`.
     *  - class: The class to observe for the elements.
     */
    public $listElementOptions = ['class' => 'list-element'];

    /**
     * @var boolean Decides whether the <ul> tag will be outputted or not
     */
    public $noListTag = false;

    /**
     * @var array Options to pass to the element (li tag):
     *
     * - tag: The used tag (defaults is li tag)
     * - class: The class for the element.
     */
    public $elementOptions = ['class' => 'lang-element-item'];

    /**
     * @var string The class to set when the element item (li tag) is the current language.
     */
    public $elementActiveClass = 'lang-element-item--active';

    /**
     * @var string The class to set when the link item (a tag) is the current language.
     */
    public $linkActiveClass = 'lang-link-item--active';

    /**
     * @var array Options to pass to the link element (a tag).
     */
    public $linkOptions = ['class' => 'lang-link-item'];

    /**
     * @var string Options to pass to the link element (a tag). Can also be a callable in order to specific output.
     *
     * - id:
     * - name: The fullname, e.g. English
     * - short_code: The short code, e.g. en
     */
    public $linkLabel = 'name';

    /**
     * @var callable A callable function in order to sort the $items (the array key of the items contains the lang short code):
     *
     * ```php
     * 'itemsCallback' => function($items) {
     *     ksort($items);
     *     return $items;
     * }
     * ```
     */
    public $itemsCallback;

    /**
     * @var array An array with links which the link tag is already registered.
     * @since 1.0.9
     */
    private static array $registerLinkTags = [];

    /**
     * Generate the item element.
     *
     * @param string $href
     * @param boolean $isActive
     * @param array $lang
     * @return string
     */
    private function generateHtml($href, $isActive, $lang)
    {
        if (!array_key_exists($href, static::$registerLinkTags)) {
            $this->view->registerLinkTag(['rel' => 'alternate', 'hreflang' => $lang['short_code'], 'href' => $href]);
            static::$registerLinkTags[$href] = true;
        }
        $elementOptions = $this->elementOptions;
        $linkOptions = $this->linkOptions;

        if ($isActive) {
            if (isset($linkOptions['class'])) {
                $linkOptions['class'] = $linkOptions['class'] . ' ' . $this->linkActiveClass;
            } else {
                $linkOptions['class'] = $this->linkActiveClass;
            }

            if (isset($elementOptions['class'])) {
                $elementOptions['class'] = $elementOptions['class'] . ' ' . $this->elementActiveClass;
            } else {
                $elementOptions['class'] = $this->elementActiveClass;
            }
        }

        $tag = ArrayHelper::remove($elementOptions, 'tag', 'li');

        $text = is_callable($this->linkLabel) ? call_user_func($this->linkLabel, $lang) : $lang[$this->linkLabel];

        return Html::tag($tag, Html::a($text, $href, $linkOptions), $elementOptions);
    }

    /**
     * Add Singleton Container.
     *
     * @return array
     */
    private static function getDataArray()
    {
        if (self::$_dataArray === null) {
            $currentMenuItem = Yii::$app->menu->current;
            $array = [];
            foreach (Yii::$app->adminLanguage->getLanguages() as $lang) {
                $array[] = [
                    'lang' => $lang,
                    'item' => Yii::$app->menu->find()->where(['nav_id' => $currentMenuItem->navId])->lang($lang['short_code'])->with('hidden')->one(),
                ];
            }

            self::$_dataArray = $array;
        }

        return self::$_dataArray;
    }

    /**
     * Prefix the current link with the dedicated host info.
     *
     * Assuming hostInfoMapping is defined in composition component, the correct domain will be taken from the
     * language information.
     *
     * @param string $link The link to prefix.
     * @param array $lang The language array containing the short code to determine host info.
     * @return string
     * @since 2.0.0
     */
    private function ensureHostInfo($link, array $lang)
    {
        // check if host info mapping is available.
        $domain = Yii::$app->composition->resolveHostInfo($lang['short_code']);
        // no domain is defined for this host info, therfore just prepend the current host:
        if (!$domain) {
            $domain = Yii::$app->urlManager->hostInfo;
        }

        return Url::ensureHttp((string) $domain) . '/' . ltrim($link, '/');
    }

    /**
     * Generate the lang switcher html.
     *
     * @return string
     */
    public function run()
    {
        $currentLang = Yii::$app->composition['langShortCode'];

        $rule = Yii::$app->menu->currentUrlRule;

        $items = [];

        foreach (self::getDataArray() as $langData) {
            $item = $langData['item'];
            $lang = $langData['lang'];
            $isActive = $currentLang == $lang['short_code'];
            if ($item) {
                if ($item->type == NavItem::TYPE_MODULE && !empty($rule)) {
                    $routeParams = [$rule['route']];
                    foreach ($rule['params'] as $key => $value) {
                        $routeParams[$key] = $this->findUrlRuleParamValue($lang['short_code'], $key, $value);
                    }
                    $compositionObject = Yii::createObject(Composition::class);
                    // https://github.com/luyadev/luya-module-cms/issues/48
                    // $compositionObject->off(Composition::EVENT_AFTER_SET);
                    $compositionObject['langShortCode'] = $lang['short_code'];
                    $link = Yii::$app->urlManager->createMenuItemUrl($routeParams, $item->id, $compositionObject);
                } else {
                    $link = $item->link;
                }
            } else {
                $link = Yii::$app->urlManager->prependBaseUrl($lang['short_code']);
            }

            $items[$lang['short_code']] = $this->generateHtml($this->ensureHostInfo($link, $lang), $isActive, $lang);
            unset($item, $lang);
        }

        if (is_callable($this->itemsCallback)) {
            $items = call_user_func($this->itemsCallback, $items);
        }

        $options = $this->listElementOptions;
        $options['encode'] = false;

        $separator = ArrayHelper::remove($options, 'separator', "\n");
        $tag =  ArrayHelper::remove($options, 'tag', "ul");

        if ($this->noListTag) {
            return trim($separator . implode($separator, $items) . $separator);
        }

        return Html::tag($tag, $separator . implode($separator, $items) . $separator, $options);
    }

    /**
     * Find a given url rule param value if defined, otherwise return default.
     *
     * @param string $lang
     * @param string $key
     * @param string $defaultValue
     * @return string
     * @since 2.2.0
     */
    protected function findUrlRuleParamValue($lang, $key, $defaultValue)
    {
        if (isset(self::$_i18nUrlRuleParams[$lang])) {
            return array_key_exists($key, self::$_i18nUrlRuleParams[$lang]) ? self::$_i18nUrlRuleParams[$lang][$key] : $defaultValue;
        }

        return $defaultValue;
    }

    private static array $_i18nUrlRuleParams = [];

    /**
     * Set a url rule paramter which can be taken when resolve pages for other languages.
     *
     * Used to assign a url param value for another language, this is commonly used when working with slugs or titles.
     *
     * Assuming to have a news detail url rule with a slug:
     *
     * ```php
     * 'urlRules' => [
     *     'newsmodule/<id:\d+>/<slug:[a-zA-Z\-]+>' => 'newsmodule/detail/index',
     * ]
     * ```
     *
     * When slug is an i18n value, this information must be provided to the LangSwither, so it will take the correct slug for the the given language.
     *
     * ```php
     * LangSwitcher::setUrlRuleParam('de', 'slug', 'mein-news-slug');
     * LangSwitcher::setUrlRuleParam('en', 'slug', 'my-news-slug');
     * ```
     *
     * @param string $lang The language which the value should be assigned with.
     * @param string $key The url rule param key which should be assigned.
     * @param string $value The value which should be used to generate the url.
     * @since 2.2.0
     */
    public static function setUrlRuleParam($lang, $key, $value)
    {
        self::$_i18nUrlRuleParams[$lang][$key] = $value;
    }

    /**
     * Set the url rule param values from a given Model and attribute name.
     *
     * Its very common to have {{luya\admin\ngrest\base\NgRestModel::$i18n}} attributes defined, therefore use this method
     * to assign attributes:
     *
     * ```php
     * LangSwitcher::setUrlRuleParamByModel($model, 'title');
     * ```
     *
     * If $title is defined as $i18n attribute, it will take the values for corresponding languages and set those through the
     * {{luya\cms\widgets\LangSwitcher::setUrlRuleParam()}} method.
     *
     * @param NgRestModel $model The model which contains the content.
     * @param string $attribute The attribute of the model which should be take in order to assign the multi lingual values.
     * @param string $parmName The parameter value in the url which should be stored, by default its equals the attribute name.
     * @since 2.2.0
     */
    public static function setUrlRuleParamByModel(NgRestModel $model, $attribute, $parmName = null)
    {
        if (method_exists($model, 'getI18nOldValue')) {
            $array = $model->getI18nOldValue($attribute);
        } else {
            // support version before luya admin 3.6.0
            $array = $model->getOldAttribute($attribute);
        }

        $array = I18n::decode($array);

        foreach ($array as $lang => $value) {
            self::setUrlRuleParam($lang, $parmName ?: $attribute, $value);
        }
    }
}
