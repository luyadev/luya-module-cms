<?php

use yii\db\Migration;

/**
 * Class m190227_123549_cms_nav_item_strict_url_parsing
 */
class m190529_123549_cms_nav_item_module_route_and_params extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item_module', 'controller_name', $this->string());
        $this->addColumn('cms_nav_item_module', 'action_name', $this->string());
        $this->addColumn('cms_nav_item_module', 'action_params', $this->text());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item_module', 'controller_name');
        $this->dropColumn('cms_nav_item_module', 'action_name');
        $this->dropColumn('cms_nav_item_module', 'action_params');
    }
}
