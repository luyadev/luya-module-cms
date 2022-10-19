<?php

namespace luya\cms\frontend\commands;

use luya\cms\models\Log;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use luya\cms\models\NavPermission;
use luya\cms\models\Property;
use luya\console\Command;
use yii\console\widgets\Table;

/**
 * Page command cms interaction.
 *
 * The page controller contains all interaction with cms nav, pages, blocks.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.4
 */
class PageController extends Command
{
    /**
     * Cleanup routine.
     *
     * The are differente cases which are part of the cleanup process:
     *
     * + find is_deleted cms nav items and remove them (with all its depending items, blocks etc.)
     * + see if cms_nav_item has a none existing cms_nav and remove them.
     * + check if cms_nav_item_page has nav_item_id which does not exists anymore if yes delete the page with all its blocks.
     * + check of nav_item_page where the nav_container does not exists anymore.
     */
    public function actionCleanup()
    {
        // return all pages with deleted items
        $navIds = Nav::find()->where(['is_deleted' => true])->select(['id'])->column();

        // get all nav items where the page is deleted.
        $navItemIds = NavItem::find()->joinWith(['nav' => function ($q) {
            $q->where(['is_deleted' => true]);
        }])->select(['{{cms_nav_item}}.id'])->column();

        // get all nav item pages from the missing navItems list
        $navItemPageIds = NavItemPage::find()->where(['in', 'nav_item_id', $navItemIds])->select(['id'])->column();

        // get all blocks from those pages
        $navItemPageBlockIds = NavItemPageBlockItem::find()->where(['in', 'nav_item_page_id', $navItemPageIds])->select(['id'])->column();



        // remove block content
        $count = 0;

        $blockItems = NavItemPageBlockItem::find()->with(['block'])->batch();
        foreach ($blockItems as $rows) {
            foreach ($rows as $item) {
                if (!$item->block) {
                    $count++;
                }
            }
        }

        $table = new Table();
        $table->setHeaders(['Type', 'Items to delete']);
        $table->setRows([
            ['Pages', count($navIds)],
            ['Page language', count($navItemIds)],
            ['Page versions', count($navItemPageIds)],
            ['Blocks', count($navItemPageBlockIds)],
            ['Block Content wihout Block', $count]
        ]);

        echo $table->run();

        if ($this->confirm('The delete process can not be undone! Are you sure you want to delete those data?')) {
            $this->printRows(Nav::deleteAll(['in', 'id', $navIds]), 'Page');
            $this->printRows(NavItem::deleteAll(['in', 'id', $navItemIds]), 'Page language');
            $this->printRows(NavItemPage::deleteAll(['in', 'id', $navItemPageIds]), 'Page version');
            $this->printRows(NavItemPageBlockItem::deleteAll(['in', 'id', $navItemPageBlockIds]), 'Block');
            // cleanup depending table data.
            $this->printRows(Property::deleteAll(['in', 'nav_id', $navIds]), 'Property');
            $this->printRows(NavPermission::deleteAll(['in', 'nav_id', $navIds]), 'Permission');

            $this->printRows(Log::deleteAll(['and', ['in', 'row_id', $navIds], ['table_name' => 'cms_nav']]), 'Page log');
            $this->printRows(Log::deleteAll(['and', ['in', 'row_id', $navItemIds], ['table_name' => 'cms_nav_item']]), 'Page language log');
            $this->printRows(Log::deleteAll(['and', ['in', 'row_id', $navItemPageBlockIds], ['table_name' => 'cms_nav_item_page_block_item']]), 'Block log');

            $blockItems = NavItemPageBlockItem::find()->with(['block'])->batch();
            foreach ($blockItems as $rows) {
                foreach ($rows as $item) {
                    if (!$item->block) {
                        $item->delete();
                    }
                }
            }

            return $this->outputSuccess('Done');
        }

        return $this->outputError("Abort by User.");
    }

    private function printRows($count, $describer)
    {
        $this->outputInfo("{$describer}: {$count} rows deleted");
    }
}
