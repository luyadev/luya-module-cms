<?php

namespace luya\cms\frontend;

use luya\cms\models\Theme;
use luya\theme\ThemeConfig;

/**
 * CMS theme manager for LUYA.
 *
 * This component manage the themes via database model.
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 3.0.0
 */
class CmsThemeManager extends \luya\theme\ThemeManager
{
    /**
     * Read the json config from the \luya\cms\models\Theme and create a new \luya\theme\ThemeConfig for the given base path.
     *
     * @param string $basePath
     *
     * @return ThemeConfig
     * @throws \yii\base\InvalidConfigException
     */
    protected static function loadThemeConfig(string $basePath): ThemeConfig
    {
        /** @var Theme $themeModel */
        $themeModel = Theme::find()->andWhere(['base_path' => $basePath])->one();
        $config = $themeModel->getJsonConfig();
        
        $themeConfig = new ThemeConfig($basePath, $config);

        return $themeConfig;
    }
    
    /**
     * Override the core function and load the themes from the database instead to read them from the directory.
     *
     * @return string[]
     */
    protected function getThemeDefinitions(): array
    {
        return Theme::find()->indexBy('id')->select('base_path')->column();
    }
    
    protected function getActiveThemeBasePath()
    {
        $activeTheme = Theme::findOne(['is_active' => 1]);
        if ($activeTheme) {
            return $activeTheme->base_path;
        }
        
        return parent::getActiveThemeBasePath();
    }
    
}