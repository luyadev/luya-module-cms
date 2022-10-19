<?php
use luya\admin\Module as AdminModule;
use luya\cms\admin\Module;

?>
<?= $this->render('_angulardirectives'); ?>

<script type="text/ng-template" id="cmsNavReverse.html">
    <span ng-if="data.is_editable" class="treeview-label treeview-label-page" dnd dnd-model="data" dnd-ondrop="dropItem(dragged,dropped,position)" dnd-isvalid="validItem(hover,dragged)" dnd-css="{onDrag:'drag-dragging',onHover:'drag-hover',onHoverTop:'drag-hover-top',onHoverMiddle:'drag-hover-middle',onHoverBottom:'drag-hover-bottom'}">
        <span class="treeview-icon treeview-icon-collapse" ng-show="(menuData.items | menuparentfilter:catitem.id:data.id).length"  ng-click="toggleItem(data)">
            <i class="material-icons">arrow_drop_down</i>
        </span>
        <span class="treeview-icon treeview-icon-right" ng-if="data.is_home==1">
            <i class="material-icons">home</i>
        </span>
        <span class="treeview-icon treeview-icon-right" ng-if="isLocked('cms_nav_item', data.id)" tooltip tooltip-text="<?= AdminModule::t('locked_info'); ?> ({{getLockedName('cms_nav_item', data.id)}})">
            <i class="material-icons">warning</i>
        </span>
        <span class="treeview-link" alt="id={{data.id}}" title="id={{data.id}}" ng-click="go(data)">
            <span class="google-chrome-font-offset-fix">{{data.title}}</span>
        </span>
    </span>
    <span ng-if="!data.is_editable" class="treeview-label treeview-label-page">
        <span class="treeview-icon treeview-icon-collapse" ng-show="(menuData.items | menuparentfilter:catitem.id:data.id).length"  ng-click="toggleItem(data)">
            <i class="material-icons">arrow_drop_down</i>
        </span>
        <span class="treeview-link" alt="id={{data.id}}" title="id={{data.id}}" style="cursor: not-allowed;">
            <span class="google-chrome-font-offset-fix text-muted"><span class="material-icons" style="font-size:8px; padding-right:2px; padding-bottom:2px;">lock</span>{{data.title}}</span>
        </span>
    </span>
    <ul class="treeview-items" ng-if="data.has_children && data.toggle_open">
        <li class="treeview-item" ng-class="{'treeview-item-active' : isCurrentElement(data), 'treeview-item-isoffline' : data.is_offline, 'treeview-item-collapsed': !data.toggle_open, 'treeview-item-ishidden': data.is_hidden, 'treeview-item-has-children' : (menuData.items | menuparentfilter:catitem.id:data.id).length}" ng-repeat="data in menuData.items | menuparentfilter:catitem.id:data.id" ng-include="'cmsNavReverse.html'"></li>
    </ul>
</script>

