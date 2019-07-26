<?php

namespace luya\cms\admin\importers;

use luya\base\PackageConfig;
use luya\base\PackageInstaller;
use luya\theme\ThemeConfig;
use Yii;
use luya\Exception;
use luya\helpers\FileHelper;
use luya\cms\models\Layout;
use luya\console\Importer;
use yii\helpers\Inflector;
use yii\helpers\Json;

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
        $exists = [];
    
        $this->packageInstaller = Yii::$app->getPackageInstaller();
  
        foreach ($this->getImporter()->getDirectoryFiles('themes') as $file) {
            $exists[] = $this->saveTheme($file['module'] . '/themes/' . $file['file']);
        }
  
        foreach ($this->packageInstaller->getConfigs() as $config) {
            /** @var PackageConfig $config*/
            $exists = array_merge($exists, $this->handleThemeDefinitions($config->themes));
        }
        
        return $this->addLog("Theme importer finished with ".count($exists) . " themes.");
    }
    
    /**
     * Replace {{DS}} separator.
     *
     * @param string $path
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
     * @return array
     * @since 1.0.8
     */
    protected function handleThemeDefinitions(array $definitions)
    {
        // A list of directories which should be prefix to the current theme definition,
        // as a theme definition can contain an alias with a full path, we need an empty "prefix"
        // directory, which is represented as `null` value at the end of the array.
        $directories = array_unique([Yii::getAlias('@app'), getcwd(), null]);
        
        $ids = [];
        foreach ($definitions as $themeDefinition) {
            $theme = Yii::getAlias($themeDefinition, false);
            // if there is no alias, or not found, switch back to original name
            if ($theme === false) {
                $theme = $themeDefinition;
            }
            
            $ids = array_merge($ids, $this->handleThemeDefinitionInDirectories($directories, $theme));
        }
        
        return $ids;
    }
    
    /**
     * Handle a theme definition for different folders
     *
     * @param array  $directories
     * @param string $themeDefinition
     *
     * @return array
     * @since 2.0.0
     */
    protected function handleThemeDefinitionInDirectories(array $directories, $themeDefinition)
    {
        $results = [];
        foreach ($directories as $directoryPath) {
            $path = rtrim($directoryPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . ltrim($themeDefinition, DIRECTORY_SEPARATOR);
            
            $path = $this->replaceDsSeparator($path);
            
            if (isset($results[$path])) {
                continue;
            }
            
            $themes = $this->getThemeIdsByPath($path);
            if (!empty($themes)) {
                $results[$path] = $themes;
            }
        }
        
        if (empty($results)) {
            $this->addLog("Unable to find '{$themeDefinition}' in any of those paths '".implode(",", $directories)."'");
        }
        
        $return = [];
        foreach ($results as $path => $ids) {
            $return = array_merge($return, $ids);
        }
        
        return $return;
    }
    
    /**
     * Get an array of ids for a given path.
     *
     * @param string $path
     * @return array An array with theme ids or an empty array if not found.
     * @since 2.0.0
     */
    protected function getThemeIdsByPath($path)
    {
        if (is_dir($path)) {
            $id = $this->saveTheme($path);
            if ($id) {
                return [$id];
            }
        }
        
        return [];
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
        $this->addLog("Loaded theme $basePath");
    
        // @todo save theme config in db?
    
        return $themeConfig->basePath;
    }
}
