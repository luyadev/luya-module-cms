<?php

namespace luya\cms;

use luya\cms\models\Nav;
use luya\helpers\ArrayHelper;
use luya\web\EmailLink;
use luya\web\TelephoneLink;
use luya\web\WebsiteLink;
use Yii;
use yii\base\BaseObject;

/**
 * Convert a given config into a {{luya\web\LinkInterface}} Object.
 *
 * From a array with config:
 *
 * ```php
 * $converter = LinkConverter::fromArray($config);
 * return $converter->getLink();
 * ```
 *
 * or from object context
 *
 * ```php
 * $converter = new LinkConverter();
 *
 * // set value and type from current object context.
 * $converter->value = $this->value;
 * $converter->type = $this->type;
 *
 * return $converter->getLink();
 * ```
 *
 * In very rare case you may want to provide some extra informations to the
 * the different link types, like for intern pages a language container, then
 * you can also use the converter like this.
 *
 * ```php
 * $converter = new LinkConverter([
 *     'type' => $this->redirectMapData('type'),
 *     'value' => $this->redirectMapData('value'),
 * ]);
 *
 * switch ($converter->type) {
 *     case $converter::TYPE_EXTERNAL_URL:
 *         return $converter->getWebsiteLink($converter->value, $converter->target)->getHref();
 *         break;
 *     case $converter::TYPE_INTERNAL_PAGE:
 *         return $converter->getPageLink($converter->value, $converter->target, $this->lang)->getHref();
 *         break;
 *     case $converter::TYPE_LINK_TO_EMAIL:
 *         return $converter->getEmailLink($converter->value)->getHref();
 *         break;
 *     case $converter::TYPE_LINK_TO_FILE:
 *         return $converter->getFileLink($converter->value, $converter->target)->getHref();
 *         break;
 * }
 * ```
 *
 * But keep in mind, with this solution you have to adjust new TYPES by yourself.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.5
 */
class LinkConverter extends BaseObject
{
    public const TYPE_INTERNAL_PAGE = 1;

    public const TYPE_EXTERNAL_URL = 2;

    public const TYPE_LINK_TO_FILE = 3;

    public const TYPE_LINK_TO_EMAIL = 4;

    public const TYPE_LINK_TO_TELEPHONE = 5;

    /**
     * @var integer A numeric representation of the type of link.
     */
    public $type;

    /**
     * @var mixed The value which will be associated to the type.
     */
    public $value;

    /**
     * @var string Whether its _blank or _self.
     */
    public $target;

    /**
     * @var string Optional anchor definition for internal page links
     */
    public $anchor;

    /**
     * Generate a link converter object from an array.
     *
     * If type is empty, false is returned. This allows us to have predefined values from
     * value and target and do not throw an exception.
     *
     * @param array $configuration
     */
    public static function fromArray(array $configuration): \luya\cms\LinkConverter|false
    {
        $type = ArrayHelper::getValue($configuration, 'type');
        $value = ArrayHelper::getValue($configuration, 'value');
        $target = ArrayHelper::getValue($configuration, 'target');
        $anchor = ArrayHelper::getValue($configuration, 'anchor');

        if (empty($type)) {
            return false;
        }

        return (new self(['type' => $type, 'value' => (string) $value, 'target' => $target, 'anchor' => $anchor]));
    }

    /**
     * Get the {{luya\web\LinkInterface}} from the given configuration trough type.
     */
    public function getLink(): \luya\web\LinkInterface|bool
    {
        return match ($this->type) {
            self::TYPE_INTERNAL_PAGE => $this->getPageLink($this->value, $this->target, null, $this->anchor),
            self::TYPE_EXTERNAL_URL => $this->getWebsiteLink($this->value, $this->target),
            self::TYPE_LINK_TO_FILE => $this->getFileLink($this->value, $this->target),
            self::TYPE_LINK_TO_EMAIL => $this->getEmailLink($this->value),
            self::TYPE_LINK_TO_TELEPHONE => $this->getTelephoneLink($this->value),
            default => false,
        };
    }

    /**
     * Get a Website Link Object.
     *
     * @param string $href
     * @param string $target
     * @return \luya\web\WebsiteLink
     */
    public function getWebsiteLink($href, $target)
    {
        return new WebsiteLink(['href' => (string) $href, 'target' => $target]);
    }

    /**
     * Get a File Link Object.
     *
     * @param integer $fileId
     * @param string $target
     */
    public function getFileLink($fileId, $target): \luya\admin\file\Item|bool
    {
        $file = Yii::$app->storage->getFile($fileId);
        if ($file) {
            $file->setTarget($target);
        }
        return $file;
    }

    /**
     * Get CMS Page Link Object.
     *
     * @param integer $navId
     * @param string $target
     * @param string $lang
     * @param string $anchor Optional anchor element
     */
    public function getPageLink($navId, $target, $lang = null, $anchor = null): \luya\cms\menu\Item|bool
    {
        // in a headless context, the menu component might not exists, therefore just return all
        // available informations.
        if (!Yii::$app->get('menu', false)) {
            return Nav::find()
                ->where(['cms_nav.id' => $navId])
                ->joinWith(['navItems'])
                ->asArray()
                ->one();
        }

        $linkQuery = Yii::$app->menu->find();
        $linkQuery->where(['nav_id' => $navId]);
        $linkQuery->with(['hidden']);
        if ($lang) {
            $linkQuery->lang($lang);
        }
        $link = $linkQuery->one();

        // if a page is found, set the target value from the config.
        if ($link) {
            $link->setTarget($target);
        }

        if ($anchor) {
            $link->setAnchor($anchor);
        }

        return $link;
    }

    /**
     * Get an Email Link Object.
     *
     * @param string $email
     * @return \luya\web\EmailLink
     */
    public function getEmailLink($email)
    {
        return new EmailLink(['email' => $email]);
    }

    /**
     * Get a Telefphone Link Object.
     *
     * @param string $telephone
     * @return \luya\web\TelephoneLink
     */
    public function getTelephoneLink($telephone)
    {
        return new TelephoneLink(['telephone' => $telephone]);
    }
}