<div class="luya-main" ng-class="{'luya-mainnav-is-open' : isHover}">
    <div class="luya-subnav" ng-controller="CmsMenuTreeController" ng-class="{'overlaying': liveEditStateToggler}">
        <div class="cmsnav">
            <ul class="cmsnav-list cmsnav-list-buttons">
                <?php if (Yii::$app->adminuser->canRoute('cmsadmin/page/create')): ?>
                <li class="cmsnav-button" ui-sref="custom.cmsadd">
                    <div class="btn btn-block text-left btn-success">
                        <span class="material-icons">note_add</span>
                        <span class="btn-symbol-label"><?= Module::t('view_index_sidebar_new_page'); ?></span>
                    </div>
                </li>
                <?php endif; ?>
                <?php if (Yii::$app->adminuser->canRoute('cmsadmin/page/drafts')): ?>
                <li class="cmsnav-button" ui-sref="custom.cmsdraft">
                    <div class="btn btn-block text-left btn-info">
                        <span class="material-icons">receipt</span>
                        <span class="btn-symbol-label"><?= Module::t('view_index_sidebar_drafts'); ?></span>
                    </div>
                </li>
                <?php endif; ?>
            </ul>
            <ul class="cmsnav-list cmsnav-list-switches">
                <li class="cmsnav-switch">
                    <label class="switch switch-left" for="switch-live-preview">
                        <span class="switch-switch">
                            <input class="switch-checkbox" type="checkbox" id="switch-live-preview" ng-model="liveEditStateToggler" ng-true-value="1" ng-false-value="0" />
                            <span class="switch-control" for="switch-live-preview"></span>
                        </span>
                        <span class="switch-label">
                            <?= Module::t('view_index_sidebar_autopreview'); ?>
                        </span>
                    </label>
                </li>
            </ul>
            <ul class="cmsnav-list cmsnav-list-selects" ng-show="menuData.websites.length > 1 && currentWebsite && currentWebsiteToggler">
                <li class="cmsnav-select">
                    <zaa-select model="currentWebsiteToggler" clearable="false" options="menuData.websites" optionsvalue="id" optionslabel="name" initvalue="currentWebsite.id"/>
                </li>
            </ul>
            <ul class="cmsnav-list cmsnav-list-treeview treeview">
                <li class="treeview-container" ng-repeat="catitem in menuData.containers | menuwebsitefilter:currentWebsite.id" >
                    <div class="treeview-label treeview-label-container" ng-click="toggleCat(catitem.id)">
                        <span class="treeview-icon treeview-icon-collapse">
                            <i class="material-icons" ng-show="!toggleIsHidden(catitem.id)">keyboard_arrow_down</i>
                            <i class="material-icons" ng-show="toggleIsHidden(catitem.id)">keyboard_arrow_right</i>
                        </span>
                        <span class="treeview-link"><span class="google-chrome-font-offset-fix">{{catitem.name}}</span></span>
                    </div>
                    <div ng-show="(menuData.items|menuparentfilter:catitem.id:0).length == 0 && !toggleIsHidden(catitem.id)">
                        <div dnd dnd-drag-disabled dnd-isvalid="true" dnd-ondrop="dropEmptyContainer(dragged,dropped,position, catitem.id)" dnd-css="{onHover: 'drag-hover', onHoverTop: 'drag-hover-top', onHoverMiddle: 'drag-hover-top', onHoverBottom: 'drag-hover-top'}">
                            <p class="treeview-no-entry"><small><i><?= Module::t('view_index_sidebar_container_no_pages'); ?></i></small></p>
                        </div>
                    </div>
                    <ul class="treeview-items treeview-items-lvl1" ng-if="!toggleIsHidden(catitem.id)">
                        <li 
                            class="treeview-item treeview-item-lvl1" 
                            ng-class="{'treeview-item-active' : isCurrentElement(data), 'treeview-item-isoffline' : data.is_offline, 'treeview-item-collapsed': !data.toggle_open, 'treeview-item-ishidden': data.is_hidden, 'treeview-item-has-children' : (menuData.items | menuparentfilter:catitem.id:data.id).length}"
                            ng-repeat="data in menuData.items | menuparentfilter:catitem.id:0"
                            ng-include="'cmsNavReverse.html'"
                        ></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
    <div class="luya-content luya-content-cmsadmin mt-0" ui-view>
        <div ng-controller="CmsDashboard">
            <div class="card mb-2" ng-repeat="item in dashboard" ng-init="item.isToggled = ($index < 3)">
	            <div class="card-header" ng-click="item.isToggled = !item.isToggled">
	                <span class="card-title">{{item.day * 1000 | date:"EEEE, dd. MMMM"}}</span>
	            </div>
	            <div class="card-body" ng-show="item.isToggled">
	                <div class="timeline timeline-left timeline-compact">
	                    <div class="timeline-item timeline-item-center-point" ng-repeat="(key, log) in item.items">
	                        <i class="material-icons" ng-if="log.is_insertion == 1">add_box</i>
	                        <i class="material-icons" ng-if="log.is_update == 1">create</i>
                            <i class="material-icons" ng-if="log.is_deletion == 1">delete</i>
                            <small class="pr-4"><i>{{log.timestamp * 1000 | date:"HH:mm"}}</i></small>
                            <small class="pr-4">{{ log.user.firstname }} {{log.user.lastname}}</small>
	                        <small><span compile-html ng-bind-html="log.action | trustAsUnsafe"></span></small>
	                    </div>
	                </div>
	            </div>
            </div>
        </div>
    </div>
</div>