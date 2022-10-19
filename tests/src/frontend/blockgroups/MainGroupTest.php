<?php

namespace cmstests\src\frontend\blockgroups;

use luya\testsuite\cases\CmsBlockGroupTestCase;

/**
 * Class MainGroupTest
 *
 * @package cmstests\src\frontend\blockgroups
 * @author Alex Schmid <alex.schmid@stud.unibas.ch>
 * @since 1.0.6
 */
class MainGroupTest extends CmsBlockGroupTestCase
{
    public $blockGroupClass = 'luya\cms\frontend\blockgroups\MainGroup';

    public $blockGroupIdentifier = 'main-group';
}
