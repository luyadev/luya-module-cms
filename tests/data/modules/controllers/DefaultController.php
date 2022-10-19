<?php

namespace cmstests\data\modules\controllers;

use luya\cms\Exception;
use luya\web\Controller;

class DefaultController extends Controller
{
    public function actionIndex()
    {
        return 'cmsunitmodule/default/index';
    }

    public function actionWithArgs($param)
    {
        return $param;
    }

    public function actionException()
    {
        throw new Exception();
    }
}
