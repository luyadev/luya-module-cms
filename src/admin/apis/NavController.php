<?php

namespace luya\cms\admin\apis;

use luya\cms\models\NavItemRedirect;
use Yii;
use luya\cms\models\Property;
use luya\cms\models\Nav;
use luya\cms\models\NavItem;
use yii\helpers\Json;
use yii\base\InvalidCallException;
use luya\admin\models\UserOnline;
use yii\web\NotFoundHttpException;
use luya\cms\admin\Module;
use yii\web\ForbiddenHttpException;

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
    private function postArg($name)
    {
        return Yii::$app->request->post($name, null);
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
     *
     * @return bool
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
            if ($newItem->save() && !empty($newItem->nav_item_type_id)) {
                $item->copyTypeContent($newItem);
            }
        }
        
        return true;
    }

    /**
     * Create a page template from a existing page.
     *
     * @return bool
     * @since 1.0.6
     */
    public function actionDeepPageCopyAsTemplate()
    {
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
            }
        }

        return true;
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
        UserOnline::lock(Yii::$app->adminuser->id, NavItem::tableName(), $navId, 'lock_cms_edit_page', ['title' => Nav::findOne($navId)->activeLanguageItem->title]);
        
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
            $prop->delete(false);
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
        $item = Nav::find()->where(['id' => $navId])->one();
        $this->menuFlush();
        if ($homeState == 1) {
            Nav::updateAll(['is_home' => false]);
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

    public function actionDelete($navId)
    {
        if (!Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)) {
            throw new ForbiddenHttpException("Unable to remove this page due to permission restrictions.");
        }
        
        $model = Nav::find()->where(['id' => $navId])->one();
        if ($model) {
            $this->menuFlush();
            // check for internal redirects
            $redirectResult = false;
            $redirects = NavItemRedirect::find()->where(['value' => $navId])->asArray()->all();
            foreach ($redirects as $redirect) {
                $navItem = NavItem::find()->where(['nav_item_type' => 3, 'nav_item_type_id' => $redirect['id']])->one();
                $redirectResult = empty(Nav::find()->where(['id' => $navItem->nav_id, 'is_deleted' => false])->one()) ? $redirectResult : true;
            }

            if ($redirectResult) {
                Yii::$app->response->statusCode = 417;
                return;
            }

            $model->is_deleted = true;

            foreach (NavItem::find()->where(['nav_id' => $navId])->all() as $navItem) {
                $navItem->setAttribute('alias', date('Y-m-d-H-i').'-'.$navItem->alias);
                $navItem->update(false);
            }

            return $model->update(false);
        }
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
        $parentNavId = $this->postArg('parent_nav_id');
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
        
        $create = $model->createModule($parentNavId, $navContainerId, $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('module_name'), $this->postArg('description'));
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }

    public function actionCreateModuleItem()
    {
        $this->menuFlush();
        $model = new Nav();
        $create = $model->createModuleItem($this->postArg('nav_id'), $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('module_name'), $this->postArg('description'));
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
        
        $create = $model->createRedirect($parentNavId, $navContainerId, $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('redirect_type'), $this->postArg('redirect_type_value'), $this->postArg('description'));
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }

        return $create;
    }
    
    public function actionCreateRedirectItem()
    {
        $this->menuFlush();
        $model = new Nav();
        $create = $model->createRedirectItem($this->postArg('nav_id'), $this->postArg('lang_id'), $this->postArg('title'), $this->postArg('alias'), $this->postArg('redirect_type'), $this->postArg('redirect_type_value'), $this->postArg('description'));
        if (is_array($create)) {
            Yii::$app->response->statusCode = 422;
        }
    
        return $create;
    }
    
    /**
     * Create a new page from another existing Page.
     *
     * @return boolean|array
     */
    public function actionCreateFromPage()
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
