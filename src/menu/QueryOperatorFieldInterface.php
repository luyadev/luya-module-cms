<?php

namespace luya\cms\menu;

/**
 * Menu Query Operator Field Interface.
 *
 * This interfaces describes all available fields which can be used as Operator in {{luya\cms\menu\Query::where()}} conditions.
 *
 * @author Basil Suter <basil@nadar.io>
 * @since 1.0.0
 */
interface QueryOperatorFieldInterface
{
    /**
     * @var string Operator Field ID, contains the absolute id for a page (nav item id)
     */
    public const FIELD_ID = 'id';
    /**
     * @var string Operator Field
     */
    public const FIELD_NAVID = 'nav_id';
    /**
     * @var string Operator Field
     */
    public const FIELD_LANG = 'lang';
    /**
     * @var string Operator Field
     */
    public const FIELD_LINK = 'link';
    /**
     * @var string Operator Field
     */
    public const FIELD_TITLE = 'title';
    /**
     * @var string Operator Field
     */
    public const FIELD_TITLETAG = 'title_tag';
    /**
     * @var string Operator Field
     */
    public const FIELD_ALIAS = 'alias';
    /**
     * @var string Operator Field
     */
    public const FIELD_DESCRIPTION = 'description';
    /**
     * @var string Operator Field
     */
    public const FIELD_KEYWORDS = 'keywords';
    /**
     * @var string Operator Field
     */
    public const FIELD_CREATEUSERID = 'create_user_id';
    /**
     * @var string Operator Field
     */
    public const FIELD_UPDATEUSERID = 'update_user_id';
    /**
     * @var string Operator Field
     */
    public const FIELD_TIMESTAMPCREATE = 'timestamp_create';
    /**
     * @var string Operator Field
     */
    public const FIELD_TIMESTAMPUPDATE = 'timestamp_update';
    /**
     * @var string Operator Field
     */
    public const FIELD_ISHOME = 'is_home';
    /**
     * @var string Operator Field
     */
    public const FIELD_PARENTNAVID = 'parent_nav_id';
    /**
     * @var string Operator Field
     */
    public const FIELD_SORTINDEX = 'sort_index';
    /**
     * @var string Operator Field
     */
    public const FIELD_ISHIDDEN = 'is_hidden';
    /**
     * @var string Operator Field
     */
    public const FIELD_TYPE = 'type';
    /**
     * @var string Operator Field
     */
    public const FIELD_REDIRECT = 'redirect';
    /**
     * @var string Operator Field
     */
    public const FIELD_MODULENAME = 'module_name';
    /**
     * @var string Operator Field
     */
    public const FIELD_CONTAINER = 'container';
    /**
     * @var string Operator Field
     */
    public const FIELD_DEPTH = 'depth';

    /**
     * @var string Strict Parsing Operator Field
     * @since 2.0.0
     */
    public const FIELD_IS_URL_STRICT_PARSING_DISABLED = 'is_url_strict_parsing_disabled';
}
