<?php

namespace luya\cms\base;

use yii\helpers\Inflector;

/**
 * Generate Block Flavor Variations.
 *
 * The register output generates:
 *
 * ```php
 * textBlock::class => [
 *     'variation1' => [
 *         'title' => 'Variation Auswahl für Fetti Font Css Class',
 *         'cfgs' => ['cssClass' => 'fetti-font-css-class'],
 *         'vars' => ['textType' => 1],
 *         'is_default' => 0
 *     ],
 * ]
 * ```
 *
 * In order to configure the blockVariations property of the cms admin module:
 *
 * ```php
 * TextBlock::variations()
 *     ->add('bold', 'Bold Font with Markdown')->cfgs(['cssClass' => 'bold-font-class'])->vars(['textType' => 1])
 *     ->add('italic', 'Italic Font')->cfgs(['cssClass' => 'italic-font-class'])
 *     ->register(),
 * VideoBlock::variations()
 *     ->add('bold', 'Bold Videos')->cfgs([])->register(),
 * ```
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockVariationRegister
{
    private array $_variations = [];

    private $_tempIdentifier;

    public function __construct(protected InternalBaseBlock $block)
    {
    }

    /**
     * Register a new flavor.
     *
     * @param string $identifier
     * @param string $title
     * @return \luya\cms\base\BlockVariationRegister
     */
    public function add($identifier, $title)
    {
        $identifier = Inflector::slug($identifier);
        $this->_variations[$identifier] = [
            'title' => $title,
            'cfgs' => [],
            'vars' => [],
            'extras' => [],
            'is_default' => false,
        ];
        $this->_tempIdentifier = $identifier;
        return $this;
    }

    /**
     * Add option to register a variations as default.
     *
     * This means that when a cfg or value has no user input data, this value will be used.
     *
     * This implementation does not check whether another variation has the default check,
     * so make sure that only a single entry can be the default entry.
     *
     * @return \luya\cms\base\BlockVariationRegister
     * @since 1.0.8
     */
    public function asDefault()
    {
        $this->_variations[$this->_tempIdentifier]['is_default'] = true;

        return $this;
    }

    /**
     * Flavor CFG variables.
     *
     * @return \luya\cms\base\BlockVariationRegister
     */
    public function cfgs(array $config)
    {
        $this->_variations[$this->_tempIdentifier]['cfgs'] = $config;
        return $this;
    }

    /**
     * Flavor VAR variables.
     *
     * @return \luya\cms\base\BlockVariationRegister
     */
    public function vars(array $config)
    {
        $this->_variations[$this->_tempIdentifier]['vars'] = $config;
        return $this;
    }

    /**
     * Flavor EXTRA variables.
     *
     * @return \luya\cms\base\BlockVariationRegister
     */
    public function extras(array $config)
    {
        $this->_variations[$this->_tempIdentifier]['extras'] = $config;
        return $this;
    }

    /**
     * @return array
     */
    public function register()
    {
        return [$this->block->className() => $this->_variations];
    }
}
