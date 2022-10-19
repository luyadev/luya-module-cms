<?php

namespace cmstests\src\frontend\blockgroups;

use luya\testsuite\cases\CmsBlockGroupTestCase;

/**
 * Class TextGroupTest
 *
 * @package cmstests\src\frontend\blockgroups
 * @author Alex Schmid <alex.schmid@stud.unibas.ch>
 * @since 1.0.6
 */
class TextGroupTest extends CmsBlockGroupTestCase
{
    public $blockGroupClass = 'luya\cms\frontend\blockgroups\TextGroup';

    public $blockGroupIdentifier = 'text-group';
}
