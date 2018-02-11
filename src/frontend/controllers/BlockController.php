<?php

namespace luya\cms\frontend\controllers;

use Yii;
use yii\helpers\Inflector;
use luya\helpers\ObjectHelper;
use luya\cms\models\Block;
use luya\cms\models\NavItemPageBlockItem;
use luya\cms\frontend\base\Controller;
use luya\cms\Exception;

/**
 * CMS Ajax-Block Controller Responder.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class BlockController extends Controller
{
	/**
	 * @inheritdoc
	 */
    public $enableCsrfValidation = false;
    
    /**
     * Run the callback for a given block.
     * 
     * @param string $callback The name of the callback to call inside the block object. Without callback prefix.
     * @param integer $id The id of the block item where the callbacke is located.
     * @throws \luya\cms\Exception
     * @return mixed
     */
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
