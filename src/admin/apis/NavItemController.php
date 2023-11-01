<?php

namespace luya\cms\admin\apis;

use luya\cms\admin\Module;
use luya\cms\Exception;
use luya\cms\models\Layout;
use luya\cms\models\Nav;
use luya\cms\models\NavContainer;
use luya\cms\models\NavItem;
use luya\cms\models\NavItemModule;
use luya\cms\models\NavItemPage;
use luya\cms\models\NavItemPageBlockItem;
use luya\cms\models\NavItemRedirect;
use luya\helpers\ArrayHelper;
use luya\helpers\Json;
use luya\web\filters\ResponseCache;
use Yii;
use yii\caching\DbDependency;
use yii\web\ForbiddenHttpException;
use yii\web\NotFoundHttpException;

/**
 * NavItem Api is cached response method to load data and perform changes of cms nav item.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class NavItemController extends \luya\admin\base\RestController
{
    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        $behaviors = parent::behaviors();

        $behaviors['responseCache'] = [
            'class' => ResponseCache::class,
            'only' => ['nav-lang-item'],
            'variations' => [
                Yii::$app->request->get('navId', 0),
                Yii::$app->request->get('langId', 0),
            ],
            'dependency' => [
                'class' => DbDependency::class,
                'sql' => 'SELECT timestamp_update FROM cms_nav_item WHERE lang_id=:lang_id AND nav_id=:nav_id',
                'params' => [':lang_id' => Yii::$app->request->get('langId', 0), ':nav_id' => Yii::$app->request->get('navId', 0)]
            ],
        ];

        return $behaviors;
    }

    /**
     * Returns an array of 10 items for last updated pages.
     *
     * @return array
     */
    public function actionLastUpdates()
    {
        return NavItem::find()
            ->select(['cms_nav_item.title', 'timestamp_update', 'update_user_id', 'nav_id'])
            ->limit(10)
            ->orderBy(['timestamp_update' => SORT_DESC])
            ->joinWith(['updateUser' => function ($q) {
                $q->select(['firstname', 'lastname', 'id'])->where([]);
            }, 'nav'])
            ->where(['cms_nav.is_deleted' => false])
            ->asArray(true)
            ->all();
    }

    /**
     * Delete a nav item based on the id.
     *
     * @param integer $navItemId The id of the item to delete.
     * @throws ForbiddenHttpException
     */
    public function actionDelete($navItemId): array|bool
    {
        if (!Yii::$app->adminuser->canRoute(Module::ROUTE_PAGE_DELETE)) {
            throw new ForbiddenHttpException("Unable to perform this action due to permission restrictions");
        }

        $model = NavItem::findOne($navItemId);

        if (!$model) {
            throw new NotFoundHttpException("Unable to find the given nav item model for id {$navItemId}.");
        }

        return $model->delete();
    }

    /**
     * The data api for a nav id and correspoding language.
     *
     * http://example.com/admin/api-cms-navitem/nav-lang-item?access-token=XXX&navId=A&langId=B.
     *
     * @param integer $navId
     * @param integer $langId
     * @return array
     * @throws NotFoundHttpException If the page is not found, a NotFoundHttpException is thrown.
     */
    public function actionNavLangItem($navId, $langId)
    {
        $item = NavItem::find()->with('nav')->where(['nav_id' => $navId, 'lang_id' => $langId])->one();
        if ($item) {
            return [
                'item' => $item->toArray(),
                'nav' => $item->nav->toArray(),
                'typeData' => $item->nav_item_type == 1 ? NavItemPage::getVersionList($item->id) : ArrayHelper::typeCast($item->getType()->toArray()),
            ];
        }

        throw new NotFoundHttpException(Module::t('unable_to_find_item_for_language'));
    }

    /**
     * Get the data for a given placeholder variable inside a page id.
     *
     * @param integer $navItemPageId
     * @param integer $prevId The previous id if its a nested element.
     * @param string $placeholderVar
     */
    public function actionReloadPlaceholder($navItemPageId, $prevId, $placeholderVar)
    {
        $navItemPage = NavItemPage::findOne($navItemPageId);
        return NavItemPage::getPlaceholder($placeholderVar, $prevId, $navItemPage);
    }

    /**
     * Update data for a given nav item id.
     *
     * @param integer $navItemId
     * @return boolean
     */
    public function actionUpdateItemTypeData($navItemId)
    {
        return NavItem::findOne($navItemId)->updateType(Yii::$app->request->post());
    }

    /**
     * Change the layout of a page version.
     *
     * @return NavItemPage
     * @throws NotFoundHttpException
     */
    public function actionChangePageVersionLayout()
    {
        $params =  Yii::$app->request->bodyParams;
        $pageItemId = $params['pageItemId'];
        $layoutId =  $params['layoutId'];
        $alias =  $params['alias'];

        $model = NavItemPage::findOne(['id' => $pageItemId]);

        if ($model) {
            $model->forceNavItem->updateTimestamp();
            $model->layout_id = $layoutId;
            $model->version_alias = $alias;

            if ($model->save(true, ['layout_id', 'version_alias'])) {
                return $model;
            }

            return $this->sendModelError($model);
        }

        throw new NotFoundHttpException();
    }

    /**
     * Delete a given page from pageId body param.
     *
     * @return boolean
     */
    public function actionRemovePageVersion()
    {
        $pageId = Yii::$app->request->getBodyParam('pageId');

        $page = NavItemPage::findOne((int) $pageId);

        if ($page) {
            $page->forceNavItem->updateTimestamp();
            return $page->delete();
        }

        return false;
    }

    /**
     * Create a new cms_nav_item_page for an existing nav_item, this is also known as a "new version" of a page item.
     *
     */
    public function actionCreatePageVersion()
    {
        $fromPageModel = null;
        $name = Yii::$app->request->post('name');
        $fromPageId = (int) Yii::$app->request->post('fromPageId');
        $navItemId = (int) Yii::$app->request->post('navItemId');
        $layoutId = Yii::$app->request->post('layoutId');

        if (empty($name) || empty($navItemId)) {
            return ['error' => true];
        }

        if (empty($fromPageId) && empty($layoutId)) {
            return ['error' => true];
        }

        $navItemModel = NavItem::findOne($navItemId);

        if (!$navItemModel) {
            throw new Exception("Unable to find nav item model");
        }

        if (!empty($fromPageId)) {
            $fromPageModel = NavItemPage::findOne($fromPageId);
            $layoutId = $fromPageModel->layout_id;
        }

        $model = new NavItemPage();
        $model->attributes = [
            'nav_item_id' => $navItemId,
            'timestamp_create' => time(),
            'create_user_id' => Yii::$app->adminuser->getId(),
            'version_alias' => $name,
            'layout_id' => $layoutId,
        ];

        $save = $model->save(false);

        if (!empty($fromPageId) && $save) {
            NavItemPage::copyBlocks($fromPageModel->id, $model->id);
        }

        if (empty($navItemModel->nav_item_type_id) && $navItemModel->nav_item_type == 1) {
            $navItemModel->updateAttributes(['nav_item_type_id' => $model->id]);
        }

        $navItemModel->updateAttributes(['timestamp_update' => time()]);

        return ['error' => !$save];
    }

    /**
     * admin/api-cms-navitem/update-item?navItemId=2.
     *
     * @param int $navItemId
     * @return mixed
     * @throws Exception
     */
    public function actionUpdateItem($navItemId)
    {
        $model = NavItem::find()->where(['id' => $navItemId])->one();

        if (!$model) {
            throw new Exception('Unable to find nav item id '.$navItemId . ' in order to update data.');
        }
        $model->setParentFromModel();
        $model->attributes = Yii::$app->request->post();
        $model->timestamp_update = time();
        if ($model->validate()) {
            if ($model->save()) {
                return true;
            }
        }

        return $this->sendModelError($model);
    }

    /**
     * extract a post var and set to model attribute with the same name.
     *
     * @param $model
     * @param string $attribute
     */
    public function setPostAttribute($model, $attribute)
    {
        $model->{$attribute} = Yii::$app->request->getBodyParam($attribute, null);
    }

    /**
     * check old entries - delete if obsolete (changed type) and add new entry to the appropriate cms_nav_item_(page/module/redirect).
     *
     * @param integer $navItemId The id of the nav_item item which should be changed
     * @param integer $navItemType The NEW type of content for the above nav_item.id
     * @throws Exception
     */
    public function actionUpdatePageItem($navItemId, $navItemType): array|bool
    {
        $model = NavItem::findOne($navItemId);

        if (!$model) {
            throw new Exception('Unable to find the requested nav item object.');
        }

        $model->setParentFromModel();
        $model->title = Yii::$app->request->post('title', false);
        $model->alias = Yii::$app->request->post('alias', false);
        $model->description = Yii::$app->request->post('description', null);
        $model->keywords = Yii::$app->request->post('keywords');
        $model->title_tag = Yii::$app->request->post('title_tag');
        $model->image_id = Yii::$app->request->post('image_id');
        $model->timestamp_create = Yii::$app->request->post('timestamp_create');
        $model->is_url_strict_parsing_disabled = Yii::$app->request->post('is_url_strict_parsing_disabled');
        $model->is_cacheable = Yii::$app->request->post('is_cacheable');

        // make sure the currently provided informations are valid (like title);
        if (!$model->validate()) {
            return $this->sendModelError($model);
        }

        $this->menuFlush();

        // its the same type, update values
        if ($model->nav_item_type == $navItemType) {
            $typeModel = $model->getType();
            // lets just update the type data
            switch ($navItemType) {
                case NavItem::TYPE_PAGE:
                    $this->setPostAttribute($model, 'nav_item_type_id');
                    break;
                case NavItem::TYPE_MODULE:
                    $this->setPostAttribute($typeModel, 'module_name');
                    $this->setPostAttribute($typeModel, 'controller_name');
                    $this->setPostAttribute($typeModel, 'action_name');
                    $this->setPostAttribute($typeModel, 'action_params');

                    if (!$typeModel->validate()) {
                        return $this->sendModelError($typeModel);
                    }
                    $typeModel->update();
                    break;
                case NavItem::TYPE_REDIRECT:
                    $this->setPostAttribute($typeModel, 'type');
                    $this->setPostAttribute($typeModel, 'value');
                    $this->setPostAttribute($typeModel, 'target');
                    $this->setPostAttribute($typeModel, 'anchor');
                    if (!$typeModel->validate()) {
                        return $this->sendModelError($typeModel);
                    }
                    $typeModel->update();
                    break;
                default:
                    throw new Exception("Invalid nav item type.");
                    break;
            }
        } else {
            // the page type has changed, create new type
            $model->nav_item_type = $navItemType;
            switch ($navItemType) {
                case NavItem::TYPE_PAGE:
                    // check for existent version, if not available create "First version"
                    if (!NavItemPage::find()->where(['nav_item_id' => $navItemId])->exists()) {
                        $pageModel = new NavItemPage();
                        $pageModel->attributes = [
                            'nav_item_id' => $navItemId,
                            'timestamp_create' => time(),
                            'create_user_id' => Yii::$app->adminuser->getId(),
                            'version_alias' => Module::t('Initial'),
                            'layout_id' => Yii::$app->request->post('layout_id'),
                        ];
                        if (!$pageModel->save()) {
                            return $this->sendModelError($pageModel);
                        }
                        $model->nav_item_type_id = $pageModel->id;
                    } else {
                        $this->setPostAttribute($model, 'nav_item_type_id');
                    }
                    break;
                case NavItem::TYPE_MODULE:
                    $typeModel = new NavItemModule();
                    $this->setPostAttribute($typeModel, 'module_name');
                    $this->setPostAttribute($typeModel, 'controller_name');
                    $this->setPostAttribute($typeModel, 'action_name');
                    $this->setPostAttribute($typeModel, 'action_params');
                    if (!$typeModel->validate()) {
                        return $this->sendModelError($typeModel);
                    }
                    $typeModel->insert();
                    $model->nav_item_type_id = $typeModel->id;
                    break;
                case NavItem::TYPE_REDIRECT:
                    $typeModel = new NavItemRedirect();
                    $this->setPostAttribute($typeModel, 'type');
                    $this->setPostAttribute($typeModel, 'value');
                    $this->setPostAttribute($typeModel, 'target');
                    $this->setPostAttribute($typeModel, 'anchor');
                    if (!$typeModel->validate()) {
                        return $this->sendModelError($typeModel);
                    }
                    $typeModel->insert();
                    $model->nav_item_type_id = $typeModel->id;
                    break;
                default:
                    throw new Exception("Invalid nav item type.");
                    break;
            }
        }

        if ($model->update()) {
            return [
                'item' => $model,
                'typeData' => ($model->nav_item_type == 1) ? NavItemPage::getVersionList($model->id) : $model->getType()->toArray()
            ];
        }
        return false;
    }

    /**
     * returns all the PAGE type specific informations.
     *
     * @return array
     */
    public function actionTypePageContainer($navItemId)
    {
        $navItem = NavItem::findOne($navItemId);
        $type = $navItem->getType();
        $layout = Layout::findOne($type->layout_id);
        if (!empty($layout)) {
            $layout->json_config = Json::decodeSilent($layout->json_config, true, []);
        }

        return [
            //'nav_item' => $navItem,
            'layout' => $layout,
            'type_container' => $type,
        ];
    }

    /**
     * Move an item to a container.
     *
     * @param integer $moveItemId
     * @param integer $droppedOnCatId
     * @return array
     */
    public function actionMoveToContainer($moveItemId, $droppedOnCatId)
    {
        return ['success' => Nav::moveToContainer($moveItemId, $droppedOnCatId)];
    }

    /**
     * Move an item before an existing item.
     *
     * @param integer $moveItemId
     * @param integer $droppedBeforeItemId
     * @return array
     */
    public function actionMoveBefore($moveItemId, $droppedBeforeItemId)
    {
        $result = Nav::moveToBefore($moveItemId, $droppedBeforeItemId);

        if ($result !== true) {
            $title = isset($result['title']) ? ' "'.$result['title'].'"' : '';
            Yii::$app->response->setStatusCode(422, "Found URL alias duplication in drop target{$title}.");
        }

        return ['success' => $result];
    }

    /**
     * Move an item after an existing item.
     *
     * @param integer $moveItemId
     * @param integer $droppedAfterItemId
     * @return array
     */
    public function actionMoveAfter($moveItemId, $droppedAfterItemId)
    {
        $result = Nav::moveToAfter($moveItemId, $droppedAfterItemId);

        if ($result !== true) {
            $title = isset($result['title']) ? ' "'.$result['title'].'"' : '';
            Yii::$app->response->setStatusCode(422, "Found URL alias duplication in drop target{$title}.");
        }

        return ['success' => $result];
    }

    /**
     * Move an item to a child item (make the parent of).
     *
     * @param integer $moveItemId
     * @param integer $droppedOnItemId
     * @return array
     */
    public function actionMoveToChild($moveItemId, $droppedOnItemId)
    {
        $result = Nav::moveToChild($moveItemId, $droppedOnItemId);

        if ($result !== true) {
            $title = isset($result['title']) ? ' "'.$result['title'].'"' : '';
            Yii::$app->response->setStatusCode(422, "Found URL alias duplication in drop target{$title}.");
        }

        return ['success' => $result];
    }

    /**
     * Toggle visibilty of a block.
     *
     * @param integer $blockId
     * @param integer $hiddenState
     * @return array
     */
    public function actionToggleBlockHidden($blockId, $hiddenState)
    {
        $block = NavItemPageBlockItem::findOne($blockId);
        if ($block) {
            $block->is_hidden = $hiddenState;
            return $block->update(false);
        }

        return false;
    }

    /**
     * Get full constructed path of a nav item.
     *
     * @param $navId
     * @return string Path
     */
    public function actionGetNavItemPath($navId)
    {
        $data = "";
        $node = NavItem::find()->where(['nav_id' => $navId])->one();
        if ($node) {
            $data .= $node->title;
            $parentNavId = $navId;
            while ($parentNavId != 0) {
                $parentNavIdModel = Nav::findOne($parentNavId);
                if ($parentNavIdModel) {
                    $parentNavId = $parentNavIdModel->parent_nav_id;
                    if ($parentNavId != 0) {
                        $node = NavItem::find()->where(['nav_id' => $parentNavId])->one();
                        if ($parentNavId) {
                            $data = $node->title . '/' . $data;
                        }
                    }
                }
            }
        }

        return $data;
    }

    /**
     * Get Container name for a nav item.
     *
     * @param $navId
     * @return string Container name
     */
    public function actionGetNavContainerName($navId)
    {
        $nav = Nav::findOne($navId);
        if ($nav) {
            $navCoontainer = NavContainer::findOne($nav->nav_container_id);
            if ($navCoontainer) {
                return $navCoontainer->name;
            }
        }
        return "";
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
