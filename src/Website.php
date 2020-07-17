<?php

namespace luya\cms;

use luya\helpers\StringHelper;
use luya\traits\CacheableTrait;
use yii\base\Component;
use \luya\cms\models\Website as WebsiteModel;

/**
 * Class Website
 *
 * @property array|boolean $current
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 4.0.0
 */
class Website extends Component
{
    use CacheableTrait;
    
    private $_current = null;
    
    public function getCurrent()
    {
        if ($this->_current === null) {
            $this->_current = $this->findOneByHostName(\Yii::$app->request->hostName);
        }
        
        return $this->_current;
    }
    
    /**
     * Get website information by hostname.
     *
     * @param string $hostName
     * @return array|boolean If the website exists an array with informations as returned, otherwise false.
     */
    public function findOneByHostName($hostName)
    {
        $cache = $this->getHasCache($hostName);
        if ($cache) {
            return $cache;
        }
        $defaultWebsite = false;
    
        $websites = $this->loadAllWebsiteData();
        if (isset($websites[$hostName])) {
            $this->setHasCache($hostName, $websites[$hostName]);
            return $websites[$hostName];
        }
        
        foreach ($websites as $website) {
            foreach (explode(',', $website['aliases']) as $alias) {
                if (StringHelper::matchWildcard(trim($alias), $hostName)) {
                    $this->setHasCache($hostName, $website);
                    return $website;
                }
            }
            
            if ($website['is_default']) {
                $defaultWebsite = $website;
            }
        }
        
        $this->setHasCache($hostName, $defaultWebsite);
        return $defaultWebsite;
    }
    
    private $_allWebsiteData = null;
    
    /**
     * @return array
     */
    private function loadAllWebsiteData()
    {
        if ($this->_allWebsiteData === null) {
            $this->_allWebsiteData = WebsiteModel::find(['is_active' => true, 'is_delete' => false])->cache()->indexBy('host')->asArray()->all();
        }
        return $this->_allWebsiteData;
    }
}