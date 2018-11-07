<?php

namespace luya\cms\admin\controllers;

use luya\admin\ngrest\base\Controller;
use luya\cms\models\Block;
use yii\web\NotFoundHttpException;

/**
 * Block Controller.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockController extends Controller
{
    public $modelClass = 'luya\cms\models\Block';

    /**
     * Generate the the block preview.
     *
     * @param int $blockId
     * @return string
     * @throws NotFoundHttpException
     * @since 1.0.8
     */
    public function actionPreview($blockId)
    {
        $blockItem = Block::findOne($blockId);
        if (!$blockItem) {
            throw new NotFoundHttpException();
        }

        /** @var $blockObject \luya\cms\base\InternalBaseBlock */
        $blockObject = $blockItem->getObject('preview', 'admin-preview');

        return $blockObject->renderAdminPreview();
    }
}
