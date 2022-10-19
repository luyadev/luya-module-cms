<?php

namespace luya\cms\injectors;

use luya\cms\base\BaseBlockInjector;
use luya\helpers\ArrayHelper;
use yii\data\ActiveDataProvider;
use yii\db\ActiveQueryInterface;

/**
 * Base class for ActiveQuery Injectors.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
abstract class BaseActiveQueryInjector extends BaseBlockInjector
{
    /**
     * @var null|string|closure This attribute from the model is used to render the admin block dropdown selection. Define
     * the field name to pick for the label or set a closure lambda function in order to provide the select label template.
     *
     * ```php
     * 'label' => function($model) {
     *     return $model->title;
     * },
     * ```
     *
     * If the label attribute is not defined, just all attribute from the model will be displayed.
     */
    public $label;

    /**
     * @var boolean|array Whether the extra assigned data should enable pagination.
     */
    public $pagination = false;

    private $_query;

    /**
     * Setter method for the active query interface.
     *
     * Define the active query which will be used to retrieve data must be an instance of {{\yii\db\ActiveQueryInterface}}.
     *
     * @param ActiveQueryInterface $query The query provider for the {{yii\data\ActiveDataProvider}}.
     */
    public function setQuery(ActiveQueryInterface $query)
    {
        $this->_query = $query;
    }

    /**
     * Get the Active Query Object.
     *
     * @return ActiveQueryInterface
     * @since 2.1.0
     */
    protected function getQuery()
    {
        return $this->_query;
    }

    /**
     * Get an array with options
     *
     * @return array
     */
    protected function getQueryData()
    {
        $provider = new ActiveDataProvider([
            'query' => $this->_query,
            'pagination' => false,
        ]);

        $data = [];
        foreach ($provider->getModels() as $model) {
            if (is_callable($this->label)) {
                $label = call_user_func($this->label, $model);
            } elseif (is_string($this->label)) {
                $label = $model->{$this->label};
            } else {
                $label = implode(", ", $model->getAttributes());
            }
            $data[] = ['value' => $model->primaryKey, 'label' => $label];
        }

        return $data;
    }

    /**
     * Get the Active Record models from the stored block values
     *
     * @return \yii\db\ActiveRecord[]
     */
    protected function getExtraAssignArrayData()
    {
        $ids = ArrayHelper::getColumn($this->getContextConfigValue($this->varName, []), 'value');

        $provider = new ActiveDataProvider([
            'query' => $this->_query->andWhere(['in', 'id', $ids]),
            'pagination' => $this->pagination,
        ]);

        return $provider->getModels();
    }

    /**
     * Get a single active record based on the stored block value.
     *
     * @return \yii\db\ActiveRecord
     */
    protected function getExtraAssignSingleData()
    {
        $value = $this->getContextConfigValue($this->varName);

        if (!$value) {
            return false;
        }

        return $this->getQuery()->where(['id' => $value])->one();
    }
}
