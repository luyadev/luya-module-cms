<?php
use luya\admin\helpers\Angular;
use luya\admin\Module as AdminModule;
use luya\cms\admin\Module;

?>
<modal is-modal-hidden="pageSettingsOverlayHidden" modal-title="<?= Module::t('cmsadmin_settings_modal_title'); ?>">
    <div ng-if="!pageSettingsOverlayHidden" class="row">
        <div class="col-md-3">
            <ul class="nav nav-pills flex-column">
                <li class="nav-item">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=9" ng-class="{'active':pageSettingsOverlayTab==9}"><i class="material-icons">tag</i><span><?= AdminModule::t('menu_system_item_tags'); ?></span></a>
                </li>
                <li class="nav-item" ng-show="propertiesData.length > 0">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=2" ng-class="{'active':pageSettingsOverlayTab==2}"><i class="material-icons">menu_open</i><span><?= Module::t('view_update_properties_title'); ?></span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=4" ng-class="{'active':pageSettingsOverlayTab==4}"><i class="material-icons">content_copy</i><span><?= Module::t('page_update_actions_deepcopy_title'); ?></span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=8" ng-class="{'active':pageSettingsOverlayTab==8}"><i class="material-icons">collections</i><span><?= Module::t('page_update_actions_deepcopyastemplate_title'); ?></span></a>
                </li>
                <li class="nav-item" ng-show="!isDraft">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=5" ng-class="{'active':pageSettingsOverlayTab==5}"><i class="material-icons">home</i><span><?= Module::t('cmsadmin_settings_homepage_title'); ?></span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=3" ng-class="{'active':pageSettingsOverlayTab==3}"><i class="material-icons">web</i><span><?= Module::t('page_update_actions_layout_title'); ?></span></a>
                </li>
                <?php if (Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)): ?>
                <li class="nav-item">
                    <a class="nav-link nav-link-icon" ng-click="pageSettingsOverlayTab=6" ng-class="{'active':pageSettingsOverlayTab==6}"><i class="material-icons">delete</i><span><?= Module::t('cmsadmin_settings_trashpage_title'); ?></span></a>
                </li>
                <?php endif; ?>
            </ul>
        </div>
        <div class="col-md-9" ng-switch="pageSettingsOverlayTab">
            <div ng-switch-when="9">
                <?= Angular::tagArray('pageTags', AdminModule::t('menu_system_item_tags')); ?>
                <p><button type="button" class="btn btn-save btn-icon" ng-click="savePageTags()"><?= Module::t('btn_save'); ?></button></p>
            </div>
            <div ng-switch-when="2">
                <h1><?= Module::t('view_update_properties_title'); ?></h1>
                <p ng-show="!hasValues" ><?= Module::t('view_update_no_properties_exists'); ?></p>
                <div ng-repeat="prop in propertiesData" ng-class="{'border-top border-light pt-4': !$first}">
                    <span class="help-button btn btn-icon btn-help" tooltip tooltip-text="{{prop.help}}" ng-show="prop.help" tooltip-position="left"></span>
                    <div ng-if="prop.i18n">
                        <ul>
                            <li ng-repeat="lang in languagesData">
                                <zaa-injector dir="prop.type" options="prop.option_json" fieldid="{{prop.var_name}}" fieldname="{{prop.var_name}}" initvalue="{{prop.default_value}}" label="{{lang.name}}: {{prop.label}}" model="propValues[prop.id][lang.short_code]"></zaa-injector>
                            </li>
                        </ul>
                    </div>
                    <div ng-if="!prop.i18n">
                        <zaa-injector dir="prop.type" options="prop.option_json" fieldid="{{prop.var_name}}" fieldname="{{prop.var_name}}" initvalue="{{prop.default_value}}" label="{{prop.label}}" model="propValues[prop.id]"></zaa-injector>
                    </div>
                </div>
                <button type="button" ng-click="storePropValues()" class="btn btn-save btn-icon" ng-show="hasValues"><?= Module::t('btn_refresh'); ?></button>
                <button type="button" ng-click="storePropValues()" class="btn btn-save btn-icon" ng-show="!hasValues"><?= Module::t('btn_save'); ?></button>
            </div>
            <div ng-switch-when="3">
                <h1><?= Module::t('page_update_actions_layout_title'); ?></h1>
                <p><?= Module::t('page_update_actions_layout_text'); ?></p>
                <form ng-submit="submitNavForm({layout_file: navData.layout_file})">
                    <zaa-text model="navData.layout_file" label="<?= Module::t('page_update_actions_layout_file_field'); ?>"></zaa-text>
                    <button class="btn btn-save btn-icon" type="submit"><?= Module::t('btn_save'); ?></button>
                </form>
            </div>
            <div ng-switch-when="4">
                <h1><?= Module::t('page_update_actions_deepcopy_title'); ?></h1>
                <p><?= Module::t('page_update_actions_deepcopy_text'); ?></p>
                <p><button type="button" class="btn btn-save btn-icon" ng-click="createDeepPageCopy()"><?= Module::t('page_update_actions_deepcopy_btn'); ?></button></p>
            </div>
            <div ng-switch-when="5" ng-show="!isDraft">
                <h1><?= Module::t('cmsadmin_settings_homepage_title'); ?></h1>
                <p><?= Module::t('view_update_homepage_info'); ?></p>
                <!-- OLD CODE -->
                <label ng-if="!navData.is_home">
                    <button type="button" ng-click="navData.is_home=1" class="btn btn-save btn-icon"><?= Module::t('view_update_set_as_homepage_btn'); ?></button>
                </label>
                <button type="button" class="btn btn-success btn-disabled" disabled ng-if="navData.is_home"><?= Module::t('view_update_is_homepage'); ?></button>
            </div>
            <?php if (Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)): ?>
            <div ng-switch-when="6">
                <h1><?= Module::t('cmsadmin_settings_trashpage_title'); ?></h1>
                <p><a ng-click="trash()" class="btn btn-delete btn-icon"><?= Module::t('cmsadmin_settings_trashpage_title'); ?></a></p>
            </div>
            <?php endif; ?>

            <div ng-switch-when="8">
                <h1><?= Module::t('page_update_actions_deepcopyastemplate_title'); ?></h1>
                <p><?= Module::t('page_update_actions_deepcopyastemplate_text'); ?></p>
                <p><button type="button" class="btn btn-save btn-icon" ng-click="createDeepPageCopyAsTemplate()"><?= Module::t('page_update_actions_deepcopyastemplate_btn'); ?></button></p>
            </div>
        </div>
    </div>
</modal>
