<?php

namespace cmstests\src\menu;

use cmstests\CmsFrontendTestCase;
use luya\cms\menu\Item;
use luya\cms\menu\Query;
use Yii;

class QueryTest extends CmsFrontendTestCase
{
    public function testContainerSelector()
    {
        Yii::$app->composition['langShortCode'] = 'fr';
        Yii::$app->menu->setLanguageContainer('fr', include('_dataFrArray.php'));

        $containers = ['footer-column-one', 'footer-column-two', 'footer-column-three'];

        foreach ($containers as $container) {
            foreach (Yii::$app->menu->find()->where(['container' => $container])->all() as $item) {
                $link = $item->link;

                if (is_null($link)) {
                    $this->assertNull($link); // internal self redirect
                } else {
                    $this->assertNotEmpty($link);
                }
            }
        }
    }

    private function generateItems($start, $end, $lang)
    {
        $data = [];
        foreach (range($start, $end) as $number) {
            $data[$number] = [
                    'id' => $number,
                    'nav_id' => $number,
                    'lang' => $lang,
                    'link' => '/public_html/' . $number,
                    'title' => 'Page-'. $number,
                    'alias' => 'page-' . $number,
                    'description' => null,
                    'keywords' => null,
                    'create_user_id' => 1,
                    'update_user_id' => 1,
                    'timestamp_create' => '1457091369',
                    'timestamp_update' => '1483367249',
                    'is_home' => 0,
                    'parent_nav_id' => '0',
                    'sort_index' => $number,
                    'is_hidden' => 0,
                    'type' => 1,
                    'nav_item_type_id' => $number,
                    'redirect' => false,
                    'module_name' => false,
                    'container' => 'default',
                    'depth' => 1,
            ];
        }

        return $data;
    }

    public function testWhereOperatorException()
    {
        Yii::$app->composition['langShortCode'] = 'en';
        Yii::$app->menu->setLanguageContainer('en', $this->generateItems(1, 10, 'en'));
        $this->expectException('luya\cms\Exception');
        $result = Yii::$app->menu->find()->where(['>', 'id', 4, 'error'])->all();
    }

    public function testWhereOperatorComperators()
    {
        Yii::$app->composition['langShortCode'] = 'en';
        Yii::$app->menu->setLanguageContainer('en', $this->generateItems(1, 10, 'en'));
        $this->assertSame(5, Yii::$app->menu->find()->where(['>', 'id', 5])->count());
        $this->assertSame(6, Yii::$app->menu->find()->where(['>=', 'id', 5])->count());
        $this->assertSame(4, Yii::$app->menu->find()->where(['<', 'id', 5])->count());
        $this->assertSame(5, Yii::$app->menu->find()->where(['<=', 'id', 5])->count());
        $this->assertSame(1, Yii::$app->menu->find()->where(['=', 'id', 5])->count());
        $this->assertSame(1, Yii::$app->menu->find()->where(['==', 'id', 5])->count());
        $this->assertSame(0, Yii::$app->menu->find()->where(['==', 'id', "5"])->count());
        $this->assertSame(9, Yii::$app->menu->find()->where(['!=', 'id', "4"])->count());
    }

    public function testAndWhereOperatorComperators()
    {
        Yii::$app->composition['langShortCode'] = 'en';
        Yii::$app->menu->setLanguageContainer('en', $this->generateItems(1, 10, 'en'));
        $this->assertSame(1, Yii::$app->menu->find()->where(['=', 'id', 5])->andWhere(['is_hidden' => 0])->count());
        $this->assertSame(0, Yii::$app->menu->find()->where(['=', 'id', 5])->andWhere(['lang' => 'another'])->count());
    }

    public function testLimitAndOffset()
    {
        Yii::$app->composition['langShortCode'] = 'en';
        Yii::$app->menu->setLanguageContainer('en', $this->generateItems(1, 20, 'en'));
        $data = Yii::$app->menu->find()->limit(5)->offset(10)->all();
        $i = 10;
        $this->assertSame(5, count($data));
        foreach ($data as $item) {
            $i++;
            $this->assertSame($i, $item->id);
        }
    }

    public function testInOperatorWithContainers()
    {
        Yii::$app->menu->setLanguageContainer('en', CmsFrontendTestCase::mockMenuContainerArray());

        $default = (new Query())->where(['container' => 'default'])->count();
        $c1 = (new Query())->where(['container' => 'c1'])->count();
        $c2 = (new Query())->where(['container' => 'c2'])->count();

        $all = (new Query())->count();

        $this->assertSame(2, $default);
        $this->assertSame(2, $c2);
        $this->assertSame(1, $c1);
        $this->assertSame(5, $all);

        $in = (new Query())->where(['in', 'container', ['c1', 'c2']])->count();

        $this->assertSame(3, $in);
    }

    public function testOrderByQuery()
    {
        Yii::$app->menu->setLanguageContainer('en', CmsFrontendTestCase::mockMenuContainerArray());

        $unOrdered = (new Query())->all();

        $this->assertTrue(isset($unOrdered[0]));
        $this->assertSame(1, $unOrdered[0]->id);

        $array = iterator_to_array($unOrdered);

        $this->assertSame(1, $array[0]->id);
        $last = end($array)->id;
        $this->assertSame(6, $last);

        $ordered = (new Query())->orderBy(['id' => SORT_DESC])->all();

        $sortedArray = iterator_to_array($ordered);

        $this->assertSame(6, $sortedArray[0]->id);
        $last = end($sortedArray)->id;
        $this->assertSame(1, $last);


        $unOrdered[9998] = ['id' => 9998];
        $this->assertInstanceOf(Item::class, $unOrdered[9998]);
        unset($unOrdered[9999]);
    }

    public function testPreloadModels()
    {
        $default = (new Query())->where(['container' => 'default'])->all();

        $this->assertNull($default->getInnerIterator()->getLoadedModel(1));

        $default = (new Query())->where(['container' => 'default'])->preloadModels()->all();

        $this->assertNotNull($default->getInnerIterator()->getLoadedModel(1));
    }

    public function testRootQueryHelperMethod()
    {
        Yii::$app->menu->setLanguageContainer('en', CmsFrontendTestCase::mockMenuContainerArray());

        $one = (new Query())->container('c1')->one();
        $this->assertSame(3, $one->id);

        $all = (new Query())->container('c1')->root()->count();
        $this->assertSame(1, $all);
    }

    public function testInvalidOperator()
    {
        $q = new Query();
        $this->expectException('luya\cms\Exception');
        $q->where(['invalidoperator', 'attribute', 'value']);
    }
}
