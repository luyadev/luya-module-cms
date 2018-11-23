<?php

use yii\db\Migration;

/**
 * Class m181123_065051_cms_nav_item_property
 */
class m181123_065051_cms_nav_item_property extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->createTable('cms_nav_item_property', [
            'id' => $this->primaryKey(),
            'nav_item_id' => $this->integer(11)->notNull()->unique(),
            'canonical' => $this->string(),
            'og_title' => $this->string(50),
            'og_type' => $this->string(50),
            'og_description' => $this->string(),
            'og_image' => $this->string(),
        ]);
        
        $this->batchInsert('cms_nav_item_property', ['nav_item_id'], \luya\cms\models\NavItem::find()->select(['nav_item_id' => 'id'])->asArray()->all());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropTable('cms_nav_item_property');

        return true;
    }
}
