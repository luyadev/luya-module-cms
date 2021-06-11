<?php

use yii\db\Migration;

/**
 * Class m210605_172811_cms_website_permissions
 */
class m210605_172811_cms_website_permissions extends Migration
{
    /**
     * {@inheritdoc}
     */
    public function safeUp()
    {
        $this->addColumn(\luya\cms\models\Website::tableName(), 'group_ids', $this->text());
        $this->addColumn(\luya\cms\models\Website::tableName(), 'user_ids', $this->text());
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn(\luya\cms\models\Website::tableName(), 'group_ids');
        $this->dropColumn(\luya\cms\models\Website::tableName(), 'user_ids');

        return true;
    }
}
