<?php

use luya\cms\models\Website;
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
        $this->addColumn(Website::tableName(), 'group_ids', $this->text());
        $this->addColumn(Website::tableName(), 'user_ids', $this->text());

        $this->update(Website::tableName(), [
            'group_ids' => '[{"value":0}]',
            'user_ids' => '[{"value":0}]',
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function safeDown()
    {
        $this->dropColumn(Website::tableName(), 'group_ids');
        $this->dropColumn(Website::tableName(), 'user_ids');

        return true;
    }
}
