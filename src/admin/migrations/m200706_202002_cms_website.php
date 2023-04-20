<?php

use yii\db\Migration;

/**
 * Class m200706_202002_cms_website
 */
class m200706_202002_cms_website extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('cms_website', [
            'id' => $this->primaryKey(),
            'name' => $this->string(120)->unique()->notNull(),
            'is_default' => $this->boolean()->notNull()->defaultValue(false),
            'is_active' => $this->boolean()->notNull()->defaultValue(false),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'host' => $this->string(191)->unique()->notNull(),
            'aliases' => $this->string(255)->null()->defaultValue(null),
            'redirect_to_host' => $this->boolean()->notNull()->defaultValue(false),
            'theme_id' => $this->integer()->defaultValue(null),
            'default_lang' => $this->string(2)->defaultValue(null),
        ]);

        $this->insert('cms_website', [
            'id' => 1,
            'name' => 'default',
            'is_default' => true,
            'is_active' => true,
            'host' => '',
            'theme_id' => $this->db->createCommand('SELECT id FROM cms_theme WHERE is_active = 1')->queryScalar() ?: null
        ]);

        $this->addColumn('cms_nav_container', 'website_id', $this->integer()->notNull()->defaultValue(1)->after('id'));

        $this->alterColumn('cms_nav', 'parent_nav_id', $this->integer(11)->notNull()->defaultValue(0));

        $this->alterColumn('cms_nav_item_page', 'nav_item_id', $this->integer(11)->defaultValue(null));
        $this->update('cms_nav_item_page', ['nav_item_id' => 0], ['nav_item_id' => null]);

        //        $this->alterColumn('cms_nav', 'parent_nav_id', $this->integer(11)->defaultValue(null));
        //        $this->update('cms_nav', ['parent_nav_id' => null], ['parent_nav_id' => 0]);

        $this->renameColumn('cms_theme', 'is_active', 'is_default');
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_container', 'website_id');
        $this->dropTable('cms_website');
        $this->renameColumn('cms_theme', 'is_default', 'is_active');

        return true;
    }
}
