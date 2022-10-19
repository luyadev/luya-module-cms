<?php

use yii\db\Migration;

/**
 * Class m180723_123237_indexes
 */
class m180723_123237_indexes extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        // cms_block
        $this->createIndex('index_cms_block_group_id', 'cms_block', ['group_id']);
        $this->createIndex('index_cms_block_class', 'cms_block', ['class']);

        // cms log
        $this->createIndex('index_cms_log_user_id', 'cms_log', ['user_id']);

        // cms_nav
        $this->createIndex('index_cms_nav_nav_container', 'cms_nav', ['nav_container_id']);
        $this->createIndex('index_cms_nav_parent_nav_id', 'cms_nav', ['parent_nav_id']);

        // cms_nav_item
        $this->createIndex('index_cms_nav_item_alias', 'cms_nav_item', ['alias']);
        $this->createIndex('index_cms_nav_item_nav_id', 'cms_nav_item', ['nav_id']);
        $this->createIndex('index_cms_nav_item_lang_id', 'cms_nav_item', ['lang_id']);
        $this->createIndex('index_cms_nav_item_nav_item_type_id', 'cms_nav_item', ['nav_item_type_id']);
        $this->createIndex('index_cms_nav_item_create_user_id', 'cms_nav_item', ['create_user_id']);
        $this->createIndex('index_cms_nav_item_update_user_id', 'cms_nav_item', ['update_user_id']);

        // cms_nav_item_page
        $this->createIndex('index_cms_nav_item_page_layout_id', 'cms_nav_item_page', ['layout_id']);
        $this->createIndex('index_cms_nav_item_page_nav_item_id', 'cms_nav_item_page', ['nav_item_id']);
        $this->createIndex('index_cms_nav_item_page_create_user_id', 'cms_nav_item_page', ['create_user_id']);

        // cms_nav_item_page_block_item
        $this->createIndex('index_cms_nav_item_page_block_item_block_id', 'cms_nav_item_page_block_item', ['block_id']);
        $this->createIndex('index_cms_nav_item_page_block_item_placeholder_var', 'cms_nav_item_page_block_item', ['placeholder_var']);
        $this->createIndex('index_cms_nav_item_page_block_item_nav_item_page_id', 'cms_nav_item_page_block_item', ['nav_item_page_id']);
        $this->createIndex('index_cms_nav_item_page_block_item_prev_id', 'cms_nav_item_page_block_item', ['prev_id']);
        $this->createIndex('index_cms_nav_item_page_block_item_create_user_id', 'cms_nav_item_page_block_item', ['create_user_id']);
        $this->createIndex('index_cms_nav_item_page_block_item_update_user_id', 'cms_nav_item_page_block_item', ['update_user_id']);

        //index_nav_item_page_id_paceholder_var_prev_id_is_hidden_sort_index
        $this->createIndex('index_nipi_pv_pi_ih_si', 'cms_nav_item_page_block_item', ['nav_item_page_id', 'placeholder_var', 'prev_id', 'is_hidden', 'sort_index']);

        // cms_nav_permission
        $this->createIndex('index_cms_nav_permission_group_id', 'cms_nav_permission', ['group_id']);
        $this->createIndex('index_cms_nav_permission_nav_id', 'cms_nav_permission', ['nav_id']);
        $this->createIndex('index_cms_nav_permission_group_id_nav_id', 'cms_nav_permission', ['group_id', 'nav_id']);

        // cms_nav_property
        $this->createIndex('index_cms_nav_property_nav_id', 'cms_nav_property', ['nav_id']);
        $this->createIndex('index_cms_nav_property_admin_prop_id', 'cms_nav_property', ['admin_prop_id']);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        echo "m180723_123237_indexes cannot be reverted.\n";

        return false;
    }
}
