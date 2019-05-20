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
  <tr ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->navItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})" style="cursor:pointer;">
    <td>
      <a ui-sref="custom.cmsedit({ navId : <?= $block->navItemPage->navItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})"><?= $block->navItemPage->navItem->title; ?></a>
    </td>
    <td><?= Yii::$app->formatter->asBoolean($block->is_hidden); ?></td>
    <td><?= $block->navItemPage->navItem->lang->name; ?></td>
    <td><?= Yii::$app->formatter->asDate($block->navItemPage->navItem->timestamp_update); ?></td>
    <td><?= Yii::$app->formatter->asDate($block->navItemPage->navItem->timestamp_create); ?></td>
  </tr>
<?php endforeach; ?>
</table>