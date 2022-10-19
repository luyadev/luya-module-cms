<?php

namespace cmstests\data\blocks;

use luya\cms\base\InternalBaseBlock;

abstract class UnitTestBlock extends InternalBaseBlock
{
    public function onRegister()
    {
    }

    public function onRegisterFromCache()
    {
    }

    public function renderAdmin()
    {
    }

    public function renderAdminPreview()
    {
    }

    public function renderFrontend()
    {
    }
}
