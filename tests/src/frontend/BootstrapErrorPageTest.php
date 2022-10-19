<?php

namespace cmstests\src\frontend;

use cmstests\CmsFrontendTestCase;
use luya\cms\frontend\Bootstrap;
use luya\cms\models\Config;
use luya\testsuite\fixtures\ActiveRecordFixture;
use luya\web\ErrorHandler;
use luya\web\ErrorHandlerExceptionRenderEvent;
use yii\web\NotFoundHttpException;

class BootstrapErrorPageTest extends CmsFrontendTestCase
{
    public function testBootstrap()
    {
        $bs = new Bootstrap();
        $bs->bootstrap($this->app);

        $event = new ErrorHandlerExceptionRenderEvent();
        $event->exception = new NotFoundHttpException("not found");


        new ActiveRecordFixture([
            'modelClass' => Config::class,
        ]);

        Config::set(Config::HTTP_EXCEPTION_NAV_ID, 1);

        $this->expectException('yii\web\HeadersAlreadySentException');
        $this->app->errorHandler->trigger(ErrorHandler::EVENT_BEFORE_EXCEPTION_RENDER, $event);
    }
}
