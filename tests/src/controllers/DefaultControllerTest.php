<?php

namespace cmstests\src\controllers;

use luya\cms\frontend\blocks\HtmlBlock;
use luya\cms\models\NavItemPage;
use luya\testsuite\cases\WebApplicationTestCase;
use luya\testsuite\scopes\PageScope;
use Yii;

class DefaultControllerTest extends WebApplicationTestCase
{
    public function getConfigArray()
    {
        return [
            'id' => 'pagescope',
            'basePath' => dirname(__DIR__),
            'modules' => [
                'admin' => 'luya\admin\Module',
                'cms' => 'luya\cms\frontend\Module',
                'cmsadmin' => 'luya\cms\admin\Module',
            ],
            'components' => [
                'db' => [
                        'class' => 'yii\db\Connection',
                        'dsn' => 'sqlite::memory:',
                    ]
            ]
        ];
    }

    /**
     * @runInSeparateProcess
     */
    public function testRenderPageCycle()
    {
        PageScope::run($this->app, function(PageScope $scope) {
            $scope->createPage('home', '@app/../data/views/cmslayouts/main.php', ['content'])->addBlockAndContent(HtmlBlock::class, 'content', [
                'html' => '<p>foobar</p>',
            ]);
            $page = NavItemPage::findOne($scope->pageId);
            $content = $page->getContent();
            $copy = (string) $content;
            $this->assertNotNull($content);
        });
    }
}
