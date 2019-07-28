<?php

namespace luya\cms\frontend;

use luya\cms\models\Theme;

class ThemeManager extends \luya\theme\ThemeManager
{
    protected function getThemeDefinitions(): array
    {
        return Theme::find()->indexBy('id')->column('base_path');
    }
    
}