<?php

namespace luya\cms;

use Yii;
use yii\base\BaseObject;
use yii\base\InvalidConfigException;
use luya\helpers\ArrayHelper;
use luya\web\WebsiteLink;
use luya\web\EmailLink;
use luya\web\TelephoneLink;

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
    const TYPE_INTERNAL_PAGE = 1;
    
    const TYPE_EXTERNAL_URL = 2;
    
    const TYPE_LINK_TO_FILE = 3;
    
    const TYPE_LINK_TO_EMAIL = 4;
    
    const TYPE_LINK_TO_TELEPHONE = 5;

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
     * Generate a link converter object from an array.
     *
     * If type is empty, false is returned. This allows us to have predefined values from
     * value and target and do not throw an exception.
     *
     * @param array $configuration
     * @return \luya\cms\LinkConverter|false
     */
    public static function fromArray(array $configuration)
    {
        $type = ArrayHelper::getValue($configuration, 'type');
        $value = ArrayHelper::getValue($configuration, 'value');
        $target = ArrayHelper::getValue($configuration, 'target');
        
        if (empty($type)) {
            return false;
        }
        
        return (new self(['type' => $type, 'value' => $value, 'target' => $target]));
    }
    
    /**
     * Get the {{luya\web\LinkInterface}} from the given configuration trough type.
     *
     * @return \luya\web\LinkInterface|boolean
     */
    public function getLink()
    {
        switch ($this->type) {
            
            // internal page
            case self::TYPE_INTERNAL_PAGE:
                return $this->getPageLink($this->value, $this->target);
                break;
                
            // external url
            case self::TYPE_EXTERNAL_URL:
                return $this->getWebsiteLink($this->value, $this->target);
                break;
                
            // file from storage
            case self::TYPE_LINK_TO_FILE:
                return $this->getFileLink($this->value, $this->target);
                break;
                
            // mailto link
            case self::TYPE_LINK_TO_EMAIL:
                return $this->getEmailLink($this->value);
                break;

            // tel link
            case self::TYPE_LINK_TO_TELEPHONE:
                return $this->getTelephoneLink($this->value);
                break;
        }
        
        return false;
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
        return new WebsiteLink(['href' => $href, 'target' => $target]);
    }
    
    /**
     * Get a File Link Object.
     *
     * @param integer $fileId
     * @param string $target
     * @return \luya\admin\file\Item|boolean
     */
    public function getFileLink($fileId, $target)
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
     * @return \luya\cms\menu\Item|boolean
     */
    public function getPageLink($navId, $target, $lang = null)
    {
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
