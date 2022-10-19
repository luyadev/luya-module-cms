<?php

namespace luya\cms\models;

use luya\admin\models\Property as AdminProperty;

/**
 * CMS PROPERTY
 *
 * Each CMS property is attached to an ADMIN PROPERTY with the current navigation (nav_id) context.
 *
 * @property \luya\admin\base\Property $object
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
final class Property extends \yii\db\ActiveRecord
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_nav_property';
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['nav_id', 'admin_prop_id', 'value'], 'required'],
        ];
    }

    /**
     * Property Active Query.
     *
     * @return \luya\admin\models\Property
     */
    public function getAdminProperty()
    {
        return $this->hasOne(AdminProperty::class, ['id' => 'admin_prop_id']);
    }

    private $_object;

    /**
     * Create the Property object with the given value.
     *
     * @return \luya\admin\base\Property
     */
    public function getObject()
    {
        if ($this->_object === null) {
            $this->_object = $this->adminProperty->createObject($this->value);
        }

        return $this->_object;
    }
}
