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
        $this->createTable('cms_website',[
            'id' => $this->primaryKey(),
            'name' => $this->string(20)->unique()->notNull(),
            'is_default' => $this->boolean()->notNull()->defaultValue(false),
            'is_active' => $this->boolean()->notNull()->defaultValue(false),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'host' => $this->string(255)->unique()->notNull(),
            'aliases' => $this->string(255)->null()->defaultValue(null),
            'redirect_to_host' => $this->boolean()->notNull()->defaultValue(false),
        ]);
        
        $this->insert('cms_website', [
            'id' => 1,
            'name' => 'default',
            'is_default' => true,
            'is_active' => true,
            'host' => ''
        ]);
        
        $this->addColumn('cms_nav_container', 'website_id', $this->integer()->notNull()->defaultValue(1)->after('id'));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_container', 'website_id');
        $this->dropTable('cms_website');

        return true;
    }
}
