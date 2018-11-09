<?php

namespace luya\cms\admin\apis;

use luya\cms\base\BlockInterface;
use Yii;
use luya\cms\models\Layout;
use luya\cms\models\Block;
use luya\cms\models\BlockGroup;
use luya\helpers\ArrayHelper;
use luya\cms\frontend\Module;
use luya\cms\models\Config;
use luya\cms\models\Log;

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
        $data = Log::find()->orderBy(['timestamp' => SORT_DESC])->with(['user'])->limit(60)->all();
        $log= [];
        foreach ($data as $item) {
            $log[strtotime('today', $item->timestamp)][] = $item;
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
                if (!$obj || in_array(get_class($obj), $this->module->hiddenBlocks)) {
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
}
