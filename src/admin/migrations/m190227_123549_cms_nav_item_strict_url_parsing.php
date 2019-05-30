<?php

use yii\db\Migration;

/**
 * Class m190227_123549_cms_nav_item_strict_url_parsing
 */
class m190227_123549_cms_nav_item_strict_url_parsing extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item', 'is_url_strict_parsing_disabled', $this->boolean()->defaultValue(false));
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item', 'is_url_strict_parsing_disabled');
    }
}
