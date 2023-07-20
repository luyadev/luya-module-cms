<?php

use luya\cms\models\NavItemRedirect;
use yii\db\Migration;

/**
 * Class m210708_091145_v4
 */
class m230720_130000_page_link_anchor extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn(NavItemRedirect::tableName(), 'anchor', $this->string());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn(NavItemRedirect::tableName(), 'anchor');
    }
}
