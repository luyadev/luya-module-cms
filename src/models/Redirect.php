<?php

namespace luya\cms\models;

use luya\admin\buttons\DuplicateActiveButton;
use luya\admin\ngrest\base\NgRestModel;
use luya\cms\admin\Module;
use luya\helpers\StringHelper;
use luya\helpers\Url;
use yii\behaviors\TimestampBehavior;

/**
 * Redirect.
 *
 * File has been created with `crud/create` command on LUYA version 1.0.0.
 *
 * @property integer $id
 * @property integer $timestamp_create
 * @property string $catch_path
 * @property string $redirect_path
 * @property integer $redirect_status_code
 */
class Redirect extends NgRestModel
{
    /**
     * @inheritdoc
     */
    public static function tableName()
    {
        return 'cms_redirect';
    }

    /**
     * @inheritdoc
     */
    public static function ngRestApiEndpoint()
    {
        return 'api-cms-redirect';
    }

    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        return [
            'timestamp' => [
                'class' => TimestampBehavior::class,
                'createdAtAttribute' => 'timestamp_create',
                'updatedAtAttribute' => false,
            ]
        ];
    }

    /**
     * @inheritdoc
     */
    public function attributeLabels()
    {
        return [
            'id' => Module::t('ID'),
            'timestamp_create' => Module::t('redirect_model_atr_timestamp_create'),
            'catch_path' => Module::t('redirect_model_atr_catch_path'),
            'redirect_path' => Module::t('redirect_model_atr_redirect_path'),
            'redirect_status_code' => Module::t('redirect_model_atr_redirect_status_code'),
        ];
    }

    public function attributeHints()
    {
        return [
            'redirect_status_code' => Module::t('redirect_model_atr_redirect_status_code_hint'),
            'catch_path' => Module::t('redirect_model_atr_catch_path_hint'),
            'redirect_path' => Module::t('redirect_model_atr_redirect_path_hint'),
        ];
    }

    /**
     * @inheritdoc
     */
    public function rules()
    {
        return [
            [['timestamp_create', 'redirect_status_code'], 'integer'],
            [['catch_path', 'redirect_path', 'redirect_status_code'], 'required'],
            [['catch_path', 'redirect_path'], 'string', 'max' => 255],
            [['catch_path'], function ($attribute) {
                if (!StringHelper::startsWith($this->catch_path, '/')) {
                    $this->addError($attribute, Module::t('redirect_model_atr_catch_path_error'));
                }
            }]
        ];
    }

    /**
     * @inheritdoc
     */
    public function genericSearchFields()
    {
        return ['catch_path', 'redirect_path'];
    }

    /**
     * @inheritdoc
     */
    public function ngRestAttributeTypes()
    {
        return [
            'catch_path' => ['text', 'placeholder' => '/path/to/catch', 'encoding' => false],
            'redirect_path' => ['text', 'placeholder' => '/path/to/redirect', 'encoding' => false],
            'redirect_status_code' => ['selectArray', 'data' => [
                301 => Module::t('redirect_model_atr_redirect_status_code_opt_301'),
                302 => Module::t('redirect_model_atr_redirect_status_code_opt_302'),
            ], 'initValue' => 302],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestScopes()
    {
        return [
            ['list', ['catch_path', 'redirect_path', 'redirect_status_code']],
            [['create', 'update'], ['catch_path', 'redirect_path', 'redirect_status_code']],
            ['delete', true],
        ];
    }

    /**
     * @inheritdoc
     */
    public function ngRestActiveButtons()
    {
        return [
            [
                'class' => DuplicateActiveButton::class,
            ]
        ];
    }

    /**
     * Match Request Path against catch_path.
     *
     * Several version of the request path will be checked in order to ensure different siutations can be handled.
     *
     * `foo/*` catch_path would return `bar` when the request path is `foo/bar`.
     *
     * @param string $requestPath The path from the webserver (the URL which has been opened).
     * @return boolean|string If the provided $catch_path matches the requestPath it returns true, or if a wild card is used the pattern is returned. {@since 3.5.0}
     */
    public function matchRequestPath($requestPath): bool|string
    {
        foreach ([$requestPath, urlencode($requestPath), urldecode($requestPath)] as $path) {
            foreach ([$this->catch_path, urlencode($this->catch_path), urldecode($this->catch_path)] as $catch) {
                if ($response = $this->pathMatcher($path, $catch)) {
                    return $response;
                }
            }
        }

        return false;
    }

    /**
     * Turn wildcard into match all regex pattern and return result
     *
     * @param string $requestPath
     * @param string $catchPath
     * @since 4.0.0
     */
    private function inputToRegex($requestPath, $catchPath): bool|string|array
    {
        $pattern = str_replace('\*', '(.*)', preg_quote($catchPath, '/'));

        if (preg_match('/'.$pattern.'/i', $requestPath, $result) == 1) {
            return $result;
        }

        return false;
    }
    /**
     * Internal path matcher
     *
     * @param string $input The input request path
     * @param string $catchPath The path to catch
     * @return boolean|string Returns either true, false or if a wildcard is used, the value is returned {@since 3.5.0}
     * @since 1.0.8
     */
    private function pathMatcher($input, $catchPath): bool|string
    {
        // ensure request path is prefix with slash
        $requestPath = '/'.ltrim($input, '/');

        // match wild cards which are end of a string like `/foobar*`
        if (StringHelper::startsWithWildcard($requestPath, $catchPath)) {
            $result = $this->inputToRegex($requestPath, $catchPath);
            if ($result && isset($result[1]) && !empty($result[1])) {
                return $result[1];
            }

            // wildcard pattern match returns true
            return true;
        }

        // match for anywild card like `/*.html`
        if (StringHelper::contains('*', $catchPath)) {
            $result = $this->inputToRegex($requestPath, $catchPath);
            if ($result && isset($result[1]) && !empty($result[1])) {
                return $result[1];
            }
        }

        // compare strings
        return ($requestPath == $catchPath);
    }

    /**
     *
     * @param string $wildcard An optional wildcard string which can be used as with `*` in the redirect_path. {@since 3.5.0}
     * @return string
     */
    public function getRedirectUrl($wildcard = null)
    {
        $redirectPath = $this->redirect_path;

        if ($wildcard) {
            $redirectPath = str_replace('*', $wildcard, $redirectPath);
        }

        return Url::to($redirectPath);
    }
}
