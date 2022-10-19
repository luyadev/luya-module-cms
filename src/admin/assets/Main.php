<?php

namespace luya\cms\admin\assets;

/**
 * CMS Main Asset Bundle.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class Main extends \yii\web\AssetBundle
{
    /**
     * @inheritdoc
     */
    public $sourcePath = '@cmsadmin/resources';

    /**
     * @inheritdoc
     */
    public $js = [
        'dist/main.js'
    ];

    /**
     * @inheritdoc
     */
    public $css = [
        'dist/main.css',
    ];

    /**
     * @inheritdoc
     */
    public $depends = [
        'luya\admin\assets\Main',
    ];

    /**
     * @inheritdoc
     */
    public $publishOptions = [
        'except' => [
            'node_modules/',
        ]
    ];
}
