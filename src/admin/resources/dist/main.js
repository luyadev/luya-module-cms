function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  "use strict"; // directive.js

  zaa.directive("menuDropdown", ['ServiceMenuData', '$filter', function (ServiceMenuData, $filter) {
    return {
      restrict: 'E',
      scope: {
        navId: '='
      },
      controller: ['$scope', function ($scope) {
        $scope.changeModel = function (data) {
          $scope.navId = data.id;
        };

        $scope.menuData = angular.copy(ServiceMenuData.data);
        $scope.menuDataOriginal = angular.copy(ServiceMenuData.data);
        $scope.$on('service:MenuData', function (event, data) {
          $scope.menuData = angular.copy(data);
          $scope.menuDataOriginal = angular.copy(data);
        });

        function init() {
          if ($scope.menuData.length == 0) {
            ServiceMenuData.load();
          }
        }

        for (var container in $scope.menuData.containers) {
          $scope.menuData.containers[container].isHidden = false;
        }

        $scope.$watch('searchQuery', function (n) {
          if (n == null || n == '') {
            $scope.menuData.items = angular.copy($scope.menuDataOriginal.items);
            return;
          }

          var items = $filter('filter')($scope.menuDataOriginal.items, {
            title: n
          }); // find all parent elements of the found elements and re add them to the map in order to 
          // ensure a correct menu tree.

          angular.forEach(items, function (value) {
            if (value['parent_nav_id'] != null) {
              $scope.bubbleParents(value['parent_nav_id'], value['nav_container_id'], items);
            }
          });
          $scope.menuData.items = items;
        });

        $scope.bubbleParents = function (parentNavId, containerId, index) {
          var item = $filter('menuchildfilter')($scope.currentWebsiteId, $scope.menuDataOriginal.items, containerId, parentNavId);

          if (item) {
            var exists = false;
            angular.forEach(index, function (i) {
              if (i.id == item.id) {
                exists = true;
              }
            });

            if (!exists) {
              index.push(item);
            }

            $scope.bubbleParents(item.parent_nav_id, item.nav_container_id, index);
          }
        };

        $scope.toggler = true;
        init();
      }],
      template: function template() {
        return '<div>' + '<div class="input-group mb-2">' + '<div class="input-group-prepend" ng-hide="searchQuery"><div class="input-group-text"><i class="material-icons">search</i></div></div>' + '<div class="input-group-prepend" ng-show="searchQuery" ng-click="searchQuery = \'\'"><div class="input-group-text"><i class="material-icons">clear</i></div></div>' + '<input class="form-control" ng-model="searchQuery" type="text" placeholder="' + i18n['ngrest_crud_search_text'] + '">' + '</div>' + '<div ng-repeat="(key, container) in menuData.containers" ng-if="(menuData.items | menuparentfilter:container.id:null).length > 0" class="card mb-2" ng-class="{\'card-closed\': !container.isHidden}">' + '<div class="card-header" ng-click="container.isHidden=!container.isHidden">' + '<span class="material-icons card-toggle-indicator">keyboard_arrow_down</span>' + '<span>{{container.name}}</span>' + '</div>' + '<div class="card-body">' + '<div class="treeview treeview-chooser">' + '<ul class="treeview-items treeview-items-lvl1">' + '<li class="treeview-item treeview-item-lvl1" ng-class="{\'treeview-item-has-children\' : (menuData.items | menuparentfilter:container.id:null).length}" ng-repeat="(key, data) in menuData.items | menuparentfilter:container.id:null track by data.id" ng-include="\'menuDropdownReverse\'"></li>' + '</ul>' + '</div>' + '</div>' + '</div>' + '</div>';
      }
    };
  }]);
  zaa.directive("zaaCmsPage", function () {
    return {
      restrict: "E",
      scope: {
        "model": "=",
        "options": "=",
        "label": "@label",
        "i18n": "@i18n",
        "id": "@fieldid",
        "name": "@fieldname"
      },
      template: function template() {
        return '<div class="form-group form-side-by-side" ng-class="{\'input--hide-label\': i18n}">' + '<div class="form-side form-side-label">' + '<label>{{label}}</label>' + '</div>' + '<div class="form-side">' + '<menu-dropdown class="menu-dropdown" nav-id="model" />' + '</div>' + '</div>';
      }
    };
  });
  zaa.directive("showInternalRedirection", function () {
    return {
      restrict: 'E',
      scope: {
        navId: '='
      },
      controller: ['$scope', '$http', '$state', function ($scope, $http, $state) {
        $scope.$watch('navId', function (n) {
          if (n) {
            $http.get('admin/api-cms-navitem/get-nav-item-path', {
              params: {
                navId: $scope.navId
              }
            }).then(function (response) {
              $scope.path = response.data;
            });
            $http.get('admin/api-cms-navitem/get-nav-container-name', {
              params: {
                navId: $scope.navId
              }
            }).then(function (response) {
              $scope.container = response.data;
            });
          }
        });
      }],
      template: function template() {
        return '<a class="btn btn-secondary btn-sm" ui-sref="custom.cmsedit({ navId : navId, templateId: \'cmsadmin/default/index\'})">{{path}}</a> in {{container}}';
      }
    };
  });
  zaa.directive("createForm", function () {
    return {
      restrict: 'EA',
      scope: {
        data: '='
      },
      templateUrl: 'createform.html',
      controller: ['$scope', '$http', '$filter', 'ServiceMenuData', 'ServiceLanguagesData', 'AdminToastService', 'ServiceCurrentWebsite', function ($scope, $http, $filter, ServiceMenuData, ServiceLanguagesData, AdminToastService, ServiceCurrentWebsite) {
        $scope.error = [];
        $scope.success = false;
        $scope.controller = $scope.$parent;
        $scope.menuData = ServiceMenuData.data;
        $scope.$on('service:MenuData', function (event, data) {
          $scope.menuData = data;
        });
        $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
          $scope.data.nav_container_id = ServiceCurrentWebsite.currentWebsite.default_container_id;
        });

        $scope.menuDataReload = function () {
          return ServiceMenuData.load(true);
        };

        function initializer() {
          $scope.menu = $scope.menuData.items;
          $scope.navcontainers = $scope.menuData.containers;
        }

        initializer();
        $scope.data.nav_item_type = 1;
        $scope.data.parent_nav_id = null;
        $scope.data.is_draft = 0;
        $scope.data.nav_container_id = null;
        $scope.languagesData = ServiceLanguagesData.data;
        $scope.$on('service:LanguagesData', function (event, data) {
          $scope.languagesData = data;
        });
        $scope.data.lang_id = parseInt($filter('filter')($scope.languagesData, {
          'is_default': '1'
        }, true)[0].id);
        $scope.navitems = [];
        $scope.$watch(function () {
          return $scope.data.nav_container_id;
        }, function (n, o) {
          if (n !== undefined && n !== o) {
            $scope.data.parent_nav_id = null;
            $scope.navitems = $scope.menu[n]['__items'];
          }
        });

        $scope.aliasSuggestion = function () {
          $scope.data.alias = $filter('slugify')($scope.data.title);
        };

        $scope.$watch('data.alias', function (n, o) {
          if (n != o && n != null) {
            $scope.data.alias = $filter('slugify')(n);
          }
        });

        $scope.exec = function () {
          $scope.controller.save().then(function (response) {
            $scope.menuDataReload();
            $scope.success = true;
            $scope.error = [];
            $scope.data.title = null;
            $scope.data.alias = null;

            if ($scope.data.isInline) {
              $scope.$parent.$parent.getItem($scope.data.lang_id, $scope.data.nav_id);
            }

            AdminToastService.success(i18n['view_index_page_success']);
          }, function (reason) {
            angular.forEach(reason, function (value, key) {
              AdminToastService.error(value[0]);
            });
            $scope.error = reason;
          });
        };
      }]
    };
  });
  /** PAGE CREATE & UPDATE */

  zaa.directive("updateFormPage", ['ServiceLayoutsData', function (ServiceLayoutsData) {
    return {
      restrict: 'EA',
      scope: {
        data: '='
      },
      templateUrl: 'updateformpage.html',
      controller: ['$scope', '$http', function ($scope, $http) {
        $scope.parent = $scope.$parent.$parent;
        $scope.navItemId = $scope.parent.item.id;
        $scope.data.layout_id = 0;
        $scope.layoutsData = ServiceLayoutsData.data;
        $scope.$on('service:LayoutsData', function (event, data) {
          $scope.layoutsData = data;
        });
        $scope.versionsData = [];

        $scope.getVersionList = function () {
          $http.get('admin/api-cms-navitempage/versions', {
            params: {
              navItemId: $scope.navItemId
            }
          }).then(function (response) {
            $scope.versionsData = response.data;
          });
        };

        $scope.isEditAvailable = function () {
          return $scope.versionsData.length;
        };

        function init() {
          $scope.getVersionList();
        }

        init();
      }]
    };
  }]);
  zaa.directive("createFormPage", function () {
    return {
      restrict: 'EA',
      scope: {
        data: '='
      },
      templateUrl: 'createformpage.html',
      controller: ['$scope', 'ServiceLayoutsData', 'ServiceMenuData', function ($scope, ServiceLayoutsData, ServiceMenuData) {
        $scope.data.use_draft = 0;
        $scope.data.layout_id = 0;
        $scope.data.from_draft_id = 0;
        /* layoutsData */

        $scope.layoutsData = ServiceLayoutsData.data;
        $scope.$on('service:BlocksData', function (event, data) {
          $scope.layoutsData = data;
        });
        /* menuData */

        $scope.menuData = ServiceMenuData.data;
        $scope.$on('service:MenuData', function (event, data) {
          $scope.menuData = data;
        });

        function init() {
          $scope.drafts = $scope.menuData.drafts;
          $scope.layouts = $scope.layoutsData;
        }

        init();

        $scope.save = function () {
          $scope.$parent.exec();
        };
      }]
    };
  });
  /* Page MODULE */

  zaa.directive("formModule", function () {
    return {
      restrict: 'EA',
      scope: {
        data: '='
      },
      templateUrl: 'formmodule.html',
      controller: ['$scope', '$http', function ($scope, $http) {
        $scope.modules = [];
        $scope.controllers = [];
        $scope.actions = [];
        $scope.params = {};
        $http.get('admin/api-admin-common/data-modules').then(function (response) {
          $scope.modules = response.data;
        });

        $scope.addParam = function (key) {
          if (!$scope.data.hasOwnProperty('action_params')) {
            $scope.data.action_params = {};
          }

          $scope.data.action_params[key] = '';
        };

        $scope.$watch(function () {
          return $scope.data.module_name;
        }, function (n) {
          if (n) {
            $http.get('admin/api-cms-admin/module-controllers?module=' + n).then(function (response) {
              $scope.controllers = response.data;
              $scope.actions = [];
            });
          }
        });
        $scope.$watch(function () {
          return $scope.data.controller_name;
        }, function (n) {
          if (n) {
            $http.get('admin/api-cms-admin/controller-actions?module=' + $scope.data.module_name + '&controller=' + n).then(function (response) {
              $scope.actions = response.data;
            });
          }
        });
      }]
    };
  });
  /* filters */

  zaa.filter("menuwebsitefilter", function () {
    return function (input, websiteId) {
      var result = [];
      angular.forEach(input, function (value, key) {
        if (value.website_id == websiteId) {
          result.push(value);
        }
      });
      return result;
    };
  });
  zaa.filter("menuparentfilter", function () {
    return function (input, containerId, parentNavId) {
      var result = [];
      angular.forEach(input, function (value, key) {
        if (value.parent_nav_id == parentNavId && value.nav_container_id == containerId) {
          result.push(value);
        }
      });
      return result;
    };
  });
  zaa.filter('menuchildfilter', function () {
    return function (input, containerId, parentNavId) {
      var returnValue = false;
      angular.forEach(input, function (value, key) {
        if (!returnValue) {
          if (value.id == parentNavId && value.nav_container_id == containerId) {
            returnValue = value;
          }
        }
      });
      return returnValue;
    };
  });
  /* factory.js */

  zaa.factory('PlaceholderService', function () {
    var service = [];
    service.status = 1;
    /* 1 = showplaceholders; 0 = hide placeholders */

    service.delegate = function (status) {
      service.status = status;
    };

    return service;
  });
  /* layout.js */

  zaa.config(['$stateProvider', function ($stateProvider) {
    $stateProvider.state("custom.cmsedit", {
      url: "/update/:navId",
      templateUrl: 'cmsadmin/page/update'
    }).state("custom.cmsadd", {
      url: "/create",
      templateUrl: 'cmsadmin/page/create'
    }).state("custom.cmsdraft", {
      url: '/drafts',
      templateUrl: 'cmsadmin/page/drafts'
    });
  }]);
  /* controllers */

  zaa.controller("DraftsController", ['$scope', '$state', 'ServiceMenuData', function ($scope, $state, ServiceMenuData) {
    $scope.menuData = ServiceMenuData.data;
    $scope.$on('service:MenuData', function (event, data) {
      $scope.menuData = data;
    });

    $scope.go = function (navId) {
      $state.go('custom.cmsedit', {
        navId: navId
      });
    };
  }]);
  zaa.controller("CmsDashboard", ['$scope', '$http', function ($scope, $http) {
    $scope.dashboard = [];
    $http.get('admin/api-cms-admin/dashboard-log').then(function (response) {
      $scope.dashboard = response.data;
    });
  }]);
  zaa.controller("ConfigController", ['$scope', '$http', 'AdminToastService', function ($scope, $http, AdminToastService) {
    $scope.data = {};
    $http.get('admin/api-cms-admin/config').then(function (response) {
      $scope.data = response.data;
    });

    $scope.save = function () {
      $http.post('admin/api-cms-admin/config', $scope.data).then(function (response) {
        AdminToastService.success(i18n['js_config_update_success']);
      });
    };
  }]);
  zaa.controller("PageVersionsController", ['$scope', '$http', 'ServiceLayoutsData', 'AdminToastService', function ($scope, $http, ServiceLayoutsData, AdminToastService) {
    /**
     * @var object $typeData From parent scope controller NavItemController
     * @var object $item From parent scope controller NavItemController
     * @var string $versionName From ng-model
     * @var integer $fromVersionPageId From ng-model the version copy from or 0 = new empty/blank version
     * @var integer $versionLayoutId From ng-model, only if fromVersionPageId is 0
    	 */
    var headers = {
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      }
    };
    /* layoutsData */

    $scope.layoutsData = ServiceLayoutsData.data;
    $scope.$on('service:LayoutsData', function (event, data) {
      $scope.layoutsData = data;
    });
    /* controller logic */

    $scope.createNewVersionSubmit = function (data) {
      if (data == undefined) {
        AdminToastService.error(i18n['js_version_error_empty_fields']);
        return null;
      }

      if (data.copyExistingVersion) {
        data.versionLayoutId = 0;
      }

      $http.post('admin/api-cms-navitem/create-page-version', $.param({
        'layoutId': data.versionLayoutId,
        'navItemId': $scope.item.id,
        'name': data.versionName,
        'fromPageId': data.fromVersionPageId
      }), headers).then(function (response) {
        if (response.data.error) {
          AdminToastService.error(i18n['js_version_error_empty_fields']);
          return null;
        }

        $scope.refreshForce();
        AdminToastService.success(i18n['js_version_create_success']);
      });
    };
  }]);
  zaa.controller("CopyPageController", ['$scope', '$http', '$filter', 'AdminToastService', function ($scope, $http, $filter, AdminToastService) {
    var headers = {
      "headers": {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      }
    };
    $scope.$on('deletedNavItem', function () {
      $scope.isOpen = false;
      $scope.itemSelection = false;
      $scope.selection = 0;
    });
    $scope.NavItemController = $scope.$parent;
    $scope.navId = 0;
    $scope.items = null;
    $scope.isOpen = false;
    $scope.itemSelection = false;
    $scope.selection = 0;

    $scope.select = function (item) {
      $scope.selection = item.id;
      $scope.itemSelection = angular.copy(item);
    };

    $scope.$watch('itemSelection.title', function (n, o) {
      if (n) {
        $scope.aliasSuggestion();
      }
    });

    $scope.aliasSuggestion = function () {
      $scope.itemSelection.alias = $filter('slugify')($scope.itemSelection.title);
    };

    $scope.loadItems = function () {
      $scope.navId = $scope.NavItemController.NavController.navData.id;
      $http.get('admin/api-cms-nav/find-nav-items', {
        params: {
          navId: $scope.navId
        }
      }).then(function (response) {
        $scope.items = response.data;
        $scope.isOpen = true;
      });
    };

    $scope.save = function () {
      $scope.itemSelection['toLangId'] = $scope.NavItemController.lang.id;
      $http.post('admin/api-cms-nav/create-from-page', $.param($scope.itemSelection), headers).then(function (response) {
        if (response.data) {
          AdminToastService.success(i18n['js_added_translation_ok']);
          $scope.NavItemController.refresh();
        } else {
          AdminToastService.error(i18n['js_added_translation_error']);
        }
      }, function (response) {
        AdminToastService.errorArray(response.data);
      });
    };
  }]);
  zaa.controller("CmsMenuTreeController", ['$scope', '$rootScope', '$state', '$http', '$filter', 'ServiceMenuData', 'ServiceLiveEditMode', 'ServiceCurrentWebsite', function ($scope, $rootScope, $state, $http, $filter, ServiceMenuData, ServiceLiveEditMode, ServiceCurrentWebsite) {
    // live edit service
    $scope.liveEditState = 0;
    $scope.$watch('liveEditStateToggler', function (n) {
      ServiceLiveEditMode.state = n;
    });

    $scope.loadCmsConfig = function () {
      $http.get('admin/api-cms-admin/config').then(function (response) {
        $rootScope.cmsConfig = response.data;
      });
    };

    $scope.loadCmsConfig(); // menu Data

    $scope.menuData = ServiceMenuData.data;
    $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
    $scope.$on('service:MenuData', function (event, data) {
      $scope.menuData = data;
    });

    $scope.menuDataReload = function () {
      return ServiceMenuData.load(true);
    };

    $scope.$watch('currentWebsiteToggler', function (id) {
      ServiceCurrentWebsite.toggle(id); //ServiceMenuData.load()
    });
    $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
      $scope.currentWebsite = data;
      $scope.currentWebsiteToggler = data.id;
    }); // controller logic

    $scope.dropEmptyContainer = function (dragged, dropped, position, catId) {
      $http.get('admin/api-cms-navitem/move-to-container', {
        params: {
          moveItemId: dragged.id,
          droppedOnCatId: catId
        }
      }).then(function (succes) {
        ServiceMenuData.load(true);
      });
    };

    $scope.dropItem = function (drag, drop, pos) {
      if (pos == 'bottom') {
        var api = 'admin/api-cms-navitem/move-after';
        var params = {
          moveItemId: drag.id,
          droppedAfterItemId: drop.id
        };
      } else if (pos == 'top') {
        var api = 'admin/api-cms-navitem/move-before';
        var params = {
          moveItemId: drag.id,
          droppedBeforeItemId: drop.id
        };
      } else if (pos == 'middle') {
        var api = 'admin/api-cms-navitem/move-to-child';
        var params = {
          moveItemId: drag.id,
          droppedOnItemId: drop.id
        };
      }

      $http.get(api, {
        params: params
      }).then(function (success) {
        ServiceMenuData.load(true);
      }, function (error) {
        //console.log('throw error message errorMessageOnDuplicateAlias');
        ServiceMenuData.load(true);
      });
    };

    $scope.validItem = function (hover, draged) {
      if (hover.id == draged.id) {
        return false;
      }

      $scope.rritems = [];
      $scope.recursivItemValidity(draged.nav_container_id, draged.id);

      if ($scope.rritems.indexOf(hover.id) == -1) {
        return true;
      }

      return false;
    };

    $scope.rritems = [];

    $scope.recursivItemValidity = function (containerId, parentNavId) {
      var items = $filter('menuparentfilter')($scope.menuData.items, containerId, parentNavId);
      angular.forEach(items, function (item) {
        $scope.rritems.push(item.id);
        $scope.recursivItemValidity(containerId, item.id);
      });
    };

    $scope.toggleItem = function (data) {
      if (data.toggle_open == undefined) {
        data['toggle_open'] = 1;
      } else {
        data['toggle_open'] = !data.toggle_open;
      }

      $http.post('admin/api-cms-nav/tree-history', {
        data: data
      }, {
        ignoreLoadingBar: true
      });
    };

    $scope.go = function (data) {
      ServiceLiveEditMode.changeUrl(data.nav_item_id, 0);
      $state.go('custom.cmsedit', {
        navId: data.id
      });
    };

    $scope.showDrag = 0;

    $scope.isCurrentElement = function (data) {
      if (data !== null && $state.params.navId == data.id) {
        return true;
      }

      return false;
    };

    $scope.hiddenCats = [];
    $scope.$watch('menuData', function (n, o) {
      $scope.hiddenCats = n.hiddenCats;
    });

    $scope.toggleCat = function (catId) {
      if (catId in $scope.hiddenCats) {
        $scope.hiddenCats[catId] = !$scope.hiddenCats[catId];
      } else {
        $scope.hiddenCats[catId] = 1;
      }

      $http.post('admin/api-cms-nav/save-cat-toggle', {
        catId: catId,
        state: $scope.hiddenCats[catId]
      }, {
        ignoreLoadingBar: true
      });
    };

    $scope.toggleIsHidden = function (catId) {
      if ($scope.hiddenCats == undefined) {
        return false;
      }

      if (catId in $scope.hiddenCats) {
        if ($scope.hiddenCats[catId] == 1) {
          return true;
        }
      }

      return false;
    };
  }]);
  zaa.controller("CmsadminCreateController", ['$scope', '$q', '$http', function ($scope, $q, $http) {
    $scope.data = {};
    $scope.data.isInline = false;

    $scope.save = function () {
      var headers = {
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
      };
      return $q(function (resolve, reject) {
        if ($scope.data.nav_item_type == 1) {
          $http.post('admin/api-cms-nav/create-page', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }

        if ($scope.data.nav_item_type == 2) {
          $http.post('admin/api-cms-nav/create-module', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }

        if ($scope.data.nav_item_type == 3) {
          $http.post('admin/api-cms-nav/create-redirect', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }
      });
    };
  }]);
  zaa.controller("CmsadminCreateInlineController", ['$scope', '$q', '$http', function ($scope, $q, $http) {
    $scope.data = {
      nav_id: $scope.$parent.NavController.id
    };
    $scope.data.isInline = true;

    $scope.save = function () {
      $scope.data.lang_id = $scope.lang.id;
      var headers = {
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
      };
      return $q(function (resolve, reject) {
        if ($scope.data.nav_item_type == 1) {
          $http.post('admin/api-cms-nav/create-page-item', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }

        if ($scope.data.nav_item_type == 2) {
          $http.post('admin/api-cms-nav/create-module-item', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }

        if ($scope.data.nav_item_type == 3) {
          $http.post('admin/api-cms-nav/create-redirect-item', $.param($scope.data), headers).then(function (response) {
            resolve(response.data);
          }, function (response) {
            reject(response.data);
          });
        }
      });
    };
  }]);
  zaa.controller("NavController", ['$scope', '$rootScope', '$filter', '$state', '$stateParams', '$http', 'PlaceholderService', 'ServicePropertiesData', 'ServiceMenuData', 'ServiceLanguagesData', 'ServiceLiveEditMode', 'AdminToastService', 'AdminClassService', 'AdminLangService', 'HtmlStorage', function ($scope, $rootScope, $filter, $state, $stateParams, $http, PlaceholderService, ServicePropertiesData, ServiceMenuData, ServiceLanguagesData, ServiceLiveEditMode, AdminToastService, AdminClassService, AdminLangService, HtmlStorage) {
    $scope.pageSettingsOverlayHidden = true;
    $scope.pageSettingsOverlayTab = 1;

    $scope.togglePageSettingsOverlay = function (t) {
      $scope.pageSettingsOverlayTab = t;
      $scope.pageSettingsOverlayHidden = !$scope.pageSettingsOverlayHidden;
    };

    $scope.navCfg = {
      helptags: $rootScope.luyacfg.helptags
    };
    $scope.$watch(function () {
      return ServiceLiveEditMode.state;
    }, function (n, o) {
      $scope.displayLiveContainer = n;
    });
    $scope.$watch(function () {
      return ServiceLiveEditMode.url;
    }, function (n, o) {
      $scope.liveUrl = n;
    });
    $scope.AdminLangService = AdminLangService;
    /* service AdminPropertyService inheritance */

    $scope.propertiesData = ServicePropertiesData.data;
    $scope.$on('service:PropertiesData', function (event, data) {
      $scope.propertiesData = data;
    });
    /* service ServiceMenuData inheritance */

    $scope.menuData = ServiceMenuData.data;
    $scope.$on('service:MenuData', function (event, data) {
      $scope.menuData = data;
    });

    $scope.menuDataReload = function () {
      return ServiceMenuData.load(true);
    };
    /* service ServiceLangaugesData inheritance */


    $scope.languagesData = ServiceLanguagesData.data;
    $scope.$on('service:LanguagesData', function (event, data) {
      $scope.languagesData = data;
    });
    /* placeholders toggler service */

    $scope.PlaceholderService = PlaceholderService;
    $scope.placeholderState = $scope.PlaceholderService.status;
    $scope.$watch('placeholderState', function (n, o) {
      if (n !== o && n !== undefined) {
        $scope.PlaceholderService.delegate(n);
      }
    });
    /* Blockholder size toggler */

    $scope.isBlockholderSmall = HtmlStorage.getValue('blockholderToggleState', true);

    $scope.toggleBlockholderSize = function () {
      $scope.isBlockholderSmall = !$scope.isBlockholderSmall;
      HtmlStorage.setValue('blockholderToggleState', $scope.isBlockholderSmall);
    };
    /* sidebar logic */


    $scope.sidebar = false;

    $scope.enableSidebar = function () {
      $scope.sidebar = true;
    };

    $scope.toggleSidebar = function () {
      $scope.sidebar = !$scope.sidebar;
    };
    /* app logic */


    $scope.showActions = 1;
    $scope.id = parseInt($stateParams.navId);
    $scope.isDeleted = false;
    $scope.AdminClassService = AdminClassService;
    $scope.propValues = {};
    $scope.hasValues = false;
    $scope.pageTags = [];

    $scope.bubbleParents = function (parentNavId, containerId) {
      var item = $filter('menuchildfilter')($scope.currentWebsiteId, $scope.menuData.items, containerId, parentNavId);

      if (item) {
        item.toggle_open = 1;
        $scope.bubbleParents(item.parent_nav_id, item.nav_container_id);
      }
    };

    $scope.createDeepPageCopy = function () {
      $http.post('admin/api-cms-nav/deep-page-copy', {
        navId: $scope.id
      }).then(function (response) {
        $scope.menuDataReload();
        AdminToastService.success(i18n['js_page_create_copy_success']);
        $scope.showActions = 1;
        $scope.togglePageSettingsOverlay();
      }, function (response) {
        AdminToastService.errorArray(response.data);
      });
    };

    $scope.pageTags = [];
    $http.get('admin/api-cms-nav/' + $scope.id + '/tags').then(function (response) {
      angular.forEach(response.data, function (value) {
        $scope.pageTags.push(value.id);
      });
    });

    $scope.savePageTags = function () {
      $http.post('admin/api-cms-nav/' + $scope.id + '/tags', $scope.pageTags).then(function (response) {
        $scope.togglePageSettingsOverlay();
        AdminToastService.success(i18n['js_config_update_success']);
      }, function (response) {
        AdminToastService.errorArray(response.data);
      });
    };

    $scope.createDeepPageCopyAsTemplate = function () {
      $http.post('admin/api-cms-nav/deep-page-copy-as-template', {
        navId: $scope.id
      }).then(function (response) {
        $scope.menuDataReload();
        AdminToastService.success(i18n['js_page_create_copy_as_template_success']);
        $scope.showActions = 1;
        $scope.togglePageSettingsOverlay();
        $state.go('custom.cmsdraft');
      }, function (response) {
        AdminToastService.errorArray(response.data);
      });
    };

    $scope.loadNavProperties = function () {
      $http.get('admin/api-cms-nav/get-properties', {
        params: {
          navId: $scope.id
        }
      }).then(function (response) {
        for (var i in response.data) {
          var d = response.data[i];
          $scope.propValues[d.admin_prop_id] = d.value;
          $scope.hasValues = true;
        }
      });
    };

    $scope.togglePropMask = function () {
      $scope.showPropForm = !$scope.showPropForm;
    };

    $scope.showPropForm = false;

    $scope.storePropValues = function () {
      var headers = {
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
      };
      $http.post('admin/api-cms-nav/save-properties?navId=' + $scope.id, $.param($scope.propValues), headers).then(function (response) {
        AdminToastService.success(i18n['js_page_property_refresh']);
        $scope.loadNavProperties();
        $scope.showPropForm = false;
        $scope.togglePageSettingsOverlay();
      });
    };

    $scope.trash = function () {
      AdminToastService.confirm(i18n['js_page_confirm_delete'], i18n['cmsadmin_settings_trashpage_title'], ['$toast', function ($toast) {
        $http.get('admin/api-cms-nav/delete', {
          params: {
            navId: $scope.id
          }
        }).then(function (response) {
          $scope.isDeleted = true;
          $scope.menuDataReload().then(function () {
            $toast.close();
            $scope.togglePageSettingsOverlay();
          });
        }, function (response) {
          if (response.status == 417) {
            AdminToastService.error(i18n['js_page_delete_error_cause_redirects']);
          } else {
            AdminToastService.errorArray(response.data);
          }
        });
      }]);
    };

    $scope.isDraft = false;

    $scope.submitNavForm = function (data) {
      $http.post('admin/api-cms-nav/update?id=' + $scope.navData.id, data).then(function (response) {
        AdminToastService.success(i18nParam('js_page_update_layout_save_success'));
        $scope.togglePageSettingsOverlay();
      }, function (response) {
        angular.forEach(response.data, function (value) {
          AdminToastService.error(value.message);
        });
      });
    };

    function initializer() {
      $scope.navData = $filter('filter')($scope.menuData.items, {
        id: $scope.id
      }, true)[0];

      if ($scope.navData == undefined) {
        $scope.isDraft = true;
      } else {
        $scope.loadNavProperties();
        /* properties --> */

        $scope.$watch(function () {
          return $scope.navData.is_offline;
        }, function (n, o) {
          if (n !== o && n !== undefined) {
            $http.get('admin/api-cms-nav/toggle-offline', {
              params: {
                navId: $scope.navData.id,
                offlineStatus: n
              }
            }).then(function (response) {
              if ($scope.navData.is_offline == 1) {
                AdminToastService.info(i18nParam('js_state_offline', {
                  title: $scope.navData.title
                }));
              } else {
                AdminToastService.info(i18nParam('js_state_online', {
                  title: $scope.navData.title
                }));
              }
            });
          }
        });
        $scope.$watch(function () {
          return $scope.navData.is_hidden;
        }, function (n, o) {
          if (n !== o && n !== undefined) {
            $http.get('admin/api-cms-nav/toggle-hidden', {
              params: {
                navId: $scope.navData.id,
                hiddenStatus: n
              }
            }).then(function (response) {
              if ($scope.navData.is_hidden == 1) {
                AdminToastService.info(i18nParam('js_state_hidden', {
                  title: $scope.navData.title
                }));
              } else {
                AdminToastService.info(i18nParam('js_state_visible', {
                  title: $scope.navData.title
                }));
              }
            });
          }
        });
        $scope.$watch(function () {
          return $scope.navData.is_home;
        }, function (n, o) {
          if (n !== o && n !== undefined) {
            $http.get('admin/api-cms-nav/toggle-home', {
              params: {
                navId: $scope.navData.id,
                homeState: n
              }
            }).then(function (response) {
              $scope.menuDataReload().then(function () {
                if ($scope.navData.is_home == 1) {
                  AdminToastService.success(i18nParam('js_state_is_home', {
                    title: $scope.navData.title
                  }));
                } else {
                  AdminToastService.success(i18nParam('js_state_is_not_home', {
                    title: $scope.navData.title
                  }));
                }

                $scope.togglePageSettingsOverlay();
              });
            });
          }
        });
      }
    }

    initializer();
  }]);
  /**
   * @param $scope.lang from ng-repeat
   */

  zaa.controller("NavItemController", ['$scope', '$rootScope', '$http', '$filter', '$timeout', 'ServiceMenuData', 'AdminLangService', 'AdminToastService', 'ServiceLiveEditMode', 'ServiceLayoutsData', 'ServiceWorkingPageVersion', function ($scope, $rootScope, $http, $filter, $timeout, ServiceMenuData, AdminLangService, AdminToastService, ServiceLiveEditMode, ServiceLayoutsData, ServiceWorkingPageVersion) {
    $scope.loaded = false;
    $scope.NavController = $scope.$parent;
    $scope.liveEditState = false;
    $scope.$watch(function () {
      return ServiceLiveEditMode.state;
    }, function (n, o) {
      $scope.liveEditState = n;
    });

    $scope.openLiveUrl = function (id, versionId) {
      ServiceLiveEditMode.changeUrl(id, versionId);
    };

    $scope.loadLiveUrl = function () {
      ServiceLiveEditMode.changeUrl($scope.item.id, $scope.currentPageVersion);
    }; // layoutsData


    $scope.layoutsData = ServiceLayoutsData.data;
    $scope.$on('service:BlocksData', function (event, data) {
      $scope.layoutsData = data;
    }); // serviceMenuData inheritance

    $scope.menuDataReload = function () {
      return ServiceMenuData.load(true);
    };

    $scope.$on('service:LoadLanguage', function (event, data) {
      if (!$scope.loaded) {
        $scope.refresh();
      }
    }); // properties:

    $scope.isTranslated = false;
    $scope.item = [];
    $scope.itemCopy = [];
    $scope.settings = false;
    $scope.typeDataCopy = [];
    $scope.typeData = [];
    $scope.container = [];
    $scope.errors = [];
    $scope.homeUrl = $rootScope.luyacfg.homeUrl;
    $scope.currentPageVersion = 0;
    $scope.currentPageVersionAlias;

    $scope.trashItem = function () {
      if ($scope.lang.is_default == 0) {
        AdminToastService.confirm(i18n['js_page_confirm_delete'], i18n['cmsadmin_settings_trashpage_title'], ['$toast', function ($toast) {
          $http.delete('admin/api-cms-navitem/delete?navItemId=' + $scope.item.id).then(function (response) {
            $scope.menuDataReload().then(function () {
              $scope.isTranslated = false;
              $scope.item = [];
              $scope.itemCopy = [];
              $scope.settings = false;
              $scope.typeDataCopy = [];
              $scope.typeData = [];
              $scope.container = [];
              $scope.errors = [];
              $scope.currentPageVersion = 0;
              $scope.$broadcast('deletedNavItem');
              $toast.close();
            });
          }, function (response) {
            AdminToastService.error(i18n['js_page_delete_error_cause_redirects']);
          });
        }]);
      }
    };

    $scope.reset = function () {
      $scope.itemCopy = angular.copy($scope.item);

      if ($scope.item.nav_item_type == 1) {
        $scope.typeDataCopy = angular.copy({
          'nav_item_type_id': $scope.item.nav_item_type_id
        });
      } else {
        $scope.typeDataCopy = angular.copy($scope.typeData);
      }
    };

    $scope.updateNavItemData = function (itemCopy, typeDataCopy) {
      $scope.errors = [];
      var headers = {
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        }
      };
      var navItemId = itemCopy.id;
      typeDataCopy.title = itemCopy.title;
      typeDataCopy.alias = itemCopy.alias;
      typeDataCopy.title_tag = itemCopy.title_tag;
      typeDataCopy.description = itemCopy.description;
      typeDataCopy.keywords = itemCopy.keywords;
      typeDataCopy.timestamp_create = itemCopy.timestamp_create;
      typeDataCopy.image_id = itemCopy.image_id;
      typeDataCopy.is_url_strict_parsing_disabled = itemCopy.is_url_strict_parsing_disabled;
      typeDataCopy.is_cacheable = itemCopy.is_cacheable;
      $http.post('admin/api-cms-navitem/update-page-item?navItemId=' + navItemId + '&navItemType=' + itemCopy.nav_item_type, $.param(typeDataCopy), headers).then(function (response) {
        if (itemCopy.nav_item_type !== 1) {
          $scope.currentPageVersion = 0;
        }

        $scope.loaded = false;

        if (response.data) {
          /* switch version if type is page */
          if (itemCopy.nav_item_type == 1 && _typeof(response.data['typeData']) === 'object') {
            /* choose given version or choose first available version */
            var pageVersionKey = response.data['item'].nav_item_type_id;

            if (pageVersionKey == 0) {
              pageVersionKey = Object.keys(response.data['typeData'])[0];
            }

            $scope.container = response.data['typeData'][pageVersionKey]['contentAsArray'];
            $scope.currentPageVersionAlias = response.data['typeData'][pageVersionKey]['version_alias'];
            $scope.currentPageVersion = pageVersionKey;
          }
        }

        AdminToastService.success(i18nParam('js_page_item_update_ok', {
          'title': itemCopy.title
        }));
        $scope.menuDataReload();
        $scope.refresh();
        $scope.toggleSettingsOverlay();
        $scope.reset();
      }, function errorCallback(response) {
        angular.forEach(response.data, function (item) {
          AdminToastService.error(item.message);
        });
      });
    };

    $scope.$watch('itemCopy.alias', function (n, o) {
      if (n != o && n != null) {
        $scope.itemCopy.alias = $filter('slugify')(n);
      }
    });

    $scope.removeVersion = function (version) {
      AdminToastService.confirm(i18nParam('js_version_delete_confirm', {
        alias: version.version_alias
      }), i18n['cmsadmin_version_remove'], ['$toast', '$http', function ($toast, $http) {
        $http.post('admin/api-cms-navitem/remove-page-version', {
          pageId: version.id
        }).then(function (response) {
          $scope.refreshForce();
          $toast.close();
          AdminToastService.success(i18nParam('js_version_delete_confirm_success', {
            alias: version.version_alias
          }));
        });
      }]);
    };

    $scope.editVersionItem;
    $scope.tab = 1;

    $scope.editVersion = function (versionItem) {
      $scope.changeTab(4);
      $scope.editVersionItem = versionItem;
    };

    $scope.editVersionUpdate = function (editVersionItem) {
      $http.post('admin/api-cms-navitem/change-page-version-layout', {
        'pageItemId': editVersionItem.id,
        'layoutId': editVersionItem.layout_id,
        'alias': editVersionItem.version_alias
      }).then(function (response) {
        $scope.refreshForce();
        AdminToastService.success(i18n['js_version_update_success']);
        $scope.toggleSettingsOverlay();
      });
    };

    $scope.getItem = function (langId, navId) {
      $http({
        url: 'admin/api-cms-navitem/nav-lang-item',
        method: "GET",
        params: {
          langId: langId,
          navId: navId
        }
      }).then(function (response) {
        if (response.data) {
          if (!response.data.error) {
            $scope.item = response.data['item'];
            $scope.typeData = response.data['typeData'];
            $scope.isTranslated = true;
            $scope.reset();

            if (!response.data['nav'].is_draft) {
              $scope.NavController.bubbleParents($scope.NavController.navData.parent_nav_id, $scope.NavController.navData.nav_container_id);

              if ($scope.item.nav_item_type == 1) {
                var lastVersion = ServiceWorkingPageVersion.hasVersion($scope.item.id);

                if (lastVersion) {
                  $scope.switchVersion(lastVersion);
                } else {
                  if ($scope.currentPageVersion == 0) {
                    $scope.currentPageVersion = response.data.item.nav_item_type_id;
                  }

                  if (response.data.item.nav_item_type_id in response.data.typeData) {
                    $scope.currentPageVersionAlias = $scope.container = response.data.typeData[$scope.currentPageVersion]['version_alias'];
                    $scope.container = response.data.typeData[$scope.currentPageVersion]['contentAsArray'];
                  }
                }
              }
            } else {
              $scope.currentPageVersion = response.data.item.nav_item_type_id;
              $scope.container = response.data.typeData[$scope.currentPageVersion]['contentAsArray'];
            }
          }

          $scope.loaded = true;
        }
      });
    };

    $scope.versionDropDownVisbility = false;

    $scope.toggleVersionsDropdown = function () {
      $scope.versionDropDownVisbility = !$scope.versionDropDownVisbility;
    };

    $scope.switchVersion = function (pageVersionid, toggle) {
      ServiceWorkingPageVersion.store($scope.item.id, pageVersionid);
      $scope.container = $scope.typeData[pageVersionid]['contentAsArray'];
      $scope.currentPageVersionAlias = $scope.typeData[pageVersionid]['version_alias'];
      $scope.currentPageVersion = pageVersionid;
      $scope.loadLiveUrl();

      if (toggle) {
        $scope.toggleVersionsDropdown();
      }
    };

    $scope.refreshForce = function () {
      $scope.getItem($scope.lang.id, $scope.NavController.id);
    };

    $scope.refresh = function () {
      if (AdminLangService.isInSelection($scope.lang.short_code)) {
        $scope.getItem($scope.lang.id, $scope.NavController.id);
      }
    };
    /* new settings overlay */


    $scope.settingsOverlayVisibility = true;

    $scope.toggleSettingsOverlay = function (tab) {
      $scope.settingsOverlayVisibility = !$scope.settingsOverlayVisibility;

      if (tab) {
        $scope.tab = tab;
      }
    };

    $scope.changeTab = function (tab) {
      $scope.tab = tab;
    };
    /**
     * Refresh the current layout container blocks.
     * 
     * After successfull api response all cms layout are foreach and the values are passed to revPlaceholders() method.
     */


    $scope.refreshNested = function (prevId, placeholderVar) {
      $http({
        url: 'admin/api-cms-navitem/reload-placeholder',
        method: 'GET',
        params: {
          navItemPageId: $scope.currentPageVersion,
          prevId: prevId,
          placeholderVar: placeholderVar
        }
      }).then(function (response) {
        ServiceLiveEditMode.changeUrl($scope.item.id, $scope.currentPageVersion);
        angular.forEach($scope.container.__placeholders, function (placeholder) {
          $scope.revPlaceholders(placeholder, prevId, placeholderVar, response.data);
        });
      });
    };
    /**
     * The revPlaceholders method goes trourgh the new row/col (grid) system container json layout where:
     * 
     * rows[][1] = col left
     * rows[][2] = col right
     * 
     * Where a layout have at least on row which can have cols inside. So there revPlaceholders method goes trough the cols
     * and check if the col is equal the given col to replace the content with  (from refreshNested method).
     */


    $scope.revPlaceholders = function (placeholders, prevId, placeholderVar, replaceContent) {
      angular.forEach(placeholders, function (placeholderRow, placeholderKey) {
        if (parseInt(prevId) == parseInt(placeholderRow.prev_id) && placeholderVar == placeholderRow['var']) {
          placeholders[placeholderKey]['__nav_item_page_block_items'] = replaceContent;
        } else {
          $scope.revFind(placeholderRow, prevId, placeholderVar, replaceContent);
        }
      });
    };
    /**
     * The revFind method does the recursiv job within a block an passes the value back to revPlaceholders().
     */


    $scope.revFind = function (placeholder, prevId, placeholderVar, replaceContent) {
      for (var i in placeholder['__nav_item_page_block_items']) {
        for (var holderKey in placeholder['__nav_item_page_block_items'][i]['__placeholders']) {
          for (var holder in placeholder['__nav_item_page_block_items'][i]['__placeholders'][holderKey]) {
            $scope.revPlaceholders(placeholder['__nav_item_page_block_items'][i]['__placeholders'][holderKey], prevId, placeholderVar, replaceContent);
          }
        }
      }
    };
    /**
     * drops items in an empty page placeholder of CMS LAYOUT PLACEHOLDER
     */


    $scope.dropItemPlaceholder = function (dragged, dropped, position) {
      if (dragged.hasOwnProperty('favorized') || dragged.hasOwnProperty('newblock')) {
        // its a new block
        $http.post('admin/api-cms-navitempageblockitem/create', {
          prev_id: dropped.prev_id,
          sort_index: 0,
          block_id: dragged.id,
          placeholder_var: dropped['var'],
          nav_item_page_id: dropped.nav_item_page_id
        }).then(function (response) {
          $scope.refreshNested(dropped['prev_id'], dropped['var']);
        });
      } else if (dragged.hasOwnProperty('copystack')) {
        // its a block from copy stack
        $http.post('admin/api-cms-navitemblock/copy-block-from-stack', {
          copyBlockId: dragged.id,
          sort_index: 0,
          prev_id: dropped.prev_id,
          placeholder_var: dropped['var'],
          nav_item_page_id: dropped.nav_item_page_id
        }).then(function (response) {
          $scope.refreshNested(dropped['prev_id'], dropped['var']);
        });
      } else {
        // moving an existing block
        $http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
          sort_index: 0,
          prev_id: dropped.prev_id,
          placeholder_var: dropped['var']
        }).then(function (response) {
          $scope.refreshForce();
        });
      }
    };

    $scope.refresh();
  }]);
  /**
   * @param $scope.block From ng-repeat scope assignment
   */

  zaa.controller("PageBlockEditController", ['$scope', '$sce', '$http', 'AdminClassService', 'AdminToastService', 'ServiceBlockCopyStack', 'ServiceLiveEditMode', function ($scope, $sce, $http, AdminClassService, AdminToastService, ServiceBlockCopyStack, ServiceLiveEditMode) {
    $scope.NavItemTypePageController = $scope.$parent;
    /**
     * drops an item in an empty placeholder of a BLOCK
     */

    $scope.dropItemPlaceholder = function (dragged, dropped, position) {
      if (dragged.hasOwnProperty('favorized') || dragged.hasOwnProperty('newblock')) {
        // its a new block
        $http.post('admin/api-cms-navitempageblockitem/create', {
          prev_id: dropped.prev_id,
          sort_index: 0,
          block_id: dragged.id,
          placeholder_var: dropped.var,
          nav_item_page_id: dropped.nav_item_page_id
        }).then(function (response) {
          $scope.NavItemTypePageController.refreshNested(dropped.prev_id, dropped.var);
        });
      } else if (dragged.hasOwnProperty('copystack')) {
        // its a block from copy stack
        $http.post('admin/api-cms-navitemblock/copy-block-from-stack', {
          copyBlockId: dragged.id,
          sort_index: 0,
          prev_id: dropped.prev_id,
          placeholder_var: dropped.var,
          nav_item_page_id: dropped.nav_item_page_id
        }).then(function (response) {
          $scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
        });
      } else {
        // moving an existing block
        $http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
          sort_index: 0,
          prev_id: dropped.prev_id,
          placeholder_var: dropped.var
        }).then(function (response) {
          $scope.refreshForce();
        });
      }
    };
    /**
     * Drops a block above/below an EXISTING BLOCK
     */


    $scope.dropItem = function (dragged, dropped, position, element) {
      var sortIndex = $scope.$index;

      if (position == 'bottom') {
        sortIndex = sortIndex + 1;
      }

      if (dragged.hasOwnProperty('favorized') || dragged.hasOwnProperty('newblock')) {
        // its a new block
        $http.post('admin/api-cms-navitempageblockitem/create', {
          prev_id: $scope.placeholder.prev_id,
          sort_index: sortIndex,
          block_id: dragged.id,
          placeholder_var: $scope.placeholder['var'],
          nav_item_page_id: $scope.placeholder.nav_item_page_id
        }).then(function (response) {
          $scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
        });
      } else if (dragged.hasOwnProperty('copystack')) {
        // its a block from copy stack
        $http.post('admin/api-cms-navitemblock/copy-block-from-stack', {
          copyBlockId: dragged.id,
          sort_index: sortIndex,
          prev_id: $scope.placeholder.prev_id,
          placeholder_var: $scope.placeholder['var'],
          nav_item_page_id: $scope.placeholder.nav_item_page_id
        }).then(function (response) {
          $scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
        });
      } else {
        // moving an existing block
        $http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
          prev_id: $scope.placeholder.prev_id,
          placeholder_var: $scope.placeholder['var'],
          sort_index: sortIndex
        }).then(function (response) {
          /*
           * @issue: https://github.com/luyadev/luya/issues/1629
           * The moved block, should removed from the previous array. This is only the case when dragging from an OUTER block into an INNER block
           * is this will not refresh the OUTER block, but always will in the opposite way.
           */
          angular.element(element).remove(); // as the block has been removed from existing, refresh the new placeholder.

          $scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
        });
      }
    };

    $scope.copyBlock = function () {
      ServiceBlockCopyStack.push($scope.block);
    };

    $scope.toggleHidden = function () {
      if ($scope.block.is_hidden == 0) {
        $scope.block.is_hidden = 1;
      } else {
        $scope.block.is_hidden = 0;
      }

      $http({
        url: 'admin/api-cms-navitem/toggle-block-hidden',
        method: "GET",
        params: {
          blockId: $scope.block.id,
          hiddenState: $scope.block.is_hidden
        }
      }).then(function (response) {
        /* load live url on hidden trigger */
        $scope.NavItemTypePageController.$parent.$parent.loadLiveUrl(); // successfull toggle hidden state of block

        AdminToastService.info(i18nParam('js_page_block_visbility_change', {
          name: $scope.block.name
        }));
      });
    };

    $scope.isEditable = function () {
      return typeof $scope.block.vars != "undefined" && $scope.block.vars.length > 0;
    };

    $scope.isConfigurable = function () {
      return typeof $scope.block.cfgs != "undefined" && $scope.block.cfgs.length > 0;
    };

    $scope.$watch(function () {
      return $scope.block.values;
    }, function (n, o) {
      $scope.data = n;
    });
    $scope.$watch(function () {
      return $scope.block.variation;
    }, function (n, o) {
      $scope.evalVariationVisbility(n);
    });

    $scope.getInfo = function (varFieldName) {
      if ($scope.block.field_help.hasOwnProperty(varFieldName)) {
        return $scope.block.field_help[varFieldName];
      }

      return false;
    };

    $scope.evalVariationVisbility = function (variatenName) {
      if ($scope.block.variations.hasOwnProperty(variatenName)) {
        var variation = $scope.block.variations[$scope.block.variation];
        angular.forEach(variation, function (value, key) {
          if (angular.isObject(value)) {
            angular.forEach(value, function (v, k) {
              angular.forEach($scope.block[key], function (object) {
                if (k == object.var) {
                  object.invisible = true;
                }
              });
            });
          }
        });
      } else {
        angular.forEach($scope.block.cfgs, function (object) {
          object.invisible = false;
        });
        angular.forEach($scope.block.vars, function (object) {
          object.invisible = false;
        });
      }
    };

    $scope.cfgdata = $scope.block.cfgvalues || {};
    $scope.edit = false;
    $scope.modalHidden = true;
    $scope.modalMode = 1;

    $scope.initModalMode = function () {
      if ($scope.block.vars.length == 0) {
        $scope.modalMode = 2;
      }
    };

    $scope.toggleEdit = function () {
      if ($scope.isEditable() || $scope.isConfigurable()) {
        $scope.modalHidden = !$scope.modalHidden;
        $scope.edit = !$scope.edit;
      }
    };

    $scope.renderTemplate = function (template, dataVars, cfgVars, block, extras) {
      if (template == undefined) {
        return '';
      }

      var template = Twig.twig({
        data: template
      });
      var content = template.render({
        vars: dataVars,
        cfgs: cfgVars,
        block: block,
        extras: extras
      });
      return $sce.trustAsHtml(content);
    };

    $scope.removeBlock = function () {
      AdminToastService.confirm(i18nParam('js_page_block_delete_confirm', {
        name: $scope.block.name
      }), i18n['view_update_block_tooltip_delete'], ['$toast', function ($toast) {
        $http.delete('admin/api-cms-navitempageblockitem/delete?id=' + $scope.block.id).then(function (response) {
          $scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
          $scope.NavItemTypePageController.loadLiveUrl();
          $toast.close();
          AdminToastService.success(i18nParam('js_page_block_remove_ok', {
            name: $scope.block.name
          }));
        });
      }]);
    };

    $scope.save = function () {
      $http.put('admin/api-cms-navitempageblockitem/update?id=' + $scope.block.id, {
        json_config_values: $scope.data,
        json_config_cfg_values: $scope.cfgdata,
        variation: $scope.block.variation
      }).then(function (response) {
        AdminToastService.success(i18nParam('js_page_block_update_ok', {
          name: $scope.block.name
        }));
        $scope.toggleEdit();
        $scope.block.is_dirty = 1;
        $scope.block = angular.copy(response.data.objectdetail);
        $scope.NavItemTypePageController.loadLiveUrl();
        $scope.evalVariationVisbility($scope.block.variation);
      });
    };
  }]);
  zaa.controller("DroppableBlocksController", ['$scope', '$http', 'AdminClassService', 'ServiceBlocksData', 'ServiceBlockCopyStack', function ($scope, $http, AdminClassService, ServiceBlocksData, ServiceBlockCopyStack) {
    /* service ServiceBlocksData inheritance */
    $scope.blocksData = ServiceBlocksData.data;
    $scope.blocksDataRestore = angular.copy($scope.blocksData);
    $scope.$on('service:BlocksData', function (event, data) {
      $scope.blocksData = data;
    });

    $scope.blocksDataReload = function () {
      return ServiceBlocksData.load(true);
    };

    $scope.addToFav = function (item) {
      $http.post('admin/api-cms-block/to-fav', {
        block: item
      }).then(function (response) {
        $scope.blocksDataReload();
      });
    };

    $scope.removeFromFav = function (item) {
      $http.post('admin/api-cms-block/remove-fav', {
        block: item
      }).then(function (response) {
        $scope.blocksDataReload();
      });
    };

    $scope.toggleGroup = function (group) {
      if (group.toggle_open == undefined) {
        group.toggle_open = 1;
      } else {
        group.toggle_open = !group.toggle_open;
      }

      $http.post('admin/api-cms-block/toggle-group', {
        group: group
      }, {
        ignoreLoadingBar: true
      });
    };

    $scope.isPreviewEnabled = function (item) {
      return item.preview_enabled;
    }; // controller logic


    $scope.copyStack = ServiceBlockCopyStack.stack;
    $scope.$on('service:CopyStack', function (event, stack) {
      $scope.copyStack = stack;
    });

    $scope.clearStack = function () {
      ServiceBlockCopyStack.clear();
    };

    $scope.searchQuery = '';
    $scope.searchIsDirty = false;
    $scope.$watch('searchQuery', function (n, o) {
      if (n !== '') {
        $scope.searchIsDirty = true;
        angular.forEach($scope.blocksData, function (value, key) {
          if (value.group.is_fav) {
            $scope.blocksData.splice(key, 1);
          }

          value.group.toggle_open = 1;
        });
      } else if ($scope.searchIsDirty) {
        $scope.blocksData = angular.copy($scope.blocksDataRestore);
      }
    });
  }]);
})();/**
 * all global admin services
 * 
 * controller resolve: https://github.com/johnpapa/angular-styleguide#style-y080
 * 
 * Service Inheritance:
 * 
 * 1. Service must be prefix with Service
 * 2. Service must contain a forceReload state
 * 3. Service must broadcast an event 'service:FoldersData'
 * 4. Controller integration must look like
 * 
 * ```
 * $scope.foldersData = ServiceFoldersData.data;
 *				
 * $scope.$on('service:FoldersData', function(event, data) {
 *      $scope.foldersData = data;
 * });
 *				
 * $scope.foldersDataReload = function() {
 *     return ServiceFoldersData.load(true);
 * }
 * ```
 * 
 */
