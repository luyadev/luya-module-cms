<?php

namespace luya\cms\admin\apis;

use luya\admin\models\TagRelation;
use luya\admin\models\UserOnline;
use luya\cms\admin\Module;
use luya\cms\models\Log;
use luya\cms\models\Nav;
use luya\cms\models\NavContainer;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemRedirect;
use luya\cms\models\Property;
use Yii;
use yii\base\InvalidCallException;
use yii\data\ActiveDataProvider;
use yii\db\Query;
use yii\helpers\Json;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

/**
 * Nav Api provides tasks to create, modify and delete navigation items and properties of items.
 *
 * example.com/admin/api-cms-nav/create-page
 * example.com/admin/api-cms-nav/create-item-page
 * example.com/admin/api-cms-nav/create-module
 * example.com/admin/api-cms-nav/create-item-module.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavController extends \luya\admin\base\RestController
{
    private function postArg($name, $defautValue = null)
    {
        return Yii::$app->request->post($name, $defautValue);
    }

    public function actionUpdate($id)
    {
        $model = Nav::findOne($id);

        if (!$model) {
            throw new NotFoundHttpException("Unable to find nav model.");
        }

        $model->attributes = Yii::$app->request->bodyParams;

        if (!$model->save()) {
            return $this->sendModelError($model);
        }

        return true;
    }

    /**
     * Create a page copy from existing page.
     */
    public function actionDeepPageCopy()
    {
        $navId = (int) Yii::$app->request->getBodyParam('navId');

        if (empty($navId)) {
            throw new InvalidCallException("navId can not be empty.");
        }

        $nav = Nav::findOne($navId);

        if (!$nav) {
            throw new InvalidCallException("Unable to find the requested model.");
        }

        $model = $nav->createCopy();
        foreach ($nav->navItems as $item) {
            $newItem = new NavItem();
            $newItem->attributes = $item->toArray();
            $newItem->nav_id = $model->id;
            $newItem->parent_nav_id = $model->parent_nav_id;
            $newItem->title = $item->title . ' (copy)';
            $newItem->alias = $item->alias . '-' . time();
            $save = $newItem->save();
            if ($save && !empty($newItem->nav_item_type_id)) {
                $item->copyTypeContent($newItem);
            }

            if (!$save) {
                return $this->sendModelError($newItem);
            }
        }

        return $model;
    }

    /**
     * Create a page template from a existing page.
     *
     * @return bool
     * @since 1.0.6
     */
    public function actionDeepPageCopyAsTemplate()
    {
        $newItem = null;
        $navId = (int) Yii::$app->request->getBodyParam('navId');

        if (empty($navId)) {
            throw new InvalidCallException("navId can not be empty.");
        }

        $nav = Nav::findOne($navId);

        if (!$nav) {
            throw new InvalidCallException("Unable to find the requested model.");
        }

        $model = $nav->createCopy(true);
        foreach ($nav->navItems as $item) {
            $newItem = new NavItem();
            $newItem->attributes = $item->toArray();
            $newItem->nav_id = $model->id;
            $newItem->parent_nav_id = $model->parent_nav_id;
            $newItem->title = $item->title . ' (template copy)';
            $newItem->alias = $item->alias . '-' . time();
            if ($newItem->save() && !empty($newItem->nav_item_type_id)) {
                $item->copyTypeContent($newItem);

                return $newItem;
            }
        }

        return $this->sendModelError($newItem);
    }

    public function actionSaveCatToggle()
    {
        $catId = Yii::$app->request->getBodyParam('catId');
        $state = Yii::$app->request->getBodyParam('state');

        if ($catId) {
            return Yii::$app->adminuser->identity->setting->set("togglecat.{$catId}", (int) $state);
        }
    }

    public function actionTreeHistory()
    {
        $item = Yii::$app->request->getBodyParam('data');
        Yii::$app->adminuser->identity->setting->set('tree.'.$item['id'], (int) $item['toggle_open']);
    }

    public function actionFindNavItems($navId)
    {
        return NavItem::find()->where(['nav_id' => $navId])->asArray()->with('lang')->all();
    }

    public function actionGetProperties($navId)
    {
        $nav = Nav::findOne($navId);

        if (!$nav) {
            throw new NotFoundHttpException();
        }

        UserOnline::lock(Yii::$app->adminuser->id, NavItem::tableName(), $navId, 'lock_cms_edit_page', [
            'title' => $nav->defaultLanguageItem ? $nav->defaultLanguageItem->title : '(no translation)',
        ]);

        $data = [];
        foreach (Property::find()->select(['admin_prop_id', 'value'])->where(['nav_id' => $navId])->asArray()->all() as $row) {
            $object = \luya\admin\models\Property::findOne($row['admin_prop_id']);
            $blockObject = $object->createObject($row['value']);

            $value = $blockObject->getAdminValue();

            $row['value'] = (is_numeric($value)) ? (int) $value : $value;

            $data[] = $row;
        }

        return $data;
    }

    public function actionSaveProperties($navId)
    {
        $rows = [];

        $doNotDeleteList = [];

        foreach (Yii::$app->request->post() as $id => $value) {
            $rows[] = [
                'nav_id' => $navId,
                'admin_prop_id' => $id,
                'value' => (is_array($value)) ? Json::encode($value) : $value,
            ];

            $doNotDeleteList[] = $id;
        }

        foreach ($rows as $atrs) {
            $model = Property::find()->where(['admin_prop_id' => $atrs['admin_prop_id'], 'nav_id' => $navId])->one();

            if ($model) {
                if (empty($atrs['value']) && $atrs['value'] != 0) {
                    $model->delete();
                } else {
                    // update
                    $model->value = $atrs['value'];
                    $model->update(false);
                }
            } else {
                $model = new Property();
                $model->attributes = $atrs;
                $model->insert(false);
            }
        }

        foreach (Property::find()->where(['nav_id' => $navId])->andWhere(['not in', 'admin_prop_id', $doNotDeleteList])->all() as $prop) {
            $prop->delete();
        }
    }

    public function actionToggleHidden($navId, $hiddenStatus)
    {
        $item = Nav::find()->where(['id' => $navId])->one();

        if ($item) {
            $this->menuFlush();
            $item->is_hidden = $hiddenStatus;
            $item->update(false);

            return true;
        }

        return false;
    }

    public function actionToggleHome($navId, $homeState)
    {
        /** @var Nav $item */
        $item = Nav::find()->with('navContainer')->where(['id' => $navId])->one();
        $this->menuFlush();
        if ($homeState == 1) {
            $navIds = (new Query())
                ->from(Nav::tableName())
                ->leftJoin(NavContainer::tableName(), 'cms_nav_container.id = nav_container_id')
                ->where(['website_id' => $item->navContainer->website_id])
                ->select('cms_nav.id')
                ->column();
            Nav::updateAll(['is_home' => false], ['id' => $navIds]);

            $item->setAttributes([
                'is_home' => true,
            ]);
        } else {
            $item->setAttributes([
                'is_home' => false,
            ]);
        }

        return $item->update(false);
    }

    public function actionToggleOffline($navId, $offlineStatus)
    {
        $item = Nav::find()->where(['id' => $navId])->one();

        if ($item) {
            $this->menuFlush();
            $item->is_offline = $offlineStatus;
            $item->update(false);

            return true;
        }

        return false;
    }

    public function actionDetail($navId)
    {
        return Nav::findOne($navId);
    }

    /**
     * Get all tags for a given navigation id.
     *
     * @param integer $id
     * @return ActiveDataProvider
     * @since 2.2.0
     */
    public function actionTags($id)
    {
        $model = Nav::findOne($id);

        if (!$model) {
            throw new NotFoundHttpException("Unable to find the given nav model.");
        }

        return new ActiveDataProvider([
            'query' => $model->getTags(),
            'pagination' => false,
        ]);
    }

    /**
     * Save tags for a given page.
     *
     * Tags are provided by post and contains the id.
     *
     * @param integer $id
     * @return integer The number of relations stored.
     * @since 2.2.0
     */
    public function actionSaveTags($id)
    {
        $model = Nav::findOne($id);

        if (!$model) {
            throw new NotFoundHttpException("Unable to find the given nav model.");
        }

        return TagRelation::batchUpdateRelations(Yii::$app->request->bodyParams, Nav::tableName(), $id);
    }

    public function actionDelete($navId)
    {
        if (!Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)) {
            throw new ForbiddenHttpException("Unable to remove this page due to permission restrictions.");
        }

        $model = Nav::find()->where(['id' => $navId])->one();

        if (!$model) {
            throw new NotFoundHttpException("Unable to find the given model.");
        }

        $this->menuFlush();
        // check for internal redirects
        $redirectResult = false;
        $redirects = NavItemRedirect::find()->where(['value' => $navId])->asArray()->all();
        foreach ($redirects as $redirect) {
            $navItem = NavItem::find()->where(['nav_item_type' => NavItem::TYPE_REDIRECT, 'nav_item_type_id' => $redirect['id']])->one();
            $redirectResult = empty(Nav::find()->where(['id' => $navItem->nav_id, 'is_deleted' => false])->one()) ? $redirectResult : true;
        }

        // This check allows use to ensure, whether another page is redirect to this page or not. If a page is redirecting to this page
        // deleting is not allowed as it will make the page "fragile".
        if ($redirectResult) {
            Yii::$app->response->statusCode = 417;
            return;
        }

        $model->is_deleted = true;

        foreach (NavItem::find()->where(['nav_id' => $navId])->all() as $navItem) {
            $navItem->parent_nav_id = $model->parent_nav_id;
            $navItem->alias = date('Y-m-d-H-i').'-deleted-'.$navItem->alias;
            $navItem->update(true, ['alias']);

            if ($navItem->hasErrors('alias')) {
                return $this->sendModelError($navItem);
            }
        }

        Log::addModel(Log::LOG_TYPE_DELETE, $model);

        return $model->update(true, ['is_deleted']);
    }

    /**
     * Create a new nav entry for the type page (nav_id will be created.
     *
     * This methods is execute via post.
     */
    public function actionCreatePage()
    {
        $this->menuFlush();
        $model = new Nav();
        $fromDraft = $this->postArg('use_draft');
        $parentNavId = $this->postArg('parent_nav_id') ?: null;
        $navContainerId = $this->postArg('nav_container_id');

        if (!empty($parentNavId)) {
            $navContainerId = Nav::findOne($parentNavId)->nav_container_id;
        }

        if (!empty($fromDraft)) {
            $create = $model->createPageFromDraft($parentNavId, $navContainerId, $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('description'), $this->postArg('from_draft_id'), $this->postArg('is_draft'));
        } else {
            $create = $model->createPage($parentNavId, $navContainerId, $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('layout_id'), $this->postArg('description'), $this->postArg('is_draft'));
        }

        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    /**
     * creates a new nav_item entry for the type page (it means nav_id will be delivered).
     */
    public function actionCreatePageItem()
    {
        $this->menuFlush();
        $model = new Nav();
        $create = $model->createPageItem($this->postArg('nav_id'), $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('layout_id'), $this->postArg('description'));
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    public function actionCreateModule()
    {
        $this->menuFlush();
        $model = new Nav();

        $parentNavId = $this->postArg('parent_nav_id');
        $navContainerId = $this->postArg('nav_container_id');

        if (!empty($parentNavId)) {
            $navContainerId = Nav::findOne($parentNavId)->nav_container_id;
        }

        $create = $model->createModule(
            $parentNavId,
            $navContainerId,
            $this->postArg('lang_id'),
            $this->postArg('title'),
            $this->postArg('alias'),
            $this->postArg('module_name'),
            $this->postArg('description'),
            $this->postArg('controller_name'),
            $this->postArg('action_name'),
            $this->postArg('action_params', [])
        );
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    public function actionCreateModuleItem()
    {
        $this->menuFlush();
        $model = new Nav();
        $create = $model->createModuleItem(
            $this->postArg('nav_id'),
            $this->postArg('lang_id'),
            $this->postArg('title'),
            $this->postArg('alias'),
            $this->postArg('module_name'),
            $this->postArg('description'),
            $this->postArg('controller_name'),
            $this->postArg('action_name'),
            $this->postArg('action_params', [])
        );
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    /* redirect */

    public function actionCreateRedirect()
    {
        $this->menuFlush();
        $model = new Nav();

        $parentNavId = $this->postArg('parent_nav_id');
        $navContainerId = $this->postArg('nav_container_id');

        if (!empty($parentNavId)) {
            $navContainerId = Nav::findOne($parentNavId)->nav_container_id;
        }

        $redirect = $this->postArg('redirect');

        $create = $model->createRedirect($parentNavId, $navContainerId, $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $redirect['type'], $redirect['value'], $this->postArg('description'), $redirect['target'] ?? null, $redirect['anchor'] ?? null);
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    public function actionCreateRedirectItem()
    {
        $this->menuFlush();
        $model = new Nav();
        $redirect = $this->postArg('redirect');
        $create = $model->createRedirectItem($this->postArg('nav_id'), $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $redirect['type'], $redirect['value'], $this->postArg('description'), $redirect['target'] ?? null);
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    /**
     * Create a new page from another existing Page.
     */
    public function actionCreateFromPage(): bool|array
    {
        $this->menuFlush();
        $model = new Nav();
        $response = $model->createItemLanguageCopy($this->postArg('id'), $this->postArg('toLangId'), $this->postArg('title'), $this->postArg('alias'));

        if (is_array($response)) {
            return $this->sendArrayError($response);
        }

        return $response;
    }

    /**
     * Flush the menu data if component exits.
     *
     * @since 1.0.6
     */
    protected function menuFlush()
    {
        if (Yii::$app->get('menu', false)) {
            Yii::$app->menu->flushCache();
        }
    }
}
