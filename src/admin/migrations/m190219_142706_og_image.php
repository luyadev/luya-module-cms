<?php

use yii\db\Migration;

/**
 * Class m190219_142706_og_image
 */
class m190219_142706_og_image extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item', 'image_id', $this->integer());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item', 'image_id');
    }
}
