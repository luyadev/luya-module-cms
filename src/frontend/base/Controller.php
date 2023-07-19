<?php

namespace luya\cms\frontend\base;

use luya\admin\filters\LargeThumbnail;
use luya\cms\frontend\events\BeforeRenderEvent;
use luya\cms\frontend\Module;
use luya\cms\models\NavItem;
use luya\helpers\StringHelper;
use luya\TagParser;
use luya\web\View;
use Yii;
use yii\base\Event;
use yii\web\MethodNotAllowedHttpException;
use yii\web\NotFoundHttpException;
use yii\web\Response;

/**
 * Abstract Controller for CMS Controllers.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
abstract class Controller extends \luya\web\Controller
{
    /**
     * @var string This event is triggered when the CMS Page output is generated and ready to render into the view file.
     * @since 4.0.0
     */
    public const EVENT_RENDER_CMS_PAGE = 'renderCmsPage';

    /**
     * @var string
     * @since 1.0.8
     */
    public const LINK_CANONICAL = 'linkCanonical';

    /**
     * @var string The og:image constant.
     * @since 2.0.0
     */
    public const META_OG_IMAGE = 'ogImage';

    /**
     * @var string The twitter:image constant.
     * @since 2.0.0
     */
    public const META_TWITTER_IMAGE = 'twitterImage';

    /**
     * @var string og:type key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_OG_TYPE = 'ogType';

    /**
     * @var string twitter:card key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_TWITTER_CARD = 'twitterCard';

    /**
     * @var string og:title key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_OG_TITLE = 'ogTitle';

    /**
     * @var string twitter:title key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_TWITTER_TITLE = 'twitterTitle';

    /**
     * @var string og:url key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_OG_URL = 'ogUrl';

    /**
     * @var string twitter:url key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_TWITTER_URL = 'twitterUrl';

    /**
     * @var string description meta key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_DESCRIPTION = 'metaDescription';

    /**
     * @var string og:description key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_OG_DESCRIPTION = 'ogDescription';

    /**
     * @var string twitter:description key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_TWITTER_DESCRIPTION = 'twitterDescription';

    /**
     * @var string keywords meta key which is used for meta registration. Use this constant in order to override the default implementation.
     * @since 1.0.8
     */
    public const META_KEYWORDS = 'metaKeywords';

    /**
     * Render the NavItem content and set several view specific data.
     *
     * @param integer $navItemId
     * @param string $appendix
     * @param boolean|integer $setNavItemTypeId To get the content of a version this parameter will change the database value from the nav item Model
     * to this provided value
     *
     * @return string
     * @throws NotFoundHttpException
     * @throws MethodNotAllowedHttpException
     */
    public function renderItem($navItemId, $appendix = null, bool|int $setNavItemTypeId = false)
    {
        $model = NavItem::find()->where(['id' => $navItemId])->with(['nav'])->one();

        if (!$model) {
            throw new NotFoundHttpException('The requested nav item could not found.');
        }

        Yii::$app->urlManager->contextNavItemId = $navItemId;

        $currentMenu = Yii::$app->menu->current;

        $event = new BeforeRenderEvent();
        $event->menu = $currentMenu;
        foreach ($model->nav->properties as $property) {
            $object = $property->getObject();

            $object->trigger($object::EVENT_BEFORE_RENDER, $event);
            if (!$event->isValid) {
                throw new MethodNotAllowedHttpException('Your are not allowed to see this page.');
                return Yii::$app->end();
            }
        }

        if ($setNavItemTypeId !== false && !empty($setNavItemTypeId)) {
            $model->nav_item_type_id = $setNavItemTypeId;
        }

        $typeModel = $model->getType();

        if (!$typeModel) {
            throw new NotFoundHttpException("The requestd nav item could not be found with the paired type, maybe this version does not exists for this Type.");
        }

        $typeModel->setOptions([
            'navItemId' => $navItemId,
            'restString' => $appendix,
        ]);

        $content = $typeModel->getContent();

        Yii::$app->trigger(self::EVENT_RENDER_CMS_PAGE, new Event(['data' => ['navItemId' => $navItemId]]));

        if ($content instanceof Response) {
            return Yii::$app->end(0, $content);
        }

        // it seems to be a json response as it is an array
        if (is_array($content)) {
            return $content;
        }

        // https://github.com/luyadev/luya/issues/863 - if context controller is not false and the layout variable is not empty, the layout file will be displayed
        // as its already renderd by the module controller itself.
        if ($typeModel->controller !== false && !empty($typeModel->controller->layout)) {
            $this->layout = false;
        }

        // If the user has defined a layout file, this will be ensured and set as layout file.
        $layoutFile = $model->nav->layout_file;
        if (!empty($layoutFile)) {
            $this->layout = StringHelper::startsWith($layoutFile, '@') ? $layoutFile : '/' . ltrim($layoutFile, '/');
        }

        if ($this->view->title === null) {
            if (empty($model->title_tag)) {
                $this->view->title = $model->title;
            } else {
                $this->view->title = $model->title_tag;
            }
        }

        $this->view->registerMetaTag(['property' => 'og:type', 'content' => 'website'], self::META_OG_TYPE);
        $this->view->registerMetaTag(['name' => 'twitter:card', 'content' => 'summary'], self::META_TWITTER_CARD);

        $this->view->registerMetaTag(['property' => 'og:title', 'content' => $this->view->title], self::META_OG_TITLE);
        $this->view->registerMetaTag(['name' => 'twitter:title', 'content' => $this->view->title], self::META_TWITTER_TITLE);

        $this->view->registerMetaTag(['property' => 'og:url', 'content' => Yii::$app->request->absoluteUrl], self::META_OG_URL);
        $this->view->registerMetaTag(['name' => 'twitter:url', 'content' => Yii::$app->request->absoluteUrl], self::META_TWITTER_URL);

        if (!empty($model->description)) {
            $this->view->registerMetaTag(['name' => 'description', 'content' => $model->description], self::META_DESCRIPTION);
            $this->view->registerMetaTag(['property' => 'og:description', 'content' => $model->description], self::META_OG_DESCRIPTION);
            $this->view->registerMetaTag(['name' => 'twitter:description', 'content' => $model->description], self::META_TWITTER_DESCRIPTION);
        }

        if (!empty($model->keywords)) {
            $this->view->registerMetaTag(['name' => 'keywords', 'content' => implode(", ", $currentMenu->keywords)], self::META_KEYWORDS);
        }

        if (!empty($model->image_id)) {
            $image = Yii::$app->storage->getImage($model->image_id);
            if ($image) {
                $this->view->registerMetaTag(['property' => 'og:image', 'content' => $image->applyFilter(LargeThumbnail::identifier())->sourceAbsolute], self::META_OG_IMAGE);
                $this->view->registerMetaTag(['name' => 'twitter:image', 'content' => $image->applyFilter(LargeThumbnail::identifier())->sourceAbsolute], self::META_TWITTER_IMAGE);
            }
        }

        if ($this->module->enableTagParsing) {
            $content = TagParser::convert($content);
        }

        if (Yii::$app->has('adminuser') && !Yii::$app->request->isAjax && !Yii::$app->adminuser->isGuest && $this->module->overlayToolbar === true) {
            $this->view->registerCssFile('//fonts.googleapis.com/icon?family=Material+Icons');
            $this->view->on(View::EVENT_BEGIN_BODY, [$this, 'renderToolbar'], ['content' => $content]);
        }

        return $content;
    }

    /**
     * Render the LUYA Toolbar.
     *
     * @param \yii\base\Event $event
     */
    public function renderToolbar($event)
    {
        Yii::info('LUYA CMS Toolbar rendering start', __METHOD__);

        $props = [];
        foreach (Yii::$app->menu->current->model->properties as $prop) {
            $o = $prop->getObject();
            $props[] = ['label' => $o->label(), 'value' => $o->getValue()];
        }

        $menu = Yii::$app->menu;

        // seo keyword frequency
        $seoAlert = 0;
        $keywords = [];
        $content = strip_tags($event->data['content']);

        if (empty($menu->current->description)) {
            $seoAlert++;
        }

        if (empty($menu->current->keywords)) {
            $seoAlert++;
        } else {
            foreach ($menu->current->keywords as $word) {
                if (preg_match_all('/' . preg_quote($word, '/') . '/i', $content, $matches)) {
                    $keywords[] = [$word, is_countable($matches[0]) ? count($matches[0]) : 0];
                } else {
                    $keywords[] = [$word, 0];
                    $seoAlert++;
                }
            }
        }

        // As the view path can not evaluated from controller context, we have to force the viewPath trough
        // the module instance.
        // @see https://github.com/luyadev/luya/issues/1768
        $viewSourcePath = Module::getInstance()->viewPath;

        // echo is used in order to support cases where asset manager is not available
        echo '<style>' . $this->view->renderFile($viewSourcePath . '/inline/toolbar.css') . '</style>';
        // mabye ensure that jquery is loaded,  better put this at the End of body tag
        echo '<script>' . $this->view->renderFile($viewSourcePath . '/inline/toolbar.js') . '</script>';

        echo $this->view->renderFile($viewSourcePath . '/_toolbar.php', [
            'keywords' => $keywords,
            'seoAlertCount' => $seoAlert,
            'menu' => $menu,
            'composition' => Yii::$app->composition,
            'luyaTagParsing' => $event->sender->context->module->enableTagParsing,
            'properties' => $props,
            'theme' => Yii::$app->themeManager->activeTheme,
            'content' => $content,
        ]);

        Yii::info('LUYA CMS Toolbar rendering is finished', __METHOD__);
    }
}