zaa.config(['resolverProvider', function (resolverProvider) {
  resolverProvider.addCallback(['ServiceMenuData', 'ServiceBlocksData', 'ServiceLayoutsData', 'ServiceCurrentWebsite', 'LuyaLoading', function (ServiceMenuData, ServiceBlocksData, ServiceLayoutsData, ServiceCurrentWebsite, LuyaLoading) {
    LuyaLoading.start();
    ServiceBlocksData.load();
    ServiceLayoutsData.load();
    ServiceMenuData.load().then(function (r) {
      ServiceCurrentWebsite.load();
      LuyaLoading.stop();
    });
  }]);
}]);
/**
 * Copy Block Stack service.
 */

zaa.factory("ServiceBlockCopyStack", ['$rootScope', function ($rootScope) {
  var service = [];
  service.stack = [];

  service.clear = function () {
    service.stack = [];
    $rootScope.$broadcast('service:CopyStack', service.stack);
  };

  service.push = function (block) {
    if (service.stack.length > 4) {
      service.stack.shift();
    }

    service.stack.push({
      blockId: block.block_id,
      name: block.name,
      icon: block.icon,
      id: block.id,
      copystack: 1
    });
    $rootScope.$broadcast('service:CopyStack', service.stack);
  };

  return service;
}]);
/**
 * Menu Service.
 * 
 * $scope.menuData = ServiceMenuData.data;
 * 				
 * $scope.$on('service:MenuData', function(event, data) {
 * 	$scope.menuData = data;
 * });
 * 
 * $scope.menuDataReload = function() {
 * 	return ServiceMenuData.load(true);
 * }
 * 				
 */

