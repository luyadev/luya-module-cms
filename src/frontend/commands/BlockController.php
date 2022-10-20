<?php

namespace luya\cms\frontend\commands;

use luya\cms\models\Block;
use luya\helpers\FileHelper;
use luya\helpers\StringHelper;
use Yii;
use yii\console\widgets\Table;
use yii\helpers\Console;
use yii\helpers\Inflector;

/**
 * Block console commands.
 *
 * @property string $blockName The name of the block getter/setters stored.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockController extends \luya\console\Command
{
    /**
     * @inheritdoc
     */
    public $defaultAction = 'create';

    /**
     * @var string Type module
     */
    public const TYPE_MODULE = 'module';

    /**
     * @var string Type application block
     */
    public const TYPE_APP = 'app';

    /**
     * @var string The type of block, valid `app` (static::TYPE_APP) or `module` (static::TYPE_TMODULE) values.
     */
    public $type;

    /**
     * @var string If type is `module` the name of the module must be provided with this $moduleName property.
     */
    public $moduleName;

    /**
     * @var array Provide the configuration array which is inside the `config()` method of the block.
     */
    public $config;

    /**
     * @var boolean Whether the block is a container/layout block or not this will enable/dsiable the $isContainer property
     */
    public $isContainer;

    /**
     * @var boolean Whether the caching property should be displayed or not inside the block.
     */
    public $cacheEnabled;

    /**
     * @var boolean If dry run is enabled the content of the block will be returned but no files will be created. This is usefull for unit testing.
     */
    public $dryRun = false;

    private $_blockName;

    /**
     * Setter method for $blockName, ensure the correct block name.
     *
     * @param string $name The name of the block.
     */
    public function setBlockName($name)
    {
        if (!StringHelper::endsWith($name, 'Block')) {
            $name .= 'Block';
        }

        $this->_blockName = Inflector::camelize($name);
    }

    /**
     * Getter method fro $blockName.
     *
     * @return string Get the ensured block name.
     */
    public function getBlockName()
    {
        return $this->_blockName;
    }

    /**
     * @var array An array with the list of extras which are generated during the var creator process, example content `'foo' => 'value',`
     */
    public $extras = [];

    /**
     * @var array An array with all phpdoc comments which should be added to the admin template, exmaple content `['{{extras.foobar}}']`.
     */
    public $phpdoc = [];

    /**
     * @var array Am array with additional docblocks messages to render inside the view file.
     */
    public $viewFileDoc = [];

    /**
     * Get an array with all modules where you can generate blocks for.
     *
     * @return array
     */
    private function getModuleProposal()
    {
        $moduleNames = [];
        foreach (Yii::$app->getApplicationModules() as $id => $obj) {
            $moduleNames[$id] = $id;
        }

        return $moduleNames;
    }

    private function getVariableTypes()
    {
        return [
            'text' => 'Textinput',
            'textarea' => 'Textarea multi rows input',
            'password' => 'Passwort input field (hides the signs)',
            'number' => 'Numbers allowed only',
            'decimal' => 'Decimal Number Float',
            'wysiwyg' => 'What you see is what you get Editor',
            'select' => 'Dropdown Select',
            'date' => 'Date Selector',
            'datetime' => 'Date and Time selector',
            'checkbox' => 'A single Checkbox',
            'checkbox-array' => 'radio Buttons with several inputs',
            'file-upload' => 'User can upload a single file',
            'file-array-upload' => 'User can upload severals files',
            'image-upload' => 'creata a image upload form and return the imageId on success',
            'image-array-upload' => 'creates an asrray with image id an caption string',
            'list-array' => 'Creates an array with a key variable value',
            'table' => 'User can dynamic create tables (jsons)',
            'link' => 'Generats a linkable internal or external resource (use Link Injector!)',
            'cms-page' => 'Returns CMS page selection tree (only when cms is registered).',
            'slug' => 'Slugified input field which allows only lower chars and - for url rules.',
            'radio' => 'Generate radio inputs which allows to select and return a single value.',
            'multiple-inputs' => 'Nesting all types inside an array.',
            'color' => 'A color picker.',
        ];
    }

    private function getVariableTypeInterfaceMap()
    {
        return [
            'text' => 'self::TYPE_TEXT',
            'textarea' => 'self::TYPE_TEXTAREA',
            'password' => 'self::TYPE_PASSWORD',
            'number' => 'self::TYPE_NUMBER',
            'decimal' => 'self::TYPE_DECIMAL',
            'wysiwyg' => 'self::TYPE_WYSIWYG',
            'select' => 'self::TYPE_SELECT',
            'date' => 'self::TYPE_DATE',
            'datetime' => 'self::TYPE_DATETIME',
            'checkbox' => 'self::TYPE_CHECKBOX',
            'checkbox-array' => 'self::TYPE_CHECKBOX_ARRAY',
            'file-upload' => 'self::TYPE_FILEUPLOAD',
            'file-array-upload' => 'self::TYPE_FILEUPLOAD_ARRAY',
            'image-upload' => 'self::TYPE_IMAGEUPLOAD',
            'image-array-upload' => 'self::TYPE_IMAGEUPLOAD_ARRAY',
            'list-array' => 'self::TYPE_LIST_ARRAY',
            'table' => 'self::TYPE_TABLE',
            'link' => 'self::TYPE_LINK',
            'cms-page' => 'self::TYPE_CMS_PAGE',
            'slug' => 'self::TYPE_SLUG',
            'radio' => 'self::TYPE_RADIO',
            'multiple-inputs' => 'self::TYPE_MULTIPLE_INPUTS',
            'color' => 'self::TYPE_COLOR',
        ];
    }

    private function getVariableTypesOptions()
    {
        return [
            'select' => "BlockHelper::selectArrayOption([1 => 'Label for 1'])",
            'checkbox-array' => "BlockHelper::checkboxArrayOption([1 => 'Label for 1'])",
            'image-upload' => "['no_filter' => false]",
            'image-array-upload' => "['no_filter' => false]",
            'radio' => "BlockHelper::radioArrayOption([1 => 'Label for 1'])",
        ];
    }

    private function getExtraVarDef($type, $varName, $func)
    {
        $info = [
            'image-upload' => fn ($varName) => 'BlockHelper::imageUpload($this->'.$func.'(\''.$varName.'\'), false, true),',
            'image-array-upload' => fn ($varName) => 'BlockHelper::imageArrayUpload($this->'.$func.'(\''.$varName.'\'), false, true),',
            'file-upload' => fn ($varName) => 'BlockHelper::fileUpload($this->'.$func.'(\''.$varName.'\'), true),',
            'file-array-upload' => fn ($varName) => 'BlockHelper::fileArrayUpload($this->'.$func.'(\''.$varName.'\'), true),',
            'cms-page' => fn ($varName) => 'Yii::$app->menu->findOne([\'nav_id\' => $this->'.$func.'(\''.$varName.'\', 0)]),',
        ];

        if (array_key_exists($type, $info)) {
            return "'".$varName."' => ".$info[$type]($varName);
        }

        return false;
    }

    private function getVariableTypeOption($type)
    {
        $types = $this->getVariableTypesOptions();

        return $types[$type];
    }

    private function hasVariableTypeOption($type)
    {
        return array_key_exists($type, $this->getVariableTypesOptions());
    }

    private function placeholderCreator($prefix)
    {
        $this->output(PHP_EOL.'-> Create new '.$prefix, Console::FG_YELLOW);
        $name = $this->prompt('Variable Name:', ['required' => true]);
        $label = $this->prompt('End-User Label:', ['required' => true]);

        $v = [
            'var' => Inflector::variablize($name),
            'label' => $label,
        ];

        $this->output('Added '.$prefix.PHP_EOL, Console::FG_GREEN);

        return $v;
    }

    /**
     * Create a variable based of user input.
     *
     * @param string $prefix
     * @param string $typeCast 'var', 'cfg'
     * @return array
     */
    private function varCreator($prefix, $typeCast)
    {
        $this->output(PHP_EOL.'-> Create new '.$prefix, Console::FG_YELLOW);
        $name = $this->prompt('Variable Name:', ['required' => true]);
        $label = $this->prompt('End-User Label:', ['required' => true]);
        $type = $this->select('Variable Type:', $this->getVariableTypes());

        $v = [
            'var' => Inflector::variablize($name),
            'label' => $label,
            'type' => $this->getVariableTypeInterfaceMap()[$type],
        ];

        if ($this->hasVariableTypeOption($type)) {
            $v['options'] = $this->getVariableTypeOption($type);
        }

        if ($typeCast == 'var') {
            $func = 'getVarValue';
        } else {
            $func = 'getCfgValue';
        }

        $extra = $this->getExtraVarDef($type, $v['var'], $func);

        if ($extra !== false) {
            $this->phpdoc[] = '{{extras.'.$v['var'].'}}';
            $this->viewFileDoc[] = '$this->extraValue(\''.$v['var'].'\');';
            $this->extras[] = $extra;
        }

        $this->output('Added '.$prefix.PHP_EOL, Console::FG_GREEN);

        return $v;
    }

    /**
     * Get the file namespace based on its type.
     *
     * @return string The full qualified namespace based on the type
     */
    protected function getFileNamespace()
    {
        if ($this->type == self::TYPE_APP) {
            return 'app\\blocks';
        }

        return Yii::$app->getModule($this->moduleName)->getNamespace()  . '\\blocks';
    }

    /**
     * Get the full base path to the folder of the module
     *
     * @return string The full path to the module folder.
     */
    protected function getFileBasePath()
    {
        if ($this->type == self::TYPE_APP) {
            return Yii::$app->basePath;
        }

        return Yii::$app->getModule($this->moduleName)->getBasePath();
    }

    /**
     * Generate the view file for the block.
     *
     * @param string $blockClassName The name of the block class.
     * @return string The rendered view file.
     */
    public function generateViewFile($blockClassName)
    {
        sort($this->viewFileDoc);
        return $this->view->render('@cms/views/commands/block/create_block_view.php', [
            'blockClassName' => $blockClassName,
            'phpdoc' => $this->viewFileDoc,
            'luyaText' => $this->getGeneratorText('block/create'),
        ]);
    }

    /**
     * Wizzard to create a new CMS block.
     *
     * @return number
     */
    public function actionCreate()
    {
        if (empty($this->type)) {
            Console::clearScreenBeforeCursor();
            $this->type = $this->select('Do you want to create an app or module Block?', [
                self::TYPE_APP => 'Creates a project block inside your @app Namespace (casual).',
                self::TYPE_MODULE => 'Creating a block inside a later specified Module.',
            ]);
        }

        if ($this->type == self::TYPE_MODULE && count($this->getModuleProposal()) === 0) {
            return $this->outputError('Your project does not have Project-Modules registered!');
        }

        if (empty($this->moduleName) && $this->type == self::TYPE_MODULE) {
            $this->moduleName = $this->select('Choose a module to create the block inside:', $this->getModuleProposal());
        }

        if (empty($this->blockName)) {
            $this->blockName = $this->prompt('Insert a name for your Block (e.g. HeadTeaser):', ['required' => true]);
        }

        if ($this->isContainer === null) {
            $this->isContainer = $this->confirm("Do you want to add placeholders to your block that serve as a container for nested blocks?", false);
        }

        if ($this->cacheEnabled === null) {
            $this->cacheEnabled = $this->confirm("Do you want to enable the caching for this block or not?", true);
        }

        if ($this->config === null) {
            $this->config = [
                'vars' => [], 'cfgs' => [], 'placeholders' => [],
            ];

            $doConfigure = $this->confirm('Would you like to configure this Block? (vars, cfgs, placeholders)', false);

            if ($doConfigure) {
                $doVars = $this->confirm('Add new Variable (vars)?', false);
                $i = 1;
                while ($doVars) {
                    $item = $this->varCreator('Variabel (vars) #'.$i, 'var');
                    $this->phpdoc[] = '{{vars.'.$item['var'].'}}';
                    $this->viewFileDoc[] = '$this->varValue(\''.$item['var'].'\');';
                    $this->config['vars'][] = $item;
                    $doVars = $this->confirm('Add one more?', false);
                    ++$i;
                }
                $doCfgs = $this->confirm('Add new Configuration (cfgs)?', false);
                $i = 1;
                while ($doCfgs) {
                    $item = $this->varCreator('Configration (cfgs) #'.$i, 'cfg');
                    $this->phpdoc[] = '{{cfgs.'.$item['var'].'}}';
                    $this->viewFileDoc[] = '$this->cfgValue(\''.$item['var'].'\');';
                    $this->config['cfgs'][] = $item;
                    $doCfgs = $this->confirm('Add one more?', false);
                    ++$i;
                }
                $doPlaceholders = $this->confirm('Add new Placeholder (placeholders)?', false);
                $i = 1;
                while ($doPlaceholders) {
                    $item = $this->placeholderCreator('Placeholder (placeholders) #'.$i);
                    $this->phpdoc[] = '{{placeholders.'.$item['var'].'}}';
                    $this->viewFileDoc[] = '$this->placeholderValue(\''.$item['var'].'\');';
                    $this->config['placeholders'][] = $item;
                    $doPlaceholders = $this->confirm('Add one more?', false);
                    ++$i;
                }
            }
        }

        $folder = $this->getFileBasePath() . DIRECTORY_SEPARATOR . 'blocks';
        $filePath = $folder . DIRECTORY_SEPARATOR . $this->blockName . '.php';

        sort($this->phpdoc);

        $content = $this->view->render('@cms/views/commands/block/create_block', [
            'namespace' => $this->getFileNamespace(),
            'className' => $this->blockName,
            'name' => Inflector::camel2words($this->blockName),
            'type' => $this->type,
            'module' => $this->moduleName,
            'isContainer' => $this->isContainer,
            'cacheEnabled' => $this->cacheEnabled,
            'config' => $this->config,
            'phpdoc' => $this->phpdoc,
            'extras' => $this->extras,
            'luyaText' => $this->getGeneratorText('block/create'),
        ]);

        if ($this->dryRun) {
            return $content;
        }

        if (FileHelper::createDirectory($folder) && FileHelper::writeFile($filePath, $content)) {
            // generate view file based on block object view context
            $object = Yii::createObject(['class' => $this->getFileNamespace() . '\\' . $this->blockName]);
            $viewsFolder = Yii::getAlias($object->getViewPath());
            $viewFilePath = $viewsFolder . DIRECTORY_SEPARATOR . $object->getViewFileName('php');
            if (FileHelper::createDirectory($viewsFolder) && FileHelper::writeFile($viewFilePath, $this->generateViewFile($this->blockName))) {
                $this->outputInfo('View file for the block has been created: ' . $viewFilePath);
            }

            return $this->outputSuccess("Block {$this->blockName} has been created: " . $filePath);
        }

        return $this->outputError("Error while creating block '$filePath'");
    }

    /**
     * Search for a given block by its class or return all.
     *
     * Returns all blocks:
     *
     * ```
     * ./luya cms/block/find
     * ```
     *
     * Filter for a given name:
     *
     * ```
     * ./luya cms/block/find html
     * ```
     *
     * Filter for different names combined as OR conditions:
     *
     * ```
     * ./luya cms/block/find html,module
     * ```
     *
     * @param string $search Optional query to search inside the class. In order to performe multiple criterias use comma separated list of key words.
     * @since 1.0.4
     */
    public function actionFind($search = null)
    {
        $rows = [];
        $query = Block::find();

        foreach (StringHelper::explode($search) as $q) {
            $query->orFilterWhere(['like', 'class', $q]);
        }

        $blocks = $query->with(['navItemPageBlockItems'])->all();
        foreach ($blocks as $block) {
            $rows[] = [$block->id, $block->class, $block->usageCount];
        }

        if ($search) {
            $this->outputInfo("Filtering for: {$search}");
        }

        $table = new Table();
        $table->setHeaders(['ID', 'Class', 'Usage count']);
        $table->setRows($rows);
        echo $table->run();

        return $this->outputSuccess(count($blocks) . " block(s) found.");
    }

    /**
     * Search for a given block and replace the class by replace argument.
     *
     * This is commonly used when a block does not exists anymore and you want to provide
     * another block for the none existing one.
     *
     * The most common case is to search ($old) for a class which has been used in the content but does not exist anymore,
     * therfore you can replace it with a new ($replace) block which has not been used in the content. This will change the
     * class identifier from the old block with the new (replace) ones. If the replace block has not been used, he will be deleted.
     *
     * Searching for the blocks could look like this:
     *
     * ```sh
     * ./luya cms/block/migrate OldBlockWhichDoesNotExists TheNewBlockWhichShouldReplaceTheOld
     * ```
     *
     * Example for using different namespaces but the same block name:
     *
     * ```sh
     * ./luya cms/block/migrate \\blocks\\MyBlock \\newblocks\\MyBlock
     * ```
     *
     * Example usage when working with absolute class names.
     *
     * ```sh
     * ./luya cms/block/migrate app\\blocks\\OldBlockName app\\blocks\\NewBlockName
     * ```
     *
     * As the search for the old block is done by a like statements this would work as well:
     *
     * ```sh
     * ./luya cms/block/migrate OldBlockName app\\blocks\\NewBlockName
     * ```
     *
     * @param string $old
     * @param string $replace
     * @since 1.0.4
     */
    public function actionMigrate($old, $replace)
    {
        $block = Block::find()->where(['like', 'class', $old])->one();

        if (!$block) {
            return $this->outputError("Unable to find a block for '{$old}'");
        }

        $this->outputInfo("Found block '{$block->class}' with ID {$block->id} used {$block->usageCount} times.");

        // check if existing block have the new replace name

        $replaceBlock = Block::find()->where(['like', 'class', $replace])->one();

        if ($replaceBlock && $this->confirm("Do you want to replace {$block->class} (used {$block->usageCount}x) with {$replaceBlock->class} (used {$replaceBlock->usageCount}x)?")) {
            $block->updateAttributes(['class' => $replaceBlock->class]);

            if (empty($replaceBlock->usageCount)) {
                $replaceBlock->delete();

                return $this->outputSuccess("The block as been migrated, the block used for the replacement has been delete has there was no content.");
            } else {
                $replaceBlock->updateAttributes(['class' => $block->class]);

                return $this->outputSuccess("The block has been migrated and the block class names has swaped as the replacement block had content.");
            }
        }

        return $this->outputError("Abort by user.");
    }

    /**
     * Search for blocks with none existing class files and remove them.
     *
     * > Attention: Keep in the mind if the blocks do have been used in content, those data will be delete as well!
     *
     * @since 1.0.4
     */
    public function actionCleanup()
    {
        $delete = [];
        $this->output("Blocks to delete:");
        foreach (Block::find()->all() as $block) {
            if (!$block->getFileExists()) {
                $this->outputInfo("{$block->class} (id: {$block->id}) used {$block->usageCount} times.");
                $delete[] = $block;
            }
        }

        if (!empty($delete) && $this->confirm('Are you sure to delete those blocks with its content? This can not be undone!')) {
            foreach ($delete as $deleteBlock) {
                if ($deleteBlock->delete()) {
                    $this->outputSuccess('Deleted ' . $deleteBlock->class);
                } else {
                    $this->outputError('Error while deleting ' . $deleteBlock->class);
                }
            }

            return $this->outputSuccess("Clean has been finished successful.");
        } elseif (empty($delete)) {
            return $this->outputSuccess("Nothing to cleanup.");
        }

        return $this->outputError("Abort by user.");
    }
}
