<?php

namespace luya\cms\frontend;

use luya\cms\models\Config;
use luya\web\Application;
use luya\web\ErrorHandler;
use luya\web\ErrorHandlerExceptionRenderEvent;
use yii\base\BootstrapInterface;
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
     * Bootstrap
     *
     * @param \luya\web\Application $app
     */
    public function bootstrap($app)
    {
        if ($app->hasModule('cms')) {
            // load cms url rules
            $app->on(Application::EVENT_BEFORE_REQUEST, function ($event) {
                if (!$event->sender->request->isConsoleRequest && !$event->sender->request->isAdmin) {
                    $rules = [
                        ['class' => 'luya\cms\frontend\components\RouteBehaviorUrlRule'],
                        ['class' => 'luya\cms\frontend\components\CatchAllUrlRule'],
                    ];

                    if ($event->sender->getModule('cms')->enableWebsiteHostRedirect) {
                        array_unshift($rules, ['class' => 'luya\cms\frontend\components\WebsiteBehaviorUrlRule']);
                    }

                    $event->sender->urlManager->addRules($rules);
                }
            });

            // handle not found exceptions
            $app->errorHandler->on(ErrorHandler::EVENT_BEFORE_EXCEPTION_RENDER, function (ErrorHandlerExceptionRenderEvent $event) use ($app) {
                if ($app instanceof Application && $event->exception instanceof NotFoundHttpException && !$app->request->isAdmin) {
                    $errorPageNavId = Config::get(Config::HTTP_EXCEPTION_NAV_ID, 0);
                    // if not defined abort.
                    if (!$errorPageNavId) {
                        return;
                    }
                    /** @var $item Item */
                    $item = $app->menu->find()->with(['hidden'])->where(['nav_id' => $errorPageNavId])->one();
                    // unable to find the item, maybe its offline or does not exists anymore.
                    if (!$item) {
                        return;
                    }

                    // render CMS 404 page
                    $app->menu->setCurrent($item);
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
