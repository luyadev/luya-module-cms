<?php

namespace luya\cms\admin;

use luya\admin\components\AdminMenuBuilder;
use luya\base\CoreModuleInterface;
use luya\cms\admin\importers\BlockImporter;
use luya\cms\admin\importers\CmslayoutImporter;
use luya\cms\admin\importers\PropertyConsistencyImporter;
use luya\cms\admin\importers\ThemeImporter;
use luya\console\interfaces\ImportControllerInterface;
use luya\helpers\Url;
use Yii;

/**
 * CMS Admin Module.
 *
 * @property string $previewUrl Configuration option for the auto preview and preview button link.
 * @property array $blocks Optional blocks or folders to scan for the {{luya\cms\admin\importers\BlockImporter}}.
 * @property array $blockVariations An array with variations to pass for a given block.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
final class Module extends \luya\admin\base\Module implements CoreModuleInterface
{
    /**
     * @var string The version label name of the first version, version alias is running through yii2 messaging system.
     */
    public const VERSION_INIT_LABEL = 'Initial';

    public const ROUTE_PAGE_CREATE = 'cmsadmin/page/create';

    public const ROUTE_PAGE_UDPATE = 'cmsadmin/page/update';

    public const ROUTE_PAGE_DELETE = 'cmsadmin/page/delete';

    public const ROUTE_PAGE_DRAFTS = 'cmsadmin/page/drafts';

    public const ROUTE_CONFIG = 'cmsadmin/config/index';

    /**
     * @inheritdoc
     */
    public $apis = [
        'api-cms-admin' => 'luya\cms\admin\\apis\\AdminController',
        'api-cms-navitempageblockitem' => 'luya\cms\admin\\apis\\NavItemPageBlockItemController',
        'api-cms-nav' => 'luya\cms\admin\apis\NavController',
        'api-cms-navitem' => 'luya\cms\admin\\apis\\NavItemController',
        'api-cms-navitempage' => 'luya\cms\admin\\apis\\NavItemPageController',
        'api-cms-menu' => 'luya\cms\admin\apis\MenuController',
        'api-cms-layout' => 'luya\cms\admin\\apis\\LayoutController',
        'api-cms-block' => 'luya\cms\admin\\apis\\BlockController',
        'api-cms-blockgroup' => 'luya\cms\admin\\apis\\BlockgroupController',
        'api-cms-navcontainer' => 'luya\cms\admin\apis\NavContainerController',
        'api-cms-navitemblock' => 'luya\cms\admin\apis\NavItemBlockController',
        'api-cms-redirect' => 'luya\cms\admin\apis\RedirectController',
        'api-cms-theme' => 'luya\cms\admin\apis\ThemeController',
        'api-cms-log' => 'luya\cms\admin\apis\LogController',
        'api-cms-website' => 'luya\cms\admin\apis\WebsiteController',
    ];

    public $apiRules = [
        'api-cms-nav' => ['extraPatterns' => ['GET {id}/tags' => 'tags', 'POST {id}/tags' => 'save-tags']]
    ];

    /**
     * @inheritdoc
     */
    public $dashboardObjects = [
        [
            'class' => 'luya\admin\dashboard\ListDashboardObject',
            'template' => '
				<a ng-repeat="item in data" ui-sref="custom.cmsedit({ navId : item.nav_id, templateId: \'cmsadmin/default/index\'})" class="list-group-item list-group-item-action flex-column align-items-start">
				    <div class="d-flex w-100 justify-content-between">
				      <h5 class="mb-1">{{item.title}}</h5>
				      <small>{{item.timestamp_update * 1000 | date:\'short\'}}</small>
				    </div>
				    <small>{{by}} {{item.updateUser.firstname}} {{item.updateUser.lastname}}</small>
				</a>
			',
            'variables' => [
                'by' => ['cmsadmin', 'by_label'],
            ],
            'dataApiUrl' => 'admin/api-cms-navitem/last-updates',
            'title' => ['cmsadmin', 'cmsadmin_dashboard_lastupdate'],
        ],
    ];

    /**
     * @var array Defined blocks to hidde from the cmsadmin. Those blocks are not listed in the Page Content blocks overview. You can override this
     * variable inside your configuration of the cmsadmin.
     *
     * ```php
     *  'modules' => [
     *      'cmsadmin' => [
     *          'class' => 'cmsadmin\Module',
     *          'hiddenBlocks' => [
     *              'cmsadmin\blocks\TextBlock',
     *          ],
     *      ],
     *  ],
     * ```
     *
     * You can define blocks by using the string notation:
     *
     * ```php
     * 'hiddenBlocks' => [
     *     'cmsadmin\blocks\TextBlock',
     *     'cmsadmin\blocks\AudioBlock',
     * ],
     * ```
     *
     * or you can use the object notation with static className method this is more convient as an IDE will auto complet the Input:
     *
     * ```php
     * 'hiddenBlocks' => [
     *     \cmsadmin\blocks\TextBlock::className(),
     *     \cmsadmin\blocks\AudioBlock::className(),
     * ],
     * ```
     */
    public $hiddenBlocks = [];

    /**
     * @var array An array with folders where layouts are contained or direct paths to a given layout file.
     *
     * ```php
     * 'cmsLayouts' => [
     *     '@app/path/to/cmslayouts', // a folder with layout files
     *     '@app/file/TheCmsLayout.php', // a layout file
     * ],
     * ```
     *
     * @since 1.0.6
     */
    public $cmsLayouts = [];

    private array $_blocks = [];

    /**
     * Setter method for additional cms blocks.
     *
     * @param string|array $definition This can be either a string (for directories or a single file) or an array with files or diretories.
     *
     * Example usage with differnt types of informations.
     *
     * ```php
     * 'cmsadmin' => [
     *     'class' => 'luya\cms\admin\Module',
     *     'blocks' => [
     *         '@app/extras/blocks', // a folder which contains blocks.
     *         '@app/somewhere/MyBlock.php', // a path to a specific block.
     *     ]
     * ]
     * ```
     *
     * The blocks will be add/update/deleted within the import process trough {{luya\cms\admin\importers\BlockImporter}}.
     *
     * @since 1.0.4
     */
    public function setBlocks(string|array $definition)
    {
        $this->_blocks = (array) $definition;
    }

    /**
     * Get an array with custom block definitions.
     *
     * The array of additional blocks or folders with blocks will be passed trough to the importer class {{luya\cms\admin\importers\BlockImporter}}.
     *
     * @return array
     * @since 1.0.4
     */
    public function getBlocks()
    {
        return $this->_blocks;
    }

    private $_previewUrl;

    /**
     * Setter method for previewUrl.
     *
     * The get params navId, version and date (optional) will be auto added. Remove
     * the trailing slash.
     *
     * ```php
     * 'modules' => [
     *     'cmsadmin' => [
     *         'class' => 'luya\cms\admin\Module',
     *         'previewUrl' => 'https://mywebsite/preview/page',
     *     ],
     * ]
     * ```
     *
     * @param string $url The url to use as preview url, without trailing slash. Params will be auto added.
     * @since 1.0.2
     */
    public function setPreviewUrl($url)
    {
        $this->_previewUrl = rtrim($url, '/');
    }

    /**
     * Getter method for previewUrl.
     *
     * Uses the default urlRule when no value has been provided.
     *
     * @return string Returns the preview url used for autoPreview and preview button click.
     * @since 1.0.2
     */
    public function getPreviewUrl()
    {
        return $this->_previewUrl ?? Url::home(true) . 'cms-page-preview';
    }

    private $_blockVariations;

    /**
     * Set block variations.
     *
     * ```php
     * 'blockVariations' => [
     *     TextBlock::class => [
     *         'variation1' => [
     *             'title' => 'Super Bold Text',
     *             'vars' => ['cssClass' => 'bold-font-css-class'],
     *             'cfgs' => [], // will be ignore as its empty, so you can also just remove this part.
     *             'extras' => [], // will be ignore as its empty, so you can also just remove this part.
     *             'is_default' => false, // where this is the default value or not
     *         ],
     *     ]
     * ]
     * ```
     *
     * @param array $config
     */
    public function setBlockVariations(array $config)
    {
        $_variations = [];
        foreach ($config as $key => $content) {
            if (is_numeric($key) && is_array($content)) {
                $_variations[key($content)] = array_shift($content);
            } else {
                $_variations[$key] = $content;
            }
        }
        $this->_blockVariations = $_variations;
    }

    /**
     * Getter method for blockVarionts.
     *
     * @return array
     */
    public function getBlockVariations()
    {
        return $this->_blockVariations;
    }

    /**
     * @inheritdoc
     */
    public function getMenu()
    {
        return (new AdminMenuBuilder($this))
            ->nodeRoute('menu_node_cms', 'description', 'cmsadmin/default/index', 'luya\cms\models\NavItem')
            ->node('menu_node_cmssettings', 'settings')

                ->group('menu_group_page_display')
                    ->itemApi('menu_group_item_env_websites', 'cmsadmin/website/index', 'http', 'api-cms-website')
                    ->itemApi('menu_group_item_env_layouts', 'cmsadmin/layout/index', 'view_quilt', 'api-cms-layout')
                    ->itemApi('menu_group_item_env_themes', 'cmsadmin/theme/index', 'color_lens', 'api-cms-theme')
                    ->itemApi('menu_group_item_env_container', 'cmsadmin/navcontainer/index', 'label_outline', 'api-cms-navcontainer')


                ->group('menu_group_elements')
                    ->itemApi('menu_group_item_elements_group', 'cmsadmin/blockgroup/index', 'view_module', 'api-cms-blockgroup')
                    ->itemApi('menu_group_item_elements_blocks', 'cmsadmin/block/index', 'format_align_left', 'api-cms-block')

                ->group('menu_group_configuration')
                    ->itemApi('menu_group_item_env_redirections', 'cmsadmin/redirect/index', 'compare_arrows', 'api-cms-redirect')
                    ->itemRoute('menu_group_item_env_permission', "cmsadmin/permission/index", 'gavel')
                    ->itemRoute('menu_group_item_env_config', 'cmsadmin/config/index', 'build')

                ->group('menu_group_protocol')
                    ->itemApi('menu_group_protocol_model_event_logger', 'cmsadmin/log/index', 'archive', 'api-cms-log');
    }

    /**
     * @inheritdoc
     */
    public function extendPermissionApis()
    {
        return [
            ['api' => 'api-cms-navitempageblockitem', 'alias' => static::t('module_permission_page_blocks')],
            ['api' => 'api-cms-navitempage', 'alias' => static::t('module_permission_page')],
        ];
    }

    /**
     * @inheritdoc
     */
    public function extendPermissionRoutes()
    {
        return [
            ['route' => self::ROUTE_PAGE_CREATE, 'alias' => static::t('module_permission_add_new_page')],
            ['route' => self::ROUTE_PAGE_UDPATE, 'alias' => static::t('module_permission_update_pages')],
            ['route' => self::ROUTE_PAGE_DELETE, 'alias' => static::t('module_permission_delete_pages')],
            ['route' => self::ROUTE_PAGE_DRAFTS, 'alias' => static::t('module_permission_edit_drafts')],
            ['route' => self::ROUTE_CONFIG, 'alias' => static::t('module_permission_update_config')],
        ];
    }

    /**
     * @inheritdoc
     */
    public function import(ImportControllerInterface $importer)
    {
        return [
            ThemeImporter::class,
            BlockImporter::class,
            CmslayoutImporter::class,
            PropertyConsistencyImporter::class,
        ];
    }

    /**
     * @inheritdoc
     */
    public function getAdminAssets()
    {
        return  [
            'luya\cms\admin\assets\Main',
        ];
    }

    /**
     * @inheritdoc
     */
    public function getJsTranslationMessages()
    {
        return [
            'js_added_translation_ok', 'js_added_translation_error', 'js_page_add_exists', 'js_page_property_refresh', 'js_page_confirm_delete', 'js_page_delete_error_cause_redirects', 'js_state_online', 'js_state_offline',
            'js_state_hidden', 'js_state_visible', 'js_state_is_home', 'js_state_is_not_home', 'js_page_item_update_ok', 'js_page_block_update_ok', 'js_page_block_remove_ok', 'js_page_block_visbility_change', 'js_page_block_delete_confirm',
            'js_version_update_success', 'js_version_error_empty_fields', 'js_version_create_success', 'js_version_delete_confirm', 'js_version_delete_confirm_success',
            'view_index_page_success', 'js_config_update_success', 'js_page_update_layout_save_success', 'js_page_create_copy_success', 'view_update_block_tooltip_delete',
            'cmsadmin_settings_trashpage_title', 'cmsadmin_version_remove', 'js_block_attribute_empty',
        ];
    }

    /**
     * @inheritdoc
     */
    public static function onLoad()
    {
        self::registerTranslation('cmsadmin*', static::staticBasePath() . '/messages', [
            'cmsadmin' => 'cmsadmin.php',
        ]);
    }

    /**
     * Translations for CMS admin Module.
     *
     * @param string $message
     * @return string
     */
    public static function t($message, array $params = [])
    {
        return parent::baseT('cmsadmin', $message, $params);
    }

    private static int $_authorUserId = 0;

    /**
     * Setter method for author user ID in order ensure phpunit tests.
     *
     * @param integer $userId
     */
    public static function setAuthorUserId($userId)
    {
        self::$_authorUserId = $userId;
    }

    /**
     * Get the user id of the logged in user in web appliation context.
     *
     * @return integer
     */
    public static function getAuthorUserId()
    {
        return (Yii::$app instanceof \luya\web\Application) ? Yii::$app->adminuser->getId() : self::$_authorUserId;
    }
}