zaa.factory("ServiceMenuData", ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
  var service = [];
  service.data = [];

  service.load = function (forceReload) {
    return $q(function (resolve, reject) {
      if (service.data.length > 0 && forceReload !== true) {
        resolve(service.data);
      } else {
        $http.get("admin/api-cms-menu/data-menu").then(function (response) {
          service.data = response.data;
          $rootScope.$broadcast('service:MenuData', service.data);
          resolve(service.data);
        });
      }
    });
  };

  return service;
}]);
/**
 * Blocks Service.
 * 
 * 
 * $scope.blocksData = ServiceBlocksData.data;
 * 				
 * $scope.$on('service:BlocksData', function(event, data) {
 * 	$scope.blocksData = data;
 * });
 * 
 * $scope.blocksDataReload = function() {
 * 	return ServiceBlocksData.load(true);
 * }
 * 				
 */

zaa.factory("ServiceBlocksData", ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
  var service = [];
  service.data = [];

  service.load = function (forceReload) {
    return $q(function (resolve, reject) {
      if (service.data.length > 0 && forceReload !== true) {
        resolve(service.data);
      } else {
        $http.get("admin/api-cms-admin/data-blocks").then(function (response) {
          service.data = response.data;
          $rootScope.$broadcast('service:BlocksData', service.data);
          resolve(service.data);
        });
      }
    });
  };

  return service;
}]);
/**
 * Layouts Service.

$scope.layoutsData = ServiceLayoutsData.data;
				
$scope.$on('service:BlocksData', function(event, data) {
	$scope.layoutsData = data;
});

$scope.layoutsDataReload = function() {
	return ServiceLayoutsData.load(true);
}
				
*/

