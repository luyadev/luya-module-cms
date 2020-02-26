<?php

use yii\db\Migration;

/**
 * Class m200226_211908_nav_item_is_cacheable
 */
class m200226_211908_nav_item_is_cacheable extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item', 'is_cacheable', $this->boolean()->defaultValue(false));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item', 'is_cacheable');
    }
}
