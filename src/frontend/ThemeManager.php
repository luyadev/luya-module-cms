<?php

namespace luya\cms\frontend;

use luya\cms\models\Theme;

/**
 * Class ThemeManager
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 1.1.0
 */
class ThemeManager extends \luya\theme\ThemeManager
{
    /**
     * Override the core function and load the themes from the database instead to read them from the directory.
     *
     * @return string[]
     */
    protected function getThemeDefinitions(): array
    {
        return Theme::find()->indexBy('id')->column('base_path');
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