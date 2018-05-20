<?php

/**
 * BlockPagesActiveWindow Index View.
 *
 * @var $this \luya\admin\ngrest\base\ActiveWindowView
 * @var $model \luya\admin\ngrest\base\NgRestModel
 */
?>
<ul class="list-group">

<?php foreach ($pages as $page): ?>
  <a class="list-group-item d-flex justify-content-between align-items-center" ui-sref="custom.cmsedit({ navId : <?= $page->navItemPage->forceNavItem->nav_id; ?>, templateId: 'cmsadmin/default/index'})">
    <?= $page->navItemPage->forceNavItem->title; ?>
<?php endforeach; ?>
</ul>