zaa.factory("ServiceLayoutsData", ['$http', '$q', '$rootScope', function ($http, $q, $rootScope) {
  var service = [];
  service.data = [];

  service.load = function (forceReload) {
    return $q(function (resolve, reject) {
      if (service.data.length > 0 && forceReload !== true) {
        resolve(service.data);
      } else {
        $http.get("admin/api-cms-admin/data-layouts").then(function (response) {
          service.data = response.data;
          $rootScope.$broadcast('service:LayoutsData', service.data);
          resolve(service.data);
        });
      }
    });
  };

  return service;
}]);
/**
 * CMS LIVE EDIT SERIVCE
 * 
 * $scope.liveEditMode = ServiceLiveEditMode.state
 */

zaa.factory("ServiceLiveEditMode", ['$rootScope', function ($rootScope) {
  var service = [];
  service.state = 0;
  service.url = $rootScope.luyacfg.homeUrl;

  service.toggle = function () {
    service.state = !service.state;
  };

  service.setUrl = function (itemId, versionId) {
    var d = new Date();
    var n = d.getTime();
    service.url = $rootScope.cmsConfig.previewUrl + '?itemId=' + itemId + '&version=' + versionId + '&date=' + n;
  };

  service.changeUrl = function (itemId, versionId) {
    if (versionId == undefined) {
      versionId = 0;
    }

    service.setUrl(itemId, versionId);
    $rootScope.$broadcast('service:LiveEditModeUrlChange', service.url);
  };

  return service;
}]);
/**
 * CMS Current Website SERIVCE
 *
 * $scope.currentWebsiteId = ServiceCurrentWebsite.state
 */

