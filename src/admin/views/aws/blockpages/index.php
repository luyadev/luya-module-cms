<?php

/**
 * BlockPagesActiveWindow Index View.
 *
 * @var $this \luya\admin\ngrest\base\ActiveWindowView
 * @var $model \luya\admin\ngrest\base\NgRestModel
 */

use luya\cms\admin\Module;

?>
<table class="table table-striped table-hover table-bordered">
<thead>
<tr>
    <th><?= Module::t('aws_block_pages_title_label'); ?></th>
    <th><?= Module::t('aws_block_pages_language_label'); ?></th>
    <th><?= Module::t('aws_block_pages_version_label'); ?></th>
    <th><?= Module::t('aws_block_pages_block_visible_label'); ?></th>
    <th><?= Module::t('aws_block_pages_last_updated_label'); ?></th>
    <th><?= Module::t('aws_block_pages_created_label'); ?></th>
</tr>
</thead>
<?php if (isset($blocks)) : ?>
    <?php foreach ($blocks as $block): ?>
        <tr ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})" style="cursor:pointer;">
            <td>
                <i class="material-icons <?= $block->navItemPage->forceNavItem->nav->is_hidden ? 'text-danger' : 'text-success'; ?>">
                    <?= $block->navItemPage->forceNavItem->nav->is_hidden ? 'visibility_off' : 'visibility'; ?>
                </i>

                <i class="material-icons <?= $block->navItemPage->forceNavItem->nav->is_offline ? 'text-danger' : 'text-success'; ?>">
                    <?= $block->navItemPage->forceNavItem->nav->is_offline ? 'cloud_off' : 'cloud_queue'; ?>
                </i>

                <a class="ml-2" ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})"><?= $block->navItemPage->forceNavItem->title; ?></a>
            </td>
            <td><?= $block->navItemPage->forceNavItem->lang->name; ?></td>
            <td><?= $block->navItemPage->version_alias; ?></td>
            <td><?= Yii::$app->formatter->asBoolean(!$block->is_hidden); ?></td>
            <td><?= Yii::$app->formatter->asDate($block->navItemPage->forceNavItem->timestamp_update); ?></td>
            <td><?= Yii::$app->formatter->asDate($block->navItemPage->forceNavItem->timestamp_create); ?></td>
        </tr>
    <?php endforeach; ?>
<?php endif ?>
</table>