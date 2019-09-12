<?php

/**
 * BlockPagesActiveWindow Index View.
 *
 * @var $this \luya\admin\ngrest\base\ActiveWindowView
 * @var $model \luya\admin\ngrest\base\NgRestModel
 */
?>
<table class="table table-striped table-hover table-bordered">
<thead>
<tr>
  <th>Title</th>
  <th>Language</th>
  <th>Version</th>
  <th>Block Visible</th>
  <th>Last Update</th>
  <th>Created</th>
</tr>
</thead>
<?php if (isset($blocks)) : ?>
    <?php foreach ($blocks as $block): ?>
        <tr ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})" style="cursor:pointer;">
            <td>
                <a ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})"><?= $block->navItemPage->forceNavItem->title; ?></a>
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