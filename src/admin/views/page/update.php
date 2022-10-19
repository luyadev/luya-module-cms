<?php

use luya\admin\Module as AdminModule;
use luya\cms\admin\Module;
use luya\cms\helpers\Url;

?>
<div class="cmsadmin" ng-controller="NavController" ng-show="!isDeleted" ng-class="{'cmsadmin-blockholder-collapsed' : !isBlockholderSmall}">
	<?= $this->render('_settings'); ?>
    <div class="row">
        <div class="col cmsadmin-frame-wrapper" ng-if="displayLiveContainer">
            <iframe class="cmsadmin-frame" ng-src="{{ liveUrl | trustAsResourceUrl:liveUrl }}" frameborder="0" width="100%" height="100%"></iframe>
        </div>
        <div class="col">
            <div class="cmsadmin-toolbar">
                <div ng-show="!isDraft" class="toolbar-item" >
                    <label class="switch" for="switch-visibility-status" tooltip tooltip-text="<?= Module::t('view_update_hidden_info')?>" tooltip-position="bottom">
                        <span class="switch-label">
                            <i class="material-icons" ng-show="!navData.is_hidden">visibility</i>
                            <i class="material-icons" ng-show="navData.is_hidden">visibility_off</i>
                        </span>
                        <span class="switch-switch">
                            <input class="switch-checkbox" ng-model="navData.is_hidden" ng-true-value="0" ng-false-value="1" type="checkbox" id="switch-visibility-status"/>
                            <span class="switch-control"></span>
                        </span>
                    </label>
                    <luya-schedule
                    style="display:inline-block;"
                    class="ml-1"
                    only-icon="1"
                    value="navData.is_hidden"
                    primary-key-value="navData.id"
                    model-class="luya\cms\models\Nav"
                    attribute-name="is_hidden"
                    title="Visibility"
                    attribute-values='[{"label":"Hidden","value":1},{"label":"Visible","value":0}]'></luya-schedule>
                </div>
                <div ng-show="!isDraft" class="toolbar-item">
                    <label class="switch" for="switch-online-status" tooltip tooltip-text="<?= Module::t('view_update_offline_info')?>" tooltip-position="bottom">
                        <span class="switch-label">
                            <i class="material-icons" ng-show="!navData.is_offline">cloud_queue</i>
                            <i class="material-icons" ng-show="navData.is_offline">cloud_off</i>
                        </span>
                        <span class="switch-switch">
                            <input class="switch-checkbox" type="checkbox" id="switch-online-status" ng-model="navData.is_offline" ng-true-value="0" ng-false-value="1"/>
                            <span class="switch-control"></span>
                        </span>
                    </label>
                    <luya-schedule
                    style="display:inline-block;"
                    class="ml-1"
                    only-icon="1"
                    value="navData.is_offline"
                    primary-key-value="navData.id"
                    model-class="luya\cms\models\Nav"
                    attribute-name="is_offline"
                    title="Status"
                    attribute-values='[{"label":"Offline","value":1},{"label":"Online","value":0}]'></luya-schedule>
                </div>
                <div class="toolbar-item toolbar-item-lang" ng-class="{'ml-auto':$first}" ng-repeat="lang in AdminLangService.data" ng-click="AdminLangService.toggleSelection(lang)" ng-if="AdminLangService.data.length > 1">
                    <button class="btn-toolbar flag-btn" ng-class="{'active' : AdminLangService.isInSelection(lang.short_code)}" >
                        <span class="flag flag-{{lang.short_code}}">
                            <span class="flag-fallback">{{lang.name}}</span>
                        </span>
                    </button>
                </div>
                <div class="toolbar-item" ng-class="{'ml-auto': AdminLangService.data.length <= 1}">
                    <div class="dropdown" ng-class="{'show': toggleSettings}"  ng-click="toggleSettings=!toggleSettings">
                        <button type="button" class="btn btn-outline-config btn-icon" ng-class="{'btn-active': toggleSettings}"></button>
                        <div class="dropdown-menu dropdown-menu-right" ng-class="{'show': toggleSettings}">
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(9)">
                                <i class="material-icons">tag</i> <span><?= AdminModule::t('menu_system_item_tags'); ?></span>
                            </a>    
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(2)" ng-if="propertiesData.length > 0">
                                <i class="material-icons">menu_open</i> <span><?= Module::t('view_update_properties_title'); ?></span>
                            </a>
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(4)">
                                <i class="material-icons">content_copy</i> <span><?= Module::t('page_update_actions_deepcopy_title'); ?></span>
                            </a>
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(8)">
                                <i class="material-icons">collections</i> <span><?= Module::t('page_update_actions_deepcopyastemplate_title'); ?></span>
                            </a>
                            <a class="dropdown-item" ng-show="!isDraft" ng-click="togglePageSettingsOverlay(5)">
                                <i class="material-icons">home</i> <span><?= Module::t('cmsadmin_settings_homepage_title'); ?></span>
                            </a>
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(3)">
                                <i class="material-icons">web</i> <span><?= Module::t('page_update_actions_layout_title'); ?></span>
                            </a>
                            <?php if (Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)): ?>
                            <a class="dropdown-item" ng-click="togglePageSettingsOverlay(6)">
                                <i class="material-icons">delete</i> <span><?= Module::t('cmsadmin_settings_trashpage_title'); ?></span>
                            </a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
            <div class="cmsadmin-pages">
                <div class="row">
                    <div class="col" ng-repeat="lang in languagesData" ng-if="AdminLangService.isInSelection(lang.short_code)" ng-controller="NavItemController">
                        <?= $this->render('_navitem', ['canBlockUpdate' => $canBlockUpdate, 'canBlockDelete' => $canBlockDelete, 'canBlockCreate' => $canBlockCreate]); ?>
                    </div>
                </div>
            </div>
        </div>
        <?php if ($canBlockCreate): ?>
        <div class="col blockholder-column" ng-controller="DroppableBlocksController" ng-class="{'blockholder-column-small' : !isBlockholderSmall}" }>
            <div class="blockholder">
                <div class="blockholder-search">
                    <input class="blockholder-search-input" id="blockholder-search" ng-model="searchQuery" />
                    <label class="blockholder-search-label" for="blockholder-search" ng-show="searchQuery.length == 0">
                        <i class="material-icons">search</i>
                    </label>
                    <span class="blockholder-search-label" ng-show="searchQuery.length > 0" ng-click="searchQuery = ''">
                        <i class="material-icons">clear</i>
                    </span>
                </div>
                <div class="blockholder-group blockholder-group-copy-stack" ng-show="copyStack.length > 0 && searchQuery.length == 0">
                    <span class="blockholder-group-title">
                        <i class="material-icons">bookmark</i>
                        <span>
                            <?= Module::t('view_update_blockholder_clipboard') ?>
                            <a class="blockholder-clear-button" ng-click="clearStack()"><i class="material-icons">clear</i></a>
                        </span>
                    </span>
                    <ul class="blockholder-list">
                        <li class="blockholder-item"
                            ng-repeat="stackItem in copyStack"
                            dnd dnd-model="stackItem"
                            dnd-isvalid="true"
                            dnd-drop-disabled
                            dnd-css="{onDrag: 'drag-start', onHover: 'red', onHoverTop: 'red-top', onHoverMiddle: 'red-middle', onHoverBottom: 'red-bottom'}"
                        >
                            <i class="material-icons blockholder-icon">{{stackItem.icon}}</i>
                            <span>{{stackItem.name}}</span>
                        </li>
                    </ul>
                </div>
                <div class="blockholder-group" ng-class="{'blockholder-group-favorites': item.group.is_fav, 'blockholder-group-toggled': !item.group.toggle_open}" ng-repeat="item in blocksData | orderBy:'groupPosition'" >
                    <span class="blockholder-group-title" tooltip tooltip-text="{{item.group.name}}" tooltip-position="left" tooltip-disabled="isBlockholderSmall" ng-click="toggleGroup(item.group)" ng-hide="searchQuery.length > 0">
                        <i class="material-icons" ng-if="item.group.is_fav">favorite</i>
                        <i class="material-icons blockholder-toggle-icon" ng-if="!item.group.is_fav">keyboard_arrow_down</i>
                        <span>{{item.group.name}}</span>
                    </span>
                    <ul class="blockholder-list">
                        <li class="blockholder-item" ng-if="item.group.toggle_open" ng-repeat="block in item.blocks | orderBy:'name' | filter:{name:searchQuery}"
                            dnd dnd-model="block" dnd-isvalid="true" dnd-drop-disabled dnd-css="{onDrag: 'drag-start', onHover: 'red', onHoverTop: 'red-top', onHoverMiddle: 'red-middle', onHoverBottom: 'red-bottom'}"
                        >
	                        <div tooltip tooltip-preview-url="<?= Url::base(true); ?>/cmsadmin/block/preview?blockId={{block.id}}" tooltip-position="left" tooltip-offset-left="-30" tooltip-disabled="!isPreviewEnabled(block)">
		                        <i class="material-icons blockholder-icon" tooltip tooltip-text="{{block.name}}" tooltip-position="left" tooltip-disabled="isBlockholderSmall">{{block.icon}}</i>
		                        <span>{{block.name}}</span>
		                        <button type="button" class="blockholder-favorite" ng-click="addToFav(block)" ng-if="!item.group.is_fav && !block.favorized">
			                        <i class="material-icons">favorite</i>
		                        </button>
		                        <button type="button" class="blockholder-favorite blockholder-favorite-clear" ng-click="removeFromFav(block)" ng-if="item.group.is_fav">
			                        <i class="material-icons">clear</i>
		                        </button>
	                        </div>
                        </li>
                    </ul>
                </div>
                <button class="blockholder-toggler" type="button" ng-class="{'blockholder-toggler-open' : !isBlockholderSmall}" ng-click="toggleBlockholderSize()">
                    <i class="material-icons">chevron_right</i>
                </button>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>
