<?php

namespace luya\cms\admin\importers;

use luya\cms\models\Theme;
use luya\console\Importer;
use luya\helpers\Json;
use luya\theme\ThemeConfig;
use luya\theme\ThemeManager;
use Yii;
use yii\base\InvalidConfigException;

/**
 * Class ThemeImporter
 * Import theme.json files from the folder and analyse config.
 *
 * @property ThemeManager $themeManager
 *
 * @author Bennet Klarhoelter <boehsermoe@me.com>
 * @since 3.0.0
 */
class ThemeImporter extends Importer
{
    /**
     * @var ThemeManager
     */
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
     * Handle a theme definition for different folders
     *
     * @param string $themeDefinition
     * @return array
     */
    protected function handleThemeDefinitionInDirectories($themeDefinition)
    {
        $results = [];

        $themeDefinition = preg_replace('#^vendor/#', '@vendor/', $themeDefinition);

        $themeId = $this->saveTheme($themeDefinition);
        if ($themeId) {
            $results[$themeDefinition] = $themeId;
        }

        return $results;
    }

    /**
     * Save a theme by its base path.
     * Example path: @app/themes/blank
     *
     * @param $basePath
     * @return mixed|bool False if could not exists.
     * @throws InvalidConfigException
     */
    protected function saveTheme($basePath)
    {
        $themeFile = Yii::getAlias($basePath . '/theme.json');
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
     * @return ThemeManager
     */
    public function getThemeManager()
    {
        if ($this->_themeManager == null) {
            $this->_themeManager = Yii::$app->themeManager;
        }

        return $this->_themeManager;
    }

    /**
     * @param ThemeManager $themeManager
     */
    public function setThemeManager($themeManager)
    {
        $this->_themeManager = $themeManager;
    }
}
