<?php

namespace luya\cms\frontend\controllers;

use luya\cms\frontend\base\Controller;
use Yii;
use yii\helpers\Inflector;
use yii\base\Exception;
use luya\helpers\ObjectHelper;
use luya\cms\models\Block;
use luya\cms\models\NavItemPageBlockItem;

/**
 * CMS Ajax-Block Controller Responder.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockController extends Controller
{
    public $enableCsrfValidation = false;
    
    public function actionIndex($callback, $id)
    {
        $model = NavItemPageBlockItem::findOne($id);
        
        if (!$model) {
            throw new Exception("Unable to find item id.");
        }
        
        $block = Block::objectId($model->block_id, $model->id, 'callback');

        if (!$block) {
            throw new Exception("Unable to find block object.");
        }
        
        return ObjectHelper::callMethodSanitizeArguments($block, 'callback'.Inflector::id2camel($callback), Yii::$app->request->get());
    }
}
