<?php

return [
    'tb_composition' => 'Taal',
    'tb_properties' => 'Eigenschappen',
    'tb_seo' => 'Zoekmachineoptimalisatie',
    'tb_seo_title' => 'Titel',
    'tb_seo_description' => 'Beschrijving',
    'tb_seo_description_notfound' => 'Er is nog geen beschrijving aan deze pagina toegevoegd.',
    'tb_seo_link' => 'URL-link',
    'tb_seo_keywords' => 'Trefwoorden',
    'tb_seo_keywords_notfound' => 'Geen sleutelwoorden gevonden.  U moet zoekwoorden toevoegen om uw inhoud te analyseren.',
    'tb_seo_warning' => 'Sommige van uw zoekwoorden zijn niet gevonden in uw inhoud, u moet dit oplossen door uw zoekwoorden te wijzigen of de ontbrekende zoekwoorden toe te voegen aan de inhoud.',
    'tb_edit_alt' => 'Bewerk deze pagina in CMS-beheer',
    'tb_visible_not_alt' => 'Deze pagina is NIET zichtbaar voor bezoekers',
    'tb_visible_alt' => 'Deze pagina is zichtbaar voor bezoekers',
    'block_html_html_label' => 'HTML-code',
    'block_html_no_content' => 'Er is nog geen HTML-code toegevoegd.',
    'block_module_name' => 'Module',
    'block_module_modulename_label' => 'Module naam',
    'block_module_modulecontroller_label' => 'Controller Name (zonder controller-achtervoegsel)',
    'block_module_moduleaction_label' => 'Action Name (zonder actieprefix )',
    'block_module_moduleactionargs_label' => 'Action Arguments (json: {"var": "value"})',
    'block_module_no_module' => 'Er is nog geen module gespecificeerd.',
    'block_module_integration' => 'Module integratie',
    'block_html_name' => 'HTML',
    'block_module_modulename_help' => 'Alleen frontend-modules die in het configuratiebestand zijn geregistreerd, worden weergegeven.',
    'block_group_dev_elements' => 'Ontwikkeling',
    'block_group_layout_elements' => 'Layout',
    'block_group_basic_elements' => 'Basis',
    'block_group_project_elements' => 'Project',
    'block_group_text_elements' => 'Teksten',
    'block_group_media_group' => 'Media',

    // 1.0.0
    'block_module_strictrender' => 'Stricte weergave',
    'block_module_strictrender_help' => 'Wanneer strikte weergave is ingeschakeld, voert de module alleen de opgegeven route uit (module, controller, actie, params) zonder te luisteren naar actie- en controllerroutes.',
    'block_html_cfg_raw_label' => 'Render HTML in Admin',

    // 3.4.0
    'tag_alias_readme' => 'The alias tag allows you to use aliases defined in your application as well as predefined aliases. As an example, you can use `alias[@web]` to link to images in the public html folder: `<img src="alias[@web]/image.jpg">`',
    'tag_menu_readme' => 'Generate a link to a menu item where the key is the page id (you can see the page ids when hovering over the site navigation in the administration).',
    'tag_page_readme' => 'Get the content of a full page or of a placeholder of a page. The first parameter is the page id (which you get by hovering over the site navigation in the administration): `page[1]`. If you only want to get the content of a placeholder of the cmslayout, use the second parameter: `page[1](placeholderName)`.',
    'block_mirror_language_name' => 'Mirror Language',
    'block_mirror_config_language_label' => 'Source Language',
    'block_mirror_admin_empty_language' => 'Configure a <b><span class="material-icons">edit</span> source language</b> to mirror its content for the current placeholder.',
    'block_mirror_admin_configured_language' => 'Mirroring this placeholder from <span class="material-icons">arrow_right_alt</span> <b>{name}</b>.',
];
