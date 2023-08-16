<?php

namespace luya\cms\admin\apis;

use luya\admin\models\Group;
use luya\cms\admin\helpers\MenuHelper;
use luya\cms\models\Nav;
use luya\cms\models\NavContainer;
use luya\cms\models\Website;
use luya\helpers\ArrayHelper;
use Yii;
use yii\base\InvalidArgumentException;
use yii\db\Query;

/**
 * Menu Api provides commont tasks to retrieve cmsadmin menu data and cms group permissions setting tasks.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class MenuController extends \luya\admin\base\RestController
{
    /**
     * Returns an array with all data for the admin menu.
     *
     * + items
     * + drafts
     * + containers
     * + hiddenCats
     *
     * @return array
     */
    public function actionDataMenu()
    {
        return [
            'items' => ArrayHelper::typeCast(MenuHelper::getItems()),
            'drafts' => ArrayHelper::typeCast(MenuHelper::getDrafts()),
            'containers' => ArrayHelper::typeCast(MenuHelper::getContainers()),
            'websites' => ArrayHelper::typeCast(MenuHelper::getWebsites()),
            'hiddenCats' => ArrayHelper::typeCast(Yii::$app->adminuser->identity->setting->get("togglecat", [])),
        ];
    }

    /**
     * Provides all menu items for a given langId and containerId index by the parent_nav_id.
     *
     * @param $langId
     * @param $containerId
     * @since 1.0.3
     */
    public function actionItems($langId, $containerId)
    {
        $items = Nav::find()
            ->where(['nav_container_id' => $containerId, 'is_offline' => false, 'ni.lang_id' => $langId, 'is_deleted' => false])
            ->joinWith(['navItems ni'])
            ->asArray()
            ->all();
        $result = [];

        foreach ($items as $item) {
            // rename from navItems to item
            $item['item'] = reset($item['navItems']);
            unset($item['navItems']);
            $result[$item['parent_nav_id']][] = $item;
        }

        return $result;
    }

    /**
     * Returns the full tree with groups, pages, is_inherit or not, does have rights or not as it was to hard to
     * implement this features directly with angular, now we just prepare anything withing php and delivers to angular only to display the data.
     *
     * @return array
     */
    public function actionDataPermissionTree()
    {
        $data = [];
        // collect data
        foreach (NavContainer::ngRestFind()->with('navs')->all() as $container) {
            $this->getItems($container);

            if (!isset($data['websites'][$container->website_id])) {
                $data['websites'][$container->website_id] = [
                    'websiteInfo' => Website::findOne($container->website_id),
                    'containers' => []
                ];
            }

            $data['websites'][$container->website_id]['containers'][] = [
                'containerInfo' => $container,
                'items' => self::$_permissionItemData[$container->id] ?? [],
            ];
        }
        // collect group informations
        foreach ($this->getGroups() as $group) {
            $data['groups'][] = [
                'name' => $group->name,
                'id' => $group->id,
                'fullPermission' => $this->groupHasFullPermission($group),
            ];
        }
        // return array with full data
        return $data;
    }

    /**
     * Checks whether a group hass full permission or not
     *
     * @return bool
     */
    private function groupHasFullPermission(Group $group)
    {
        return !(new Query())->from("cms_nav_permission")->where(['group_id' => $group->id])->exists();
    }

    private $_groups;

    /**
     * Get all groups as singleton instance.
     *
     * @return \yii\db\ActiveRecord
     */
    private function getGroups()
    {
        if ($this->_groups === null) {
            $this->_groups = Group::find()->all();
        }

        return $this->_groups;
    }

    private static array $_permissionItemData = [];

    /**
     * Build a trree with items for a given NavContainer.
     *
     * @param int $parentNavId
     * @param array $parentGroup
     * @param int $index
     */
    private function getItems(NavContainer $container, $parentNavId = 0, $parentGroup = [], $index = 1)
    {
        $navs = $container->getNavs()->andWhere(['parent_nav_id' => $parentNavId])->all();

        foreach ($navs as $nav) {
            $array = $nav->toArray();

            if (empty($nav->activeLanguageItem)) {
                continue;
            }
            $array['title'] = $nav->activeLanguageItem->title;

            foreach ($this->getGroups() as $key => $group) {
                $isInheritedFromParent = false;

                if (isset($parentGroup[$key])) {
                    if ($parentGroup[$key]['isGroupPermissionInheritNode'] || $parentGroup[$key]['isInheritedFromParent']) {
                        $isInheritedFromParent = true;
                    }
                }

                $array['groups'][$key] = [
                    'id' => $group->id,
                    'isGroupPermissionInheritNode' => $nav->isGroupPermissionInheritNode($group),
                    'hasGroupPermission' => $nav->hasGroupPermission($group),
                    'isInheritedFromParent' => $isInheritedFromParent,
                    'permissionCheckbox' => $nav->hasGroupPermissionSelected($group),
                    'groupFullPermission' => $this->groupHasFullPermission($group),
                ];
            }

            $array['nav_level'] = $index;

            self::$_permissionItemData[$container->id][] = $array;

            $this->getItems($container, $nav->id, $array['groups'], $index + 1);
        }
    }

    /**
     * Save a new permission for a given group and nav id.
     *
     * @return int
     */
    public function actionDataPermissionInsert()
    {
        $navId = (int) Yii::$app->request->getBodyParam('navId');
        $groupId = (int) Yii::$app->request->getBodyParam('groupId');

        if (empty($navId) || empty($groupId)) {
            throw new InvalidArgumentException("navId and groupId can not be empty.");
        }

        return Yii::$app->db->createCommand()->insert('cms_nav_permission', ['group_id' => $groupId, 'nav_id' => $navId])->execute();
    }

    /**
     * Save a new permission inhertiance for a given group and nav id.
     *
     * @return boolean
     */
    public function actionDataPermissionInsertInheritance()
    {
        $navId = (int) Yii::$app->request->getBodyParam('navId');
        $groupId = (int) Yii::$app->request->getBodyParam('groupId');

        if (empty($navId) || empty($groupId)) {
            throw new InvalidArgumentException("navId and groupId can not be empty.");
        }

        $exists = (new Query())->from("cms_nav_permission")->where(['group_id' => $groupId, 'nav_id' => $navId])->exists();

        if ($exists) {
            Yii::$app->db->createCommand()->delete('cms_nav_permission', ['group_id' => $groupId, 'nav_id' => $navId])->execute();
        }

        return Yii::$app->db->createCommand()->insert('cms_nav_permission', ['group_id' => $groupId, 'nav_id' => $navId, 'inheritance' => true])->execute();
    }

    /**
     * Delete the permission for a given group and nav id.
     *
     * @return int
     */
    public function actionDataPermissionDelete()
    {
        $navId = (int) Yii::$app->request->getBodyParam('navId');
        $groupId = (int) Yii::$app->request->getBodyParam('groupId');

        if (empty($navId) || empty($groupId)) {
            throw new InvalidArgumentException("navId and groupId can not be empty.");
        }

        return Yii::$app->db->createCommand()->delete('cms_nav_permission', ['group_id' => $groupId, 'nav_id' => $navId])->execute();
    }

    /**
     * Delete the permission inheritance for a given group and nav id.
     */
    public function actionDataPermissionDeleteInheritance()
    {
        $navId = (int) Yii::$app->request->getBodyParam('navId');
        $groupId = (int) Yii::$app->request->getBodyParam('groupId');

        if (empty($navId) || empty($groupId)) {
            throw new InvalidArgumentException("navId and groupId can not be empty.");
        }

        $exists = (new Query())->from("cms_nav_permission")->where(['group_id' => $groupId, 'nav_id' => $navId])->exists();

        if ($exists) {
            return Yii::$app->db->createCommand()->delete('cms_nav_permission', ['group_id' => $groupId, 'nav_id' => $navId])->execute();
        }

        return false;
    }

    /**
     * Grant access to a given group.
     */
    public function actionDataPermissionGrantGroup()
    {
        $groupId = (int) Yii::$app->request->getBodyParam('groupId');

        if (empty($groupId)) {
            throw new InvalidArgumentException("groupId can not be empty.");
        }

        return Yii::$app->db->createCommand()->delete('cms_nav_permission', ['group_id' => $groupId])->execute();
    }
}
