<?php

namespace cmstests\src\frontend\blockgroups;

use luya\testsuite\cases\CmsBlockGroupTestCase;

/**
 * Class ProjectGroupTest
 *
 * @package cmstests\src\frontend\blockgroups
 * @author Alex Schmid <alex.schmid@stud.unibas.ch>
 * @since 1.0.6
 */
class ProjectGroupTest extends CmsBlockGroupTestCase
{
    public $blockGroupClass = 'luya\cms\frontend\blockgroups\ProjectGroup';

    public $blockGroupIdentifier = 'project-group';
}
