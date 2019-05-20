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
  <th>Block Visibility</th>
  <th>Language</th>
  <th>Last Update</th>
  <th>Created</th>
</tr>
</thead>
<?php foreach ($blocks as $block): ?>
  <tr ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})" style="cursor:pointer;">
    <td>
      <a ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})"><?= $block->navItemPage->forceNavItem->title; ?></a>
    </td>
    <td><?= Yii::$app->formatter->asBoolean($block->is_hidden); ?></td>
    <td><?= $block->navItemPage->forceNavItem->lang->name; ?></td>
    <td><?= Yii::$app->formatter->asDate($block->navItemPage->forceNavItem->timestamp_update); ?></td>
    <td><?= Yii::$app->formatter->asDate($block->navItemPage->forceNavItem->timestamp_create); ?></td>
  </tr>
<?php endforeach; ?>
</table>