<?php

return [
    
    'view_index_add_type' => 'Type de page',
    'view_index_type_page' => 'Page',
    'view_index_type_module' => 'Module',
    'view_index_type_redirect' => 'Redirection',
    'view_index_as_draft' => 'Comme modèle',
    'view_index_as_draft_help' => 'Voulez-vous définir la nouvelle page en tant que modèle ?',
    'view_index_no' => 'Non',
    'view_index_yes' => 'Oui',
    'view_index_page_title' => 'Titre de la page',
    'view_index_page_alias' => 'Segment de l\'URL',
    'view_index_page_meta_description' => 'Description',
    'view_index_page_nav_container' => 'Conteneur de navigation',
    'view_index_page_parent_page' => 'Page parente',
    'view_index_page_success' => 'La page a été créée avec succès',
    'view_index_page_parent_root' => 'au niveau de la racine',
    'view_index_page_use_draft' => 'Utiliser un modèle ?',
    'view_index_page_select_draft' => 'Voulez-vous choisir un modèle ?',
    'view_index_page_layout' => 'Sélection du layout',
    'view_index_page_btn_save' => 'Enregistrer la nouvelle page',
    'view_index_module_select' => 'Nom du module',
    'view_index_sidebar_new_page' => 'Créer une nouvelle page',
    'view_index_sidebar_drafts' => 'Modèles',
    'view_index_sidebar_move' => 'Déplacer',
    'view_update_drop_blocks' => 'Déposer les blocs de contenu ici',
    'view_update_blockcontent' => 'Contenu du bloc',
    'view_update_configs' => 'Configurations optionnelles',
    'view_update_settings' => 'Paramètres',
    'view_update_btn_save' => 'Enregistrer',
    'view_update_btn_cancel' => 'Annuler',
    'view_update_btn_hide_help' => 'Hide help',
    'view_update_btn_show_help' => 'Show help',
    'view_update_holder_state_on' => 'Plier le conteneur',
    'view_update_holder_state_off' => 'Dérouler le conteneur',
    'view_update_is_draft_mode' => 'Edition en mode brouillon',
    'view_update_is_homepage' => 'Page d\'accueil',
    'view_update_properties_title' => 'Propriétés de la page',
    'view_update_no_properties_exists' => 'Aucune propriété n\'a été enregistrée pour cette page.',
    'view_update_draft_no_lang_error' => 'Le modèle n\'est pas configuré dans cette langue.',
    'view_update_no_translations' => 'Cette page n\'a pas été traduite.',
    'view_update_page_is_module' => 'Cette page est un <b>module</b>.',
    'view_update_page_is_redirect_internal' => 'Cette page est une <b>redirection interne</b> vers <show-internal-redirection nav-id="typeData.value" />.',
    'view_update_page_is_redirect_external' => 'Cette page est une <b>redirection externe</b> vers <a ng-href="{{typeData.value}}">{{typeData.value}}</a>',
    'menu_node_cms' => 'Pages',
    'menu_node_cmssettings' => 'Paramètres',
    'menu_group_env' => 'Environnement',
    'menu_group_item_env_container' => 'Conteneurs',
    'menu_group_item_env_layouts' => 'Layouts (mises en page)',
    'menu_group_elements' => 'Eléments du contenu',
    'menu_group_item_elements_blocks' => 'Gestion des blocs',
    'menu_group_item_elements_group' => 'Gestion des groupes',
    'btn_abort' => 'Annuler',
    'btn_refresh' => 'Rafraîchir',
    'btn_save' => 'Enregistrer',

    /* added translation in 1.0.0-beta3: */
    'model_navitemmodule_module_name_label' => 'Nom du module',
    'model_navitem_title_label' => 'Titre de la page',
    'model_navitem_alias_label' => 'Segment de l\'URL',
    'model_navitempage_layout_label' => 'Layout',
    'model_navitemredirect_type_label' => 'Type de redirection',
    'model_navitemredirect_value_label' => 'Cible de la redirection',
    'view_index_add_title' => 'Ajouter une nouvelle page',
    'view_index_add_page_from_language' => 'Ajouter la page de la langue',
    'view_index_add_page_from_language_info' => 'Voulez-vous copier le contenu d\'une autre langue lors de la création de cette page ?',
    'view_index_add_page_empty' => 'Ajouter une page vide',
    'view_index_language_loading' => 'Chargement de la page',
    'draft_title' => 'Modèles',
    'draft_text' => 'Voici la liste des modèles. Les modèles peuvent être appliqués lors de la création d\'une nouvelle page.',
    'draft_column_id' => 'ID',
    'draft_column_title' => 'Titre',
    'draft_column_action' => 'Action',
    'draft_edit_button' => 'Modifier',
    'js_added_translation_ok' => 'La traduction de cette page a été créée avec succès.',
    'js_added_translation_error' => 'Une erreur est survenue lors de la création de la traduction.',
    'js_page_add_exists' => 'Une page "%title" existe déjà avec la même URL dans ce groupe (id=%id%).',
    'js_page_property_refresh' => 'Les propriétés ont été mises à jour.',
    'js_page_confirm_delete' => 'Voulez-vous vraiment supprimer cette page ?',
    'js_page_delete_error_cause_redirects' => 'Cette page ne peut être supprimée. Vous devez d\'abord supprimer toutes les redirections pointant vers cette page.',
    'js_state_online' => '%title% en ligne',
    'js_state_offline' => '%title% hors ligne',
    'js_state_hidden' => '%title% cachée',
    'js_state_visible' => '%title% visible',
    'js_state_is_home' => '%title% est la page racine',
    'js_state_is_not_home' => '%title% n\'est pas la page racine',
    'js_page_item_update_ok' => 'La page «%title%» a été mise à jour.',
    'js_page_block_update_ok' => 'Le bloc «%name%» a été mis à jour.',
    'js_page_block_remove_ok' => 'Le bloc «%name%» a été supprimé.',
    'js_page_block_visbility_change' => 'La visibilité de «%name%» a été modifiée avec succès.',

    /* added translation in 1.0.0-beta5: */
    'view_update_blockholder_clipboard' => 'Presse-papier',

    /* added translation in 1.0.0-beta6: */
    'js_page_block_delete_confirm' => 'Voulez-vous vraiment supprimer le bloc «%name%» ?',
    'view_index_page_meta_keywords' => 'Mots-clés',
    'current_version' => 'Version actuelle',
    'Initial' => 'Première version',
    'view_index_page_version_chooser' => 'Version publiée',
    'versions_selector' => 'Versions',
    'page_has_no_version' => 'Cette page n\'a pas de version, ni de layout. Créez une nouvelle version en cliquant sur l\'icône Ajouter <i class="material-icons green-text">Ajouter</i> sur la droite.',
    'version_edit_title' => 'Editer la version',
    'version_input_name' => 'Nom',
    'version_input_layout' => 'Layout',
    'version_create_title' => 'Ajouter une nouvelle version',
    'version_create_info' => 'Vous pouvez créer un nombre illimité de versions de pages avec des contenus différents. Publiez une version pour la rendre visible sur le site.',
    'version_input_copy_chooser' => 'Version à copier',
    'version_create_copy' => 'Créer une copie d\'une version existante.',
    'version_create_new' => 'Créer une nouvelle version vide.',
    'js_version_update_success' => 'La version a été mise à jour avec succès.',
    'js_version_error_empty_fields' => 'Un ou plusieurs champs sont vides ou ont une valeur non valide.',
    'js_version_create_success' => 'La nouvelle version a été enregistrée avec succès.',

    /* added translation in 1.0.0-beta7: */
    'view_index_create_page_please_choose' => 'Veuillez choisir',
    'view_index_sidebar_autopreview' => 'Aperçu automatique',
    
    /* added translation in 1.0.0-beta8 */
    'module_permission_add_new_page' => 'Créer une nouvelle page',
    'module_permission_update_pages' => 'Modifier la page',
    'module_permission_edit_drafts' => 'Modifier les modèles',
    'module_permission_page_blocks' => 'Blocs de contenu de la page',
    'js_version_delete_confirm' => 'Etes-vous sûr de vouloir supprimer la version «%alias%» de la page ?',
    'js_version_delete_confirm_success' => 'La version de la page %alias% a été supprimée avec succès.',
    'log_action_insert_cms_nav_item' => 'Nouvelle langue <b>{info}</b> ajoutée',
    'log_action_insert_cms_nav' => 'Nouvelle page <b>{info}</b> ajoutée',
    'log_action_insert_cms_nav_item_page_block_item' => 'Nouveau bloc <b>{info}</b> inséré',
    'log_action_insert_unkown' => 'Nouvelle ligne insérée',
    'log_action_update_cms_nav_item' => 'La langue de la page <b>{info}</b> a été mise à jour.',
    'log_action_update_cms_nav' => 'Le statut de la page <b>{info}</b> a été mis à jour.',
    'log_action_update_cms_nav_item_page_block_item' => 'Le contenu ou la configuration du bloc <b>{info}</b> a été mis(e) à jour.',
    'log_action_update_unkown' => 'Mise à jour d\'une ligne existante',
    'log_action_delete_cms_nav_item' => 'Suppression d\'une version linguistique de <b>{info}</b>',
    'log_action_delete_cms_nav' => 'Suppression de la page <b>{info}</b>',
    'log_action_delete_cms_nav_item_page_block_item' => 'Suppression du bloc <b>{info}</b>',
    'log_action_delete_unkown' => 'Suppression d\'une ligne',
    'block_group_favorites' => 'Favoris',
    'button_create_version' => 'Créer une version',
    'button_update_version' => 'Modifier une version',
    'menu_group_item_env_permission' => 'Permissions de la page',
    
    /* rc1 */
    'page_update_actions_deepcopy_text' => 'Créer une copie de la page courante avec tout son contenu. La copie inclura toutes les langues, mais seulement pour la version publiée.',
    'page_update_actions_deepcopy_btn' => 'Créer une copie',
    
    /* rc2 */
    'model_navitem_title_tag_label' => 'Balise title (SEO)',
    
    /* rc3 */
    'model_navitempage_empty_draft_id' => 'Impossible de créer une page à partir d\'un modèle vide',
    'view_update_variation_select' => 'Normal',
    'menu_group_item_env_config' => 'Configuration',
    'js_config_update_success' => 'Configuration enregistrée avec succès',
    'config_index_httpexceptionnavid' => 'Indiquez la page vers laquelle les erreurs 404 redirigeront.<br/><small>Conseil : créez une page 404 contenant votre message d\'erreur et marquez-la comme cachée.</small>',
    'module_permission_update_config' => 'Configurations du CMS',
    'module_permission_delete_pages' => 'Supprimer la page',
    'page_update_actions_deepcopy_title' => 'Copier la page',
    'page_update_actions_layout_title' => 'Fichier du layout',
    'page_update_actions_layout_text' => 'Vous pouvez définir un autre fichier de layout pour le rendu au lieu du layout principal (l\'extension ".php" peut être omise, les alias peuvent être utilisés dans le chemin d\'accès). Si ce champ est vide, le layout `main.php` sera utilisé par défaut.',
    'page_update_actions_layout_file_field' => 'Fichier du layout',
    'page_update_actions_modal_title' => 'Paramètres de la page',
    'js_page_update_layout_save_success' => 'Le fichier de layout a été mis à jour',
    'js_page_create_copy_success' => 'Une copie de la page a été créée.',
    'view_update_offline_info' => 'Changer le mode hors ligne/en ligne pour cette page.  Si une page est hors ligne, elle n\'est pas accessible par l\'URL.',
    'view_update_hidden_info' => 'Changer la visibilité de la page. Si une page est cachée, elle sera accessible par URL mais cachée dans la navigation.',
    'view_update_homepage_info' => 'Définissez cette page comme page d\'accueil',
    'view_update_block_tooltip_copy' => 'Ajouter au presse-papier',
    'view_update_block_tooltip_visible' => 'Afficher',
    'view_update_block_tooltip_invisible' => 'Cacher',
    'view_update_block_tooltip_edit' => 'Modifier',
    'view_update_block_tooltip_editcfg' => 'Configurer',
    'view_update_block_tooltip_delete' => 'Supprimer',
    'view_update_block_tooltip_close' => 'Fermer',
    
    // 1.0.0
    'cmsadmin_dashboard_lastupdate' => 'Dernières mises à jour de pages',
    'cmsadmin_settings_homepage_title' => 'Page par défaut',
    'cmsadmin_settings_trashpage_title' => 'Supprimer la page',
    'cmsadmin_settings_modal_title' => 'Paramètres',
    'cmsadmin_item_settings_titleslug' => 'Informations sur la page',
    'cmsadmin_created_at' => 'Créé le',
    'cmsadmin_version_remove' => 'Supprimer la version',
    'view_index_sidebar_container_no_pages' => 'Conteneur vide',
    'view_update_set_as_homepage_btn' => 'Définir comme page d\'accueil',
    'cmsadmin_settings_time_title' => 'Planificateur',
    'cmsadmin_settings_time_title_from' => 'De',
    'cmsadmin_settings_time_title_till' => 'Jusqu\'à',
    'view_index_page_meta_timestamp_create' => 'Date de création de la page',
    'nav_item_model_error_modulenacd /var   meexists' => 'L\'alias "{alias}" existe déjà en tant que module. Utilisez un alias différent ou renommez le module avec cet alias dans votre configuration.',
    'nav_item_model_error_parentnavidcannotnull' => 'L\'identifiant du parent ne peut être nul, une erreur s\'est produite lors de l\'extension de la page parente.',
    'nav_item_model_error_urlsegementexistsalready' => 'Cet alias existe déjà, veuillez choisir un autre nom.',
    'menu_group_item_env_redirections' => 'Redirections',
    'redirect_model_atr_timestamp_create' => 'Créer un horodatage',
    'redirect_model_atr_catch_path' => 'Du chemin d\'accès',
    'redirect_model_atr_catch_path_hint' => 'Le chemin de redirection. Si vous souhaitez faire correspondre les sous-chemins, utilisez le caractère générique * (comme dans /blog*), il correspondra à tous les sous-chemins de /blog.',
    'redirect_model_atr_catch_path_error' => 'Le chemin doit commencer par un /',
    'redirect_model_atr_redirect_path' => 'Destination',
    'redirect_model_atr_redirect_path_hint' => 'Vous pouvez utiliser soit un chemin absolu commençant par https:// ou http://, soit un chemin relatif à la racine du site commençant par /, soit un chemin relatif au chemin de redirection (par ex. : maintenance à rediriger depuis /shop/start vers /shop/maintenance).',
    'redirect_model_atr_redirect_status_code' => 'Code d\'état HTTP',
    'redirect_model_atr_redirect_status_code_hint' => 'Type de redirection. Lorsque "301: Moved Permanently" est utilisé, les navigateurs mettent en cache la redirection afin que les modifications apportées à la destination ne soient pas effectives sans effacer le cache du navigateur.',
    'redirect_model_atr_redirect_status_code_opt_301' => '301: Moved Permanently',
    'redirect_model_atr_redirect_status_code_opt_302' => '302: Moved Temporarily',

    // 1.0.1
    'module_permission_page' => 'Contenu de la page',

// 1.0.6
    'page_update_actions_deepcopyastemplate_title' => 'Copier comme modèle',
    'page_update_actions_deepcopyastemplate_text' => 'Créer un modèle de la page actuelle avec tout son contenu. Les modèles contiendront toutes les langues dont la version est publiée.',
    'page_update_actions_deepcopyastemplate_btn' => 'Créer un modèle',
    'js_page_create_copy_as_template_success' => 'Le modèlke a été créé.',

// 2.0

    'model_navitem_image_id_label' => 'Image',
    'view_index_page_label_subpage' => 'Sélectionner la page parente',
    'view_index_page_label_parent_nav_id' => 'Placement dans la navigation',
    'view_index_page_label_parent_nav_id_root' => 'En haut',
    'view_index_page_label_parent_nav_id_subpage' => 'Comme une sous-page',
    'cmsadmin_item_settings_titleseo' => 'Référencement',
    'cmsadmin_item_settings_titleexpert' => 'Expert',
    'model_navitem_is_url_strict_parsing_disabled_label' => 'Analyse strict de l\'URL',
    'model_navitem_is_url_strict_parsing_disabled_label_enabled' => 'Activé',
    'model_navitem_is_url_strict_parsing_disabled_label_disabled' => 'Désactivé',
    'model_navitem_is_url_strict_parsing_disabled_label_hint' => 'L\'analyse strict de l\'URL devrait être activé à moins que vous n\'utilisez un "URL-generating module block" dans le contenu de la page.',
    'model_navitem_title_tag_label_hint' => 'L\'intitulé est affiché dans beaucoup de barre de titre de navigateurs et comme titre de votre page dans les moteurs de recherche.',
    'view_index_page_meta_description_hint' => 'Le descriptif de votre page devrait être une explications à propos du but de cette page. Ceci est souvent tilisé par les moteurs de recherche comme une description dans les résultats affichés. C\'est également le cas lors du partage sur un réseau social.',
    'view_index_page_meta_keywords_hint' => 'Les mots-clés sont séparépar des virgules (p. ex. pizza, burger, pâtes). Très peu de moteurs de recherche se basent encore sur ces mots-clés. Utilisez uniquement des mots qui ont du sens pour le contenu de la page. La barre d\'outils LUYA va vous aider à vérifier quels mots-clés ont été défini pour la page actuelle.',
    'model_navitem_image_id_label_hint' => 'L\'image est importante pour le partage sur les réseaux sociaux. Habituellement, cette image est affichée par les réseaux sopciaux comme image d\'aperçu de la page.',
    'view_index_module_controller_name' => 'Controleur',
    'view_index_module_action_name' => 'Action',
    'view_index_module_action_params' => 'Action paramètres',
    'view_index_module_select_help' => 'Choisissez le module à afficher depuis la liste (Seuls les modules d\'affichage sont affiché). Les modules doivent être configurés dans la section module de la configuration.',
    'view_index_module_advanced_settings_button' => 'Paramètres avancés',

// 3.0

    'menu_group_item_env_themes' => 'Themes',
    'view_index_page_is_cacheable' => 'Caching',
    'view_index_page_is_cacheable_hint' => 'When enabled, the whole page will be cached including all blocks, therefore dynamically generated data in blocks will not be updated.',

// 3.3

    'menu_group_page_display' => 'Page Display',
    'menu_group_configuration' => 'Configuration',
    'menu_group_protocol' => 'Protocol',
    'menu_group_protocol_model_event_logger' => 'Model Event Log',
    
// 4.0

    'menu_group_item_env_websites' => 'Websites',
    'model_website_use_default_theme' => 'Use default theme',
];
