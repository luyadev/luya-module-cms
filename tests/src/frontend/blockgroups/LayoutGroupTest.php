<?php

namespace cmstests\src\frontend\blockgroups;

use luya\testsuite\cases\CmsBlockGroupTestCase;

/**
 * Class LayoutGroupTest
 *
 * @package cmstests\src\frontend\blockgroups
 * @author Alex Schmid <alex.schmid@stud.unibas.ch>
 * @since 1.0.6
 */
class LayoutGroupTest extends CmsBlockGroupTestCase
{
    public $blockGroupClass = 'luya\cms\frontend\blockgroups\LayoutGroup';

    public $blockGroupIdentifier = 'layout-group';
}
