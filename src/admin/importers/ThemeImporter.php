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
 */
class ThemeImporter extends Importer
{
    private $packageInstaller;
    
    /**
     * @inheritdoc
     */
    public function run()
    {
        $this->packageInstaller = Yii::$app->getPackageInstaller();
    
        $exists = [];
        foreach ($this->getImporter()->getDirectoryFiles('themes') as $file) {
            $exists[] = $this->saveTheme('@'.$file['module'] . '/themes/' . $file['file']);
        }
        
        foreach ($this->packageInstaller->getConfigs() as $config) {
            /** @var PackageConfig $config */
            $exists = array_merge($exists, $this->handleThemeDefinitions($config->themes));
        }
    
        foreach (Theme::find()->all() as $theme) {
            if (!in_array($theme->id, $exists) && $theme->delete()) {
                $this->addLog("[!] The theme {$theme->base_path} does not found anymore and was deleted.");
            }
        }
        
        return $this->addLog("Theme importer finished with " . count($exists) . " themes.");
    }
    
    /**
     * Replace {{DS}} separator.
     *
     * @param string $path
     *
     * @return string
     */
    public function replaceDsSeparator($path)
    {
        return str_replace('{{DS}}', DIRECTORY_SEPARATOR, $path);
    }
    
    /**
     * Handle an array with definitions whether they are files or folders.
     *
     * @param array $definitions
     *
     * @return array
     * @since 1.0.8
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
     * @since 2.0.0
     */
    protected function handleThemeDefinitionInDirectories($themeDefinition)
    {
        $results = [];
    
        $themeId = $this->saveThemeByPath($themeDefinition);
        if ($themeId) {
            $results[$themeDefinition] = $themeId;
        } else {
            $this->addLog("Unable to find '{$themeDefinition}'");
        }
        
        return $results;
    }
    
    protected function saveThemesFromFolder($themeDefinition)
    {
        $ids = [];
        
        $folder = Yii::getAlias($themeDefinition);
        if (is_dir($folder)) {
            foreach (FileHelper::findDirectories($folder) as $themePath) {
                $ids[] = $this->saveThemeByPath($themeDefinition . DIRECTORY_SEPARATOR . basename($themePath));
            }
        }
        
        return $ids;
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
     *
     * @return mixed
     * @throws \yii\base\InvalidConfigException
     */
    protected function saveTheme($basePath)
    {
        $themeConfig = new ThemeConfig($basePath);
        
        $themeModel = Theme::findOne(['base_path' => $basePath]);

        if (!$themeModel) {
            $themeModel = new Theme();
            $themeModel->base_path = $basePath;
            $themeModel->json_config = Json::encode($themeConfig->toArray());
            
           $log = "Added theme $basePath to database.";
        } else {
            $log = "Update theme $basePath.";
        }
    
        if ($themeModel->save()) {
            $this->addLog($log);
        }
    
        return $themeModel->id;
    }
}
