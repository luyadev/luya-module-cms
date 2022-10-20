<?php
use luya\cms\frontend\Module;
use luya\helpers\Inflector;
use luya\helpers\Url;
use yii\helpers\VarDumper;

/**
 * @var \luya\theme\Theme $theme
 */
?>
<div id="luya-cms-toolbar-wrapper">
    <div id="luya-cms-toolbar">
        <div class="luya-cms-toolbar__logo">
            <a href="https://luya.io" target="_blank">
                <svg class="luya-cms-toolbar__logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 445.3">
                    <path fill="#a00093" d="M174.6 0a42.8 42.8 0 0 0-37.8 21.6L6 248a43.3 43.3 0 0 0-.3 43.5l.7 1.2L8 295a43 43 0 0 0 35.3 18.7h77l44-76.2L276.4 43.2l12.4-21.5A43.3 43.3 0 0 1 325.3.1H174.6z"></path>
                    <path d="M43.2 313.4h77l44-76.2L8 295a43 43 0 0 0 35.3 18.5z" class="cls-2" data-name="shadow purple" opacity="0.1" isolation="isolate"></path>
                    <path fill="#d40043" d="M422 417.4l.9-2.9a43.7 43.7 0 0 0-4.3-32.6l-.3-.4-.2-.3-39.1-67.7H43.2a43.2 43.2 0 0 1-36.9-20.8l63.2 109.5 12.3 21.1a42.7 42.7 0 0 0 37.5 22h261.3a42.8 42.8 0 0 0 37.8-21.6l2.3-3.8 1-1.8a1 1 0 0 1 .3-.7z"></path>
                    <path d="M422 417.3l.4-1.3a43.3 43.3 0 0 0-3.8-34l-.3-.5-.2-.3-39.1-67.7H267.7c59.2 41.3 144 100 153.2 106.3l.7-1.1.4-1.4z" class="cls-2" data-name="shadow red" opacity="0.1" isolation="isolate"></path>
                    <path fill="#ffa000" d="M494.3 249.6q-24-41.4-47.7-82.8a43.3 43.3 0 0 0-38-21.5H258a42.7 42.7 0 0 1 36.5 21.5l12.4 21.6L379 313.5l39 67.7.2.3.3.4a43.5 43.5 0 0 1 3 37.1l73.2-126.9-.3.4a43.6 43.6 0 0 0-.1-43z"></path>
                </svg>
            </a>
        </div>
        <div class="luya-cms-toolbar__button">
            <a target="_blank" href="<?= Url::toInternal(['/admin/default/index', '#' => '!/template/cmsadmin~2Fdefault~2Findex/update/' . $menu->current->navId], true); ?>">
                <i alt="<?= Module::t('tb_edit_alt'); ?>" title="<?= Module::t('tb_edit_alt'); ?>"  class="material-icons">mode_edit</i>
            </a>
        </div>
        <div class="luya-cms-toolbar__button">
            <a class="luya-cms-toolbar__container-toggler" href="javascript:void(0);" onclick="toggleDetails(this, 'luya-cms-toolbar-seo-container')">
                <?php if ($seoAlertCount > 0): ?><span class="luya-cms-toolbar__badge luya-cms-toolbar__badge--danger"><?= $seoAlertCount; ?></span><?php endif;?> <span><?= Module::t('tb_seo'); ?></span> <i class="material-icons">keyboard_arrow_down</i>
            </a>
        </div>
        <div class="luya-cms-toolbar__button">
            <a class="luya-cms-toolbar__container-toggler" href="javascript:void(0);" onclick="toggleDetails(this, 'luya-cms-toolbar-composition-container')">
                <span class="luya-cms-toolbar__badge"><?= is_countable($composition->getKeys()) ? count($composition->getKeys()) : 0; ?></span> <span><?= Module::t('tb_composition'); ?></span> <i class="material-icons">keyboard_arrow_down</i>
            </a>
        </div>
        <?php if (isset($theme)) : ?>
		    <div class="luya-cms-toolbar__button">
			    <a title="<?= Module::t('tb_active_theme'); ?>" class="luya-cms-toolbar__container-toggler" href="javascript:void(0);" onclick="toggleDetails(this, 'luya-cms-toolbar-themes-container')">
				    <i class="material-icons">color_lens</i> <span><?= $theme->getConfig()->name ?></span> <i class="material-icons">keyboard_arrow_down</i>
			    </a>
		    </div>
        <?php endif ?>

        <?php if (!empty($properties)): ?>
            <div class="luya-cms-toolbar__button">
                <a class="luya-cms-toolbar__container-toggler" href="javascript:void(0);" onclick="toggleDetails(this, 'luya-cms-toolbar-properties-container')">
                    <span class="luya-cms-toolbar__badge"><?= is_countable($properties) ? count($properties) : 0; ?></span> <span><?= Module::t('tb_properties'); ?></span> <i class="material-icons">keyboard_arrow_down</i>
                </a>
            </div>
        <?php endif; ?>
        <div class="luya-cms-toolbar__button luya-cms-toolbar__button--info luya-cms-toolbar__pull-right">
            <div class="luya-cms-toolbar__button-text">
                <?php if ($menu->current->isHidden): ?>
                    <i class="material-icons" alt="<?= Module::t('tb_visible_not_alt'); ?>" title="<?= Module::t('tb_visible_not_alt'); ?>">visibility_off</i>
                <?php else: ?>
                    <i class="material-icons" alt="<?= Module::t('tb_visible_alt'); ?>" title="<?= Module::t('tb_visible_alt'); ?>">visibility</i>
                <?php endif; ?>
                <?php if ($menu->current->type == 2): ?>
                    <span class="luya-cms-toolbar__badge luya-cms-toolbar__margin-left">
                        Module: <strong><?= $menu->current->moduleName; ?></strong>
                    </span>
                <?php endif; ?>
            </div>
        </div>
    </div>
    <div id="luya-cms-toolbar-seo-container" class="luya-cms-toolbar__container">
        <div class="luya-cms-toolbar__list">
            <div class="luya-cms-toolbar__list-entry">
                <div class="luya-cms-toolbar__list-entry-left">
                    <label><?= Module::t('tb_seo_title'); ?></label>
                </div>
                <div class="luya-cms-toolbar__list-entry-right">
                    <p>
                        <?= $menu->current->title; ?>
                    </p>
                </div>
            </div>
            <div class="luya-cms-toolbar__list-entry">
                <div class="luya-cms-toolbar__list-entry-left">
                    <label><?= Module::t('tb_seo_description'); ?></label>
                </div>
                <div class="luya-cms-toolbar__list-entry-right">
                    <p>
                        <?php if (empty($menu->current->description)): ?>
                            <span class="luya-cms-toolbar__text--danger"><?= Module::t('tb_seo_description_notfound'); ?></span>
                        <?php else: ?>
                            <span class="luya-cms-toolbar__text--success"><?= $menu->current->description; ?></span>
                        <?php endif; ?>
                    </p>
                </div>
            </div>
            <div class="luya-cms-toolbar__list-entry">
                <div class="luya-cms-toolbar__list-entry-left">
                    <label><?= Module::t('tb_seo_link'); ?></label>
                </div>
                <div class="luya-cms-toolbar__list-entry-right">
                    <p>
                        <?= $menu->current->link; ?>
                    </p>
                </div>
            </div>
            <div class="luya-cms-toolbar__list-entry">
                <div class="luya-cms-toolbar__list-entry-left">
                    <label><?= Module::t('tb_seo_keywords'); ?></label>
                </div>
                <div class="luya-cms-toolbar__list-entry-right">
                	<?php if (empty($keywords)): ?>
                		<p class="luya-cms-toolbar__text--danger"><?= Module::t('tb_seo_keywords_notfound'); ?></p>
                	<?php else: ?>
                		<?php if ($seoAlertCount > 0): ?>
                		<p class="luya-cms-toolbar__badge--warning"><?= Module::t('tb_seo_warning'); ?></p>
                		<?php endif; ?>
                		<ul class="luya-cms-toolbar__no-bullets">
                			<?php foreach ($keywords as $keyword): ?>
                			 <li><span class="luya-cms-toolbar__badge<?= $keyword[1] > 0 ? ' luya-cms-toolbar__badge--success' : ' luya-cms-toolbar__badge--danger'  ?>"><?= $keyword[1]; ?></span> <span><?= $keyword[0]; ?></span></li>
                			<?php endforeach; ?>
                		</ul>
                	<?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    <div id="luya-cms-toolbar-composition-container" class="luya-cms-toolbar__container">
        <div class="luya-cms-toolbar__list">
            <?php foreach ($composition->getKeys() as $key => $value): ?>
                <div class="luya-cms-toolbar__list-entry">
                    <div class="luya-cms-toolbar__list-entry-left">
                        <label><?= $key ?></label>
                    </div>
                    <div class="luya-cms-toolbar__list-entry-right">
                        <p>
                            <?= $value; ?>
                        </p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php if (isset($theme)) : ?>
		<div id="luya-cms-toolbar-themes-container" class="luya-cms-toolbar__container">
			<div class="luya-cms-toolbar__list">
                <?php foreach ($theme->getConfig()->toArray() as $key => $value): ?>
					<div class="luya-cms-toolbar__list-entry">
						<div class="luya-cms-toolbar__list-entry-left">
							<label><?= Inflector::humanize(Inflector::camel2words($key)) ?></label>
						</div>
						<div class="luya-cms-toolbar__list-entry-right">
							<p>
                                <?= VarDumper::dumpAsString($value, 1, true); ?>
							</p>
						</div>
					</div>
                <?php endforeach; ?>
			</div>
		</div>
    <?php endif ?>
    <?php if (!empty($properties)): ?>
        <div id="luya-cms-toolbar-properties-container" class="luya-cms-toolbar__container">
            <div class="luya-cms-toolbar__list">
                <?php foreach ($properties as $prop): ?>
                    <div class="luya-cms-toolbar__list-entry">
                        <div class="luya-cms-toolbar__list-entry-left">
                            <label><?= $prop['label'] ?></label>
                        </div>
                        <div class="luya-cms-toolbar__list-entry-right">
                            <p>
                                <?= VarDumper::dumpAsString($prop['value'], 10, true); ?>
                            </p>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
    <div class="luya-cms-toolbar-container__toggler">
        <a href="javascript:void(0);" onclick="toggleLuyaToolbar()">
            <i class="material-icons luya-cms-toolbar__arrow">keyboard_arrow_down</i>
            <?php if ($seoAlertCount > 0): ?>
            <div class="luya-cms-toolbar-container__toggler-badge"><?= $seoAlertCount; ?></div>
            <?php endif; ?>
        </a>
    </div>
</div>
