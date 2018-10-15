<?php

namespace luya\cms\admin\controllers;

use luya\admin\ngrest\base\Controller;
use luya\cms\models\Block;

/**
 * Block Controller.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockController extends Controller
{
    public $modelClass = 'luya\cms\models\Block';

    public function actionPreview($blockId = null)
    {
        $blockItem = Block::findOne($blockId);
        /** @var $blockObject \luya\cms\base\InternalBaseBlock */
        $blockObject = $blockItem->getObject('preview', 'admin-preview');

        return $blockObject->renderAdminPreview();
    }
}
