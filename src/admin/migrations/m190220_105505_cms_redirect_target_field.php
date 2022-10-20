<?php

use yii\db\Migration;

/**
 * Class m190220_105505_cms_redirect_target_field
 */
class m190220_105505_cms_redirect_target_field extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn('cms_nav_item_redirect', 'target', $this->string());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn('cms_nav_item_redirect', 'target');
    }
}
