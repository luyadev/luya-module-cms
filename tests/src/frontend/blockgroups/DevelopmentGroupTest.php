<?php

namespace cmstests\src\frontend\blockgroups;

use luya\testsuite\cases\CmsBlockGroupTestCase;

/**
 * Class DevelopmentGroupTest
 *
 * @package cmstests\src\frontend\blockgroups
 * @author Alex Schmid <alex.schmid@stud.unibas.ch>
 * @since 1.0.6
 */
class DevelopmentGroupTest extends CmsBlockGroupTestCase
{
    public $blockGroupClass = 'luya\cms\frontend\blockgroups\DevelopmentGroup';

    public $blockGroupIdentifier = 'development-group';
}
