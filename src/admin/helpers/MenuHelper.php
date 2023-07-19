<?php

namespace luya\cms\admin\helpers;

use luya\admin\models\Group;
use luya\admin\models\User;
use luya\cms\models\Nav;
use luya\helpers\ArrayHelper;
use Yii;
use yii\db\Query;
use yii\helpers\Json;

/**
 * Menu Helper to collect Data used in Administration areas.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class MenuHelper
{
    private static $items;

    /**
     * Get all nav data entries with corresponding item content
     *
     * @return array
     */
    public static function getItems()
    {
        if (self::$items === null) {
            $items = Nav::find()
                ->select(['cms_nav.id', 'nav_item_id' => 'cms_nav_item.id', 'nav_container_id', 'parent_nav_id', 'is_hidden', 'layout_file', 'is_offline', 'is_draft', 'is_home', 'cms_nav_item.title'])
                ->leftJoin('cms_nav_item', 'cms_nav.id=cms_nav_item.nav_id')
                ->with(['parents'])
                ->orderBy(['sort_index' => SORT_ASC])
                ->where([
                    'cms_nav_item.lang_id' => Yii::$app->adminLanguage->defaultLanguage['id'],
                    'cms_nav.is_deleted' => false,
                    'cms_nav.is_draft' => false,
                ])
                ->asArray()
                ->all();
            self::loadInheritanceData(0);

            $data = [];

            foreach ($items as $key => $item) {
                $item['is_draft'] = (int) $item['is_draft'];
                $item['is_hidden'] = (int) $item['is_hidden'];
                $item['is_home'] = (int) $item['is_home'];
                $item['is_offline'] = (int) $item['is_offline'];
                $item['is_editable'] = (int) Yii::$app->adminuser->canRoute('cmsadmin/page/update');
                $item['toggle_open'] = (int) Yii::$app->adminuser->identity->setting->get('tree.'.$item['id']);
                $item['has_children'] = empty($item['parents']) ? 0 : count($item['parents']); //(new Query())->from('cms_nav')->select(['id'])->where(['parent_nav_id' => $item['id']])->count();
                // the user have "page edit" permission, now we can check if the this group has more fined tuned permisionss from the
                // cms_nav_permissions table or not
                if ($item['is_editable']) {
                    $permitted = false;
                    // check permissions for all groups, if alreay permited skip
                    foreach (Yii::$app->adminuser->identity->groups as $group) {
                        if ($permitted) {
                            continue;
                        }

                        $permitted = self::navGroupPermission($item['id'], $group->id);
                    }

                    // if not yet permitted, check in inheritance table.
                    if (!$permitted) {
                        $value = self::$_inheritData[$item['id']] ?? false;
                        if ($value === true) {
                            $permitted = true;
                        }
                    }
                    $item['is_editable'] = (int) $permitted;
                }
                $data[$key] = $item;
            }
            self::$items = $data;
        }

        return self::$items;
    }

    private static $_navItems;

    /**
     * Get an array with all nav items.
     *
     * @return array
     */
    private static function getNavItems()
    {
        if (self::$_navItems === null) {
            $items = Nav::find()->select(['sort_index', 'id', 'parent_nav_id', 'is_deleted'])->where(['is_deleted' => false])->orderBy(['sort_index' => SORT_ASC])->asArray()->all();
            return self::$_navItems = ArrayHelper::index($items, null, 'parent_nav_id');
        }

        return self::$_navItems;
    }

    private static array $_inheritData = [];

    /**
     * Find nav_id inheritances
     *
     * + Get all cms_nav items where is deleted 0 and sort_asc
     * + foreach items
     * + foreach all user groups for this item to check if an inheritance nod exists for this nav_item (self::navGroupInheritanceNode)
     * + Set the interanl check to false, if inherit or internal check is true, set value into $data factory
     * + proceed nodes of the current item with the information form $data factory as inheritation info.
     *
     * @param integer $parentNavId
     * @param string $fromInheritNode
     */
    private static function loadInheritanceData($parentNavId = 0, $fromInheritNode = false)
    {
        // get items from singleton object
        $items = self::getNavItems()[$parentNavId] ?? [];
        foreach ($items as $item) {
            $internalCheck = false;
            foreach (Yii::$app->adminuser->identity->groups as $group) {
                if ($internalCheck) {
                    continue;
                }
                $internalCheck = self::navGroupInheritanceNode($item['id'], $group);
            }
            if (!array_key_exists($item['id'], self::$_inheritData)) {
                if ($fromInheritNode || $internalCheck) {
                    self::$_inheritData[$item['id']] = true;
                } else {
                    self::$_inheritData[$item['id']] = false;
                }
            }

            self::loadInheritanceData($item['id'], self::$_inheritData[$item['id']]);
        }
    }

    private static $_cmsPermissionData;

    /**
     * Get an array with all cms permissions data
     *
     * @return array
     */
    private static function getCmsPermissionData()
    {
        if (self::$_cmsPermissionData === null) {
            self::$_cmsPermissionData = ArrayHelper::index((new Query())->select("*")->from("cms_nav_permission")->all(), null, 'group_id');
        }

        return self::$_cmsPermissionData;
    }

    /**
     * Check the inhertiance for a given navigation and group.
     *
     * @param integer $navId
     * @return boolean
     */
    public static function navGroupInheritanceNode($navId, Group $group)
    {
        // default defintion is false
        $definition = false;
        // see if permission data for group exists, foreach items and set if match
        if (isset(self::getCmsPermissionData()[$group->id])) {
            foreach (self::getCmsPermissionData()[$group->id] as $item) {
                if ($item['nav_id'] == $navId) {
                    $definition = $item['inheritance'];
                }
            }
        }
        if ($definition) {
            return (bool) $definition;
        }

        return false;
    }

    private static $_navGroupPermissions;

    /**
     * An array with permissions
     *
     * @return array
     */
    private static function getNavGroupPermissions()
    {
        if (self::$_navGroupPermissions === null) {
            self::$_navGroupPermissions = ArrayHelper::index((new Query())->select(['group_id', 'nav_id'])->from("cms_nav_permission")->all(), null, 'group_id');
        }

        return self::$_navGroupPermissions;
    }

    /**
     * Get the permissions for a certain group and navigation.
     *
     * @param integer $navId
     * @param interger $groupId
     * @return boolean
     */
    public static function navGroupPermission($navId, $groupId)
    {
        // If the group does not exists, it means no permission restrictions are made for this group.
        $definitions = self::getNavGroupPermissions()[$groupId] ?? [];

        // the group has no permission defined, this means he can access ALL cms pages
        if ((is_countable($definitions) ? count($definitions) : 0) == 0) {
            return true;
        }

        // check if the nav id is defined in group
        foreach ($definitions as $permission) {
            if ($navId == $permission['nav_id']) {
                return true;
            }
        }

        return false;
    }

    private static $containers;

    /**
     * Get all cms containers
     *
     * @return array
     */
    public static function getContainers()
    {
        if (self::$containers === null) {
            self::$containers = (new Query())->select(['cms_nav_container.id', 'name' => 'cms_nav_container.name', 'website_name' => 'cms_website.name', 'alias', 'website_id'])
                ->from('cms_nav_container')
                ->innerJoin('cms_website', 'website_id = cms_website.id')
                ->where(['cms_nav_container.is_deleted' => false])
                ->orderBy(['cms_website.name' => 'ASC', 'cms_nav_container.name' => 'ASC'])
                ->all();
        }

        return self::$containers;
    }

    private static $websites;

    /**
     * Get all cms websites
     *
     * @return array
     *
     * @since 4.0.0
     */
    public static function getWebsites()
    {
        if (self::$websites === null) {
            $websites = (new Query())
                ->select([
                    'cms_website.id',
                    'cms_website.name',
                    'cms_website.host',
                    'cms_website.is_default',
                    'default_container_id' => 'MIN(cms_nav_container.id)',
                    'group_ids',
                    'user_ids'
                ])
                ->from('cms_website')
                ->leftJoin('cms_nav_container', 'website_id = cms_website.id')
                ->where(['cms_website.is_active' => true, 'cms_website.is_deleted' => false])
                ->groupBy('cms_website.id')
                ->all();

            foreach ($websites as $websiteIndex => $website) {
                if (!self::checkUserWebsitePermissions($website)) {
                    unset($websites[$websiteIndex]);
                }
            }

            self::$websites = array_values($websites);
        }

        return self::$websites;
    }

    /**
     * Check that the current user is allowed to access to the given website data.
     *
     * @param array $website Array with website data. Have to provide `user_ids` and `group_ids` in json string.
     *
     * @return bool
     */
    public static function checkUserWebsitePermissions(array $website)
    {
        /** @var User $user */
        $user = Yii::$app->adminuser->identity;
        $userGroupIds = ArrayHelper::getColumn($user->groups, 'id');

        $users = Json::decode($website['user_ids']) ?? [];
        foreach ($users as $item) {
            if ($item['value'] === 0 || $item['value'] == $user->id) {
                return true;
            }
        }

        $groups = Json::decode($website['group_ids']) ?? [];
        foreach ($groups as $item) {
            if ($item['value'] === 0 || in_array($item['value'], $userGroupIds)) {
                return true;
            }
        }

        return false;
    }

    private static $drafts;

    /**
     * Get all drafts nav items
     *
     * @return array
     */
    public static function getDrafts()
    {
        if (self::$drafts === null) {
            self::$drafts = (new Query())
            ->select(['cms_nav.id', 'nav_container_id', 'parent_nav_id', 'is_hidden', 'is_offline', 'is_draft', 'is_home', 'cms_nav_item.title'])
            ->from('cms_nav')
            ->leftJoin('cms_nav_item', 'cms_nav.id=cms_nav_item.nav_id')
            ->orderBy('cms_nav.sort_index ASC')
            ->where(['cms_nav_item.lang_id' => Yii::$app->adminLanguage->defaultLanguage['id'], 'cms_nav.is_deleted' => false, 'cms_nav.is_draft' => true])
            ->all();
        }

        return self::$drafts;
    }
}
