<?php

namespace luya\cms\admin\importers;

use luya\base\PackageConfig;
use luya\cms\models\Theme;
use luya\console\Importer;
use luya\helpers\FileHelper;
use luya\helpers\Json;
use luya\theme\ThemeConfig;
use Yii;

/**
 * Class ThemeImporter
 * Import theme.json files from the folder and analyse config.
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 3.0.0
 */
class ThemeImporter extends Importer
{
    private $_themeManager;
    
    /**
     * @inheritdoc
     */
    public function run($thowException = false)
    {
        $exists = [];

        foreach ($this->getThemeManager()->getThemes($thowException) as $theme) {
            /** @var \luya\theme\Theme $theme */
            $exists = array_merge($exists, $this->handleThemeDefinitionInDirectories($theme->basePath));
        }

        foreach (Theme::find()->all() as $theme) {
            if (!in_array($theme->id, $exists) && $theme->delete()) {
                $this->addLog("[!] The theme {$theme->base_path} does not found anymore and was deleted.");
            }
        }

        return $this->addLog("Theme importer finished with " . count($exists) . " themes.");
    }

    /**
     * Handle an array with definitions whether they are files or folders.
     *
     * @param array $definitions
     *
     * @return array
     */
    protected function handleThemeDefinitions(array $definitions)
    {
        $ids = [];
        foreach ($definitions as $themeDefinition) {
            $ids = array_merge($ids, $this->handleThemeDefinitionInDirectories($themeDefinition));
        }

        return $ids;
    }

    /**
     * Handle a theme definition for different folders
     *
     * @param string $themeDefinition
     *
     * @return array
     */
    protected function handleThemeDefinitionInDirectories($themeDefinition)
    {
        $results = [];

        $themeDefinition = preg_replace('#^vendor/#', '@vendor/', $themeDefinition);

        $themeId = $this->saveThemeByPath($themeDefinition);
        if ($themeId) {
            $results[$themeDefinition] = $themeId;
        } else {
            $this->addLog("Unable to find '{$themeDefinition}'");
        }

        return $results;
    }

    protected function saveThemeByPath($themeDefinition)
    {
        $path = Yii::getAlias($themeDefinition);
        if (is_dir($path)) {
            return $this->saveTheme($themeDefinition);
        }

        return null;
    }

    /**
     * Save a theme by its base path.
     * Example path: @app/themes/blank
     *
     * @param $basePath
     * @return mixed|bool False if could not exists.
     * @throws \yii\base\InvalidConfigException
     */
    protected function saveTheme($basePath)
    {
        $themeFile = Yii::getAlias($basePath . '/theme.json');
        if (!file_exists($themeFile)) {
            return false;
        }

        $config = Json::decode(file_get_contents($themeFile)) ?: [];

        $themeConfig = new ThemeConfig($basePath, $config);

        $themeModel = Theme::findOne(['base_path' => $basePath]);

        if (!$themeModel) {
            $themeModel = new Theme();
            $themeModel->base_path = $basePath;
            $themeModel->setThemeConfig($themeConfig);
            
            $log = "Added theme $basePath to database.";
        } else {
            $themeModel->setThemeConfig($themeConfig);
            $log = "Updated theme $basePath.";
        }

        if ($themeModel->save()) {
            $this->addLog($log);
        }

        return $themeModel->id;
    }
    
    /**
     * @return \luya\theme\ThemeManager|mixed
     */
    public function getThemeManager()
    {
        if ($this->_themeManager == null) {
            $this->_themeManager = Yii::$app->themeManager;
        }
        
        return $this->_themeManager;
    }
    
    public function setThemeManager($themeManager)
    {
        $this->_themeManager = $themeManager;
    }
}
