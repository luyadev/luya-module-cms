<?php

namespace luya\cms\admin\importers;

use luya\admin\models\Config;
use luya\cms\base\BlockInterface;
use luya\cms\Exception;
use luya\cms\models\Block;
use luya\cms\models\BlockGroup;
use luya\console\Importer;
use luya\helpers\FileHelper;
use Yii;

/**
 * CMS Blocks Importer.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockImporter extends Importer
{
    /**
     * @inheritdoc
     */
    public function run()
    {
        // when the setup timestamp is not yet set, its a fresh installation, therefore skip the 1.0.0 generic block upgrade
        // otherwise its an existing/upgrading instance which is doing the import command.
        if (!Config::has(Config::CONFIG_SETUP_COMMAND_TIMESTAMP)) {
            Config::set('100genericBlockUpdate', true);
        }

        if (!Config::has('100genericBlockUpdate')) {
            throw new Exception("You have to run the generic block updater. ./vendor/bin/luya cms/updater/generic");
        }

        $exists = [];

        foreach ($this->getImporter()->getDirectoryFiles('blocks') as $file) {
            $exists[] = $this->saveBlock($file['ns']);
        }

        foreach (Yii::$app->packageInstaller->configs as $config) {
            $exists = array_merge($exists, $this->handleBlockDefinitions($config->blocks));
        }

        // provide backwards compatibility for core 1.0.7 and below
        if ($this->hasProperty('module')) {
            $exists = array_merge($exists, $this->handleBlockDefinitions($this->module->blocks));
        }

        foreach (Block::find()->all() as $block) {
            if (!class_exists($block->class)) {
                $this->addLog("[!] The block {$block->class} used {$block->usageCount} times, does not exists anymore. You should either use migrate or cleanup command.");
            }
        }

        // remove unused block groups
        foreach (BlockGroup::find()->andWhere(['not in', 'id', $this->blockGroupIds])->all() as $oldBlockGroup) {
            if ($oldBlockGroup->delete()) {
                $this->addLog('Old blockgroup has been deleted: ' . $oldBlockGroup->name);
            }
        }

        return $this->addLog("Block importer finished with ".count($exists) . " blocks.");
    }

    private array $blockGroupIds = [];

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
     * @return array
     * @since 1.0.8
     */
    protected function handleBlockDefinitions(array $definitions)
    {
        // A list of directories which should be prefix to the current block definition,
        // as a block definition can contain an alias with a full path, we need an empty "prefix"
        // directory, which is represented as `null` value at the end of the array.
        $directories = array_unique([Yii::getAlias('@app'), getcwd(), null]);

        $ids = [];
        foreach ($definitions as $blockDefinition) {
            // find an alias for the defintion (@app/xyz/Block)
            $block = Yii::getAlias($blockDefinition, false);
            // if there is no alias, or not found, switch back to original name
            if ($block === false) {
                $block = $blockDefinition;
            }

            $ids = array_merge($ids, $this->handleBlockDefintionInDirectories($directories, $block));
        }

        return $ids;
    }

    /**
     * Handle a block defintion for different folders
     *
     * @param string $blockDefinition
     * @return array
     * @since 2.0.0
     */
    protected function handleBlockDefintionInDirectories(array $directories, $blockDefinition)
    {
        $results = [];
        foreach ($directories as $directoryPath) {
            $path = rtrim((string) $directoryPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . ltrim((string) $blockDefinition, DIRECTORY_SEPARATOR);

            $path = $this->replaceDsSeparator($path);

            if (isset($results[$path])) {
                continue;
            }

            $blockIds = $this->getBlockIdsByPath($path);
            if (!empty($blockIds)) {
                $results[$path] = $blockIds;
            }
        }

        if (empty($results)) {
            $this->addLog("Unable to find '{$blockDefinition}' in any of those paths '".implode(",", $directories)."'");
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
     * @return array An array with block ids or an empty array if not found.
     * @since 2.0.0
     */
    protected function getBlockIdsByPath($path)
    {
        if (is_file($path)) {
            $id = $this->saveBlockByPath($path);
            if ($id) {
                return [$id];
            }
        } elseif (is_dir($path)) {
            return $this->saveBlocksFromFolder($path);
        }

        return [];
    }

    /**
     * Save all blocks from a given folder.
     *
     * @param string $folder
     * @return number[]|boolean[]
     * @since 1.0.8
     */
    protected function saveBlocksFromFolder($folder)
    {
        $ids = [];
        if (is_dir($folder)) {
            foreach (FileHelper::findFiles($folder) as $blockItem) {
                $ids[] = $this->saveBlockByPath($blockItem);
            }
        }

        return $ids;
    }

    /**
     * Save a block by its given full class name.
     *
     * Example full class name: luya\cms\blocks\ModuleBlock
     *
     * @param string $fullClassName
     * @return number
     */
    protected function saveBlock($fullClassName)
    {
        // ensure all classes start with trailing slash class name definition like `\foo\bar\Class`
        $fullClassName = '\\'  . ltrim($fullClassName, '\\');
        $model = Block::find()->where(['class' => $fullClassName])->one();

        $blockObject = $this->createBlockObject($fullClassName);

        $blockGroupId = $this->getBlockGroupId($blockObject);

        if (!in_array($blockGroupId, $this->blockGroupIds)) {
            $this->blockGroupIds[] = $blockGroupId;
        }

        $log = "block {$fullClassName}: ";
        if (!$model) {
            $model = new Block();
            $model->group_id = $blockGroupId;
            $model->class = $fullClassName;
            if ($model->save()) {
                $log .= "Added to database";
            } else {
                $log .= "Error while saving";
            }
        } elseif ($model->group_id != $blockGroupId) {
            $log .= 'Updated group id"';
            $model->updateAttributes(['group_id' => $blockGroupId]);
        } else {
            $log .= 'remains the same, nothing to update';
        }
        $this->addLog($log);

        return $model->id;
    }

    /**
     * Save a block by its path, this will extract the namespace of the block in order to save it.
     *
     * Example path: /apps/myblocks/ExampleBlock.php
     *
     * Example path: `
     * @param string $path
     * @return number|boolean
     */
    protected function saveBlockByPath($path)
    {
        $info = FileHelper::classInfo($path);

        if ($info) {
            $className = $info['namespace'] . '\\' . $info['class'];

            return $this->saveBlock($className);
        }

        $this->addLog("Unable to find block namespace for file '{$path}'.");

        return false;
    }

    /**
     * Create a block object based from the class name.
     *
     * @param string $className
     * @return object|mixed
     */
    protected function createBlockObject($className)
    {
        return Yii::createObject(['class' => $className]);
    }

    /**
     * The the group of a block based on the block object.
     *
     * @return integer
     */
    protected function getBlockGroupId(BlockInterface $blockObject)
    {
        $groupClassName = $blockObject->blockGroup();

        $groupClassName = '\\'  . ltrim($groupClassName, '\\');

        $groupObject = Yii::createObject(['class' => $groupClassName]);

        $group = BlockGroup::findOne(['identifier' => $groupObject->identifier()]);

        if ($group) {
            $group->updateAttributes([
                'name' => $groupObject->label(),
                'class' => $groupClassName,
                'is_deleted' => false,
            ]);

            return $group->id;
        } else {
            $model = new BlockGroup();
            $model->name = $groupObject->label();
            $model->identifier = $groupObject->identifier();
            $model->created_timestamp = time();
            $model->class = $groupClassName;
            if ($model->save()) {
                $this->addLog("Insert new block group {$model->name}.");
                return $model->id;
            }
        }

        return 0;
    }
}