zaa.factory("ServiceCurrentWebsite", ['$rootScope', 'ServiceMenuData', function ($rootScope, ServiceMenuData) {
  var service = {
    currentWebsite: null,
    defaultWebsite: null
  };

  service.load = function (event, data) {
    service.defaultWebsite = ServiceMenuData.data.websites.find(function (w) {
      return w.is_default;
    });
    service.toggle(service.defaultWebsite.id);
  };

  service.toggle = function (websiteId) {
    if (websiteId && (!service.currentWebsite || service.currentWebsite.id !== websiteId)) {
      service.currentWebsite = ServiceMenuData.data.websites.find(function (w) {
        return w.id === websiteId;
      });
      $rootScope.$broadcast('service:CurrentWebsiteChanged', service.currentWebsite);
    }
  };

  return service;
}]);
zaa.factory("ServiceWorkingPageVersion", [function () {
  var service = {
    page: {}
  };

  service.store = function (pageId, versionId) {
    service.page[pageId] = versionId;
  };

  service.hasVersion = function (pageId) {
    if (service.page.hasOwnProperty(pageId)) {
      return service.page[pageId];
    }

    return false;
  };

  return service;
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsIm1lbnVEYXRhIiwiYW5ndWxhciIsImNvcHkiLCJtZW51RGF0YU9yaWdpbmFsIiwiJG9uIiwiZXZlbnQiLCJpbml0IiwibGVuZ3RoIiwibG9hZCIsImNvbnRhaW5lciIsImNvbnRhaW5lcnMiLCJpc0hpZGRlbiIsIiR3YXRjaCIsIm4iLCJpdGVtcyIsInRpdGxlIiwiZm9yRWFjaCIsInZhbHVlIiwiYnViYmxlUGFyZW50cyIsInBhcmVudE5hdklkIiwiY29udGFpbmVySWQiLCJpbmRleCIsIml0ZW0iLCJjdXJyZW50V2Vic2l0ZUlkIiwiZXhpc3RzIiwiaSIsInB1c2giLCJwYXJlbnRfbmF2X2lkIiwibmF2X2NvbnRhaW5lcl9pZCIsInRvZ2dsZXIiLCJ0ZW1wbGF0ZSIsImkxOG4iLCIkaHR0cCIsIiRzdGF0ZSIsImdldCIsInBhcmFtcyIsInRoZW4iLCJyZXNwb25zZSIsInBhdGgiLCJ0ZW1wbGF0ZVVybCIsIlNlcnZpY2VMYW5ndWFnZXNEYXRhIiwiQWRtaW5Ub2FzdFNlcnZpY2UiLCJTZXJ2aWNlQ3VycmVudFdlYnNpdGUiLCJlcnJvciIsInN1Y2Nlc3MiLCIkcGFyZW50IiwiY3VycmVudFdlYnNpdGUiLCJkZWZhdWx0X2NvbnRhaW5lcl9pZCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImxhbmd1YWdlc0RhdGEiLCJsYW5nX2lkIiwicGFyc2VJbnQiLCJuYXZpdGVtcyIsIm8iLCJ1bmRlZmluZWQiLCJhbGlhc1N1Z2dlc3Rpb24iLCJhbGlhcyIsImV4ZWMiLCJzYXZlIiwiaXNJbmxpbmUiLCJnZXRJdGVtIiwibmF2X2lkIiwicmVhc29uIiwia2V5IiwiU2VydmljZUxheW91dHNEYXRhIiwicGFyZW50IiwibmF2SXRlbUlkIiwibGF5b3V0X2lkIiwibGF5b3V0c0RhdGEiLCJ2ZXJzaW9uc0RhdGEiLCJnZXRWZXJzaW9uTGlzdCIsImlzRWRpdEF2YWlsYWJsZSIsInVzZV9kcmFmdCIsImZyb21fZHJhZnRfaWQiLCJkcmFmdHMiLCJsYXlvdXRzIiwibW9kdWxlcyIsImNvbnRyb2xsZXJzIiwiYWN0aW9ucyIsImFkZFBhcmFtIiwiaGFzT3duUHJvcGVydHkiLCJhY3Rpb25fcGFyYW1zIiwibW9kdWxlX25hbWUiLCJjb250cm9sbGVyX25hbWUiLCJmaWx0ZXIiLCJpbnB1dCIsIndlYnNpdGVJZCIsInJlc3VsdCIsIndlYnNpdGVfaWQiLCJyZXR1cm5WYWx1ZSIsImZhY3RvcnkiLCJzZXJ2aWNlIiwic3RhdHVzIiwiZGVsZWdhdGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsInN0YXRlIiwidXJsIiwiZ28iLCJkYXNoYm9hcmQiLCJwb3N0IiwiaGVhZGVycyIsImNyZWF0ZU5ld1ZlcnNpb25TdWJtaXQiLCJjb3B5RXhpc3RpbmdWZXJzaW9uIiwidmVyc2lvbkxheW91dElkIiwiJCIsInBhcmFtIiwidmVyc2lvbk5hbWUiLCJmcm9tVmVyc2lvblBhZ2VJZCIsInJlZnJlc2hGb3JjZSIsImlzT3BlbiIsIml0ZW1TZWxlY3Rpb24iLCJzZWxlY3Rpb24iLCJOYXZJdGVtQ29udHJvbGxlciIsInNlbGVjdCIsImxvYWRJdGVtcyIsIk5hdkNvbnRyb2xsZXIiLCJuYXZEYXRhIiwibGFuZyIsInJlZnJlc2giLCJlcnJvckFycmF5IiwiJHJvb3RTY29wZSIsIlNlcnZpY2VMaXZlRWRpdE1vZGUiLCJsaXZlRWRpdFN0YXRlIiwibG9hZENtc0NvbmZpZyIsImNtc0NvbmZpZyIsInRvZ2dsZSIsImN1cnJlbnRXZWJzaXRlVG9nZ2xlciIsImRyb3BFbXB0eUNvbnRhaW5lciIsImRyYWdnZWQiLCJkcm9wcGVkIiwicG9zaXRpb24iLCJjYXRJZCIsIm1vdmVJdGVtSWQiLCJkcm9wcGVkT25DYXRJZCIsInN1Y2NlcyIsImRyb3BJdGVtIiwiZHJhZyIsImRyb3AiLCJwb3MiLCJhcGkiLCJkcm9wcGVkQWZ0ZXJJdGVtSWQiLCJkcm9wcGVkQmVmb3JlSXRlbUlkIiwiZHJvcHBlZE9uSXRlbUlkIiwidmFsaWRJdGVtIiwiaG92ZXIiLCJkcmFnZWQiLCJycml0ZW1zIiwicmVjdXJzaXZJdGVtVmFsaWRpdHkiLCJpbmRleE9mIiwidG9nZ2xlSXRlbSIsInRvZ2dsZV9vcGVuIiwiaWdub3JlTG9hZGluZ0JhciIsImNoYW5nZVVybCIsIm5hdl9pdGVtX2lkIiwic2hvd0RyYWciLCJpc0N1cnJlbnRFbGVtZW50IiwiaGlkZGVuQ2F0cyIsInRvZ2dsZUNhdCIsInRvZ2dsZUlzSGlkZGVuIiwiJHEiLCJyZXNvbHZlIiwicmVqZWN0IiwiJHN0YXRlUGFyYW1zIiwiUGxhY2Vob2xkZXJTZXJ2aWNlIiwiU2VydmljZVByb3BlcnRpZXNEYXRhIiwiQWRtaW5DbGFzc1NlcnZpY2UiLCJBZG1pbkxhbmdTZXJ2aWNlIiwiSHRtbFN0b3JhZ2UiLCJwYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuIiwicGFnZVNldHRpbmdzT3ZlcmxheVRhYiIsInRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkiLCJ0IiwibmF2Q2ZnIiwiaGVscHRhZ3MiLCJsdXlhY2ZnIiwiZGlzcGxheUxpdmVDb250YWluZXIiLCJsaXZlVXJsIiwicHJvcGVydGllc0RhdGEiLCJwbGFjZWhvbGRlclN0YXRlIiwiaXNCbG9ja2hvbGRlclNtYWxsIiwiZ2V0VmFsdWUiLCJ0b2dnbGVCbG9ja2hvbGRlclNpemUiLCJzZXRWYWx1ZSIsInNpZGViYXIiLCJlbmFibGVTaWRlYmFyIiwidG9nZ2xlU2lkZWJhciIsInNob3dBY3Rpb25zIiwiaXNEZWxldGVkIiwicHJvcFZhbHVlcyIsImhhc1ZhbHVlcyIsInBhZ2VUYWdzIiwiY3JlYXRlRGVlcFBhZ2VDb3B5Iiwic2F2ZVBhZ2VUYWdzIiwiY3JlYXRlRGVlcFBhZ2VDb3B5QXNUZW1wbGF0ZSIsImxvYWROYXZQcm9wZXJ0aWVzIiwiZCIsImFkbWluX3Byb3BfaWQiLCJ0b2dnbGVQcm9wTWFzayIsInNob3dQcm9wRm9ybSIsInN0b3JlUHJvcFZhbHVlcyIsInRyYXNoIiwiY29uZmlybSIsIiR0b2FzdCIsImNsb3NlIiwiaXNEcmFmdCIsInN1Ym1pdE5hdkZvcm0iLCJpMThuUGFyYW0iLCJtZXNzYWdlIiwiaXNfb2ZmbGluZSIsIm9mZmxpbmVTdGF0dXMiLCJpbmZvIiwiaXNfaGlkZGVuIiwiaGlkZGVuU3RhdHVzIiwiaXNfaG9tZSIsImhvbWVTdGF0ZSIsIiR0aW1lb3V0IiwiU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbiIsImxvYWRlZCIsIm9wZW5MaXZlVXJsIiwidmVyc2lvbklkIiwibG9hZExpdmVVcmwiLCJjdXJyZW50UGFnZVZlcnNpb24iLCJpc1RyYW5zbGF0ZWQiLCJpdGVtQ29weSIsInNldHRpbmdzIiwidHlwZURhdGFDb3B5IiwidHlwZURhdGEiLCJlcnJvcnMiLCJob21lVXJsIiwiY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMiLCJ0cmFzaEl0ZW0iLCJpc19kZWZhdWx0IiwiZGVsZXRlIiwiJGJyb2FkY2FzdCIsInJlc2V0IiwibmF2X2l0ZW1fdHlwZV9pZCIsInVwZGF0ZU5hdkl0ZW1EYXRhIiwidGl0bGVfdGFnIiwiZGVzY3JpcHRpb24iLCJrZXl3b3JkcyIsInRpbWVzdGFtcF9jcmVhdGUiLCJpbWFnZV9pZCIsImlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCIsImlzX2NhY2hlYWJsZSIsInBhZ2VWZXJzaW9uS2V5IiwiT2JqZWN0Iiwia2V5cyIsInRvZ2dsZVNldHRpbmdzT3ZlcmxheSIsImVycm9yQ2FsbGJhY2siLCJyZW1vdmVWZXJzaW9uIiwidmVyc2lvbiIsInZlcnNpb25fYWxpYXMiLCJwYWdlSWQiLCJlZGl0VmVyc2lvbkl0ZW0iLCJ0YWIiLCJlZGl0VmVyc2lvbiIsInZlcnNpb25JdGVtIiwiY2hhbmdlVGFiIiwiZWRpdFZlcnNpb25VcGRhdGUiLCJsYW5nSWQiLCJtZXRob2QiLCJsYXN0VmVyc2lvbiIsImhhc1ZlcnNpb24iLCJzd2l0Y2hWZXJzaW9uIiwidmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5IiwidG9nZ2xlVmVyc2lvbnNEcm9wZG93biIsInBhZ2VWZXJzaW9uaWQiLCJzdG9yZSIsImlzSW5TZWxlY3Rpb24iLCJzaG9ydF9jb2RlIiwic2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSIsInJlZnJlc2hOZXN0ZWQiLCJwcmV2SWQiLCJwbGFjZWhvbGRlclZhciIsIm5hdkl0ZW1QYWdlSWQiLCJfX3BsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVyIiwicmV2UGxhY2Vob2xkZXJzIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZUNvbnRlbnQiLCJwbGFjZWhvbGRlclJvdyIsInBsYWNlaG9sZGVyS2V5IiwicHJldl9pZCIsInJldkZpbmQiLCJob2xkZXJLZXkiLCJob2xkZXIiLCJkcm9wSXRlbVBsYWNlaG9sZGVyIiwic29ydF9pbmRleCIsImJsb2NrX2lkIiwicGxhY2Vob2xkZXJfdmFyIiwibmF2X2l0ZW1fcGFnZV9pZCIsImNvcHlCbG9ja0lkIiwicHV0IiwiJHNjZSIsIlNlcnZpY2VCbG9ja0NvcHlTdGFjayIsIk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIiLCJ2YXIiLCJlbGVtZW50Iiwic29ydEluZGV4IiwiJGluZGV4IiwicmVtb3ZlIiwiY29weUJsb2NrIiwiYmxvY2siLCJ0b2dnbGVIaWRkZW4iLCJibG9ja0lkIiwiaGlkZGVuU3RhdGUiLCJuYW1lIiwiaXNFZGl0YWJsZSIsInZhcnMiLCJpc0NvbmZpZ3VyYWJsZSIsImNmZ3MiLCJ2YWx1ZXMiLCJ2YXJpYXRpb24iLCJldmFsVmFyaWF0aW9uVmlzYmlsaXR5IiwiZ2V0SW5mbyIsInZhckZpZWxkTmFtZSIsImZpZWxkX2hlbHAiLCJ2YXJpYXRlbk5hbWUiLCJ2YXJpYXRpb25zIiwiaXNPYmplY3QiLCJ2IiwiayIsIm9iamVjdCIsImludmlzaWJsZSIsImNmZ2RhdGEiLCJjZmd2YWx1ZXMiLCJlZGl0IiwibW9kYWxIaWRkZW4iLCJtb2RhbE1vZGUiLCJpbml0TW9kYWxNb2RlIiwidG9nZ2xlRWRpdCIsInJlbmRlclRlbXBsYXRlIiwiZGF0YVZhcnMiLCJjZmdWYXJzIiwiZXh0cmFzIiwiVHdpZyIsInR3aWciLCJjb250ZW50IiwicmVuZGVyIiwidHJ1c3RBc0h0bWwiLCJyZW1vdmVCbG9jayIsImpzb25fY29uZmlnX3ZhbHVlcyIsImpzb25fY29uZmlnX2NmZ192YWx1ZXMiLCJpc19kaXJ0eSIsIm9iamVjdGRldGFpbCIsIlNlcnZpY2VCbG9ja3NEYXRhIiwiYmxvY2tzRGF0YSIsImJsb2Nrc0RhdGFSZXN0b3JlIiwiYmxvY2tzRGF0YVJlbG9hZCIsImFkZFRvRmF2IiwicmVtb3ZlRnJvbUZhdiIsInRvZ2dsZUdyb3VwIiwiZ3JvdXAiLCJpc1ByZXZpZXdFbmFibGVkIiwicHJldmlld19lbmFibGVkIiwiY29weVN0YWNrIiwic3RhY2siLCJjbGVhclN0YWNrIiwiY2xlYXIiLCJzZWFyY2hRdWVyeSIsInNlYXJjaElzRGlydHkiLCJpc19mYXYiLCJzcGxpY2UiLCJyZXNvbHZlclByb3ZpZGVyIiwiYWRkQ2FsbGJhY2siLCJMdXlhTG9hZGluZyIsInN0YXJ0IiwiciIsInN0b3AiLCJzaGlmdCIsImljb24iLCJjb3B5c3RhY2siLCJmb3JjZVJlbG9hZCIsInNldFVybCIsIml0ZW1JZCIsIkRhdGUiLCJnZXRUaW1lIiwicHJldmlld1VybCIsImRlZmF1bHRXZWJzaXRlIiwid2Vic2l0ZXMiLCJmaW5kIiwidyIsInBhZ2UiXSwibWFwcGluZ3MiOiI7O0FBQUEsQ0FBQyxZQUFXO0FBQ1gsZUFEVyxDQUdYOztBQUVHQSxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FBYyxjQUFkLEVBQThCLENBQUMsaUJBQUQsRUFBb0IsU0FBcEIsRUFBK0IsVUFBU0MsZUFBVCxFQUEwQkMsT0FBMUIsRUFBbUM7QUFDNUYsV0FBTztB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QUFULEVBQWlCO0FBQ3JDLFFBQUlsSyxPQUFPLENBQUNvUyxJQUFSLENBQWEvUyxjQUFiLENBQTRCNkssTUFBNUIsQ0FBSixFQUF5QztBQUN4QyxhQUFPbEssT0FBTyxDQUFDb1MsSUFBUixDQUFhbEksTUFBYixDQUFQO0FBQ0E7O0FBRUQsV0FBTyxLQUFQO0FBQ0EsR0FORDs7QUFRQSxTQUFPbEssT0FBUDtBQUNBLENBckJ3QyxDQUF6QyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0XG5cdC8vIGRpcmVjdGl2ZS5qc1xuXG4gICAgemFhLmRpcmVjdGl2ZShcIm1lbnVEcm9wZG93blwiLCBbJ1NlcnZpY2VNZW51RGF0YScsICckZmlsdGVyJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCAkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdCA6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgICAgICAgIG5hdklkIDogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlciA6IFsnJHNjb3BlJywgZnVuY3Rpb24oJHNjb3BlKSB7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuY2hhbmdlTW9kZWwgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uYXZJZCA9IGRhdGEuaWQ7XG4gICAgICAgICAgICAgICAgfVxuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShTZXJ2aWNlTWVudURhdGEuZGF0YSk7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YU9yaWdpbmFsID0gYW5ndWxhci5jb3B5KFNlcnZpY2VNZW51RGF0YS5kYXRhKTtcblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShkYXRhKTtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFPcmlnaW5hbCA9IGFuZ3VsYXIuY29weShkYXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubWVudURhdGEubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjb250YWluZXIgaW4gJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVyXS5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdzZWFyY2hRdWVyeScsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobiA9PSBudWxsIHx8IG4gPT0gJycpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YS5pdGVtcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBpdGVtcyA9ICRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zLCB7dGl0bGU6IG59KTtcblxuXHRcdFx0XHRcdC8vIGZpbmQgYWxsIHBhcmVudCBlbGVtZW50cyBvZiB0aGUgZm91bmQgZWxlbWVudHMgYW5kIHJlIGFkZCB0aGVtIHRvIHRoZSBtYXAgaW4gb3JkZXIgdG8gXG5cdFx0XHRcdFx0Ly8gZW5zdXJlIGEgY29ycmVjdCBtZW51IHRyZWUuXG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlWydwYXJlbnRfbmF2X2lkJ10gIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyh2YWx1ZVsncGFyZW50X25hdl9pZCddLCB2YWx1ZVsnbmF2X2NvbnRhaW5lcl9pZCddLCBpdGVtcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEuaXRlbXMgPSBpdGVtcztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQsIGluZGV4KSB7XG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUuY3VycmVudFdlYnNpdGVJZCwgJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdFx0XHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0XHRcdHZhciBleGlzdHMgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbmRleCwgZnVuY3Rpb24oaSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoaS5pZCA9PSBpdGVtLmlkKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZXhpc3RzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdGlmICghZXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRcdGluZGV4LnB1c2goaXRlbSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyhpdGVtLnBhcmVudF9uYXZfaWQsIGl0ZW0ubmF2X2NvbnRhaW5lcl9pZCwgaW5kZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVyID0gdHJ1ZTtcblxuXHRcdFx0XHRpbml0KCk7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHRlbXBsYXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAnPGRpdj4nK1xuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgbWItMlwiPicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXByZXBlbmRcIiBuZy1oaWRlPVwic2VhcmNoUXVlcnlcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5zZWFyY2g8L2k+PC9kaXY+PC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtcHJlcGVuZFwiIG5nLXNob3c9XCJzZWFyY2hRdWVyeVwiIG5nLWNsaWNrPVwic2VhcmNoUXVlcnkgPSBcXCdcXCdcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5jbGVhcjwvaT48L2Rpdj48L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbFwiIG5nLW1vZGVsPVwic2VhcmNoUXVlcnlcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJytpMThuWyduZ3Jlc3RfY3J1ZF9zZWFyY2hfdGV4dCddKydcIj4nK1xuXHRcdFx0XHRcdCc8L2Rpdj4nICsgXG5cdFx0XHRcdFx0JzxkaXYgbmctcmVwZWF0PVwiKGtleSwgY29udGFpbmVyKSBpbiBtZW51RGF0YS5jb250YWluZXJzXCIgbmctaWY9XCIobWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDpudWxsKS5sZW5ndGggPiAwXCIgY2xhc3M9XCJjYXJkIG1iLTJcIiBuZy1jbGFzcz1cIntcXCdjYXJkLWNsb3NlZFxcJzogIWNvbnRhaW5lci5pc0hpZGRlbn1cIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlclwiIG5nLWNsaWNrPVwiY29udGFpbmVyLmlzSGlkZGVuPSFjb250YWluZXIuaXNIaWRkZW5cIj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBjYXJkLXRvZ2dsZS1pbmRpY2F0b3JcIj5rZXlib2FyZF9hcnJvd19kb3duPC9zcGFuPicrXG5cdFx0XHRcdFx0XHRcdCc8c3Bhbj57e2NvbnRhaW5lci5uYW1lfX08L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj4nKyBcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ0cmVldmlldyB0cmVldmlldy1jaG9vc2VyXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0Jzx1bCBjbGFzcz1cInRyZWV2aWV3LWl0ZW1zIHRyZWV2aWV3LWl0ZW1zLWx2bDFcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJ0cmVldmlldy1pdGVtIHRyZWV2aWV3LWl0ZW0tbHZsMVwiIG5nLWNsYXNzPVwie1xcJ3RyZWV2aWV3LWl0ZW0taGFzLWNoaWxkcmVuXFwnIDogKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6bnVsbCkubGVuZ3RofVwiIG5nLXJlcGVhdD1cIihrZXksIGRhdGEpIGluIG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6bnVsbCB0cmFjayBieSBkYXRhLmlkXCIgbmctaW5jbHVkZT1cIlxcJ21lbnVEcm9wZG93blJldmVyc2VcXCdcIj48L2xpPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3VsPicgK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0JzwvZGl2PicrXG5cdFx0XHRcdCc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJ6YWFDbXNQYWdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwiPVwiLFxuICAgICAgICAgICAgICAgIFwib3B0aW9uc1wiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQGxhYmVsXCIsXG4gICAgICAgICAgICAgICAgXCJpMThuXCI6IFwiQGkxOG5cIixcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiQGZpZWxkaWRcIixcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJAZmllbGRuYW1lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcdHJldHVybiAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIGZvcm0tc2lkZS1ieS1zaWRlXCIgbmctY2xhc3M9XCJ7XFwnaW5wdXQtLWhpZGUtbGFiZWxcXCc6IGkxOG59XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGUgZm9ybS1zaWRlLWxhYmVsXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWw+e3tsYWJlbH19PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxtZW51LWRyb3Bkb3duIGNsYXNzPVwibWVudS1kcm9wZG93blwiIG5hdi1pZD1cIm1vZGVsXCIgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJzaG93SW50ZXJuYWxSZWRpcmVjdGlvblwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0bmF2SWQgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCAnJHN0YXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJHN0YXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnbmF2SWQnLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2dldC1uYXYtaXRlbS1wYXRoJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5wYXRoID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1jb250YWluZXItbmFtZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XSxcblx0XHRcdHRlbXBsYXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAnPGEgY2xhc3M9XCJidG4gYnRuLXNlY29uZGFyeSBidG4tc21cIiB1aS1zcmVmPVwiY3VzdG9tLmNtc2VkaXQoeyBuYXZJZCA6IG5hdklkLCB0ZW1wbGF0ZUlkOiBcXCdjbXNhZG1pbi9kZWZhdWx0L2luZGV4XFwnfSlcIj57e3BhdGh9fTwvYT4gaW4ge3tjb250YWluZXJ9fSc7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblx0XG5cdHphYS5kaXJlY3RpdmUoXCJjcmVhdGVGb3JtXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFQScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0ZGF0YSA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2NyZWF0ZWZvcm0uaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxhbmd1YWdlc0RhdGEnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSkge1xuXG5cdFx0XHRcdCRzY29wZS5lcnJvciA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuc3VjY2VzcyA9IGZhbHNlO1xuXG5cdFx0XHRcdCRzY29wZS5jb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZ1bmN0aW9uIGluaXRpYWxpemVyKCkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51ID0gJHNjb3BlLm1lbnVEYXRhLml0ZW1zO1xuXHRcdFx0XHRcdCRzY29wZS5uYXZjb250YWluZXJzID0gJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnM7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpbml0aWFsaXplcigpO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9IDE7XG5cdFx0XHRcdCRzY29wZS5kYXRhLnBhcmVudF9uYXZfaWQgPSBudWxsO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5pc19kcmFmdCA9IDA7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCA9IG51bGw7XG5cblxuXHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IFNlcnZpY2VMYW5ndWFnZXNEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9IHBhcnNlSW50KCRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5sYW5ndWFnZXNEYXRhLCB7J2lzX2RlZmF1bHQnOiAnMSd9LCB0cnVlKVswXS5pZCk7XG5cblx0XHRcdFx0JHNjb3BlLm5hdml0ZW1zID0gW107XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSB1bmRlZmluZWQgJiYgbiAhPT0gbykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEucGFyZW50X25hdl9pZCA9IG51bGw7XG5cdFx0XHRcdFx0XHQkc2NvcGUubmF2aXRlbXMgPSAkc2NvcGUubWVudVtuXVsnX19pdGVtcyddO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKCRzY29wZS5kYXRhLnRpdGxlKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdkYXRhLmFsaWFzJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuIT1vICYmIG4hPW51bGwpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKG4pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmV4ZWMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIuc2F2ZSgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnN1Y2Nlc3MgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS50aXRsZSA9IG51bGw7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9IG51bGw7XG5cdFx0XHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEuaXNJbmxpbmUpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLiRwYXJlbnQuJHBhcmVudC5nZXRJdGVtKCRzY29wZS5kYXRhLmxhbmdfaWQsICRzY29wZS5kYXRhLm5hdl9pZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ3ZpZXdfaW5kZXhfcGFnZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlYXNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZVswXSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdCRzY29wZS5lcnJvciA9IHJlYXNvbjtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyoqIFBBR0UgQ1JFQVRFICYgVVBEQVRFICovXG4gICAgemFhLmRpcmVjdGl2ZShcInVwZGF0ZUZvcm1QYWdlXCIsIFsnU2VydmljZUxheW91dHNEYXRhJywgZnVuY3Rpb24oU2VydmljZUxheW91dHNEYXRhKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdCA6ICdFQScsXG4gICAgICAgICAgICBzY29wZSA6IHtcbiAgICAgICAgICAgICAgICBkYXRhIDogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmwgOiAndXBkYXRlZm9ybXBhZ2UuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLnBhcmVudCA9ICRzY29wZS4kcGFyZW50LiRwYXJlbnQ7XG5cdFx0XHRcdCRzY29wZS5uYXZJdGVtSWQgPSAkc2NvcGUucGFyZW50Lml0ZW0uaWQ7XG5cblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYXlvdXRfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXG5cdFx0XHRcdCRzY29wZS52ZXJzaW9uc0RhdGEgPSBbXTtcblxuXHRcdFx0XHQkc2NvcGUuZ2V0VmVyc2lvbkxpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2UvdmVyc2lvbnMnLCB7IHBhcmFtcyA6IHsgbmF2SXRlbUlkIDogJHNjb3BlLm5hdkl0ZW1JZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnZlcnNpb25zRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLmlzRWRpdEF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUudmVyc2lvbnNEYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIFx0fTtcblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0XHRcdCRzY29wZS5nZXRWZXJzaW9uTGlzdCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuXHR9XSk7XG5cdHphYS5kaXJlY3RpdmUoXCJjcmVhdGVGb3JtUGFnZVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjcmVhdGVmb3JtcGFnZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHNjb3BlLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLnVzZV9kcmFmdCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmxheW91dF9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmZyb21fZHJhZnRfaWQgPSAwO1xuXG5cdFx0XHRcdC8qIGxheW91dHNEYXRhICovXG5cblx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgICAgICAgICAgXHR9KTtcblxuICAgICAgICAgICAgXHQvKiBtZW51RGF0YSAqL1xuXG4gICAgXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cbiAgICAgICAgICAgIFx0ZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUuZHJhZnRzID0gJHNjb3BlLm1lbnVEYXRhLmRyYWZ0cztcbiAgICAgICAgICAgIFx0XHQkc2NvcGUubGF5b3V0cyA9ICRzY29wZS5sYXlvdXRzRGF0YTtcbiAgICAgICAgICAgIFx0fVxuXG4gICAgICAgICAgICBcdGluaXQoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LmV4ZWMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qIFBhZ2UgTU9EVUxFICovXG5cblx0emFhLmRpcmVjdGl2ZShcImZvcm1Nb2R1bGVcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnZm9ybW1vZHVsZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuXHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLnBhcmFtcyA9IHt9O1xuXG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWFkbWluLWNvbW1vbi9kYXRhLW1vZHVsZXMnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1vZHVsZXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWRkUGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0XHRpZiAoISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCdhY3Rpb25fcGFyYW1zJykpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFjdGlvbl9wYXJhbXMgPSB7fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtc1trZXldID0gJyc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEubW9kdWxlX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL21vZHVsZS1jb250cm9sbGVycz9tb2R1bGU9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXJzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEuY29udHJvbGxlcl9uYW1lO1xuXHRcdFx0XHR9LCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb250cm9sbGVyLWFjdGlvbnM/bW9kdWxlPScrJHNjb3BlLmRhdGEubW9kdWxlX25hbWUrJyZjb250cm9sbGVyPScgKyBuKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogZmlsdGVycyAqL1xuXG5cdHphYS5maWx0ZXIoXCJtZW51d2Vic2l0ZWZpbHRlclwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHdlYnNpdGVJZCkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICh2YWx1ZS53ZWJzaXRlX2lkID09IHdlYnNpdGVJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoXCJtZW51cGFyZW50ZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnBhcmVudF9uYXZfaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAoIXJldHVyblZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmlkID09IHBhcmVudE5hdklkICYmIHZhbHVlLm5hdl9jb250YWluZXJfaWQgPT0gY29udGFpbmVySWQpIHtcblx0XHRcdFx0XHRcdHJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHRcdH07XG5cdH0pO1xuXG5cdC8qIGZhY3RvcnkuanMgKi9cblxuXHR6YWEuZmFjdG9yeSgnUGxhY2Vob2xkZXJTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSBbXTtcblxuXHRcdHNlcnZpY2Uuc3RhdHVzID0gMTsgLyogMSA9IHNob3dwbGFjZWhvbGRlcnM7IDAgPSBoaWRlIHBsYWNlaG9sZGVycyAqL1xuXG5cdFx0c2VydmljZS5kZWxlZ2F0ZSA9IGZ1bmN0aW9uKHN0YXR1cykge1xuXHRcdFx0c2VydmljZS5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0fTtcblxuXHRcdHJldHVybiBzZXJ2aWNlO1xuXHR9KTtcblxuXHQvKiBsYXlvdXQuanMgKi9cblxuXHR6YWEuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInLCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHRcdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2VkaXRcIiwge1xuXHRcdFx0dXJsIDogXCIvdXBkYXRlLzpuYXZJZFwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS91cGRhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zYWRkXCIsIHtcblx0XHRcdHVybCA6IFwiL2NyZWF0ZVwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS9jcmVhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZHJhZnRcIiwge1xuXHRcdFx0dXJsOiAnL2RyYWZ0cycsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2Ntc2FkbWluL3BhZ2UvZHJhZnRzJ1xuXHRcdH0pO1xuXHR9XSk7XG5cblx0LyogY29udHJvbGxlcnMgKi9cblxuXHR6YWEuY29udHJvbGxlcihcIkRyYWZ0c0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHN0YXRlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24obmF2SWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogbmF2SWQgfSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zRGFzaGJvYXJkXCIsIFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXHRcdCRzY29wZS5kYXNoYm9hcmQgPSBbXTtcblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vZGFzaGJvYXJkLWxvZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCRzY29wZS5kYXNoYm9hcmQgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXHR9XSk7XG5cdFxuXHR6YWEuY29udHJvbGxlcihcIkNvbmZpZ0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdCRzY29wZS5kYXRhID0ge307XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJywgJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VWZXJzaW9uc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VydmljZUxheW91dHNEYXRhLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdC8qKlxuXHRcdCAqIEB2YXIgb2JqZWN0ICR0eXBlRGF0YSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBvYmplY3QgJGl0ZW0gRnJvbSBwYXJlbnQgc2NvcGUgY29udHJvbGxlciBOYXZJdGVtQ29udHJvbGxlclxuXHRcdCAqIEB2YXIgc3RyaW5nICR2ZXJzaW9uTmFtZSBGcm9tIG5nLW1vZGVsXG5cdFx0ICogQHZhciBpbnRlZ2VyICRmcm9tVmVyc2lvblBhZ2VJZCBGcm9tIG5nLW1vZGVsIHRoZSB2ZXJzaW9uIGNvcHkgZnJvbSBvciAwID0gbmV3IGVtcHR5L2JsYW5rIHZlcnNpb25cblx0XHQgKiBAdmFyIGludGVnZXIgJHZlcnNpb25MYXlvdXRJZCBGcm9tIG5nLW1vZGVsLCBvbmx5IGlmIGZyb21WZXJzaW9uUGFnZUlkIGlzIDBcbiBcdFx0ICovXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXG4gICAgXHQvKiBjb250cm9sbGVyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuY3JlYXRlTmV3VmVyc2lvblN1Ym1pdCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc192ZXJzaW9uX2Vycm9yX2VtcHR5X2ZpZWxkcyddKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5jb3B5RXhpc3RpbmdWZXJzaW9uKSB7XG5cdFx0XHRcdGRhdGEudmVyc2lvbkxheW91dElkID0gMDtcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jcmVhdGUtcGFnZS12ZXJzaW9uJywgJC5wYXJhbSh7J2xheW91dElkJzogZGF0YS52ZXJzaW9uTGF5b3V0SWQsICduYXZJdGVtSWQnOiAkc2NvcGUuaXRlbS5pZCwgJ25hbWUnOiBkYXRhLnZlcnNpb25OYW1lLCAnZnJvbVBhZ2VJZCc6IGRhdGEuZnJvbVZlcnNpb25QYWdlSWR9KSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl9jcmVhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNvcHlQYWdlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblxuXHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdCRzY29wZS4kb24oJ2RlbGV0ZWROYXZJdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5uYXZJZCA9IDA7XG5cblx0XHQkc2NvcGUuaXRlbXMgPSBudWxsO1xuXG5cdFx0JHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3Rpb24gPSAwO1xuXG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRzY29wZS5zZWxlY3Rpb24gPSBpdGVtLmlkO1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBhbmd1bGFyLmNvcHkoaXRlbSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1TZWxlY3Rpb24udGl0bGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobikge1xuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbi5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuaXRlbVNlbGVjdGlvbi50aXRsZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkSXRlbXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5uYXZJZCA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5OYXZDb250cm9sbGVyLm5hdkRhdGEuaWQ7XG5cblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZmluZC1uYXYtaXRlbXMnLCB7IHBhcmFtczogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHQkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb25bJ3RvTGFuZ0lkJ10gPSAkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIubGFuZy5pZDtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1mcm9tLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5pdGVtU2VsZWN0aW9uKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfYWRkZWRfdHJhbnNsYXRpb25fb2snXSk7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLnJlZnJlc2goKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9lcnJvciddKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNNZW51VHJlZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckc3RhdGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRzdGF0ZSwgJGh0dHAsICRmaWx0ZXIsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHQvLyBsaXZlIGVkaXQgc2VydmljZVxuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSAwO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnbGl2ZUVkaXRTdGF0ZVRvZ2dsZXInLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkcm9vdFNjb3BlLmNtc0NvbmZpZyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnKCk7XG5cdFx0XG5cdFx0Ly8gbWVudSBEYXRhXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY3VycmVudFdlYnNpdGVUb2dnbGVyJywgZnVuY3Rpb24oaWQpIHtcblx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS50b2dnbGUoaWQpO1xuXHRcdFx0Ly9TZXJ2aWNlTWVudURhdGEubG9hZCgpXG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBkYXRhO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9IGRhdGEuaWQ7XG5cdFx0fSk7XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BFbXB0eUNvbnRhaW5lciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixjYXRJZCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS10by1jb250YWluZXInLCB7IHBhcmFtczoge21vdmVJdGVtSWQ6IGRyYWdnZWQuaWQsIGRyb3BwZWRPbkNhdElkOiBjYXRJZH19KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZyxkcm9wLHBvcykge1xuXHRcdFx0aWYgKHBvcyA9PSAnYm90dG9tJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWFmdGVyJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkQWZ0ZXJJdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fSBlbHNlIGlmIChwb3MgPT0gJ3RvcCcpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS1iZWZvcmUnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRCZWZvcmVJdGVtSWQ6IGRyb3AuaWR9O1xuXG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAnbWlkZGxlJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNoaWxkJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkT25JdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkaHR0cC5nZXQoYXBpLCB7IHBhcmFtcyA6IHBhcmFtcyB9KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCd0aHJvdyBlcnJvciBtZXNzYWdlIGVycm9yTWVzc2FnZU9uRHVwbGljYXRlQWxpYXMnKTtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS52YWxpZEl0ZW0gPSBmdW5jdGlvbihob3ZlciwgZHJhZ2VkKSB7XG5cdFx0XHRcblx0XHRcdGlmIChob3Zlci5pZCA9PSBkcmFnZWQuaWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkc2NvcGUucnJpdGVtcyA9IFtdO1xuXHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGRyYWdlZC5uYXZfY29udGFpbmVyX2lkLCBkcmFnZWQuaWQpO1xuXHRcdFx0XG5cdFx0XHRpZiAoJHNjb3BlLnJyaXRlbXMuaW5kZXhPZihob3Zlci5pZCkgPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5ycml0ZW1zID0gW107XG5cdFx0XG5cdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5ID0gZnVuY3Rpb24oY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSAkZmlsdGVyKCdtZW51cGFyZW50ZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHRcdFx0XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0JHNjb3BlLnJyaXRlbXMucHVzaChpdGVtLmlkKTtcblx0XHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGNvbnRhaW5lcklkLCBpdGVtLmlkKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXRlbSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhLnRvZ2dsZV9vcGVuID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRkYXRhWyd0b2dnbGVfb3BlbiddID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGFbJ3RvZ2dsZV9vcGVuJ10gPSAhZGF0YS50b2dnbGVfb3Blbjtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdHJlZS1oaXN0b3J5Jywge2RhdGE6IGRhdGF9LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXG5cdFx0fTtcblxuXHRcdCRzY29wZS5nbyA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKGRhdGEubmF2X2l0ZW1faWQsIDApO1xuXHRcdFx0JHN0YXRlLmdvKCdjdXN0b20uY21zZWRpdCcsIHsgbmF2SWQgOiBkYXRhLmlkIH0pO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLnNob3dEcmFnID0gMDtcblxuXHQgICAgJHNjb3BlLmlzQ3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdCAgICBcdGlmIChkYXRhICE9PSBudWxsICYmICRzdGF0ZS5wYXJhbXMubmF2SWQgPT0gZGF0YS5pZCkge1xuXHQgICAgXHRcdHJldHVybiB0cnVlO1xuXHQgICAgXHR9XG5cblx0ICAgIFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLmhpZGRlbkNhdHMgPSBbXTtcblxuXHQgICAgJHNjb3BlLiR3YXRjaCgnbWVudURhdGEnLCBmdW5jdGlvbiAobiwgbykge1xuXHQgICAgXHQkc2NvcGUuaGlkZGVuQ2F0cyA9IG4uaGlkZGVuQ2F0cztcblx0ICAgIH0pO1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUNhdCA9IGZ1bmN0aW9uKGNhdElkKSB7XG5cdFx0XHRpZiAoY2F0SWQgaW4gJHNjb3BlLmhpZGRlbkNhdHMpIHtcblx0XHRcdFx0JHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID0gISRzY29wZS5oaWRkZW5DYXRzW2NhdElkXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtY2F0LXRvZ2dsZScsIHtjYXRJZDogY2F0SWQsIHN0YXRlOiAkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF19LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXNIaWRkZW4gPSBmdW5jdGlvbihjYXRJZCkge1xuXG5cdFx0XHRpZiAoJHNjb3BlLmhpZGRlbkNhdHMgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNhdElkIGluICRzY29wZS5oaWRkZW5DYXRzKSB7XG5cdFx0XHRcdGlmICgkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPT0gMSkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHt9O1xuXHRcdCRzY29wZS5kYXRhLmlzSW5saW5lID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMikge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1tb2R1bGUnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMykge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1yZWRpcmVjdCcsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlSW5saW5lQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdG5hdl9pZCA6ICRzY29wZS4kcGFyZW50Lk5hdkNvbnRyb2xsZXIuaWRcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRhdGEuaXNJbmxpbmUgPSB0cnVlO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9ICRzY29wZS5sYW5nLmlkO1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAyKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLW1vZHVsZS1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDMpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcmVkaXJlY3QtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIk5hdkNvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHJvb3RTY29wZScsICckZmlsdGVyJywgJyRzdGF0ZScsICckc3RhdGVQYXJhbXMnLCAnJGh0dHAnLCAnUGxhY2Vob2xkZXJTZXJ2aWNlJywgJ1NlcnZpY2VQcm9wZXJ0aWVzRGF0YScsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxhbmd1YWdlc0RhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdBZG1pblRvYXN0U2VydmljZScsICdBZG1pbkNsYXNzU2VydmljZScsICdBZG1pbkxhbmdTZXJ2aWNlJywgJ0h0bWxTdG9yYWdlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRmaWx0ZXIsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCwgUGxhY2Vob2xkZXJTZXJ2aWNlLCBTZXJ2aWNlUHJvcGVydGllc0RhdGEsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxhbmd1YWdlc0RhdGEsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIEFkbWluVG9hc3RTZXJ2aWNlLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5MYW5nU2VydmljZSwgSHRtbFN0b3JhZ2UpIHtcblxuXG5cdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4gPSB0cnVlO1xuXHRcdFxuXHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gMTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHQpIHtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gdDtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuID0gISRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLm5hdkNmZyA9IHtcblx0XHRcdGhlbHB0YWdzOiAkcm9vdFNjb3BlLmx1eWFjZmcuaGVscHRhZ3MsXG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUxpdmVDb250YWluZXIgPSBuO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnVybCB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZVVybCA9IG47XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLkFkbWluTGFuZ1NlcnZpY2UgPSBBZG1pbkxhbmdTZXJ2aWNlO1xuXG5cdFx0Lyogc2VydmljZSBBZG1pblByb3BlcnR5U2VydmljZSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLnByb3BlcnRpZXNEYXRhID0gU2VydmljZVByb3BlcnRpZXNEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOlByb3BlcnRpZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5wcm9wZXJ0aWVzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlTGFuZ2F1Z2VzRGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdC8qIHBsYWNlaG9sZGVycyB0b2dnbGVyIHNlcnZpY2UgKi9cblxuXHRcdCRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2UgPSBQbGFjZWhvbGRlclNlcnZpY2U7XG5cblx0XHQkc2NvcGUucGxhY2Vob2xkZXJTdGF0ZSA9ICRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2Uuc3RhdHVzO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgncGxhY2Vob2xkZXJTdGF0ZScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlLmRlbGVnYXRlKG4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0LyogQmxvY2tob2xkZXIgc2l6ZSB0b2dnbGVyICovXG5cbiAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9IEh0bWxTdG9yYWdlLmdldFZhbHVlKCdibG9ja2hvbGRlclRvZ2dsZVN0YXRlJywgdHJ1ZSk7XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUJsb2NraG9sZGVyU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9ICEkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsO1xuICAgICAgICAgICAgSHRtbFN0b3JhZ2Uuc2V0VmFsdWUoJ2Jsb2NraG9sZGVyVG9nZ2xlU3RhdGUnLCAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBzaWRlYmFyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuc2lkZWJhciA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuZW5hYmxlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgXHQkc2NvcGUuc2lkZWJhciA9IHRydWU7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUudG9nZ2xlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICRzY29wZS5zaWRlYmFyID0gISRzY29wZS5zaWRlYmFyO1xuXHQgICAgfTtcblxuXHRcdC8qIGFwcCBsb2dpYyAqL1xuXG5cdCAgICAkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXG5cdFx0JHNjb3BlLmlkID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLm5hdklkKTtcblxuXHRcdCRzY29wZS5pc0RlbGV0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5BZG1pbkNsYXNzU2VydmljZSA9IEFkbWluQ2xhc3NTZXJ2aWNlO1xuXG5cdFx0JHNjb3BlLnByb3BWYWx1ZXMgPSB7fTtcblxuXHRcdCRzY29wZS5oYXNWYWx1ZXMgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5wYWdlVGFncyA9IFtdO1xuXG5cdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQpIHtcblx0ICAgIFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUuY3VycmVudFdlYnNpdGVJZCwgJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHQgICAgXHRpZiAoaXRlbSkge1xuXHQgICAgXHRcdGl0ZW0udG9nZ2xlX29wZW4gPSAxO1xuXHQgICAgXHRcdCRzY29wZS5idWJibGVQYXJlbnRzKGl0ZW0ucGFyZW50X25hdl9pZCwgaXRlbS5uYXZfY29udGFpbmVyX2lkKTtcblx0ICAgIFx0fVxuXHQgICAgfTtcblxuXHRcdCRzY29wZS5jcmVhdGVEZWVwUGFnZUNvcHkgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2RlZXAtcGFnZS1jb3B5Jywge25hdklkOiAkc2NvcGUuaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfY3JlYXRlX2NvcHlfc3VjY2VzcyddKTtcblx0XHRcdFx0JHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnBhZ2VUYWdzID0gW107XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2LycgKyAkc2NvcGUuaWQgKyAnL3RhZ3MnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0JHNjb3BlLnBhZ2VUYWdzLnB1c2godmFsdWUuaWQpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuc2F2ZVBhZ2VUYWdzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi8nICsgJHNjb3BlLmlkICsgJy90YWdzJywgJHNjb3BlLnBhZ2VUYWdzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfY29uZmlnX3VwZGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY3JlYXRlRGVlcFBhZ2VDb3B5QXNUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVlcC1wYWdlLWNvcHktYXMtdGVtcGxhdGUnLCB7bmF2SWQ6ICRzY29wZS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9jcmVhdGVfY29weV9hc190ZW1wbGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHQkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY3VzdG9tLmNtc2RyYWZ0Jyk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9nZXQtcHJvcGVydGllcycsIHsgcGFyYW1zOiB7bmF2SWQ6ICRzY29wZS5pZH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGZvcih2YXIgaSBpbiByZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0dmFyIGQgPSByZXNwb25zZS5kYXRhW2ldO1xuXHRcdFx0XHRcdCRzY29wZS5wcm9wVmFsdWVzW2QuYWRtaW5fcHJvcF9pZF0gPSBkLnZhbHVlO1xuXHRcdFx0XHRcdCRzY29wZS5oYXNWYWx1ZXMgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZVByb3BNYXNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gISRzY29wZS5zaG93UHJvcEZvcm07XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zdG9yZVByb3BWYWx1ZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtcHJvcGVydGllcz9uYXZJZD0nKyRzY29wZS5pZCwgJC5wYXJhbSgkc2NvcGUucHJvcFZhbHVlcyksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX3Byb3BlcnR5X3JlZnJlc2gnXSk7XG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXHRcdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gZmFsc2U7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRyYXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVsZXRlJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLmlkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0XHQkc2NvcGUuaXNEZWxldGVkID0gdHJ1ZTtcblx0ICAgIFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdCAgICBcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHQgICAgXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHQgICAgXHRcdFx0fSk7XG5cdCAgICBcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09IDQxNykge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuaXNEcmFmdCA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuc3VibWl0TmF2Rm9ybSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0ICAgIFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdXBkYXRlP2lkPScgKyAkc2NvcGUubmF2RGF0YS5pZCwgZGF0YSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX3VwZGF0ZV9sYXlvdXRfc2F2ZV9zdWNjZXNzJykpO1xuXHQgICAgXHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdCAgICBcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdCAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZS5tZXNzYWdlKTtcblx0ICAgIFx0XHR9KTtcblx0ICAgIFx0fSk7XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdCRzY29wZS5uYXZEYXRhID0gJGZpbHRlcignZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCB7aWQ6ICRzY29wZS5pZH0sIHRydWUpWzBdO1xuXHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuaXNEcmFmdCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXG5cdFx0XHRcdC8qIHByb3BlcnRpZXMgLS0+ICovXG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfb2ZmbGluZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQgICAgXHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdCAgICBcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtb2ZmbGluZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgb2ZmbGluZVN0YXR1cyA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX29mZmxpbmUgPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9vZmZsaW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfb25saW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0ICAgIFx0XHR9KTtcblx0XHRcdCAgICBcdH1cblx0XHRcdCAgICB9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaGlkZGVuJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBoaWRkZW5TdGF0dXMgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9oaWRkZW4nLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV92aXNpYmxlJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19ob21lIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCAgICBcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaG9tZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgaG9tZVN0YXRlIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19ob21lID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19zdGF0ZV9pc19ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3N0YXRlX2lzX25vdF9ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdCAgICBcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0XHRpbml0aWFsaXplcigpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUubGFuZyBmcm9tIG5nLXJlcGVhdFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJOYXZJdGVtQ29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckcm9vdFNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnJHRpbWVvdXQnLCAnU2VydmljZU1lbnVEYXRhJywgJ0FkbWluTGFuZ1NlcnZpY2UnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbicsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkaHR0cCwgJGZpbHRlciwgJHRpbWVvdXQsIFNlcnZpY2VNZW51RGF0YSwgQWRtaW5MYW5nU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbikge1xuXG5cdFx0JHNjb3BlLmxvYWRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUub3BlbkxpdmVVcmwgPSBmdW5jdGlvbihpZCwgdmVyc2lvbklkKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybChpZCwgdmVyc2lvbklkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWRMaXZlVXJsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybCgkc2NvcGUuaXRlbS5pZCwgJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbik7XG5cdFx0fTtcblxuXHRcdC8vIGxheW91dHNEYXRhXG5cblx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXHRcdFxuXHRcdC8vIHNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZVxuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TG9hZExhbmd1YWdlJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdGlmICghJHNjb3BlLmxvYWRlZCkge1xuXHRcdFx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gcHJvcGVydGllczpcblxuXHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5pdGVtID0gW107XG5cblx0XHQkc2NvcGUuaXRlbUNvcHkgPSBbXTtcblxuXHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IFtdO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhID0gW107XG5cblx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cblx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cblx0XHQkc2NvcGUuaG9tZVVybCA9ICRyb290U2NvcGUubHV5YWNmZy5ob21lVXJsO1xuXG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzO1xuXG5cdFx0JHNjb3BlLnRyYXNoSXRlbSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5sYW5nLmlzX2RlZmF1bHQgPT0gMCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdFx0JGh0dHAuZGVsZXRlKCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZGVsZXRlP25hdkl0ZW1JZD0nICsgJHNjb3BlLml0ZW0uaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW0gPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW1Db3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS50eXBlRGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS4kYnJvYWRjYXN0KCdkZWxldGVkTmF2SXRlbScpO1xuXHRcdFx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHQgICAgXHRcdFx0fSk7XG5cdFx0ICAgIFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XSk7XG5cdFx0XHR9XG5cdCAgICB9O1xuXG5cdFx0JHNjb3BlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXRlbUNvcHkgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLml0ZW0pO1xuXHRcdFx0aWYgKCRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gYW5ndWxhci5jb3B5KHsnbmF2X2l0ZW1fdHlwZV9pZCcgOiAkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlX2lkIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IGFuZ3VsYXIuY29weSgkc2NvcGUudHlwZURhdGEpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUudXBkYXRlTmF2SXRlbURhdGEgPSBmdW5jdGlvbihpdGVtQ29weSwgdHlwZURhdGFDb3B5KSB7XG5cdFx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cdFx0XHR2YXIgbmF2SXRlbUlkID0gaXRlbUNvcHkuaWQ7XG5cblx0XHRcdHR5cGVEYXRhQ29weS50aXRsZSA9IGl0ZW1Db3B5LnRpdGxlO1xuXHRcdFx0dHlwZURhdGFDb3B5LmFsaWFzID0gaXRlbUNvcHkuYWxpYXM7XG5cdFx0XHR0eXBlRGF0YUNvcHkudGl0bGVfdGFnID0gaXRlbUNvcHkudGl0bGVfdGFnO1xuXHRcdFx0dHlwZURhdGFDb3B5LmRlc2NyaXB0aW9uID0gaXRlbUNvcHkuZGVzY3JpcHRpb247XG5cdFx0XHR0eXBlRGF0YUNvcHkua2V5d29yZHMgPSBpdGVtQ29weS5rZXl3b3Jkcztcblx0XHRcdHR5cGVEYXRhQ29weS50aW1lc3RhbXBfY3JlYXRlID0gaXRlbUNvcHkudGltZXN0YW1wX2NyZWF0ZTtcblx0XHRcdHR5cGVEYXRhQ29weS5pbWFnZV9pZCA9IGl0ZW1Db3B5LmltYWdlX2lkO1xuXHRcdFx0dHlwZURhdGFDb3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCA9IGl0ZW1Db3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZDtcblx0XHRcdHR5cGVEYXRhQ29weS5pc19jYWNoZWFibGUgPSBpdGVtQ29weS5pc19jYWNoZWFibGU7XG5cdFx0XHQkaHR0cC5wb3N0KFxuXHRcdFx0XHQnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3VwZGF0ZS1wYWdlLWl0ZW0/bmF2SXRlbUlkPScgKyBuYXZJdGVtSWQgKyAnJm5hdkl0ZW1UeXBlPScgKyBpdGVtQ29weS5uYXZfaXRlbV90eXBlLFxuXHRcdFx0XHQkLnBhcmFtKHR5cGVEYXRhQ29weSksXG5cdFx0XHRcdGhlYWRlcnNcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSAhPT0gMSkge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHQvKiBzd2l0Y2ggdmVyc2lvbiBpZiB0eXBlIGlzIHBhZ2UgKi9cblx0XHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSA9PSAxICYmIHR5cGVvZiByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdFx0LyogY2hvb3NlIGdpdmVuIHZlcnNpb24gb3IgY2hvb3NlIGZpcnN0IGF2YWlsYWJsZSB2ZXJzaW9uICovXG5cdFx0XHRcdFx0XHR2YXIgcGFnZVZlcnNpb25LZXkgPSByZXNwb25zZS5kYXRhWydpdGVtJ10ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdGlmIChwYWdlVmVyc2lvbktleSA9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdHBhZ2VWZXJzaW9uS2V5ID0gT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXSlbMF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXVtwYWdlVmVyc2lvbktleV1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddW3BhZ2VWZXJzaW9uS2V5XVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHBhZ2VWZXJzaW9uS2V5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9pdGVtX3VwZGF0ZV9vaycsIHsndGl0bGUnOiBpdGVtQ29weS50aXRsZX0pKTtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHR9LCBmdW5jdGlvbiBlcnJvckNhbGxiYWNrKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaXRlbS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnaXRlbUNvcHkuYWxpYXMnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiE9byAmJiBuIT1udWxsKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtQ29weS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKShuKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS5yZW1vdmVWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm0nLCB7YWxpYXM6IHZlcnNpb24udmVyc2lvbl9hbGlhc30pLCBpMThuWydjbXNhZG1pbl92ZXJzaW9uX3JlbW92ZSddLCBbJyR0b2FzdCcsICckaHR0cCcsIGZ1bmN0aW9uKCR0b2FzdCwgJGh0dHApIHtcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbW92ZS1wYWdlLXZlcnNpb24nLCB7cGFnZUlkIDogdmVyc2lvbi5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm1fc3VjY2VzcycsIHthbGlhczogdmVyc2lvbi52ZXJzaW9uX2FsaWFzfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXHRcdFxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uSXRlbTtcbiAgICBcdFxuICAgIFx0JHNjb3BlLnRhYiA9IDE7XG4gICAgXHRcbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb25JdGVtKSB7XG4gICAgXHRcdCRzY29wZS5jaGFuZ2VUYWIoNCk7XG4gICAgXHRcdCRzY29wZS5lZGl0VmVyc2lvbkl0ZW0gPSB2ZXJzaW9uSXRlbTtcbiAgICBcdH07XG5cbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvblVwZGF0ZSA9IGZ1bmN0aW9uKGVkaXRWZXJzaW9uSXRlbSkge1xuICAgIFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vY2hhbmdlLXBhZ2UtdmVyc2lvbi1sYXlvdXQnLCB7J3BhZ2VJdGVtSWQnOiBlZGl0VmVyc2lvbkl0ZW0uaWQsICdsYXlvdXRJZCc6IGVkaXRWZXJzaW9uSXRlbS5sYXlvdXRfaWQsICdhbGlhcyc6IGVkaXRWZXJzaW9uSXRlbS52ZXJzaW9uX2FsaWFzfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcbiAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3ZlcnNpb25fdXBkYXRlX3N1Y2Nlc3MnXSk7XG4gICAgXHRcdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSk7XG4gICAgXHR9O1xuICAgIFx0XG5cdFx0JHNjb3BlLmdldEl0ZW0gPSBmdW5jdGlvbihsYW5nSWQsIG5hdklkKSB7XG5cdFx0XHQkaHR0cCh7XG5cdFx0XHQgICAgdXJsOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL25hdi1sYW5nLWl0ZW0nLFxuXHRcdFx0ICAgIG1ldGhvZDogXCJHRVRcIixcblx0XHRcdCAgICBwYXJhbXM6IHsgbGFuZ0lkIDogbGFuZ0lkLCBuYXZJZCA6IG5hdklkIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHRpZiAoIXJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5pdGVtID0gcmVzcG9uc2UuZGF0YVsnaXRlbSddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXTtcblx0XHRcdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGlmICghcmVzcG9uc2UuZGF0YVsnbmF2J10uaXNfZHJhZnQpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIuYnViYmxlUGFyZW50cygkc2NvcGUuTmF2Q29udHJvbGxlci5uYXZEYXRhLnBhcmVudF9uYXZfaWQsICRzY29wZS5OYXZDb250cm9sbGVyLm5hdkRhdGEubmF2X2NvbnRhaW5lcl9pZCk7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlID09IDEpIHtcblxuXHRcdFx0XHRcdFx0XHRcdHZhciBsYXN0VmVyc2lvbiA9IFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24uaGFzVmVyc2lvbigkc2NvcGUuaXRlbS5pZCk7XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAobGFzdFZlcnNpb24pIHtcblx0XHRcdFx0XHRcdFx0XHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uKGxhc3RWZXJzaW9uKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQgaW4gcmVzcG9uc2UuZGF0YS50eXBlRGF0YSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSByZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IHRydWVcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVZlcnNpb25zRHJvcGRvd24gPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkgPSAhJHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uID0gZnVuY3Rpb24ocGFnZVZlcnNpb25pZCwgdG9nZ2xlKSB7XG5cdFx0XHRTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uLnN0b3JlKCRzY29wZS5pdGVtLmlkLCBwYWdlVmVyc2lvbmlkKTtcblx0XHRcdCRzY29wZS5jb250YWluZXIgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSBwYWdlVmVyc2lvbmlkO1xuXHRcdFx0JHNjb3BlLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRpZiAodG9nZ2xlKcKge1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlVmVyc2lvbnNEcm9wZG93bigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaEZvcmNlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKEFkbWluTGFuZ1NlcnZpY2UuaXNJblNlbGVjdGlvbigkc2NvcGUubGFuZy5zaG9ydF9jb2RlKSkge1xuXHRcdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyogbmV3IHNldHRpbmdzIG92ZXJsYXkgKi9cblx0XHRcblx0XHQkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSA9IHRydWU7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0JHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkgPSAhJHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHk7XG5cdFx0XHRpZiAodGFiKSB7XG5cdFx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdCRzY29wZS5jaGFuZ2VUYWIgPSBmdW5jdGlvbih0YWIpIHtcblx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0fVxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFJlZnJlc2ggdGhlIGN1cnJlbnQgbGF5b3V0IGNvbnRhaW5lciBibG9ja3MuXG5cdFx0ICogXG5cdFx0ICogQWZ0ZXIgc3VjY2Vzc2Z1bGwgYXBpIHJlc3BvbnNlIGFsbCBjbXMgbGF5b3V0IGFyZSBmb3JlYWNoIGFuZCB0aGUgdmFsdWVzIGFyZSBwYXNzZWQgdG8gcmV2UGxhY2Vob2xkZXJzKCkgbWV0aG9kLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkID0gZnVuY3Rpb24ocHJldklkLCBwbGFjZWhvbGRlclZhcikge1xuXHRcdFx0JGh0dHAoe1xuXHRcdFx0XHR1cmwgOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbG9hZC1wbGFjZWhvbGRlcicsXG5cdFx0XHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXMgOiB7IG5hdkl0ZW1QYWdlSWQgOiAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uLCBwcmV2SWQgOiBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyIDogcGxhY2Vob2xkZXJWYXJ9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKCRzY29wZS5pdGVtLmlkLCAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uKTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5jb250YWluZXIuX19wbGFjZWhvbGRlcnMsIGZ1bmN0aW9uKHBsYWNlaG9sZGVyKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyhwbGFjZWhvbGRlciwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgcmV2UGxhY2Vob2xkZXJzIG1ldGhvZCBnb2VzIHRyb3VyZ2ggdGhlIG5ldyByb3cvY29sIChncmlkKSBzeXN0ZW0gY29udGFpbmVyIGpzb24gbGF5b3V0IHdoZXJlOlxuXHRcdCAqIFxuXHRcdCAqIHJvd3NbXVsxXSA9IGNvbCBsZWZ0XG5cdFx0ICogcm93c1tdWzJdID0gY29sIHJpZ2h0XG5cdFx0ICogXG5cdFx0ICogV2hlcmUgYSBsYXlvdXQgaGF2ZSBhdCBsZWFzdCBvbiByb3cgd2hpY2ggY2FuIGhhdmUgY29scyBpbnNpZGUuIFNvIHRoZXJlIHJldlBsYWNlaG9sZGVycyBtZXRob2QgZ29lcyB0cm91Z2ggdGhlIGNvbHNcblx0XHQgKiBhbmQgY2hlY2sgaWYgdGhlIGNvbCBpcyBlcXVhbCB0aGUgZ2l2ZW4gY29sIHRvIHJlcGxhY2UgdGhlIGNvbnRlbnQgd2l0aCAgKGZyb20gcmVmcmVzaE5lc3RlZCBtZXRob2QpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMgPSBmdW5jdGlvbihwbGFjZWhvbGRlcnMsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocGxhY2Vob2xkZXJzLCBmdW5jdGlvbihwbGFjZWhvbGRlclJvdywgcGxhY2Vob2xkZXJLZXkpIHtcblx0XHRcdFx0aWYgKHBhcnNlSW50KHByZXZJZCkgPT0gcGFyc2VJbnQocGxhY2Vob2xkZXJSb3cucHJldl9pZCkgJiYgcGxhY2Vob2xkZXJWYXIgPT0gcGxhY2Vob2xkZXJSb3dbJ3ZhciddKSB7XG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJzW3BsYWNlaG9sZGVyS2V5XVsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ10gPSByZXBsYWNlQ29udGVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUucmV2RmluZChwbGFjZWhvbGRlclJvdywgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSByZXZGaW5kIG1ldGhvZCBkb2VzIHRoZSByZWN1cnNpdiBqb2Igd2l0aGluIGEgYmxvY2sgYW4gcGFzc2VzIHRoZSB2YWx1ZSBiYWNrIHRvIHJldlBsYWNlaG9sZGVycygpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZGaW5kID0gZnVuY3Rpb24ocGxhY2Vob2xkZXIsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRmb3IgKHZhciBpIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXSkge1xuXHRcdFx0XHRmb3IgKHZhciBob2xkZXJLZXkgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaG9sZGVyIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzKHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBkcm9wcyBpdGVtcyBpbiBhbiBlbXB0eSBwYWdlIHBsYWNlaG9sZGVyIG9mIENNUyBMQVlPVVQgUExBQ0VIT0xERVJcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW1QbGFjZWhvbGRlciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbikge1xuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywge1xuXHRcdFx0XHRcdHByZXZfaWQ6IGRyb3BwZWQucHJldl9pZCwgXG5cdFx0XHRcdFx0c29ydF9pbmRleDowLCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZFsncHJldl9pZCddLCBkcm9wcGVkWyd2YXInXSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZChkcm9wcGVkWydwcmV2X2lkJ10sIGRyb3BwZWRbJ3ZhciddKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUuYmxvY2sgRnJvbSBuZy1yZXBlYXQgc2NvcGUgYXNzaWdubWVudFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJQYWdlQmxvY2tFZGl0Q29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckc2NlJywgJyRodHRwJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VCbG9ja0NvcHlTdGFjaycsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRzY2UsICRodHRwLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VCbG9ja0NvcHlTdGFjaywgU2VydmljZUxpdmVFZGl0TW9kZSkge1xuXG5cdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdC8qKlxuXHRcdCAqIGRyb3BzIGFuIGl0ZW0gaW4gYW4gZW1wdHkgcGxhY2Vob2xkZXIgb2YgYSBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbVBsYWNlaG9sZGVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uKSB7XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7XG5cdFx0XHRcdFx0cHJldl9pZCA6IGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OjAsIFxuXHRcdFx0XHRcdGJsb2NrX2lkIDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkIDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKGRyb3BwZWQucHJldl9pZCwgZHJvcHBlZC52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZCA6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogRHJvcHMgYSBibG9jayBhYm92ZS9iZWxvdyBhbiBFWElTVElORyBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbSA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixlbGVtZW50KSB7XG5cdFx0XHR2YXIgc29ydEluZGV4ID0gJHNjb3BlLiRpbmRleDtcblx0XHRcdFxuXHRcdFx0aWYgKHBvc2l0aW9uID09ICdib3R0b20nKSB7XG5cdFx0XHRcdHNvcnRJbmRleCA9IHNvcnRJbmRleCArIDE7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHsgXG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4LCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiAkc2NvcGUucGxhY2Vob2xkZXIubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleCxcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0Lypcblx0XHRcdFx0XHQgKiBAaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9sdXlhZGV2L2x1eWEvaXNzdWVzLzE2Mjlcblx0XHRcdFx0XHQgKiBUaGUgbW92ZWQgYmxvY2ssIHNob3VsZCByZW1vdmVkIGZyb20gdGhlIHByZXZpb3VzIGFycmF5LiBUaGlzIGlzIG9ubHkgdGhlIGNhc2Ugd2hlbiBkcmFnZ2luZyBmcm9tIGFuIE9VVEVSIGJsb2NrIGludG8gYW4gSU5ORVIgYmxvY2tcblx0XHRcdFx0XHQgKiBpcyB0aGlzIHdpbGwgbm90IHJlZnJlc2ggdGhlIE9VVEVSIGJsb2NrLCBidXQgYWx3YXlzIHdpbGwgaW4gdGhlIG9wcG9zaXRlIHdheS5cblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZWxlbWVudCkucmVtb3ZlKCk7XG5cdFx0XHRcdFx0Ly8gYXMgdGhlIGJsb2NrIGhhcyBiZWVuIHJlbW92ZWQgZnJvbSBleGlzdGluZywgcmVmcmVzaCB0aGUgbmV3IHBsYWNlaG9sZGVyLlxuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5jb3B5QmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VCbG9ja0NvcHlTdGFjay5wdXNoKCRzY29wZS5ibG9jayk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVIaWRkZW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2suaXNfaGlkZGVuID09IDApIHtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfaGlkZGVuID0gMDtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAoe1xuXHRcdFx0ICAgIHVybDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS90b2dnbGUtYmxvY2staGlkZGVuJyxcblx0XHRcdCAgICBtZXRob2Q6IFwiR0VUXCIsXG5cdFx0XHQgICAgcGFyYW1zOiB7IGJsb2NrSWQgOiAkc2NvcGUuYmxvY2suaWQsIGhpZGRlblN0YXRlOiAkc2NvcGUuYmxvY2suaXNfaGlkZGVuIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0LyogbG9hZCBsaXZlIHVybCBvbiBoaWRkZW4gdHJpZ2dlciAqL1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci4kcGFyZW50LiRwYXJlbnQubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0Ly8gc3VjY2Vzc2Z1bGwgdG9nZ2xlIGhpZGRlbiBzdGF0ZSBvZiBibG9ja1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja192aXNiaWxpdHlfY2hhbmdlJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAkc2NvcGUuYmxvY2sudmFycyAhPSBcInVuZGVmaW5lZFwiICYmICRzY29wZS5ibG9jay52YXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzQ29uZmlndXJhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICRzY29wZS5ibG9jay5jZmdzICE9IFwidW5kZWZpbmVkXCIgJiYgJHNjb3BlLmJsb2NrLmNmZ3MubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblx0XHRcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhbHVlcyB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGF0YSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhcmlhdGlvbiB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eShuKTtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuZ2V0SW5mbyA9IGZ1bmN0aW9uKHZhckZpZWxkTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay5maWVsZF9oZWxwLmhhc093blByb3BlcnR5KHZhckZpZWxkTmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuICRzY29wZS5ibG9jay5maWVsZF9oZWxwW3ZhckZpZWxkTmFtZV07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSA9IGZ1bmN0aW9uKHZhcmlhdGVuTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay52YXJpYXRpb25zLmhhc093blByb3BlcnR5KHZhcmlhdGVuTmFtZSkpIHtcblx0XHRcdFx0dmFyIHZhcmlhdGlvbiA9ICRzY29wZS5ibG9jay52YXJpYXRpb25zWyRzY29wZS5ibG9jay52YXJpYXRpb25dO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFyaWF0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFsdWUsIGZ1bmN0aW9uKHYsIGspIHtcblx0XHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9ja1trZXldLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoayA9PSBvYmplY3QudmFyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay5jZmdzLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLnZhcnMsIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jZmdkYXRhID0gJHNjb3BlLmJsb2NrLmNmZ3ZhbHVlcyB8fCB7fTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLm1vZGFsSGlkZGVuID0gdHJ1ZTtcblxuXHRcdCRzY29wZS5tb2RhbE1vZGUgPSAxO1xuXG5cdFx0JHNjb3BlLmluaXRNb2RhbE1vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2sudmFycy5sZW5ndGggID09IDApIHtcblx0XHRcdFx0JHNjb3BlLm1vZGFsTW9kZSA9IDI7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVFZGl0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmlzRWRpdGFibGUoKSB8fCAkc2NvcGUuaXNDb25maWd1cmFibGUoKSkge1xuXHRcdFx0XHQkc2NvcGUubW9kYWxIaWRkZW4gPSAhJHNjb3BlLm1vZGFsSGlkZGVuO1xuXHRcdFx0XHQkc2NvcGUuZWRpdCA9ICEkc2NvcGUuZWRpdDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbmRlclRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUsIGRhdGFWYXJzLCBjZmdWYXJzLCBibG9jaywgZXh0cmFzKSB7XG5cdFx0XHRpZiAodGVtcGxhdGUgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH1cblx0XHRcdHZhciB0ZW1wbGF0ZSA9IFR3aWcudHdpZyh7XG5cdFx0XHQgICAgZGF0YTogdGVtcGxhdGVcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgY29udGVudCA9IHRlbXBsYXRlLnJlbmRlcih7XG5cdFx0XHRcdHZhcnMgOiBkYXRhVmFycyxcblx0XHRcdFx0Y2ZncyA6IGNmZ1ZhcnMsXG5cdFx0XHRcdGJsb2NrIDogYmxvY2ssXG5cdFx0XHRcdGV4dHJhcyA6IGV4dHJhc1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiAkc2NlLnRydXN0QXNIdG1sKGNvbnRlbnQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlQmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX2RlbGV0ZV9jb25maXJtJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSksIGkxOG5bJ3ZpZXdfdXBkYXRlX2Jsb2NrX3Rvb2x0aXBfZGVsZXRlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmRlbGV0ZSgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9kZWxldGU/aWQ9JyArICRzY29wZS5ibG9jay5pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfcmVtb3ZlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyAkc2NvcGUuYmxvY2suaWQsIHtcblx0XHRcdFx0anNvbl9jb25maWdfdmFsdWVzOiAkc2NvcGUuZGF0YSxcblx0XHRcdFx0anNvbl9jb25maWdfY2ZnX3ZhbHVlczogJHNjb3BlLmNmZ2RhdGEsXG5cdFx0XHRcdHZhcmlhdGlvbjogJHNjb3BlLmJsb2NrLnZhcmlhdGlvblxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja191cGRhdGVfb2snLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVFZGl0KCk7XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19kaXJ0eSA9IDE7XG5cdFx0XHRcdCRzY29wZS5ibG9jayA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLm9iamVjdGRldGFpbCk7XG5cdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5KCRzY29wZS5ibG9jay52YXJpYXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiRHJvcHBhYmxlQmxvY2tzQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdBZG1pbkNsYXNzU2VydmljZScsICdTZXJ2aWNlQmxvY2tzRGF0YScsICdTZXJ2aWNlQmxvY2tDb3B5U3RhY2snLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pbkNsYXNzU2VydmljZSwgU2VydmljZUJsb2Nrc0RhdGEsIFNlcnZpY2VCbG9ja0NvcHlTdGFjaykge1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlQmxvY2tzRGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBTZXJ2aWNlQmxvY2tzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZXN0b3JlID0gYW5ndWxhci5jb3B5KCRzY29wZS5ibG9ja3NEYXRhKTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmFkZFRvRmF2ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay90by1mYXYnLCB7YmxvY2s6IGl0ZW0gfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVGcm9tRmF2ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay9yZW1vdmUtZmF2Jywge2Jsb2NrOiBpdGVtIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlR3JvdXAgPSBmdW5jdGlvbihncm91cCkge1xuXHRcdFx0aWYgKGdyb3VwLnRvZ2dsZV9vcGVuID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRncm91cC50b2dnbGVfb3BlbiA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRncm91cC50b2dnbGVfb3BlbiA9ICFncm91cC50b2dnbGVfb3Blbjtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay90b2dnbGUtZ3JvdXAnLCB7Z3JvdXA6IGdyb3VwfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzUHJldmlld0VuYWJsZWQgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gaXRlbS5wcmV2aWV3X2VuYWJsZWQ7XG5cdFx0fTtcblxuXHRcdC8vIGNvbnRyb2xsZXIgbG9naWNcblxuXHRcdCRzY29wZS5jb3B5U3RhY2sgPSBTZXJ2aWNlQmxvY2tDb3B5U3RhY2suc3RhY2s7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkNvcHlTdGFjaycsIGZ1bmN0aW9uKGV2ZW50LCBzdGFjaykge1xuXHRcdFx0JHNjb3BlLmNvcHlTdGFjayA9IHN0YWNrO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmNsZWFyU3RhY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VCbG9ja0NvcHlTdGFjay5jbGVhcigpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2VhcmNoUXVlcnkgPSAnJztcblxuXHRcdCRzY29wZS5zZWFyY2hJc0RpcnR5ID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdzZWFyY2hRdWVyeScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuICE9PSAnJykge1xuXHRcdFx0XHQkc2NvcGUuc2VhcmNoSXNEaXJ0eSA9IHRydWU7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2tzRGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdGlmICh2YWx1ZS5ncm91cC5pc19mYXYpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhLnNwbGljZShrZXksIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YWx1ZS5ncm91cC50b2dnbGVfb3BlbiA9IDFcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYoJHNjb3BlLnNlYXJjaElzRGlydHkpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmJsb2Nrc0RhdGFSZXN0b3JlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fV0pO1xufSkoKTsiLCIvKipcbiAqIGFsbCBnbG9iYWwgYWRtaW4gc2VydmljZXNcbiAqIFxuICogY29udHJvbGxlciByZXNvbHZlOiBodHRwczovL2dpdGh1Yi5jb20vam9obnBhcGEvYW5ndWxhci1zdHlsZWd1aWRlI3N0eWxlLXkwODBcbiAqIFxuICogU2VydmljZSBJbmhlcml0YW5jZTpcbiAqIFxuICogMS4gU2VydmljZSBtdXN0IGJlIHByZWZpeCB3aXRoIFNlcnZpY2VcbiAqIDIuIFNlcnZpY2UgbXVzdCBjb250YWluIGEgZm9yY2VSZWxvYWQgc3RhdGVcbiAqIDMuIFNlcnZpY2UgbXVzdCBicm9hZGNhc3QgYW4gZXZlbnQgJ3NlcnZpY2U6Rm9sZGVyc0RhdGEnXG4gKiA0LiBDb250cm9sbGVyIGludGVncmF0aW9uIG11c3QgbG9vayBsaWtlXG4gKiBcbiAqIGBgYFxuICogJHNjb3BlLmZvbGRlcnNEYXRhID0gU2VydmljZUZvbGRlcnNEYXRhLmRhdGE7XG4gKlx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOkZvbGRlcnNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqICAgICAgJHNjb3BlLmZvbGRlcnNEYXRhID0gZGF0YTtcbiAqIH0pO1xuICpcdFx0XHRcdFxuICogJHNjb3BlLmZvbGRlcnNEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiAgICAgcmV0dXJuIFNlcnZpY2VGb2xkZXJzRGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogYGBgXG4gKiBcbiAqL1xuXHRcbnphYS5jb25maWcoWydyZXNvbHZlclByb3ZpZGVyJywgZnVuY3Rpb24ocmVzb2x2ZXJQcm92aWRlcikge1xuXHRyZXNvbHZlclByb3ZpZGVyLmFkZENhbGxiYWNrKFsnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VCbG9ja3NEYXRhJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCAnTHV5YUxvYWRpbmcnLCBmdW5jdGlvbihTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VCbG9ja3NEYXRhLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSwgTHV5YUxvYWRpbmcpIHtcblx0XHRMdXlhTG9hZGluZy5zdGFydCgpO1xuXHRcdFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQoKTtcblx0XHRTZXJ2aWNlTGF5b3V0c0RhdGEubG9hZCgpO1xuXHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKCkudGhlbihmdW5jdGlvbihyKSB7XG5cdFx0XHRTZXJ2aWNlQ3VycmVudFdlYnNpdGUubG9hZCgpO1xuXHRcdFx0THV5YUxvYWRpbmcuc3RvcCgpO1xuXHRcdH0pO1xuXHR9XSk7XG59XSk7XG5cblxuLyoqXG4gKiBDb3B5IEJsb2NrIFN0YWNrIHNlcnZpY2UuXG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUJsb2NrQ29weVN0YWNrXCIsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2Uuc3RhY2sgPSBbXTtcblx0XG5cdHNlcnZpY2UuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0XHRzZXJ2aWNlLnN0YWNrID0gW107XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkNvcHlTdGFjaycsIHNlcnZpY2Uuc3RhY2spO1xuXHR9O1xuXHRcblx0c2VydmljZS5wdXNoID0gZnVuY3Rpb24oYmxvY2spIHtcblx0XHRpZiAoc2VydmljZS5zdGFjay5sZW5ndGggPiA0KSB7XG5cdFx0XHRzZXJ2aWNlLnN0YWNrLnNoaWZ0KCk7XG5cdFx0fVxuXHRcdHNlcnZpY2Uuc3RhY2sucHVzaCh7YmxvY2tJZDogYmxvY2suYmxvY2tfaWQsIG5hbWU6IGJsb2NrLm5hbWUsIGljb246YmxvY2suaWNvbiwgaWQ6IGJsb2NrLmlkLCBjb3B5c3RhY2s6IDF9KTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q29weVN0YWNrJywgc2VydmljZS5zdGFjayk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBNZW51IFNlcnZpY2UuXG4gKiBcbiAqICRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuICogXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogXHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuICogfSk7XG4gKiBcbiAqICRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogXHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBcdFx0XHRcdFxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VNZW51RGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1tZW51L2RhdGEtbWVudVwiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TWVudURhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBCbG9ja3MgU2VydmljZS5cbiAqIFxuICogXG4gKiAkc2NvcGUuYmxvY2tzRGF0YSA9IFNlcnZpY2VCbG9ja3NEYXRhLmRhdGE7XG4gKiBcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqIFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBkYXRhO1xuICogfSk7XG4gKiBcbiAqICRzY29wZS5ibG9ja3NEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiBcdHJldHVybiBTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogXHRcdFx0XHRcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQmxvY2tzRGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXRhLWJsb2Nrc1wiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6QmxvY2tzRGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIExheW91dHMgU2VydmljZS5cblxuJHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cdFx0XHRcdFxuJHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbn0pO1xuXG4kc2NvcGUubGF5b3V0c0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFNlcnZpY2VMYXlvdXRzRGF0YS5sb2FkKHRydWUpO1xufVxuXHRcdFx0XHRcbiovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VMYXlvdXRzRGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXRhLWxheW91dHNcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkxheW91dHNEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQ01TIExJVkUgRURJVCBTRVJJVkNFXG4gKiBcbiAqICRzY29wZS5saXZlRWRpdE1vZGUgPSBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlXG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUxpdmVFZGl0TW9kZVwiLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG5cdFxuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5zdGF0ZSA9IDA7XG5cdFxuXHRzZXJ2aWNlLnVybCA9ICRyb290U2NvcGUubHV5YWNmZy5ob21lVXJsO1xuXHRcblx0c2VydmljZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcblx0XHRzZXJ2aWNlLnN0YXRlID0gIXNlcnZpY2Uuc3RhdGU7XG5cdH07XG5cdHNlcnZpY2Uuc2V0VXJsID0gZnVuY3Rpb24oaXRlbUlkLCB2ZXJzaW9uSWQpIHtcblx0XHR2YXIgZCA9IG5ldyBEYXRlKCk7XG5cdFx0dmFyIG4gPSBkLmdldFRpbWUoKTtcblx0XHRzZXJ2aWNlLnVybCA9ICRyb290U2NvcGUuY21zQ29uZmlnLnByZXZpZXdVcmwgKyAnP2l0ZW1JZD0nK2l0ZW1JZCsnJnZlcnNpb249JyArIHZlcnNpb25JZCArICcmZGF0ZT0nICsgbjtcblx0fTtcblx0XG5cdHNlcnZpY2UuY2hhbmdlVXJsID0gZnVuY3Rpb24oaXRlbUlkLCB2ZXJzaW9uSWQpIHtcblx0XHRpZiAodmVyc2lvbklkID09IHVuZGVmaW5lZCkge1xuXHRcdFx0dmVyc2lvbklkID0gMDtcblx0XHR9XG5cdFx0c2VydmljZS5zZXRVcmwoaXRlbUlkLCB2ZXJzaW9uSWQpO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpMaXZlRWRpdE1vZGVVcmxDaGFuZ2UnLCBzZXJ2aWNlLnVybCk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBDTVMgQ3VycmVudCBXZWJzaXRlIFNFUklWQ0VcbiAqXG4gKiAkc2NvcGUuY3VycmVudFdlYnNpdGVJZCA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5zdGF0ZVxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VDdXJyZW50V2Vic2l0ZVwiLCBbJyRyb290U2NvcGUnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgU2VydmljZU1lbnVEYXRhKSB7XG5cblx0dmFyIHNlcnZpY2UgPSB7XG5cdFx0Y3VycmVudFdlYnNpdGU6IG51bGwsXG5cdFx0ZGVmYXVsdFdlYnNpdGU6IG51bGxcblx0fTtcblxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdHNlcnZpY2UuZGVmYXVsdFdlYnNpdGUgPSBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcy5maW5kKHcgPT4gdy5pc19kZWZhdWx0KTtcblx0XHRzZXJ2aWNlLnRvZ2dsZShzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlLmlkKTtcblx0fVxuXG5cdHNlcnZpY2UudG9nZ2xlID0gZnVuY3Rpb24od2Vic2l0ZUlkKSB7XG5cdFx0aWYgKHdlYnNpdGVJZCAmJiAoIXNlcnZpY2UuY3VycmVudFdlYnNpdGUgfHwgc2VydmljZS5jdXJyZW50V2Vic2l0ZS5pZCAhPT0gd2Vic2l0ZUlkKSkge1xuXHRcdFx0c2VydmljZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzLmZpbmQodyA9PiB3LmlkID09PSB3ZWJzaXRlSWQpO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIHNlcnZpY2UuY3VycmVudFdlYnNpdGUpO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuemFhLmZhY3RvcnkoXCJTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uXCIsIFtmdW5jdGlvbigpIHtcblx0dmFyIHNlcnZpY2UgPSB7XG5cdFx0cGFnZSA6IHt9XG5cdH07XG5cblxuXG5cdHNlcnZpY2Uuc3RvcmUgPSBmdW5jdGlvbihwYWdlSWQsIHZlcnNpb25JZCkge1xuXHRcdHNlcnZpY2UucGFnZVtwYWdlSWRdID0gdmVyc2lvbklkO1xuXHR9O1xuXG5cblx0c2VydmljZS5oYXNWZXJzaW9uID0gZnVuY3Rpb24ocGFnZUlkKSB7XG5cdFx0aWYgKHNlcnZpY2UucGFnZS5oYXNPd25Qcm9wZXJ0eShwYWdlSWQpKSB7XG5cdFx0XHRyZXR1cm4gc2VydmljZS5wYWdlW3BhZ2VJZF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdHJldHVybiBzZXJ2aWNlO1xufV0pOyJdfQ==