<?php
use luya\cms\admin\Module;

?>
<div ng-controller="CmsadminCreateController">
    <h1><?= Module::t('view_index_add_title'); ?></h1>
    <create-form data="data"></create-form>
</div>