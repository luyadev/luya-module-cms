<?php

namespace luya\cms\admin\apis;

use luya\admin\helpers\Angular;
use luya\cms\base\BlockInterface;
use luya\cms\models\BlockGroup;
use luya\cms\models\Config;
use luya\cms\models\Layout;
use luya\cms\models\Log;
use luya\helpers\ArrayHelper;
use luya\helpers\ObjectHelper;
use Yii;
use yii\base\InvalidArgumentException;

/**
 * Admin Api delievers common api tasks like blocks and layouts.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
class AdminController extends \luya\admin\base\RestController
{
    /**
     * Return the general cms page configuration.
     *
     * @return array
     */
    public function actionConfig()
    {
        // valid keys
        $keys = [Config::HTTP_EXCEPTION_NAV_ID];

        foreach (Yii::$app->request->bodyParams as $key => $value) {
            if (in_array($key, $keys)) {
                Config::set($key, $value);
            }
        }

        $data = [];
        $data[Config::HTTP_EXCEPTION_NAV_ID] = Config::get(Config::HTTP_EXCEPTION_NAV_ID, 0);
        $data['previewUrl'] = $this->module->previewUrl;
        return $data;
    }

    /**
     * Get all logs for the cms in order to render the dashboard
     *
     * @return array
     */
    public function actionDashboardLog()
    {
        $log = [];
        foreach (Log::find()
        ->orderBy(['timestamp' => SORT_DESC])
        ->with(['user'])
        ->limit(60)
        ->all() as $item) {
            $log[strtotime('midnight', $item->timestamp)][] = [
                'action' => $item->action,
                'user' => $item->user,
                'is_insertion' => $item->is_insertion,
                'is_update' => $item->is_update,
                'is_deletion' => $item->is_deletion,
                'timestamp' => $item->timestamp,
            ];
        }

        $array = [];

        krsort($log, SORT_NUMERIC);

        foreach ($log as $day => $values) {
            $array[] = [
                'day' => $day,
                'items' => $values,
            ];
        }

        return $array;
    }

    /**
     * Get all blocks which can be dropped into a page grouped by group.
     *
     * @return array An array with list of groups with an array key "blocks" containing the blocks.
     */
    public function actionDataBlocks()
    {
        $favs = Yii::$app->adminuser->identity->setting->get("blockfav", []);
        $groups = [];
        foreach (BlockGroup::find()->with(['blocks'])->all() as $blockGroup) {
            $blocks = [];
            $groupPosition = null;
            foreach ($blockGroup->blocks as $block) {
                if ($block->is_disabled) {
                    continue;
                }
                // create the block object
                /** @var BlockInterface $obj */
                $obj = $block->getObject(0, 'admin');

                // check if in hidden blocks
                if (!$obj || in_array($obj::class, $this->module->hiddenBlocks)) {
                    continue;
                }

                if ($groupPosition == null) {
                    $groupObject = Yii::createObject($obj->blockGroup());
                    $groupPosition = $groupObject->getPosition();
                }

                $blocks[] = [
                    'id' => $block->id,
                    'name' => $obj->name(),
                    'icon' => $obj->icon(),
                    'preview_enabled' => $obj->renderAdminPreview() ? true : false,
                    'full_name' => ($obj->icon() === null) ? $obj->name() : '<i class="material-icons">'.$obj->icon().'</i> <span>'.$obj->name().'</span>',
                    'favorized' => array_key_exists($block->id, $favs),
                    'newblock' => 1,
                ];
            }

            if (empty($blocks)) {
                continue;
            }

            // extend the group element b
            $group = $blockGroup->toArray([]);
            $group['name'] = $blockGroup->groupLabel;
            $group['is_fav'] = 0;
            $group['toggle_open'] = (int) Yii::$app->adminuser->identity->setting->get("togglegroup.{$group['id']}", 1);

            $groups[] = [
                'groupPosition' => $groupPosition,
                'group' => $group,
                'blocks' => $blocks,
            ];
        }

        if (!empty($favs)) {
            $favblocks = [];
            foreach ($favs as $fav) {
                $favblocks[] = $fav;
            }

            array_unshift($groups, [
                'group' => [
                    'toggle_open' => (int) Yii::$app->adminuser->identity->setting->get("togglegroup.99999", 1),
                    'id' => '99999',
                    'is_fav' => 1,
                    'name' => \luya\cms\admin\Module::t('block_group_favorites'), // translation stored in admin module
                    'identifier' => 'favs',
                    'position' => 0,
                ],
                'groupPosition' => 0,
                'blocks' => $favblocks,
            ]);
        }

        return $groups;
    }

    /**
     * Get all cms layouts
     *
     * @return array
     */
    public function actionDataLayouts()
    {
        return ArrayHelper::typeCast(Layout::find()->asArray()->all());
    }

    /**
     * Get the controllers for a given module
     *
     * @param string $module
     * @return array
     * @since 2.0.0
     */
    public function actionModuleControllers($module)
    {
        $module = Yii::$app->getModule($module);

        if (!$module) {
            throw new InvalidArgumentException("The given module name is not valid pr not found.");
        }

        return Angular::optionsArrayInput($module->getControllerFiles());
    }

    /**
     * Get the actions for a given controller.
     *
     * @param string $module
     * @param string $controller
     * @return array
     * @since 2.0.0
     */
    public function actionControllerActions($module, $controller)
    {
        $module = Yii::$app->getModule($module);

        if (!$module) {
            throw new InvalidArgumentException("The given module name is not valid or not found.");
        }

        $controller = $module->createControllerByID($controller);
        $actions = ObjectHelper::getActions($controller);

        return Angular::optionsArrayInput(array_combine($actions, $actions));
    }
}
