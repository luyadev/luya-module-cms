<?php
use luya\admin\helpers\Angular;
use luya\cms\admin\Module;

?>
<script type="text/ng-template" id="createform.html">
    <div class="card">
        <div class="card-header">
            <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                    <a class="nav-link" ng-class="{'active' : data.nav_item_type == 1}" ng-click="data.nav_item_type = 1"><?= Module::t('view_index_type_page'); ?></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" ng-class="{'active' : data.nav_item_type == 2}" ng-click="data.nav_item_type = 2;  data.is_draft = 0"><?= Module::t('view_index_type_module'); ?></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" ng-class="{'active' : data.nav_item_type == 3}" ng-click="data.nav_item_type = 3;  data.is_draft = 0"><?= Module::t('view_index_type_redirect'); ?></a>
                </li>
            </ul>
        </div>
        <div  class="card-body">
            <form ng-switch on="data.nav_item_type" ng-submit="exec()">
                <div class="form-group" ng-show="data.nav_item_type == 1 && !data.isInline">
                    <label for="exampleInputEmail1"><?= Module::t('view_index_as_draft'); ?></label>
                    <div class="form-check">
                        <input class="form-check-input" ng-checked="data.is_draft == 1" type="radio" name="inlineRadioOptions" id="update-as-draft-yes" />
                        <label class="form-check-label" ng-click="data.is_draft = 1" for="update-as-draft-yes"><?= Module::t('view_index_yes'); ?></label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" ng-checked="data.is_draft == 0" type="radio" name="inlineRadioOptions" id="update-as-draft-no" />
                        <label class="form-check-label" ng-click="data.is_draft = 0" for="update-as-draft-no"><?= Module::t('view_index_no'); ?></label>
                    </div>
                </div>
                <div class="form-group" ng-init="showFocus=true">
                    <label><?= Module::t('view_index_page_title'); ?></label>
                    <input name="text" type="text" class="form-control" ng-model="data.title" ng-change="aliasSuggestion()" focus-me="showFocus" />
                </div>
                <div class="form-group">
                    <label><?= Module::t('view_index_page_alias'); ?></label>
                    <input name="text" type="text" class="form-control" ng-model="data.alias" />
                </div>
                <div class="form-group" ng-show="data.is_draft==0 && !data.isInline">
                    <label for="navigationPos"><?= Module::t('view_index_page_label_parent_nav_id'); ?></label>
                    <div class="form-check">
                        <input class="form-check-input" ng-checked="data.parent_nav_id == 0" type="radio" name="navigationPos" id="nav-pos-root" />
                        <label class="form-check-label" ng-click="data.parent_nav_id = 0" for="nav-pos-root"><?= Module::t('view_index_page_label_parent_nav_id_root'); ?></label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" ng-checked="data.parent_nav_id != 0" type="radio" name="navigationPos" id="nav-pos-subpage" />
                        <label class="form-check-label" ng-click="data.parent_nav_id = 1" for="nav-pos-subpage"><?= Module::t('view_index_page_label_parent_nav_id_subpage'); ?></label>
                    </div>
                </div>
                <div class="form-group" ng-show="data.is_draft==0" ng-hide="data.isInline || navcontainer.length == 1 || data.parent_nav_id!=0">
                    <label><?= Module::t('view_index_page_nav_container'); ?></label>
                    <select class="form-control" ng-model="data.nav_container_id" ng-options="item.id as item.name for item in (navcontainers | menuwebsitefilter:currentWebsite.id)"></select>
                </div>
                <div class="form-group" ng-show="data.is_draft==0 && !data.isInline && data.parent_nav_id != 0">
                    <label><?= Module::t('view_index_page_label_subpage'); ?></label>
                    <menu-dropdown style="margin:0px; padding:0px;" class="menu-dropdown" nav-id="data.parent_nav_id"></menu-dropdown>
                </div>
                <hr />
                <div ng-switch-when="1">
                    <create-form-page data="data"></create-form-page>
                </div>
                <div ng-switch-when="2">
                    <form-module data="data"></form-module>
                </div>
                <div ng-switch-when="3">
                    <zaa-link model="data.redirect"></zaa-link>
                </div>
                <button type="submit" class="btn btn-icon btn-save"><?= Module::t('btn_save'); ?></button>
            </form>
        </div>
    </div>
</script>

<!-- CREATE PAGE FORM -->
<script type="text/ng-template" id="createformpage.html">
    <div class="form-group" ng-show="!data.isInline">
        <label class="input__label"><?= Module::t('view_index_page_use_draft'); ?></label>
        <div class="form-check">
            <input class="form-check-input" type="radio" ng-checked="data.use_draft == 1" id="create-as-draft-yes">
            <label class="form-check-label" ng-click="data.use_draft = 1; data.layout_id = 0" for="create-as-draft-yes"><?= Module::t('view_index_yes'); ?></label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" ng-checked="data.use_draft == 0" id="create-as-draft-no" />
            <label class="form-check-label" ng-click="data.use_draft = 0; data.from_draft_id = 0" for="create-as-draft-no"><?= Module::t('view_index_no'); ?></label>
        </div>
    </div>
    <div class="form-group" ng-if="data.use_draft==1">
        <label><?= Module::t('view_index_page_select_draft'); ?></label>
        <luya-select ng-model="data.from_draft_id" options="drafts"></luya-select>
    </div>
    <div class="form-group" ng-if="data.use_draft==0">
        <label><?= Module::t('view_index_page_layout'); ?></label>
        <luya-select ng-model="data.layout_id" options="layouts"></luya-select>
    </div>
</script>
<!-- PAGE UPDATE FORM -->
<script type="text/ng-template" id="updateformpage.html">
    <div class="form-group" ng-show="!isEditAvailable()">
        <label><?= Module::t('view_index_page_layout'); ?></label>
        <luya-select ng-model="data.layout_id" options="layoutsData"></luya-select>
    </div>
    <div class="form-group" ng-show="isEditAvailable()">
        <label><?= Module::t('view_index_page_version_chooser'); ?></label>
        <luya-select ng-model="data.nav_item_type_id" options="versionsData"></luya-select>
    </div>
</script>

<!-- MODULE -->
<script type="text/ng-template" id="formmodule.html">
    <?= Angular::select('data.module_name', Module::t('view_index_module_select'), 'modules')->hint(Module::t('view_index_module_select_help')); ?>
    <collapse-container title="<?= Module::t('view_index_module_advanced_settings_button'); ?>" class="mb-3">
        <?= Angular::select('data.controller_name', Module::t('view_index_module_controller_name'), 'controllers'); ?>
        <?= Angular::select('data.action_name', Module::t('view_index_module_action_name'), 'actions'); ?>
        <zaa-json-object ng-show="data.action_name" model="data.action_params" label="<?= Module::t('view_index_module_action_params'); ?>"></zaa-json-object>
    </collapse-container>
</script>
<!-- // MODULE -->