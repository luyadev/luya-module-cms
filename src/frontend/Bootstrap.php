<?php

namespace luya\cms\frontend;

use Yii;
use yii\base\BootstrapInterface;
use yii\web\HttpException;
use luya\web\ErrorHandlerExceptionRenderEvent;
use luya\cms\menu\Item;
use luya\cms\models\Config;
use luya\web\Application;
use luya\web\ErrorHandler;
use yii\web\NotFoundHttpException;
use yii\web\Response;

/**
 * CMS Bootstrap.
 *
 * The CMS bootstrap class injects the cms specific url rules
 *
 * + {{luya\cms\frontend\components\RouteBehaviorUrlRule}}
 * + {{luya\cms\frontend\components\CatchAllUrlRule}}
 *
 * And changes the behavior if an exception appears in order to redirect users to a custom cms page.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
final class Bootstrap implements BootstrapInterface
{
    /**
     * @inheritdoc
     */
    public function bootstrap($app)
    {
        if ($app->hasModule('cms')) {
            $app->on(Application::EVENT_BEFORE_REQUEST, function ($event) {
                if (!$event->sender->request->isConsoleRequest && !$event->sender->request->isAdmin) {
                    $event->sender->urlManager->addRules([
                        ['class' => 'luya\cms\frontend\components\RouteBehaviorUrlRule'],
                        ['class' => 'luya\cms\frontend\components\CatchAllUrlRule'],
                    ]);
                }
            });

            $app->errorHandler->on(ErrorHandler::EVENT_BEFORE_EXCEPTION_RENDER, function (ErrorHandlerExceptionRenderEvent $event) use ($app) {
                if ($event->exception instanceof NotFoundHttpException) {

                    $errorPageNavId = Config::get(Config::HTTP_EXCEPTION_NAV_ID, 0);
                    /** @var $menu Item */
                    $menu = $app->menu->find()->with(['hidden'])->where(['nav_id' => $errorPageNavId])->one();
                    if ($menu === null) {
                        return;
                    }

                    // render CMS 404 page
                    $app->menu->setCurrent($menu);
                    $result = $app->runAction('cms/default/index');
                    if ($result instanceof Response) {
                        $response = $result;
                    } else {
                        $response = new Response();
                        $response->data = $result;
                    }

                    $response->setStatusCodeByException($event->exception);
                    $app->end(1, $response);
                    exit;
                }
            });
        }
    }
}
