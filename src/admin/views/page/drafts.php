<?php
use luya\cms\admin\Module;

?>
<h1><?php echo Module::t('draft_title'); ?></h1>
<p><?php echo Module::t('draft_text'); ?></p>
<div class="card" ng-controller="DraftsController">
    <div class="card-content">
    <table class="table mb-0">
        <thead>
        <tr>
            <th><?php echo Module::t('draft_column_title'); ?></th>
            <th><?php echo Module::t('draft_column_action'); ?></th>
        </tr>
        </thead>
        <tr ng-repeat="item in menuData.drafts">
            <td style="vertical-align: middle;"><a ng-click="go(item.id)">{{item.title}}</a></td>
            <td><button type="button" ng-click="go(item.id)" class="btn btn-icon btn-sm btn-edit"><?= Module::t('draft_edit_button'); ?></button>
        </tr>
    </table>
    </div>
</div>