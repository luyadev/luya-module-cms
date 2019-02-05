<?php

namespace luya\cms\admin\importers;

use Yii;
use luya\Exception;
use luya\helpers\FileHelper;
use luya\cms\models\Layout;
use luya\console\Importer;
use yii\helpers\Inflector;
use yii\helpers\Json;

/**
 * CMS Layouts Importer.
 *
 * Import cmslayout files from the folder and analyise placeholders.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class CmslayoutImporter extends Importer
{
    /**
     * @var array A list of prefix keys which will be skipped.
     */
    public $ignorePrefix = ['_', '.'];
    
    public $defaultPath = '@app/views/cmslayouts';

    /**
     * @inheritdoc
     */
    public function run()
    {
        $layoutFiles = [];
        
        // get and import cmslayouts from @app/views/cmslayouts path
        $this->handleLayoutFile($layoutFiles, $this->defaultPath);
        
        // import files from the cmsadmin module $cmsLayouts property.
        foreach ((array) $this->module->cmsLayouts as $layoutDefintion) {
            $this->handleLayoutFile($layoutFiles, $layoutDefintion);
        }
        
        // remove all view files not found somewhere ...
        foreach (Layout::find()->where(['not in', 'id', $layoutFiles])->all() as $layoutItem) {
            $layoutItem->delete();
        }
        
        return $this->addLog("cms layout importer finished with ".count($layoutFiles) . " layout files.");
    }
    
    /**
     * Assigne saved files into the layoutFiles array defintion.
     *
     * @param array $layoutFiles
     * @param string $path
     */
    protected function handleLayoutFile(&$layoutFiles, $path)
    {
        $aliased = Yii::getAlias($path, false);
        $filePath = $aliased ? $aliased : $path;
        
        if (is_dir($filePath)) {
            foreach ($this->getFilesFromFolder($filePath) as $file) {
                $handler = $this->importLayoutFile($file, $path);
                if ($handler) {
                    $layoutFiles[] = $handler;
                }
            }
        } else {
            $handler = $this->importLayoutFile($filePath, $path);
            if ($handler) {
                $layoutFiles[] = $handler;
            }
        }
    }

    /**
     * Get files from a given folder.
     *
     * @param string $folderPath
     * @return array
     */
    protected function getFilesFromFolder($folderPath)
    {
        return FileHelper::findFiles($folderPath, [
            'recursive' => false,
            'caseSensitive' => false,
            'only' => ['*.php'],
            'filter' => function ($path) {
                return in_array(substr(basename($path), 0, 1), $this->ignorePrefix) ? false : null;
            }]);
    }
    
    /**
     * Importer the given layout file from a path.
     * @param string $file The path to the layout file.
     * @throws Exception
     * @return string
     */
    protected function importLayoutFile($file, $aliased)
    {
        if (!file_exists($file)) {
            return false;
        }
        
        $fileinfo = FileHelper::getFileInfo($file);
        $baseName = $fileinfo->name . '.' . $fileinfo->extension;
        $fileBaseName = $aliased . DIRECTORY_SEPARATOR . $baseName;
        
        $json = false;
        
        if (file_exists($fileinfo->sourceFilename. '.json')) {
            $json = FileHelper::getFileContent($fileinfo->sourceFilename. '.json');
            
            try {
                if ($json) {
                    $json = Json::decode($json);
                    // the rows column defines the placeholders
                    // if the rows column does not exists fail back to normal layout processing
                    if (isset($json['rows'])) {
                        $json = $json['rows'];
                    } else {
                        $json = false;
                    }
                }
            } catch (\Exception $e) {
                $json = false;
            }
        }
        
        $readableFileName = $this->generateReadableName($fileinfo->name);
        
        $content = file_get_contents($file);
        
        preg_match_all("/placeholders\[[\'\"](.*?)[\'\"]\]/", $content, $results);
        
        if (!$json) {
            $placeholder = [];
            foreach (array_unique($results[1]) as $holderName) {
                if (!$this->isValidPlaceholderName($holderName)) {
                    throw new Exception("Wrong variable name detected '".$holderName."'. Special chars are not allowed in placeholder variables, allowed chars are a-zA-Z0-9");
                }
                $placeholder[] = ['label' => $this->generateReadableName($holderName), 'var' => $holderName];
            }
            $_placeholders = ['placeholders' => [$placeholder]];
        } else {
            $_placeholders = ['placeholders' => $json];
        }
        
        $layoutItem = Layout::find()->where(['or', ['view_file' => $fileBaseName], ['view_file' => $baseName]])->one();
        
        if ($layoutItem) {
            $match = $this->comparePlaceholders($_placeholders, json_decode($layoutItem->json_config, true));
            $matchRevert = $this->comparePlaceholders(json_decode($layoutItem->json_config, true), $_placeholders);
            if ($match && $matchRevert) {
                $layoutItem->updateAttributes([
                    'name' => $readableFileName,
                    'view_file' => $fileBaseName,
                ]);
            } else {
                $layoutItem->updateAttributes([
                    'name' => $readableFileName,
                    'view_file' => $fileBaseName,
                    'json_config' => json_encode($_placeholders),
                ]);
                $this->addLog('Existing file '.$readableFileName.' updated.');
            }

            return $layoutItem->id;
        } 

        // add item into the database table
        $data = new Layout();
        $data->scenario = 'restcreate';
        $data->setAttributes([
            'name' => $readableFileName,
            'view_file' => $fileBaseName,
            'json_config' => json_encode($_placeholders),
        ]);
        $data->save(false);
        $this->addLog('New file '.$readableFileName.' found and registered.');
        return $data->id;
    }
    
    /**
     * Verificy if a given string matches the variable rules.
     *
     * @param string $chars
     * @return boolean
     */
    protected function isValidPlaceholderName($chars)
    {
        if (preg_match('/[^a-zA-Z0-9]+/', $chars, $matches) == 1) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Generate readable name from name.
     *
     * @param string $name
     * @return string
     */
    protected function generateReadableName($name)
    {
        return Inflector::humanize(Inflector::camel2words($name));
    }
    
    /**
     * Compare two arrays with each in order to determined whether they have differences or not.
     *
     * An array must contain the keys `placeholders` otherwise false is returned too.
     *
     * @param array $array1
     * @param array $array2
     * @return bool true if the same, false if not the same
     */
    protected function comparePlaceholders($array1, $array2)
    {
        if (!array_key_exists('placeholders', $array1) || !array_key_exists('placeholders', $array2)) {
            return false;
        }

        $a1 = $array1['placeholders'];
        $a2 = $array2['placeholders'];

        if (count($a1) !== count($a2)) {
            return false;
        }

        foreach ($a1 as $key => $holder) {
            if (!array_key_exists($key, $a2)) {
                return false;
            }

            foreach ($holder as $var => $value) {
                if ($var == "label") {
                    continue;
                }
                
                if (!array_key_exists($var, $a2[$key])) {
                    return false;
                }

                if ($value != $a2[$key][$var]) {
                    return false;
                }
            }
        }

        return true;
    }
}
