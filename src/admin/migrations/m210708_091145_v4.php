<?php

use yii\db\Migration;

/**
 * Class m210708_091145_v4
 */
class m210708_091145_v4 extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item_page', 'timestamp_update', $this->integer());
        $this->alterColumn('cms_nav_item', 'alias', $this->string(180)->notNull());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item_page', 'timestamp_update');
        $this->alterColumn('cms_nav_item', 'alias', $this->string(80)->notNull());
    }
}
