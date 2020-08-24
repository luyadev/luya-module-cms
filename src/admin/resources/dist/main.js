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
            if (value['parent_nav_id'] > 0) {
              $scope.bubbleParents(value['parent_nav_id'], value['nav_container_id'], items);
            }
          });
          $scope.menuData.items = items;
        });

        $scope.bubbleParents = function (parentNavId, containerId, index) {
          var item = $filter('menuchildfilter')($scope.menuDataOriginal.items, containerId, parentNavId);

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
        return '<div>' + '<div class="input-group mb-2">' + '<div class="input-group-prepend" ng-hide="searchQuery"><div class="input-group-text"><i class="material-icons">search</i></div></div>' + '<div class="input-group-prepend" ng-show="searchQuery" ng-click="searchQuery = \'\'"><div class="input-group-text"><i class="material-icons">clear</i></div></div>' + '<input class="form-control" ng-model="searchQuery" type="text" placeholder="' + i18n['ngrest_crud_search_text'] + '">' + '</div>' + '<div ng-repeat="(key, container) in menuData.containers" ng-if="(menuData.items | menuparentfilter:container.id:0).length > 0" class="card mb-2" ng-class="{\'card-closed\': !container.isHidden}">' + '<div class="card-header" ng-click="container.isHidden=!container.isHidden">' + '<span class="material-icons card-toggle-indicator">keyboard_arrow_down</span>' + '<span>{{container.name}}</span>' + '</div>' + '<div class="card-body">' + '<div class="treeview treeview-chooser">' + '<ul class="treeview-items treeview-items-lvl1">' + '<li class="treeview-item treeview-item-lvl1" ng-class="{\'treeview-item-has-children\' : (menuData.items | menuparentfilter:container.id:0).length}" ng-repeat="(key, data) in menuData.items | menuparentfilter:container.id:0 track by data.id" ng-include="\'menuDropdownReverse\'"></li>' + '</ul>' + '</div>' + '</div>' + '</div>' + '</div>';
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
        return '<div class="form-group form-side-by-side" ng-class="{\'input--hide-label\': i18n}">' + '<div class="form-side form-side-label">' + '<label>{{label}}</label>' + '</div>' + '<div class="form-side">' + '<menu-dropdown class="menu-dropdown" nav-id="model"></menu-dropdown>' + '</div>' + '</div>';
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

        $scope.menuDataReload = function () {
          return ServiceMenuData.load(true);
        };

        function initializer() {
          $scope.menu = $scope.menuData.items;
          $scope.navcontainers = $scope.menuData.containers;
        }

        initializer();
        $scope.data.nav_item_type = 1;
        $scope.data.parent_nav_id = 0;
        $scope.data.is_draft = 0;
        $scope.data.nav_container_id = ServiceCurrentWebsite.currentWebsite.default_container_id;
        $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
          $scope.data.nav_container_id = ServiceCurrentWebsite.currentWebsite.id;
        });
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
            $scope.data.parent_nav_id = 0;
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
      ServiceCurrentWebsite.toggle(id);
    });
    $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
      if (data) {
        $scope.currentWebsite = data;
        $scope.currentWebsiteToggler = data.id;
        ServiceMenuData.load();
      }
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
      var item = $filter('menuchildfilter')($scope.menuData.items, containerId, parentNavId);

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

        $scope.loaded = true;
      }, function (error) {
        // its loaded, but the data does not exists.
        $scope.loaded = true;
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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsIm1lbnVEYXRhIiwiYW5ndWxhciIsImNvcHkiLCJtZW51RGF0YU9yaWdpbmFsIiwiJG9uIiwiZXZlbnQiLCJpbml0IiwibGVuZ3RoIiwibG9hZCIsImNvbnRhaW5lciIsImNvbnRhaW5lcnMiLCJpc0hpZGRlbiIsIiR3YXRjaCIsIm4iLCJpdGVtcyIsInRpdGxlIiwiZm9yRWFjaCIsInZhbHVlIiwiYnViYmxlUGFyZW50cyIsInBhcmVudE5hdklkIiwiY29udGFpbmVySWQiLCJpbmRleCIsIml0ZW0iLCJleGlzdHMiLCJpIiwicHVzaCIsInBhcmVudF9uYXZfaWQiLCJuYXZfY29udGFpbmVyX2lkIiwidG9nZ2xlciIsInRlbXBsYXRlIiwiaTE4biIsIiRodHRwIiwiJHN0YXRlIiwiZ2V0IiwicGFyYW1zIiwidGhlbiIsInJlc3BvbnNlIiwicGF0aCIsInRlbXBsYXRlVXJsIiwiU2VydmljZUxhbmd1YWdlc0RhdGEiLCJBZG1pblRvYXN0U2VydmljZSIsIlNlcnZpY2VDdXJyZW50V2Vic2l0ZSIsImVycm9yIiwic3VjY2VzcyIsIiRwYXJlbnQiLCJtZW51RGF0YVJlbG9hZCIsImluaXRpYWxpemVyIiwibWVudSIsIm5hdmNvbnRhaW5lcnMiLCJuYXZfaXRlbV90eXBlIiwiaXNfZHJhZnQiLCJjdXJyZW50V2Vic2l0ZSIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImxhbmdfaWQiLCJwYXJzZUludCIsIm5hdml0ZW1zIiwibyIsInVuZGVmaW5lZCIsImFsaWFzU3VnZ2VzdGlvbiIsImFsaWFzIiwiZXhlYyIsInNhdmUiLCJpc0lubGluZSIsImdldEl0ZW0iLCJuYXZfaWQiLCJyZWFzb24iLCJrZXkiLCJTZXJ2aWNlTGF5b3V0c0RhdGEiLCJwYXJlbnQiLCJuYXZJdGVtSWQiLCJsYXlvdXRfaWQiLCJsYXlvdXRzRGF0YSIsInZlcnNpb25zRGF0YSIsImdldFZlcnNpb25MaXN0IiwiaXNFZGl0QXZhaWxhYmxlIiwidXNlX2RyYWZ0IiwiZnJvbV9kcmFmdF9pZCIsImRyYWZ0cyIsImxheW91dHMiLCJtb2R1bGVzIiwiY29udHJvbGxlcnMiLCJhY3Rpb25zIiwiYWRkUGFyYW0iLCJoYXNPd25Qcm9wZXJ0eSIsImFjdGlvbl9wYXJhbXMiLCJtb2R1bGVfbmFtZSIsImNvbnRyb2xsZXJfbmFtZSIsImZpbHRlciIsImlucHV0Iiwid2Vic2l0ZUlkIiwicmVzdWx0Iiwid2Vic2l0ZV9pZCIsInJldHVyblZhbHVlIiwiZmFjdG9yeSIsInNlcnZpY2UiLCJzdGF0dXMiLCJkZWxlZ2F0ZSIsImNvbmZpZyIsIiRzdGF0ZVByb3ZpZGVyIiwic3RhdGUiLCJ1cmwiLCJnbyIsImRhc2hib2FyZCIsInBvc3QiLCJoZWFkZXJzIiwiY3JlYXRlTmV3VmVyc2lvblN1Ym1pdCIsImNvcHlFeGlzdGluZ1ZlcnNpb24iLCJ2ZXJzaW9uTGF5b3V0SWQiLCIkIiwicGFyYW0iLCJ2ZXJzaW9uTmFtZSIsImZyb21WZXJzaW9uUGFnZUlkIiwicmVmcmVzaEZvcmNlIiwiaXNPcGVuIiwiaXRlbVNlbGVjdGlvbiIsInNlbGVjdGlvbiIsIk5hdkl0ZW1Db250cm9sbGVyIiwic2VsZWN0IiwibG9hZEl0ZW1zIiwiTmF2Q29udHJvbGxlciIsIm5hdkRhdGEiLCJsYW5nIiwicmVmcmVzaCIsImVycm9yQXJyYXkiLCIkcm9vdFNjb3BlIiwiU2VydmljZUxpdmVFZGl0TW9kZSIsImxpdmVFZGl0U3RhdGUiLCJsb2FkQ21zQ29uZmlnIiwiY21zQ29uZmlnIiwidG9nZ2xlIiwiY3VycmVudFdlYnNpdGVUb2dnbGVyIiwiZHJvcEVtcHR5Q29udGFpbmVyIiwiZHJhZ2dlZCIsImRyb3BwZWQiLCJwb3NpdGlvbiIsImNhdElkIiwibW92ZUl0ZW1JZCIsImRyb3BwZWRPbkNhdElkIiwic3VjY2VzIiwiZHJvcEl0ZW0iLCJkcmFnIiwiZHJvcCIsInBvcyIsImFwaSIsImRyb3BwZWRBZnRlckl0ZW1JZCIsImRyb3BwZWRCZWZvcmVJdGVtSWQiLCJkcm9wcGVkT25JdGVtSWQiLCJ2YWxpZEl0ZW0iLCJob3ZlciIsImRyYWdlZCIsInJyaXRlbXMiLCJyZWN1cnNpdkl0ZW1WYWxpZGl0eSIsImluZGV4T2YiLCJ0b2dnbGVJdGVtIiwidG9nZ2xlX29wZW4iLCJpZ25vcmVMb2FkaW5nQmFyIiwiY2hhbmdlVXJsIiwibmF2X2l0ZW1faWQiLCJzaG93RHJhZyIsImlzQ3VycmVudEVsZW1lbnQiLCJoaWRkZW5DYXRzIiwidG9nZ2xlQ2F0IiwidG9nZ2xlSXNIaWRkZW4iLCIkcSIsInJlc29sdmUiLCJyZWplY3QiLCIkc3RhdGVQYXJhbXMiLCJQbGFjZWhvbGRlclNlcnZpY2UiLCJTZXJ2aWNlUHJvcGVydGllc0RhdGEiLCJBZG1pbkNsYXNzU2VydmljZSIsIkFkbWluTGFuZ1NlcnZpY2UiLCJIdG1sU3RvcmFnZSIsInBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4iLCJwYWdlU2V0dGluZ3NPdmVybGF5VGFiIiwidG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSIsInQiLCJuYXZDZmciLCJoZWxwdGFncyIsImx1eWFjZmciLCJkaXNwbGF5TGl2ZUNvbnRhaW5lciIsImxpdmVVcmwiLCJwcm9wZXJ0aWVzRGF0YSIsInBsYWNlaG9sZGVyU3RhdGUiLCJpc0Jsb2NraG9sZGVyU21hbGwiLCJnZXRWYWx1ZSIsInRvZ2dsZUJsb2NraG9sZGVyU2l6ZSIsInNldFZhbHVlIiwic2lkZWJhciIsImVuYWJsZVNpZGViYXIiLCJ0b2dnbGVTaWRlYmFyIiwic2hvd0FjdGlvbnMiLCJpc0RlbGV0ZWQiLCJwcm9wVmFsdWVzIiwiaGFzVmFsdWVzIiwicGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHkiLCJzYXZlUGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHlBc1RlbXBsYXRlIiwibG9hZE5hdlByb3BlcnRpZXMiLCJkIiwiYWRtaW5fcHJvcF9pZCIsInRvZ2dsZVByb3BNYXNrIiwic2hvd1Byb3BGb3JtIiwic3RvcmVQcm9wVmFsdWVzIiwidHJhc2giLCJjb25maXJtIiwiJHRvYXN0IiwiY2xvc2UiLCJpc0RyYWZ0Iiwic3VibWl0TmF2Rm9ybSIsImkxOG5QYXJhbSIsIm1lc3NhZ2UiLCJpc19vZmZsaW5lIiwib2ZmbGluZVN0YXR1cyIsImluZm8iLCJpc19oaWRkZW4iLCJoaWRkZW5TdGF0dXMiLCJpc19ob21lIiwiaG9tZVN0YXRlIiwiJHRpbWVvdXQiLCJTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uIiwibG9hZGVkIiwib3BlbkxpdmVVcmwiLCJ2ZXJzaW9uSWQiLCJsb2FkTGl2ZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbiIsImlzVHJhbnNsYXRlZCIsIml0ZW1Db3B5Iiwic2V0dGluZ3MiLCJ0eXBlRGF0YUNvcHkiLCJ0eXBlRGF0YSIsImVycm9ycyIsImhvbWVVcmwiLCJjdXJyZW50UGFnZVZlcnNpb25BbGlhcyIsInRyYXNoSXRlbSIsImlzX2RlZmF1bHQiLCJkZWxldGUiLCIkYnJvYWRjYXN0IiwicmVzZXQiLCJuYXZfaXRlbV90eXBlX2lkIiwidXBkYXRlTmF2SXRlbURhdGEiLCJ0aXRsZV90YWciLCJkZXNjcmlwdGlvbiIsImtleXdvcmRzIiwidGltZXN0YW1wX2NyZWF0ZSIsImltYWdlX2lkIiwiaXNfdXJsX3N0cmljdF9wYXJzaW5nX2Rpc2FibGVkIiwiaXNfY2FjaGVhYmxlIiwicGFnZVZlcnNpb25LZXkiLCJPYmplY3QiLCJrZXlzIiwidG9nZ2xlU2V0dGluZ3NPdmVybGF5IiwiZXJyb3JDYWxsYmFjayIsInJlbW92ZVZlcnNpb24iLCJ2ZXJzaW9uIiwidmVyc2lvbl9hbGlhcyIsInBhZ2VJZCIsImVkaXRWZXJzaW9uSXRlbSIsInRhYiIsImVkaXRWZXJzaW9uIiwidmVyc2lvbkl0ZW0iLCJjaGFuZ2VUYWIiLCJlZGl0VmVyc2lvblVwZGF0ZSIsImxhbmdJZCIsIm1ldGhvZCIsImxhc3RWZXJzaW9uIiwiaGFzVmVyc2lvbiIsInN3aXRjaFZlcnNpb24iLCJ2ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkiLCJ0b2dnbGVWZXJzaW9uc0Ryb3Bkb3duIiwicGFnZVZlcnNpb25pZCIsInN0b3JlIiwiaXNJblNlbGVjdGlvbiIsInNob3J0X2NvZGUiLCJzZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5IiwicmVmcmVzaE5lc3RlZCIsInByZXZJZCIsInBsYWNlaG9sZGVyVmFyIiwibmF2SXRlbVBhZ2VJZCIsIl9fcGxhY2Vob2xkZXJzIiwicGxhY2Vob2xkZXIiLCJyZXZQbGFjZWhvbGRlcnMiLCJwbGFjZWhvbGRlcnMiLCJyZXBsYWNlQ29udGVudCIsInBsYWNlaG9sZGVyUm93IiwicGxhY2Vob2xkZXJLZXkiLCJwcmV2X2lkIiwicmV2RmluZCIsImhvbGRlcktleSIsImhvbGRlciIsImRyb3BJdGVtUGxhY2Vob2xkZXIiLCJzb3J0X2luZGV4IiwiYmxvY2tfaWQiLCJwbGFjZWhvbGRlcl92YXIiLCJuYXZfaXRlbV9wYWdlX2lkIiwiY29weUJsb2NrSWQiLCJwdXQiLCIkc2NlIiwiU2VydmljZUJsb2NrQ29weVN0YWNrIiwiTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlciIsInZhciIsImVsZW1lbnQiLCJzb3J0SW5kZXgiLCIkaW5kZXgiLCJyZW1vdmUiLCJjb3B5QmxvY2siLCJibG9jayIsInRvZ2dsZUhpZGRlbiIsImJsb2NrSWQiLCJoaWRkZW5TdGF0ZSIsIm5hbWUiLCJpc0VkaXRhYmxlIiwidmFycyIsImlzQ29uZmlndXJhYmxlIiwiY2ZncyIsInZhbHVlcyIsInZhcmlhdGlvbiIsImV2YWxWYXJpYXRpb25WaXNiaWxpdHkiLCJnZXRJbmZvIiwidmFyRmllbGROYW1lIiwiZmllbGRfaGVscCIsInZhcmlhdGVuTmFtZSIsInZhcmlhdGlvbnMiLCJpc09iamVjdCIsInYiLCJrIiwib2JqZWN0IiwiaW52aXNpYmxlIiwiY2ZnZGF0YSIsImNmZ3ZhbHVlcyIsImVkaXQiLCJtb2RhbEhpZGRlbiIsIm1vZGFsTW9kZSIsImluaXRNb2RhbE1vZGUiLCJ0b2dnbGVFZGl0IiwicmVuZGVyVGVtcGxhdGUiLCJkYXRhVmFycyIsImNmZ1ZhcnMiLCJleHRyYXMiLCJUd2lnIiwidHdpZyIsImNvbnRlbnQiLCJyZW5kZXIiLCJ0cnVzdEFzSHRtbCIsInJlbW92ZUJsb2NrIiwianNvbl9jb25maWdfdmFsdWVzIiwianNvbl9jb25maWdfY2ZnX3ZhbHVlcyIsImlzX2RpcnR5Iiwib2JqZWN0ZGV0YWlsIiwiU2VydmljZUJsb2Nrc0RhdGEiLCJibG9ja3NEYXRhIiwiYmxvY2tzRGF0YVJlc3RvcmUiLCJibG9ja3NEYXRhUmVsb2FkIiwiYWRkVG9GYXYiLCJyZW1vdmVGcm9tRmF2IiwidG9nZ2xlR3JvdXAiLCJncm91cCIsImlzUHJldmlld0VuYWJsZWQiLCJwcmV2aWV3X2VuYWJsZWQiLCJjb3B5U3RhY2siLCJzdGFjayIsImNsZWFyU3RhY2siLCJjbGVhciIsInNlYXJjaFF1ZXJ5Iiwic2VhcmNoSXNEaXJ0eSIsImlzX2ZhdiIsInNwbGljZSIsInJlc29sdmVyUHJvdmlkZXIiLCJhZGRDYWxsYmFjayIsIkx1eWFMb2FkaW5nIiwic3RhcnQiLCJyIiwic3RvcCIsInNoaWZ0IiwiaWNvbiIsImNvcHlzdGFjayIsImZvcmNlUmVsb2FkIiwic2V0VXJsIiwiaXRlbUlkIiwiRGF0ZSIsImdldFRpbWUiLCJwcmV2aWV3VXJsIiwiZGVmYXVsdFdlYnNpdGUiLCJ3ZWJzaXRlcyIsImZpbmQiLCJ3IiwicGFnZSJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxDQUFDLFlBQVc7QUFDWCxlQURXLENBR1g7O0FBRUdBLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLGNBQWQsRUFBOEIsQ0FBQyxpQkFBRCxFQUFvQixTQUFwQixFQUErQixVQUFTQyxlQUFULEVBQTBCQyxPQUExQixFQUFtQztBQUM1RixXQUFPO0FBQ0hDLE1BQUFBLFFBQVEsRUFB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LE9BQU8sQ0FBQ29TLElBQVIsQ0FBYS9TLGNBQWIsQ0FBNEI2SyxNQUE1QixDQUFKLEVBQXlDO0FBQ3hDLGFBQU9sSyxPQUFPLENBQUNvUyxJQUFSLENBQWFsSSxNQUFiLENBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQU5EOztBQVFBLFNBQU9sSyxPQUFQO0FBQ0EsQ0FyQndDLENBQXpDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXHRcblx0Ly8gZGlyZWN0aXZlLmpzXG5cbiAgICB6YWEuZGlyZWN0aXZlKFwibWVudURyb3Bkb3duXCIsIFsnU2VydmljZU1lbnVEYXRhJywgJyRmaWx0ZXInLCBmdW5jdGlvbihTZXJ2aWNlTWVudURhdGEsICRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgICAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgICAgICAgbmF2SWQgOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5hdklkID0gZGF0YS5pZDtcbiAgICAgICAgICAgICAgICB9XG5cblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gYW5ndWxhci5jb3B5KFNlcnZpY2VNZW51RGF0YS5kYXRhKTtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwgPSBhbmd1bGFyLmNvcHkoU2VydmljZU1lbnVEYXRhLmRhdGEpO1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YU9yaWdpbmFsID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5tZW51RGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZU1lbnVEYXRhLmxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGNvbnRhaW5lciBpbiAkc2NvcGUubWVudURhdGEuY29udGFpbmVycykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVudURhdGEuY29udGFpbmVyc1tjb250YWluZXJdLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goJ3NlYXJjaFF1ZXJ5JywgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuID09IG51bGwgfHwgbiA9PSAnJykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhLml0ZW1zID0gYW5ndWxhci5jb3B5KCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIGl0ZW1zID0gJGZpbHRlcignZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMsIHt0aXRsZTogbn0pO1xuXG5cdFx0XHRcdFx0Ly8gZmluZCBhbGwgcGFyZW50IGVsZW1lbnRzIG9mIHRoZSBmb3VuZCBlbGVtZW50cyBhbmQgcmUgYWRkIHRoZW0gdG8gdGhlIG1hcCBpbiBvcmRlciB0byBcblx0XHRcdFx0XHQvLyBlbnN1cmUgYSBjb3JyZWN0IG1lbnUgdHJlZS5cblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRpZiAodmFsdWVbJ3BhcmVudF9uYXZfaWQnXSA+IDApIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHModmFsdWVbJ3BhcmVudF9uYXZfaWQnXSwgdmFsdWVbJ25hdl9jb250YWluZXJfaWQnXSwgaXRlbXMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhLml0ZW1zID0gaXRlbXM7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzID0gZnVuY3Rpb24ocGFyZW50TmF2SWQsIGNvbnRhaW5lcklkLCBpbmRleCkge1xuXHRcdFx0XHRcdHZhciBpdGVtID0gJGZpbHRlcignbWVudWNoaWxkZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdFx0XHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0XHRcdHZhciBleGlzdHMgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbmRleCwgZnVuY3Rpb24oaSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoaS5pZCA9PSBpdGVtLmlkKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZXhpc3RzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdGlmICghZXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRcdGluZGV4LnB1c2goaXRlbSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyhpdGVtLnBhcmVudF9uYXZfaWQsIGl0ZW0ubmF2X2NvbnRhaW5lcl9pZCwgaW5kZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVyID0gdHJ1ZTtcblxuXHRcdFx0XHRpbml0KCk7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHRlbXBsYXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAnPGRpdj4nK1xuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgbWItMlwiPicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXByZXBlbmRcIiBuZy1oaWRlPVwic2VhcmNoUXVlcnlcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5zZWFyY2g8L2k+PC9kaXY+PC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtcHJlcGVuZFwiIG5nLXNob3c9XCJzZWFyY2hRdWVyeVwiIG5nLWNsaWNrPVwic2VhcmNoUXVlcnkgPSBcXCdcXCdcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5jbGVhcjwvaT48L2Rpdj48L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbFwiIG5nLW1vZGVsPVwic2VhcmNoUXVlcnlcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJytpMThuWyduZ3Jlc3RfY3J1ZF9zZWFyY2hfdGV4dCddKydcIj4nK1xuXHRcdFx0XHRcdCc8L2Rpdj4nICsgXG5cdFx0XHRcdFx0JzxkaXYgbmctcmVwZWF0PVwiKGtleSwgY29udGFpbmVyKSBpbiBtZW51RGF0YS5jb250YWluZXJzXCIgbmctaWY9XCIobWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDowKS5sZW5ndGggPiAwXCIgY2xhc3M9XCJjYXJkIG1iLTJcIiBuZy1jbGFzcz1cIntcXCdjYXJkLWNsb3NlZFxcJzogIWNvbnRhaW5lci5pc0hpZGRlbn1cIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlclwiIG5nLWNsaWNrPVwiY29udGFpbmVyLmlzSGlkZGVuPSFjb250YWluZXIuaXNIaWRkZW5cIj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBjYXJkLXRvZ2dsZS1pbmRpY2F0b3JcIj5rZXlib2FyZF9hcnJvd19kb3duPC9zcGFuPicrXG5cdFx0XHRcdFx0XHRcdCc8c3Bhbj57e2NvbnRhaW5lci5uYW1lfX08L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj4nKyBcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ0cmVldmlldyB0cmVldmlldy1jaG9vc2VyXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0Jzx1bCBjbGFzcz1cInRyZWV2aWV3LWl0ZW1zIHRyZWV2aWV3LWl0ZW1zLWx2bDFcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJ0cmVldmlldy1pdGVtIHRyZWV2aWV3LWl0ZW0tbHZsMVwiIG5nLWNsYXNzPVwie1xcJ3RyZWV2aWV3LWl0ZW0taGFzLWNoaWxkcmVuXFwnIDogKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCkubGVuZ3RofVwiIG5nLXJlcGVhdD1cIihrZXksIGRhdGEpIGluIG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCB0cmFjayBieSBkYXRhLmlkXCIgbmctaW5jbHVkZT1cIlxcJ21lbnVEcm9wZG93blJldmVyc2VcXCdcIj48L2xpPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3VsPicgK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0JzwvZGl2PicrXG5cdFx0XHRcdCc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJ6YWFDbXNQYWdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwiPVwiLFxuICAgICAgICAgICAgICAgIFwib3B0aW9uc1wiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQGxhYmVsXCIsXG4gICAgICAgICAgICAgICAgXCJpMThuXCI6IFwiQGkxOG5cIixcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiQGZpZWxkaWRcIixcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJAZmllbGRuYW1lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcdHJldHVybiAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIGZvcm0tc2lkZS1ieS1zaWRlXCIgbmctY2xhc3M9XCJ7XFwnaW5wdXQtLWhpZGUtbGFiZWxcXCc6IGkxOG59XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGUgZm9ybS1zaWRlLWxhYmVsXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWw+e3tsYWJlbH19PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxtZW51LWRyb3Bkb3duIGNsYXNzPVwibWVudS1kcm9wZG93blwiIG5hdi1pZD1cIm1vZGVsXCI+PC9tZW51LWRyb3Bkb3duPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblx0emFhLmRpcmVjdGl2ZShcInNob3dJbnRlcm5hbFJlZGlyZWN0aW9uXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRuYXZJZCA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkc3RhdGUpIHtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCduYXZJZCcsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1pdGVtLXBhdGgnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnBhdGggPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9nZXQtbmF2LWNvbnRhaW5lci1uYW1lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dLFxuXHRcdFx0dGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8YSBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbVwiIHVpLXNyZWY9XCJjdXN0b20uY21zZWRpdCh7IG5hdklkIDogbmF2SWQsIHRlbXBsYXRlSWQ6IFxcJ2Ntc2FkbWluL2RlZmF1bHQvaW5kZXhcXCd9KVwiPnt7cGF0aH19PC9hPiBpbiB7e2NvbnRhaW5lcn19Jztcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1cIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gZmFsc2U7XG5cblx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudSA9ICRzY29wZS5tZW51RGF0YS5pdGVtcztcblx0XHRcdFx0XHQkc2NvcGUubmF2Y29udGFpbmVycyA9ICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdGlhbGl6ZXIoKTtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPSAxO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuaXNfZHJhZnQgPSAwO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlLmlkO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IFNlcnZpY2VMYW5ndWFnZXNEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9IHBhcnNlSW50KCRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5sYW5ndWFnZXNEYXRhLCB7J2lzX2RlZmF1bHQnOiAnMSd9LCB0cnVlKVswXS5pZCk7XG5cblx0XHRcdFx0JHNjb3BlLm5hdml0ZW1zID0gW107XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSB1bmRlZmluZWQgJiYgbiAhPT0gbykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEucGFyZW50X25hdl9pZCA9IDA7XG5cdFx0XHRcdFx0XHQkc2NvcGUubmF2aXRlbXMgPSAkc2NvcGUubWVudVtuXVsnX19pdGVtcyddO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKCRzY29wZS5kYXRhLnRpdGxlKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdkYXRhLmFsaWFzJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuIT1vICYmIG4hPW51bGwpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKG4pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmV4ZWMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIuc2F2ZSgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnN1Y2Nlc3MgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS50aXRsZSA9IG51bGw7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9IG51bGw7XG5cdFx0XHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEuaXNJbmxpbmUpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLiRwYXJlbnQuJHBhcmVudC5nZXRJdGVtKCRzY29wZS5kYXRhLmxhbmdfaWQsICRzY29wZS5kYXRhLm5hdl9pZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ3ZpZXdfaW5kZXhfcGFnZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlYXNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZVswXSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdCRzY29wZS5lcnJvciA9IHJlYXNvbjtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyoqIFBBR0UgQ1JFQVRFICYgVVBEQVRFICovXG4gICAgemFhLmRpcmVjdGl2ZShcInVwZGF0ZUZvcm1QYWdlXCIsIFsnU2VydmljZUxheW91dHNEYXRhJywgZnVuY3Rpb24oU2VydmljZUxheW91dHNEYXRhKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdCA6ICdFQScsXG4gICAgICAgICAgICBzY29wZSA6IHtcbiAgICAgICAgICAgICAgICBkYXRhIDogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmwgOiAndXBkYXRlZm9ybXBhZ2UuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLnBhcmVudCA9ICRzY29wZS4kcGFyZW50LiRwYXJlbnQ7XG5cdFx0XHRcdCRzY29wZS5uYXZJdGVtSWQgPSAkc2NvcGUucGFyZW50Lml0ZW0uaWQ7XG5cblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYXlvdXRfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXG5cdFx0XHRcdCRzY29wZS52ZXJzaW9uc0RhdGEgPSBbXTtcblxuXHRcdFx0XHQkc2NvcGUuZ2V0VmVyc2lvbkxpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2UvdmVyc2lvbnMnLCB7IHBhcmFtcyA6IHsgbmF2SXRlbUlkIDogJHNjb3BlLm5hdkl0ZW1JZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnZlcnNpb25zRGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLmlzRWRpdEF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUudmVyc2lvbnNEYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIFx0fTtcblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0XHRcdCRzY29wZS5nZXRWZXJzaW9uTGlzdCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuXHR9XSk7XG5cdHphYS5kaXJlY3RpdmUoXCJjcmVhdGVGb3JtUGFnZVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjcmVhdGVmb3JtcGFnZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHNjb3BlLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLnVzZV9kcmFmdCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmxheW91dF9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmZyb21fZHJhZnRfaWQgPSAwO1xuXG5cdFx0XHRcdC8qIGxheW91dHNEYXRhICovXG5cblx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgICAgICAgICAgXHR9KTtcblxuICAgICAgICAgICAgXHQvKiBtZW51RGF0YSAqL1xuXG4gICAgXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cbiAgICAgICAgICAgIFx0ZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUuZHJhZnRzID0gJHNjb3BlLm1lbnVEYXRhLmRyYWZ0cztcbiAgICAgICAgICAgIFx0XHQkc2NvcGUubGF5b3V0cyA9ICRzY29wZS5sYXlvdXRzRGF0YTtcbiAgICAgICAgICAgIFx0fVxuXG4gICAgICAgICAgICBcdGluaXQoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LmV4ZWMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qIFBhZ2UgTU9EVUxFICovXG5cblx0emFhLmRpcmVjdGl2ZShcImZvcm1Nb2R1bGVcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnZm9ybW1vZHVsZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuXHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLnBhcmFtcyA9IHt9O1xuXG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWFkbWluLWNvbW1vbi9kYXRhLW1vZHVsZXMnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1vZHVsZXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWRkUGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0XHRpZiAoISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCdhY3Rpb25fcGFyYW1zJykpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFjdGlvbl9wYXJhbXMgPSB7fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtc1trZXldID0gJyc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEubW9kdWxlX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL21vZHVsZS1jb250cm9sbGVycz9tb2R1bGU9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXJzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEuY29udHJvbGxlcl9uYW1lO1xuXHRcdFx0XHR9LCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb250cm9sbGVyLWFjdGlvbnM/bW9kdWxlPScrJHNjb3BlLmRhdGEubW9kdWxlX25hbWUrJyZjb250cm9sbGVyPScgKyBuKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogZmlsdGVycyAqL1xuXG5cdHphYS5maWx0ZXIoXCJtZW51d2Vic2l0ZWZpbHRlclwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHdlYnNpdGVJZCkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICh2YWx1ZS53ZWJzaXRlX2lkID09IHdlYnNpdGVJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoXCJtZW51cGFyZW50ZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnBhcmVudF9uYXZfaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAoIXJldHVyblZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmlkID09IHBhcmVudE5hdklkICYmIHZhbHVlLm5hdl9jb250YWluZXJfaWQgPT0gY29udGFpbmVySWQpIHtcblx0XHRcdFx0XHRcdHJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHRcdH07XG5cdH0pO1xuXG5cdC8qIGZhY3RvcnkuanMgKi9cblxuXHR6YWEuZmFjdG9yeSgnUGxhY2Vob2xkZXJTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSBbXTtcblxuXHRcdHNlcnZpY2Uuc3RhdHVzID0gMTsgLyogMSA9IHNob3dwbGFjZWhvbGRlcnM7IDAgPSBoaWRlIHBsYWNlaG9sZGVycyAqL1xuXG5cdFx0c2VydmljZS5kZWxlZ2F0ZSA9IGZ1bmN0aW9uKHN0YXR1cykge1xuXHRcdFx0c2VydmljZS5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0fTtcblxuXHRcdHJldHVybiBzZXJ2aWNlO1xuXHR9KTtcblxuXHQvKiBsYXlvdXQuanMgKi9cblxuXHR6YWEuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInLCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHRcdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2VkaXRcIiwge1xuXHRcdFx0dXJsIDogXCIvdXBkYXRlLzpuYXZJZFwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS91cGRhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zYWRkXCIsIHtcblx0XHRcdHVybCA6IFwiL2NyZWF0ZVwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS9jcmVhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZHJhZnRcIiwge1xuXHRcdFx0dXJsOiAnL2RyYWZ0cycsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2Ntc2FkbWluL3BhZ2UvZHJhZnRzJ1xuXHRcdH0pO1xuXHR9XSk7XG5cblx0LyogY29udHJvbGxlcnMgKi9cblxuXHR6YWEuY29udHJvbGxlcihcIkRyYWZ0c0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHN0YXRlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24obmF2SWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogbmF2SWQgfSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zRGFzaGJvYXJkXCIsIFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXHRcdCRzY29wZS5kYXNoYm9hcmQgPSBbXTtcblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vZGFzaGJvYXJkLWxvZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCRzY29wZS5kYXNoYm9hcmQgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXHR9XSk7XG5cdFxuXHR6YWEuY29udHJvbGxlcihcIkNvbmZpZ0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdCRzY29wZS5kYXRhID0ge307XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJywgJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VWZXJzaW9uc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VydmljZUxheW91dHNEYXRhLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdC8qKlxuXHRcdCAqIEB2YXIgb2JqZWN0ICR0eXBlRGF0YSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBvYmplY3QgJGl0ZW0gRnJvbSBwYXJlbnQgc2NvcGUgY29udHJvbGxlciBOYXZJdGVtQ29udHJvbGxlclxuXHRcdCAqIEB2YXIgc3RyaW5nICR2ZXJzaW9uTmFtZSBGcm9tIG5nLW1vZGVsXG5cdFx0ICogQHZhciBpbnRlZ2VyICRmcm9tVmVyc2lvblBhZ2VJZCBGcm9tIG5nLW1vZGVsIHRoZSB2ZXJzaW9uIGNvcHkgZnJvbSBvciAwID0gbmV3IGVtcHR5L2JsYW5rIHZlcnNpb25cblx0XHQgKiBAdmFyIGludGVnZXIgJHZlcnNpb25MYXlvdXRJZCBGcm9tIG5nLW1vZGVsLCBvbmx5IGlmIGZyb21WZXJzaW9uUGFnZUlkIGlzIDBcbiBcdFx0ICovXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXG4gICAgXHQvKiBjb250cm9sbGVyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuY3JlYXRlTmV3VmVyc2lvblN1Ym1pdCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc192ZXJzaW9uX2Vycm9yX2VtcHR5X2ZpZWxkcyddKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5jb3B5RXhpc3RpbmdWZXJzaW9uKSB7XG5cdFx0XHRcdGRhdGEudmVyc2lvbkxheW91dElkID0gMDtcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jcmVhdGUtcGFnZS12ZXJzaW9uJywgJC5wYXJhbSh7J2xheW91dElkJzogZGF0YS52ZXJzaW9uTGF5b3V0SWQsICduYXZJdGVtSWQnOiAkc2NvcGUuaXRlbS5pZCwgJ25hbWUnOiBkYXRhLnZlcnNpb25OYW1lLCAnZnJvbVBhZ2VJZCc6IGRhdGEuZnJvbVZlcnNpb25QYWdlSWR9KSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl9jcmVhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNvcHlQYWdlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblxuXHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdCRzY29wZS4kb24oJ2RlbGV0ZWROYXZJdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5uYXZJZCA9IDA7XG5cblx0XHQkc2NvcGUuaXRlbXMgPSBudWxsO1xuXG5cdFx0JHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3Rpb24gPSAwO1xuXG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRzY29wZS5zZWxlY3Rpb24gPSBpdGVtLmlkO1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBhbmd1bGFyLmNvcHkoaXRlbSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1TZWxlY3Rpb24udGl0bGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobikge1xuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbi5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuaXRlbVNlbGVjdGlvbi50aXRsZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkSXRlbXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5uYXZJZCA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5OYXZDb250cm9sbGVyLm5hdkRhdGEuaWQ7XG5cblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZmluZC1uYXYtaXRlbXMnLCB7IHBhcmFtczogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHQkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb25bJ3RvTGFuZ0lkJ10gPSAkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIubGFuZy5pZDtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1mcm9tLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5pdGVtU2VsZWN0aW9uKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfYWRkZWRfdHJhbnNsYXRpb25fb2snXSk7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLnJlZnJlc2goKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9lcnJvciddKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNNZW51VHJlZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckc3RhdGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRzdGF0ZSwgJGh0dHAsICRmaWx0ZXIsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHQvLyBsaXZlIGVkaXQgc2VydmljZVxuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSAwO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnbGl2ZUVkaXRTdGF0ZVRvZ2dsZXInLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkcm9vdFNjb3BlLmNtc0NvbmZpZyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnKCk7XG5cdFx0XG5cdFx0Ly8gbWVudSBEYXRhXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY3VycmVudFdlYnNpdGVUb2dnbGVyJywgZnVuY3Rpb24oaWQpIHtcblx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS50b2dnbGUoaWQpO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEpIHtcblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gZGF0YTtcblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9IGRhdGEuaWQ7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BFbXB0eUNvbnRhaW5lciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixjYXRJZCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS10by1jb250YWluZXInLCB7IHBhcmFtczoge21vdmVJdGVtSWQ6IGRyYWdnZWQuaWQsIGRyb3BwZWRPbkNhdElkOiBjYXRJZH19KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZyxkcm9wLHBvcykge1xuXHRcdFx0aWYgKHBvcyA9PSAnYm90dG9tJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWFmdGVyJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkQWZ0ZXJJdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fSBlbHNlIGlmIChwb3MgPT0gJ3RvcCcpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS1iZWZvcmUnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRCZWZvcmVJdGVtSWQ6IGRyb3AuaWR9O1xuXG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAnbWlkZGxlJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNoaWxkJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkT25JdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkaHR0cC5nZXQoYXBpLCB7IHBhcmFtcyA6IHBhcmFtcyB9KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCd0aHJvdyBlcnJvciBtZXNzYWdlIGVycm9yTWVzc2FnZU9uRHVwbGljYXRlQWxpYXMnKTtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS52YWxpZEl0ZW0gPSBmdW5jdGlvbihob3ZlciwgZHJhZ2VkKSB7XG5cdFx0XHRcblx0XHRcdGlmIChob3Zlci5pZCA9PSBkcmFnZWQuaWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkc2NvcGUucnJpdGVtcyA9IFtdO1xuXHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGRyYWdlZC5uYXZfY29udGFpbmVyX2lkLCBkcmFnZWQuaWQpO1xuXHRcdFx0XG5cdFx0XHRpZiAoJHNjb3BlLnJyaXRlbXMuaW5kZXhPZihob3Zlci5pZCkgPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5ycml0ZW1zID0gW107XG5cdFx0XG5cdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5ID0gZnVuY3Rpb24oY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSAkZmlsdGVyKCdtZW51cGFyZW50ZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHRcdFx0XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0JHNjb3BlLnJyaXRlbXMucHVzaChpdGVtLmlkKTtcblx0XHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGNvbnRhaW5lcklkLCBpdGVtLmlkKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXRlbSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhLnRvZ2dsZV9vcGVuID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRkYXRhWyd0b2dnbGVfb3BlbiddID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGFbJ3RvZ2dsZV9vcGVuJ10gPSAhZGF0YS50b2dnbGVfb3Blbjtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdHJlZS1oaXN0b3J5Jywge2RhdGE6IGRhdGF9LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXG5cdFx0fTtcblxuXHRcdCRzY29wZS5nbyA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKGRhdGEubmF2X2l0ZW1faWQsIDApO1xuXHRcdFx0JHN0YXRlLmdvKCdjdXN0b20uY21zZWRpdCcsIHsgbmF2SWQgOiBkYXRhLmlkIH0pO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLnNob3dEcmFnID0gMDtcblxuXHQgICAgJHNjb3BlLmlzQ3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdCAgICBcdGlmIChkYXRhICE9PSBudWxsICYmICRzdGF0ZS5wYXJhbXMubmF2SWQgPT0gZGF0YS5pZCkge1xuXHQgICAgXHRcdHJldHVybiB0cnVlO1xuXHQgICAgXHR9XG5cblx0ICAgIFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLmhpZGRlbkNhdHMgPSBbXTtcblxuXHQgICAgJHNjb3BlLiR3YXRjaCgnbWVudURhdGEnLCBmdW5jdGlvbiAobiwgbykge1xuXHQgICAgXHQkc2NvcGUuaGlkZGVuQ2F0cyA9IG4uaGlkZGVuQ2F0cztcblx0ICAgIH0pO1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUNhdCA9IGZ1bmN0aW9uKGNhdElkKSB7XG5cdFx0XHRpZiAoY2F0SWQgaW4gJHNjb3BlLmhpZGRlbkNhdHMpIHtcblx0XHRcdFx0JHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID0gISRzY29wZS5oaWRkZW5DYXRzW2NhdElkXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtY2F0LXRvZ2dsZScsIHtjYXRJZDogY2F0SWQsIHN0YXRlOiAkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF19LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXNIaWRkZW4gPSBmdW5jdGlvbihjYXRJZCkge1xuXG5cdFx0XHRpZiAoJHNjb3BlLmhpZGRlbkNhdHMgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNhdElkIGluICRzY29wZS5oaWRkZW5DYXRzKSB7XG5cdFx0XHRcdGlmICgkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPT0gMSkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHt9O1xuXHRcdCRzY29wZS5kYXRhLmlzSW5saW5lID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMikge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1tb2R1bGUnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMykge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1yZWRpcmVjdCcsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlSW5saW5lQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdG5hdl9pZCA6ICRzY29wZS4kcGFyZW50Lk5hdkNvbnRyb2xsZXIuaWRcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRhdGEuaXNJbmxpbmUgPSB0cnVlO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9ICRzY29wZS5sYW5nLmlkO1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAyKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLW1vZHVsZS1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDMpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcmVkaXJlY3QtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIk5hdkNvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHJvb3RTY29wZScsICckZmlsdGVyJywgJyRzdGF0ZScsICckc3RhdGVQYXJhbXMnLCAnJGh0dHAnLCAnUGxhY2Vob2xkZXJTZXJ2aWNlJywgJ1NlcnZpY2VQcm9wZXJ0aWVzRGF0YScsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxhbmd1YWdlc0RhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdBZG1pblRvYXN0U2VydmljZScsICdBZG1pbkNsYXNzU2VydmljZScsICdBZG1pbkxhbmdTZXJ2aWNlJywgJ0h0bWxTdG9yYWdlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRmaWx0ZXIsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCwgUGxhY2Vob2xkZXJTZXJ2aWNlLCBTZXJ2aWNlUHJvcGVydGllc0RhdGEsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxhbmd1YWdlc0RhdGEsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIEFkbWluVG9hc3RTZXJ2aWNlLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5MYW5nU2VydmljZSwgSHRtbFN0b3JhZ2UpIHtcblxuXG5cdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4gPSB0cnVlO1xuXHRcdFxuXHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gMTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHQpIHtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gdDtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuID0gISRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLm5hdkNmZyA9IHtcblx0XHRcdGhlbHB0YWdzOiAkcm9vdFNjb3BlLmx1eWFjZmcuaGVscHRhZ3MsXG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUxpdmVDb250YWluZXIgPSBuO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnVybCB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZVVybCA9IG47XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLkFkbWluTGFuZ1NlcnZpY2UgPSBBZG1pbkxhbmdTZXJ2aWNlO1xuXG5cdFx0Lyogc2VydmljZSBBZG1pblByb3BlcnR5U2VydmljZSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLnByb3BlcnRpZXNEYXRhID0gU2VydmljZVByb3BlcnRpZXNEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOlByb3BlcnRpZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5wcm9wZXJ0aWVzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlTGFuZ2F1Z2VzRGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdC8qIHBsYWNlaG9sZGVycyB0b2dnbGVyIHNlcnZpY2UgKi9cblxuXHRcdCRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2UgPSBQbGFjZWhvbGRlclNlcnZpY2U7XG5cblx0XHQkc2NvcGUucGxhY2Vob2xkZXJTdGF0ZSA9ICRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2Uuc3RhdHVzO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgncGxhY2Vob2xkZXJTdGF0ZScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlLmRlbGVnYXRlKG4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0LyogQmxvY2tob2xkZXIgc2l6ZSB0b2dnbGVyICovXG5cbiAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9IEh0bWxTdG9yYWdlLmdldFZhbHVlKCdibG9ja2hvbGRlclRvZ2dsZVN0YXRlJywgdHJ1ZSk7XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUJsb2NraG9sZGVyU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9ICEkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsO1xuICAgICAgICAgICAgSHRtbFN0b3JhZ2Uuc2V0VmFsdWUoJ2Jsb2NraG9sZGVyVG9nZ2xlU3RhdGUnLCAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBzaWRlYmFyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuc2lkZWJhciA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuZW5hYmxlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgXHQkc2NvcGUuc2lkZWJhciA9IHRydWU7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUudG9nZ2xlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICRzY29wZS5zaWRlYmFyID0gISRzY29wZS5zaWRlYmFyO1xuXHQgICAgfTtcblxuXHRcdC8qIGFwcCBsb2dpYyAqL1xuXG5cdCAgICAkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXG5cdFx0JHNjb3BlLmlkID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLm5hdklkKTtcblxuXHRcdCRzY29wZS5pc0RlbGV0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5BZG1pbkNsYXNzU2VydmljZSA9IEFkbWluQ2xhc3NTZXJ2aWNlO1xuXG5cdFx0JHNjb3BlLnByb3BWYWx1ZXMgPSB7fTtcblxuXHRcdCRzY29wZS5oYXNWYWx1ZXMgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5wYWdlVGFncyA9IFtdO1xuXG5cdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQpIHtcblx0ICAgIFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdCAgICBcdGlmIChpdGVtKSB7XG5cdCAgICBcdFx0aXRlbS50b2dnbGVfb3BlbiA9IDE7XG5cdCAgICBcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMoaXRlbS5wYXJlbnRfbmF2X2lkLCBpdGVtLm5hdl9jb250YWluZXJfaWQpO1xuXHQgICAgXHR9XG5cdCAgICB9O1xuXG5cdFx0JHNjb3BlLmNyZWF0ZURlZXBQYWdlQ29weSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVlcC1wYWdlLWNvcHknLCB7bmF2SWQ6ICRzY29wZS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9jcmVhdGVfY29weV9zdWNjZXNzJ10pO1xuXHRcdFx0XHQkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucGFnZVRhZ3MgPSBbXTtcblxuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvJyArICRzY29wZS5pZCArICcvdGFncycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHQkc2NvcGUucGFnZVRhZ3MucHVzaCh2YWx1ZS5pZCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5zYXZlUGFnZVRhZ3MgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2LycgKyAkc2NvcGUuaWQgKyAnL3RhZ3MnLCAkc2NvcGUucGFnZVRhZ3MpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jcmVhdGVEZWVwUGFnZUNvcHlBc1RlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9kZWVwLXBhZ2UtY29weS1hcy10ZW1wbGF0ZScsIHtuYXZJZDogJHNjb3BlLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX2NyZWF0ZV9jb3B5X2FzX3RlbXBsYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdCRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjdXN0b20uY21zZHJhZnQnKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L2dldC1wcm9wZXJ0aWVzJywgeyBwYXJhbXM6IHtuYXZJZDogJHNjb3BlLmlkfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0Zm9yKHZhciBpIGluIHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHR2YXIgZCA9IHJlc3BvbnNlLmRhdGFbaV07XG5cdFx0XHRcdFx0JHNjb3BlLnByb3BWYWx1ZXNbZC5hZG1pbl9wcm9wX2lkXSA9IGQudmFsdWU7XG5cdFx0XHRcdFx0JHNjb3BlLmhhc1ZhbHVlcyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlUHJvcE1hc2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSAhJHNjb3BlLnNob3dQcm9wRm9ybTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnN0b3JlUHJvcFZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvc2F2ZS1wcm9wZXJ0aWVzP25hdklkPScrJHNjb3BlLmlkLCAkLnBhcmFtKCRzY29wZS5wcm9wVmFsdWVzKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfcHJvcGVydHlfcmVmcmVzaCddKTtcblx0XHRcdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzKCk7XG5cdFx0XHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSBmYWxzZTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudHJhc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blsnanNfcGFnZV9jb25maXJtX2RlbGV0ZSddLCBpMThuWydjbXNhZG1pbl9zZXR0aW5nc190cmFzaHBhZ2VfdGl0bGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9kZWxldGUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUuaWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRcdCRzY29wZS5pc0RlbGV0ZWQgPSB0cnVlO1xuXHQgICAgXHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0ICAgIFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdCAgICBcdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdCAgICBcdFx0XHR9KTtcblx0ICAgIFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT0gNDE3KSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19wYWdlX2RlbGV0ZV9lcnJvcl9jYXVzZV9yZWRpcmVjdHMnXSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5pc0RyYWZ0ID0gZmFsc2U7XG5cblx0ICAgICRzY29wZS5zdWJtaXROYXZGb3JtID0gZnVuY3Rpb24oZGF0YSkge1xuXHQgICAgXHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi91cGRhdGU/aWQ9JyArICRzY29wZS5uYXZEYXRhLmlkLCBkYXRhKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfdXBkYXRlX2xheW91dF9zYXZlX3N1Y2Nlc3MnKSk7XG5cdCAgICBcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0ICAgIFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcblx0ICAgIFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKHZhbHVlLm1lc3NhZ2UpO1xuXHQgICAgXHRcdH0pO1xuXHQgICAgXHR9KTtcblx0ICAgIH07XG5cblx0ICAgIGZ1bmN0aW9uIGluaXRpYWxpemVyKCkge1xuXHRcdFx0JHNjb3BlLm5hdkRhdGEgPSAkZmlsdGVyKCdmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIHtpZDogJHNjb3BlLmlkfSwgdHJ1ZSlbMF07XG5cdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCRzY29wZS5pc0RyYWZ0ID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzKCk7XG5cblx0XHRcdFx0LyogcHJvcGVydGllcyAtLT4gKi9cblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19vZmZsaW5lIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCAgICBcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ICAgIFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1vZmZsaW5lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBvZmZsaW5lU3RhdHVzIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfb2ZmbGluZSA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX29mZmxpbmUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9vbmxpbmUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHQgICAgXHRcdH0pO1xuXHRcdFx0ICAgIFx0fVxuXHRcdFx0ICAgIH0pO1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX2hpZGRlbiB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1oaWRkZW4nLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIGhpZGRlblN0YXR1cyA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX2hpZGRlbiA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX2hpZGRlbicsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX3Zpc2libGUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX2hvbWUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0ICAgIFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1ob21lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBob21lU3RhdGUgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX2hvbWUgPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3N0YXRlX2lzX2hvbWUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfc3RhdGVfaXNfbm90X2hvbWUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0ICAgIFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRcdGluaXRpYWxpemVyKCk7XG5cdH1dKTtcblxuXHQvKipcblx0ICogQHBhcmFtICRzY29wZS5sYW5nIGZyb20gbmctcmVwZWF0XG5cdCAqL1xuXHR6YWEuY29udHJvbGxlcihcIk5hdkl0ZW1Db250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICckdGltZW91dCcsICdTZXJ2aWNlTWVudURhdGEnLCAnQWRtaW5MYW5nU2VydmljZScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRodHRwLCAkZmlsdGVyLCAkdGltZW91dCwgU2VydmljZU1lbnVEYXRhLCBBZG1pbkxhbmdTZXJ2aWNlLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uKSB7XG5cblx0XHQkc2NvcGUubG9hZGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuTmF2Q29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSBmYWxzZTtcblxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5vcGVuTGl2ZVVybCA9IGZ1bmN0aW9uKGlkLCB2ZXJzaW9uSWQpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKGlkLCB2ZXJzaW9uSWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUubG9hZExpdmVVcmwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKCRzY29wZS5pdGVtLmlkLCAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uKTtcblx0XHR9O1xuXG5cdFx0Ly8gbGF5b3V0c0RhdGFcblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgIFx0fSk7XG5cdFx0XG5cdFx0Ly8gc2VydmljZU1lbnVEYXRhIGluaGVyaXRhbmNlXG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpMb2FkTGFuZ3VhZ2UnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0aWYgKCEkc2NvcGUubG9hZGVkKSB7XG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBwcm9wZXJ0aWVzOlxuXG5cdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW0gPSBbXTtcblxuXHRcdCRzY29wZS5pdGVtQ29weSA9IFtdO1xuXG5cdFx0JHNjb3BlLnNldHRpbmdzID0gZmFsc2U7XG5cblx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gW107XG5cblx0XHQkc2NvcGUudHlwZURhdGEgPSBbXTtcblxuXHRcdCRzY29wZS5jb250YWluZXIgPSBbXTtcblxuXHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblxuXHRcdCRzY29wZS5ob21lVXJsID0gJHJvb3RTY29wZS5sdXlhY2ZnLmhvbWVVcmw7XG5cblx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcblx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXM7XG5cblx0XHQkc2NvcGUudHJhc2hJdGVtID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmxhbmcuaXNfZGVmYXVsdCA9PSAwKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blsnanNfcGFnZV9jb25maXJtX2RlbGV0ZSddLCBpMThuWydjbXNhZG1pbl9zZXR0aW5nc190cmFzaHBhZ2VfdGl0bGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0XHQkaHR0cC5kZWxldGUoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9kZWxldGU/bmF2SXRlbUlkPScgKyAkc2NvcGUuaXRlbS5pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXRlbSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXRlbUNvcHkgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnNldHRpbmdzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLiRicm9hZGNhc3QoJ2RlbGV0ZWROYXZJdGVtJyk7XG5cdFx0XHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdCAgICBcdFx0XHR9KTtcblx0XHQgICAgXHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19wYWdlX2RlbGV0ZV9lcnJvcl9jYXVzZV9yZWRpcmVjdHMnXSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1dKTtcblx0XHRcdH1cblx0ICAgIH07XG5cblx0XHQkc2NvcGUucmVzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5pdGVtQ29weSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuaXRlbSk7XG5cdFx0XHRpZiAoJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBhbmd1bGFyLmNvcHkoeyduYXZfaXRlbV90eXBlX2lkJyA6ICRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gYW5ndWxhci5jb3B5KCRzY29wZS50eXBlRGF0YSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS51cGRhdGVOYXZJdGVtRGF0YSA9IGZ1bmN0aW9uKGl0ZW1Db3B5LCB0eXBlRGF0YUNvcHkpIHtcblx0XHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblx0XHRcdHZhciBuYXZJdGVtSWQgPSBpdGVtQ29weS5pZDtcblxuXHRcdFx0dHlwZURhdGFDb3B5LnRpdGxlID0gaXRlbUNvcHkudGl0bGU7XG5cdFx0XHR0eXBlRGF0YUNvcHkuYWxpYXMgPSBpdGVtQ29weS5hbGlhcztcblx0XHRcdHR5cGVEYXRhQ29weS50aXRsZV90YWcgPSBpdGVtQ29weS50aXRsZV90YWc7XG5cdFx0XHR0eXBlRGF0YUNvcHkuZGVzY3JpcHRpb24gPSBpdGVtQ29weS5kZXNjcmlwdGlvbjtcblx0XHRcdHR5cGVEYXRhQ29weS5rZXl3b3JkcyA9IGl0ZW1Db3B5LmtleXdvcmRzO1xuXHRcdFx0dHlwZURhdGFDb3B5LnRpbWVzdGFtcF9jcmVhdGUgPSBpdGVtQ29weS50aW1lc3RhbXBfY3JlYXRlO1xuXHRcdFx0dHlwZURhdGFDb3B5LmltYWdlX2lkID0gaXRlbUNvcHkuaW1hZ2VfaWQ7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaXNfdXJsX3N0cmljdF9wYXJzaW5nX2Rpc2FibGVkID0gaXRlbUNvcHkuaXNfdXJsX3N0cmljdF9wYXJzaW5nX2Rpc2FibGVkO1xuXHRcdFx0dHlwZURhdGFDb3B5LmlzX2NhY2hlYWJsZSA9IGl0ZW1Db3B5LmlzX2NhY2hlYWJsZTtcblx0XHRcdCRodHRwLnBvc3QoXG5cdFx0XHRcdCdhZG1pbi9hcGktY21zLW5hdml0ZW0vdXBkYXRlLXBhZ2UtaXRlbT9uYXZJdGVtSWQ9JyArIG5hdkl0ZW1JZCArICcmbmF2SXRlbVR5cGU9JyArIGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUsXG5cdFx0XHRcdCQucGFyYW0odHlwZURhdGFDb3B5KSxcblx0XHRcdFx0aGVhZGVyc1xuXHRcdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChpdGVtQ29weS5uYXZfaXRlbV90eXBlICE9PSAxKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdC8qIHN3aXRjaCB2ZXJzaW9uIGlmIHR5cGUgaXMgcGFnZSAqL1xuXHRcdFx0XHRcdGlmIChpdGVtQ29weS5uYXZfaXRlbV90eXBlID09IDEgJiYgdHlwZW9mIHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ10gPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdFx0XHQvKiBjaG9vc2UgZ2l2ZW4gdmVyc2lvbiBvciBjaG9vc2UgZmlyc3QgYXZhaWxhYmxlIHZlcnNpb24gKi9cblx0XHRcdFx0XHRcdHZhciBwYWdlVmVyc2lvbktleSA9IHJlc3BvbnNlLmRhdGFbJ2l0ZW0nXS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdFx0aWYgKHBhZ2VWZXJzaW9uS2V5ID09IDApIHtcblx0XHRcdFx0XHRcdFx0cGFnZVZlcnNpb25LZXkgPSBPYmplY3Qua2V5cyhyZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddKVswXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddW3BhZ2VWZXJzaW9uS2V5XVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ11bcGFnZVZlcnNpb25LZXldWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcGFnZVZlcnNpb25LZXk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX2l0ZW1fdXBkYXRlX29rJywgeyd0aXRsZSc6IGl0ZW1Db3B5LnRpdGxlfSkpO1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0XHQkc2NvcGUucmVzZXQoKTtcblx0XHRcdH0sIGZ1bmN0aW9uIGVycm9yQ2FsbGJhY2socmVzcG9uc2UpIHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpdGVtLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdpdGVtQ29weS5hbGlhcycsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuIT1vICYmIG4hPW51bGwpIHtcblx0XHRcdFx0JHNjb3BlLml0ZW1Db3B5LmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKG4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnJlbW92ZVZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5QYXJhbSgnanNfdmVyc2lvbl9kZWxldGVfY29uZmlybScsIHthbGlhczogdmVyc2lvbi52ZXJzaW9uX2FsaWFzfSksIGkxOG5bJ2Ntc2FkbWluX3ZlcnNpb25fcmVtb3ZlJ10sIFsnJHRvYXN0JywgJyRodHRwJywgZnVuY3Rpb24oJHRvYXN0LCAkaHR0cCkge1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vcmVtb3ZlLXBhZ2UtdmVyc2lvbicsIHtwYWdlSWQgOiB2ZXJzaW9uLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfdmVyc2lvbl9kZWxldGVfY29uZmlybV9zdWNjZXNzJywge2FsaWFzOiB2ZXJzaW9uLnZlcnNpb25fYWxpYXN9KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHRcdH07XG5cdFx0XG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb25JdGVtO1xuICAgIFx0XG4gICAgXHQkc2NvcGUudGFiID0gMTtcbiAgICBcdFxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbkl0ZW0pIHtcbiAgICBcdFx0JHNjb3BlLmNoYW5nZVRhYig0KTtcbiAgICBcdFx0JHNjb3BlLmVkaXRWZXJzaW9uSXRlbSA9IHZlcnNpb25JdGVtO1xuICAgIFx0fTtcblxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uVXBkYXRlID0gZnVuY3Rpb24oZWRpdFZlcnNpb25JdGVtKSB7XG4gICAgXHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jaGFuZ2UtcGFnZS12ZXJzaW9uLWxheW91dCcsIHsncGFnZUl0ZW1JZCc6IGVkaXRWZXJzaW9uSXRlbS5pZCwgJ2xheW91dElkJzogZWRpdFZlcnNpb25JdGVtLmxheW91dF9pZCwgJ2FsaWFzJzogZWRpdFZlcnNpb25JdGVtLnZlcnNpb25fYWxpYXN9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgXHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuICAgIFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl91cGRhdGVfc3VjY2VzcyddKTtcbiAgICBcdFx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9KTtcbiAgICBcdH07XG4gICAgXHRcblx0XHQkc2NvcGUuZ2V0SXRlbSA9IGZ1bmN0aW9uKGxhbmdJZCwgbmF2SWQpIHtcblx0XHRcdCRodHRwKHtcblx0XHRcdCAgICB1cmw6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbmF2LWxhbmctaXRlbScsXG5cdFx0XHQgICAgbWV0aG9kOiBcIkdFVFwiLFxuXHRcdFx0ICAgIHBhcmFtczogeyBsYW5nSWQgOiBsYW5nSWQsIG5hdklkIDogbmF2SWQgfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbSA9IHJlc3BvbnNlLmRhdGFbJ2l0ZW0nXTtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXTtcblx0XHRcdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IHRydWU7XG5cdFx0XHRcdCRzY29wZS5yZXNldCgpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKCFyZXNwb25zZS5kYXRhWyduYXYnXS5pc19kcmFmdCkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZDb250cm9sbGVyLmJ1YmJsZVBhcmVudHMoJHNjb3BlLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5wYXJlbnRfbmF2X2lkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5uYXZEYXRhLm5hdl9jb250YWluZXJfaWQpO1xuXHRcdFx0XHRcdGlmICgkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlID09IDEpIHtcblxuXHRcdFx0XHRcdFx0dmFyIGxhc3RWZXJzaW9uID0gU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbi5oYXNWZXJzaW9uKCRzY29wZS5pdGVtLmlkKTtcblxuXHRcdFx0XHRcdFx0aWYgKGxhc3RWZXJzaW9uKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uKGxhc3RWZXJzaW9uKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID09IDApIHtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkIGluIHJlc3BvbnNlLmRhdGEudHlwZURhdGEpIHtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSByZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSB0cnVlXG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQvLyBpdHMgbG9hZGVkLCBidXQgdGhlIGRhdGEgZG9lcyBub3QgZXhpc3RzLlxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSA9IGZhbHNlO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVWZXJzaW9uc0Ryb3Bkb3duID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5ID0gISRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuc3dpdGNoVmVyc2lvbiA9IGZ1bmN0aW9uKHBhZ2VWZXJzaW9uaWQsIHRvZ2dsZSkge1xuXHRcdFx0U2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbi5zdG9yZSgkc2NvcGUuaXRlbS5pZCwgcGFnZVZlcnNpb25pZCk7XG5cdFx0XHQkc2NvcGUuY29udGFpbmVyID0gJHNjb3BlLnR5cGVEYXRhW3BhZ2VWZXJzaW9uaWRdWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gJHNjb3BlLnR5cGVEYXRhW3BhZ2VWZXJzaW9uaWRdWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcGFnZVZlcnNpb25pZDtcblx0XHRcdCRzY29wZS5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0aWYgKHRvZ2dsZSnCoHtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVZlcnNpb25zRHJvcGRvd24oKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLmdldEl0ZW0oJHNjb3BlLmxhbmcuaWQsICRzY29wZS5OYXZDb250cm9sbGVyLmlkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChBZG1pbkxhbmdTZXJ2aWNlLmlzSW5TZWxlY3Rpb24oJHNjb3BlLmxhbmcuc2hvcnRfY29kZSkpIHtcblx0XHRcdFx0JHNjb3BlLmdldEl0ZW0oJHNjb3BlLmxhbmcuaWQsICRzY29wZS5OYXZDb250cm9sbGVyLmlkKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qIG5ldyBzZXR0aW5ncyBvdmVybGF5ICovXG5cdFx0XG5cdFx0JHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkgPSB0cnVlO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkgPSBmdW5jdGlvbih0YWIpIHtcblx0XHRcdCRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5ID0gISRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5O1xuXHRcdFx0aWYgKHRhYikge1xuXHRcdFx0XHQkc2NvcGUudGFiID0gdGFiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHQkc2NvcGUuY2hhbmdlVGFiID0gZnVuY3Rpb24odGFiKSB7XG5cdFx0XHQkc2NvcGUudGFiID0gdGFiO1xuXHRcdH1cblx0XHRcblx0XHQvKipcblx0XHQgKiBSZWZyZXNoIHRoZSBjdXJyZW50IGxheW91dCBjb250YWluZXIgYmxvY2tzLlxuXHRcdCAqIFxuXHRcdCAqIEFmdGVyIHN1Y2Nlc3NmdWxsIGFwaSByZXNwb25zZSBhbGwgY21zIGxheW91dCBhcmUgZm9yZWFjaCBhbmQgdGhlIHZhbHVlcyBhcmUgcGFzc2VkIHRvIHJldlBsYWNlaG9sZGVycygpIG1ldGhvZC5cblx0XHQgKi9cblx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZCA9IGZ1bmN0aW9uKHByZXZJZCwgcGxhY2Vob2xkZXJWYXIpIHtcblx0XHRcdCRodHRwKHtcblx0XHRcdFx0dXJsIDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9yZWxvYWQtcGxhY2Vob2xkZXInLFxuXHRcdFx0XHRtZXRob2QgOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zIDogeyBuYXZJdGVtUGFnZUlkIDogJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiwgcHJldklkIDogcHJldklkLCBwbGFjZWhvbGRlclZhciA6IHBsYWNlaG9sZGVyVmFyfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybCgkc2NvcGUuaXRlbS5pZCwgJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbik7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuY29udGFpbmVyLl9fcGxhY2Vob2xkZXJzLCBmdW5jdGlvbihwbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMocGxhY2Vob2xkZXIsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogVGhlIHJldlBsYWNlaG9sZGVycyBtZXRob2QgZ29lcyB0cm91cmdoIHRoZSBuZXcgcm93L2NvbCAoZ3JpZCkgc3lzdGVtIGNvbnRhaW5lciBqc29uIGxheW91dCB3aGVyZTpcblx0XHQgKiBcblx0XHQgKiByb3dzW11bMV0gPSBjb2wgbGVmdFxuXHRcdCAqIHJvd3NbXVsyXSA9IGNvbCByaWdodFxuXHRcdCAqIFxuXHRcdCAqIFdoZXJlIGEgbGF5b3V0IGhhdmUgYXQgbGVhc3Qgb24gcm93IHdoaWNoIGNhbiBoYXZlIGNvbHMgaW5zaWRlLiBTbyB0aGVyZSByZXZQbGFjZWhvbGRlcnMgbWV0aG9kIGdvZXMgdHJvdWdoIHRoZSBjb2xzXG5cdFx0ICogYW5kIGNoZWNrIGlmIHRoZSBjb2wgaXMgZXF1YWwgdGhlIGdpdmVuIGNvbCB0byByZXBsYWNlIHRoZSBjb250ZW50IHdpdGggIChmcm9tIHJlZnJlc2hOZXN0ZWQgbWV0aG9kKS5cblx0XHQgKi9cblx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzID0gZnVuY3Rpb24ocGxhY2Vob2xkZXJzLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCkge1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKHBsYWNlaG9sZGVycywgZnVuY3Rpb24ocGxhY2Vob2xkZXJSb3csIHBsYWNlaG9sZGVyS2V5KSB7XG5cdFx0XHRcdGlmIChwYXJzZUludChwcmV2SWQpID09IHBhcnNlSW50KHBsYWNlaG9sZGVyUm93LnByZXZfaWQpICYmIHBsYWNlaG9sZGVyVmFyID09IHBsYWNlaG9sZGVyUm93Wyd2YXInXSkge1xuXHRcdFx0XHRcdHBsYWNlaG9sZGVyc1twbGFjZWhvbGRlcktleV1bJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddID0gcmVwbGFjZUNvbnRlbnQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJldkZpbmQocGxhY2Vob2xkZXJSb3csIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgcmV2RmluZCBtZXRob2QgZG9lcyB0aGUgcmVjdXJzaXYgam9iIHdpdGhpbiBhIGJsb2NrIGFuIHBhc3NlcyB0aGUgdmFsdWUgYmFjayB0byByZXZQbGFjZWhvbGRlcnMoKS5cblx0XHQgKi9cblx0XHQkc2NvcGUucmV2RmluZCA9IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCkge1xuXHRcdFx0Zm9yICh2YXIgaSBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ10pIHtcblx0XHRcdFx0Zm9yICh2YXIgaG9sZGVyS2V5IGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGhvbGRlciBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ11baG9sZGVyS2V5XSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyhwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ11baG9sZGVyS2V5XSwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogZHJvcHMgaXRlbXMgaW4gYW4gZW1wdHkgcGFnZSBwbGFjZWhvbGRlciBvZiBDTVMgTEFZT1VUIFBMQUNFSE9MREVSXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtUGxhY2Vob2xkZXIgPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24pIHtcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHtcblx0XHRcdFx0XHRwcmV2X2lkOiBkcm9wcGVkLnByZXZfaWQsIFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6MCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQ6IGRyYWdnZWQuaWQsIFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkKGRyb3BwZWRbJ3ByZXZfaWQnXSwgZHJvcHBlZFsndmFyJ10pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZFsncHJldl9pZCddLCBkcm9wcGVkWyd2YXInXSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0fV0pO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0gJHNjb3BlLmJsb2NrIEZyb20gbmctcmVwZWF0IHNjb3BlIGFzc2lnbm1lbnRcblx0ICovXG5cdHphYS5jb250cm9sbGVyKFwiUGFnZUJsb2NrRWRpdENvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHNjZScsICckaHR0cCcsICdBZG1pbkNsYXNzU2VydmljZScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQmxvY2tDb3B5U3RhY2snLCAnU2VydmljZUxpdmVFZGl0TW9kZScsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkc2NlLCAkaHR0cCwgQWRtaW5DbGFzc1NlcnZpY2UsIEFkbWluVG9hc3RTZXJ2aWNlLCBTZXJ2aWNlQmxvY2tDb3B5U3RhY2ssIFNlcnZpY2VMaXZlRWRpdE1vZGUpIHtcblxuXHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHQvKipcblx0XHQgKiBkcm9wcyBhbiBpdGVtIGluIGFuIGVtcHR5IHBsYWNlaG9sZGVyIG9mIGEgQkxPQ0tcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW1QbGFjZWhvbGRlciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbikge1xuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywge1xuXHRcdFx0XHRcdHByZXZfaWQgOiBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDowLCBcblx0XHRcdFx0XHRibG9ja19pZCA6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZCA6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZChkcm9wcGVkLnByZXZfaWQsIGRyb3BwZWQudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQgOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIERyb3BzIGEgYmxvY2sgYWJvdmUvYmVsb3cgYW4gRVhJU1RJTkcgQkxPQ0tcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW0gPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24sZWxlbWVudCkge1xuXHRcdFx0dmFyIHNvcnRJbmRleCA9ICRzY29wZS4kaW5kZXg7XG5cdFx0XHRcblx0XHRcdGlmIChwb3NpdGlvbiA9PSAnYm90dG9tJykge1xuXHRcdFx0XHRzb3J0SW5kZXggPSBzb3J0SW5kZXggKyAxO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7IFxuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQ6IGRyYWdnZWQuaWQsIFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXgsXG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXhcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0ICogQGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vbHV5YWRldi9sdXlhL2lzc3Vlcy8xNjI5XG5cdFx0XHRcdFx0ICogVGhlIG1vdmVkIGJsb2NrLCBzaG91bGQgcmVtb3ZlZCBmcm9tIHRoZSBwcmV2aW91cyBhcnJheS4gVGhpcyBpcyBvbmx5IHRoZSBjYXNlIHdoZW4gZHJhZ2dpbmcgZnJvbSBhbiBPVVRFUiBibG9jayBpbnRvIGFuIElOTkVSIGJsb2NrXG5cdFx0XHRcdFx0ICogaXMgdGhpcyB3aWxsIG5vdCByZWZyZXNoIHRoZSBPVVRFUiBibG9jaywgYnV0IGFsd2F5cyB3aWxsIGluIHRoZSBvcHBvc2l0ZSB3YXkuXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGVsZW1lbnQpLnJlbW92ZSgpO1xuXHRcdFx0XHRcdC8vIGFzIHRoZSBibG9jayBoYXMgYmVlbiByZW1vdmVkIGZyb20gZXhpc3RpbmcsIHJlZnJlc2ggdGhlIG5ldyBwbGFjZWhvbGRlci5cblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuY29weUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQmxvY2tDb3B5U3RhY2sucHVzaCgkc2NvcGUuYmxvY2spO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSGlkZGVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19oaWRkZW4gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwKHtcblx0XHRcdCAgICB1cmw6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vdG9nZ2xlLWJsb2NrLWhpZGRlbicsXG5cdFx0XHQgICAgbWV0aG9kOiBcIkdFVFwiLFxuXHRcdFx0ICAgIHBhcmFtczogeyBibG9ja0lkIDogJHNjb3BlLmJsb2NrLmlkLCBoaWRkZW5TdGF0ZTogJHNjb3BlLmJsb2NrLmlzX2hpZGRlbiB9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdC8qIGxvYWQgbGl2ZSB1cmwgb24gaGlkZGVuIHRyaWdnZXIgKi9cblx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIuJHBhcmVudC4kcGFyZW50LmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdC8vIHN1Y2Nlc3NmdWxsIHRvZ2dsZSBoaWRkZW4gc3RhdGUgb2YgYmxvY2tcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdmlzYmlsaXR5X2NoYW5nZScsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgJHNjb3BlLmJsb2NrLnZhcnMgIT0gXCJ1bmRlZmluZWRcIiAmJiAkc2NvcGUuYmxvY2sudmFycy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0NvbmZpZ3VyYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAkc2NvcGUuYmxvY2suY2ZncyAhPSBcInVuZGVmaW5lZFwiICYmICRzY29wZS5ibG9jay5jZmdzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cdFx0XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5ibG9jay52YWx1ZXMgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5ibG9jay52YXJpYXRpb24gfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkobik7XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmdldEluZm8gPSBmdW5jdGlvbih2YXJGaWVsZE5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2suZmllbGRfaGVscC5oYXNPd25Qcm9wZXJ0eSh2YXJGaWVsZE5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUuYmxvY2suZmllbGRfaGVscFt2YXJGaWVsZE5hbWVdO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkgPSBmdW5jdGlvbih2YXJpYXRlbk5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2sudmFyaWF0aW9ucy5oYXNPd25Qcm9wZXJ0eSh2YXJpYXRlbk5hbWUpKSB7XG5cdFx0XHRcdHZhciB2YXJpYXRpb24gPSAkc2NvcGUuYmxvY2sudmFyaWF0aW9uc1skc2NvcGUuYmxvY2sudmFyaWF0aW9uXTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHZhcmlhdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdGlmIChhbmd1bGFyLmlzT2JqZWN0KHZhbHVlKSkge1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHZhbHVlLCBmdW5jdGlvbih2LCBrKSB7XG5cdFx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2tba2V5XSwgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGsgPT0gb2JqZWN0LnZhcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2suY2ZncywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay52YXJzLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuY2ZnZGF0YSA9ICRzY29wZS5ibG9jay5jZmd2YWx1ZXMgfHwge307XG5cblx0XHQkc2NvcGUuZWRpdCA9IGZhbHNlO1xuXHRcdFxuXHRcdCRzY29wZS5tb2RhbEhpZGRlbiA9IHRydWU7XG5cblx0XHQkc2NvcGUubW9kYWxNb2RlID0gMTtcblxuXHRcdCRzY29wZS5pbml0TW9kYWxNb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLnZhcnMubGVuZ3RoICA9PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5tb2RhbE1vZGUgPSAyO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlRWRpdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5pc0VkaXRhYmxlKCkgfHwgJHNjb3BlLmlzQ29uZmlndXJhYmxlKCkpIHtcblx0XHRcdFx0JHNjb3BlLm1vZGFsSGlkZGVuID0gISRzY29wZS5tb2RhbEhpZGRlbjtcblx0XHRcdFx0JHNjb3BlLmVkaXQgPSAhJHNjb3BlLmVkaXQ7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCBkYXRhVmFycywgY2ZnVmFycywgYmxvY2ssIGV4dHJhcykge1xuXHRcdFx0aWYgKHRlbXBsYXRlID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdGVtcGxhdGUgPSBUd2lnLnR3aWcoe1xuXHRcdFx0ICAgIGRhdGE6IHRlbXBsYXRlXG5cdFx0XHR9KTtcblxuXHRcdFx0dmFyIGNvbnRlbnQgPSB0ZW1wbGF0ZS5yZW5kZXIoe1xuXHRcdFx0XHR2YXJzIDogZGF0YVZhcnMsXG5cdFx0XHRcdGNmZ3MgOiBjZmdWYXJzLFxuXHRcdFx0XHRibG9jayA6IGJsb2NrLFxuXHRcdFx0XHRleHRyYXMgOiBleHRyYXNcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gJHNjZS50cnVzdEFzSHRtbChjb250ZW50KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja19kZWxldGVfY29uZmlybScsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pLCBpMThuWyd2aWV3X3VwZGF0ZV9ibG9ja190b29sdGlwX2RlbGV0ZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHQkaHR0cC5kZWxldGUoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vZGVsZXRlP2lkPScgKyAkc2NvcGUuYmxvY2suaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX3JlbW92ZV9vaycsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkLCB7XG5cdFx0XHRcdGpzb25fY29uZmlnX3ZhbHVlczogJHNjb3BlLmRhdGEsXG5cdFx0XHRcdGpzb25fY29uZmlnX2NmZ192YWx1ZXM6ICRzY29wZS5jZmdkYXRhLFxuXHRcdFx0XHR2YXJpYXRpb246ICRzY29wZS5ibG9jay52YXJpYXRpb25cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdXBkYXRlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlRWRpdCgpO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfZGlydHkgPSAxO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2sgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5vYmplY3RkZXRhaWwpO1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSgkc2NvcGUuYmxvY2sudmFyaWF0aW9uKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkRyb3BwYWJsZUJsb2Nrc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnU2VydmljZUJsb2Nrc0RhdGEnLCAnU2VydmljZUJsb2NrQ29weVN0YWNrJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgQWRtaW5DbGFzc1NlcnZpY2UsIFNlcnZpY2VCbG9ja3NEYXRhLCBTZXJ2aWNlQmxvY2tDb3B5U3RhY2spIHtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZUJsb2Nrc0RhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhID0gU2VydmljZUJsb2Nrc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYmxvY2tzRGF0YSk7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKHRydWUpO1xuXHRcdH1cblxuXHRcdCRzY29wZS5hZGRUb0ZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG8tZmF2Jywge2Jsb2NrOiBpdGVtIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlRnJvbUZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svcmVtb3ZlLWZhdicsIHtibG9jazogaXRlbSB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUdyb3VwID0gZnVuY3Rpb24oZ3JvdXApIHtcblx0XHRcdGlmIChncm91cC50b2dnbGVfb3BlbiA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAhZ3JvdXAudG9nZ2xlX29wZW47XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG9nZ2xlLWdyb3VwJywge2dyb3VwOiBncm91cH0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc1ByZXZpZXdFbmFibGVkID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ucHJldmlld19lbmFibGVkO1xuXHRcdH07XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cblx0XHQkc2NvcGUuY29weVN0YWNrID0gU2VydmljZUJsb2NrQ29weVN0YWNrLnN0YWNrO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDb3B5U3RhY2snLCBmdW5jdGlvbihldmVudCwgc3RhY2spIHtcblx0XHRcdCRzY29wZS5jb3B5U3RhY2sgPSBzdGFjaztcblx0XHR9KTtcblxuXHRcdCRzY29wZS5jbGVhclN0YWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQmxvY2tDb3B5U3RhY2suY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cblx0XHQkc2NvcGUuc2VhcmNoSXNEaXJ0eSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnc2VhcmNoUXVlcnknLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiAhPT0gJycpIHtcblx0XHRcdFx0JHNjb3BlLnNlYXJjaElzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2Nrc0RhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUuZ3JvdXAuaXNfZmF2KSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YS5zcGxpY2Uoa2V5LCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFsdWUuZ3JvdXAudG9nZ2xlX29wZW4gPSAxXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmKCRzY29wZS5zZWFyY2hJc0RpcnR5KSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhID0gYW5ndWxhci5jb3B5KCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBhbGwgZ2xvYmFsIGFkbWluIHNlcnZpY2VzXG4gKiBcbiAqIGNvbnRyb2xsZXIgcmVzb2x2ZTogaHR0cHM6Ly9naXRodWIuY29tL2pvaG5wYXBhL2FuZ3VsYXItc3R5bGVndWlkZSNzdHlsZS15MDgwXG4gKiBcbiAqIFNlcnZpY2UgSW5oZXJpdGFuY2U6XG4gKiBcbiAqIDEuIFNlcnZpY2UgbXVzdCBiZSBwcmVmaXggd2l0aCBTZXJ2aWNlXG4gKiAyLiBTZXJ2aWNlIG11c3QgY29udGFpbiBhIGZvcmNlUmVsb2FkIHN0YXRlXG4gKiAzLiBTZXJ2aWNlIG11c3QgYnJvYWRjYXN0IGFuIGV2ZW50ICdzZXJ2aWNlOkZvbGRlcnNEYXRhJ1xuICogNC4gQ29udHJvbGxlciBpbnRlZ3JhdGlvbiBtdXN0IGxvb2sgbGlrZVxuICogXG4gKiBgYGBcbiAqICRzY29wZS5mb2xkZXJzRGF0YSA9IFNlcnZpY2VGb2xkZXJzRGF0YS5kYXRhO1xuICpcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpGb2xkZXJzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiAgICAgICRzY29wZS5mb2xkZXJzRGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqXHRcdFx0XHRcbiAqICRzY29wZS5mb2xkZXJzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogICAgIHJldHVybiBTZXJ2aWNlRm9sZGVyc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIGBgYFxuICogXG4gKi9cblx0XG56YWEuY29uZmlnKFsncmVzb2x2ZXJQcm92aWRlcicsIGZ1bmN0aW9uKHJlc29sdmVyUHJvdmlkZXIpIHtcblx0cmVzb2x2ZXJQcm92aWRlci5hZGRDYWxsYmFjayhbJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlQmxvY2tzRGF0YScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgJ0x1eWFMb2FkaW5nJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlQmxvY2tzRGF0YSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUsIEx1eWFMb2FkaW5nKSB7XG5cdFx0THV5YUxvYWRpbmcuc3RhcnQoKTtcblx0XHRTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKCk7XG5cdFx0U2VydmljZUxheW91dHNEYXRhLmxvYWQoKTtcblx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCgpLnRoZW4oZnVuY3Rpb24ocikge1xuXHRcdFx0U2VydmljZUN1cnJlbnRXZWJzaXRlLmxvYWQoKTtcblx0XHRcdEx1eWFMb2FkaW5nLnN0b3AoKTtcblx0XHR9KTtcblx0fV0pO1xufV0pO1xuXG5cbi8qKlxuICogQ29weSBCbG9jayBTdGFjayBzZXJ2aWNlLlxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VCbG9ja0NvcHlTdGFja1wiLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLnN0YWNrID0gW107XG5cdFxuXHRzZXJ2aWNlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGFjayA9IFtdO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDb3B5U3RhY2snLCBzZXJ2aWNlLnN0YWNrKTtcblx0fTtcblx0XG5cdHNlcnZpY2UucHVzaCA9IGZ1bmN0aW9uKGJsb2NrKSB7XG5cdFx0aWYgKHNlcnZpY2Uuc3RhY2subGVuZ3RoID4gNCkge1xuXHRcdFx0c2VydmljZS5zdGFjay5zaGlmdCgpO1xuXHRcdH1cblx0XHRzZXJ2aWNlLnN0YWNrLnB1c2goe2Jsb2NrSWQ6IGJsb2NrLmJsb2NrX2lkLCBuYW1lOiBibG9jay5uYW1lLCBpY29uOmJsb2NrLmljb24sIGlkOiBibG9jay5pZCwgY29weXN0YWNrOiAxfSk7XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkNvcHlTdGFjaycsIHNlcnZpY2Uuc3RhY2spO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogTWVudSBTZXJ2aWNlLlxuICogXG4gKiAkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcbiAqIFx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqIFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqIFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogXHRcdFx0XHRcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTWVudURhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtbWVudS9kYXRhLW1lbnVcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOk1lbnVEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQmxvY2tzIFNlcnZpY2UuXG4gKiBcbiAqIFxuICogJHNjb3BlLmJsb2Nrc0RhdGEgPSBTZXJ2aWNlQmxvY2tzRGF0YS5kYXRhO1xuICogXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiBcdCRzY29wZS5ibG9ja3NEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogXHRyZXR1cm4gU2VydmljZUJsb2Nrc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIFx0XHRcdFx0XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUJsb2Nrc0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1ibG9ja3NcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBMYXlvdXRzIFNlcnZpY2UuXG5cbiRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXHRcdFx0XHRcbiRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG59KTtcblxuJHNjb3BlLmxheW91dHNEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBTZXJ2aWNlTGF5b3V0c0RhdGEubG9hZCh0cnVlKTtcbn1cblx0XHRcdFx0XG4qL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTGF5b3V0c0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1sYXlvdXRzXCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpMYXlvdXRzRGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIENNUyBMSVZFIEVESVQgU0VSSVZDRVxuICogXG4gKiAkc2NvcGUubGl2ZUVkaXRNb2RlID0gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZVxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VMaXZlRWRpdE1vZGVcIiwgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuXHRcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2Uuc3RhdGUgPSAwO1xuXHRcblx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmx1eWFjZmcuaG9tZVVybDtcblx0XG5cdHNlcnZpY2UudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGF0ZSA9ICFzZXJ2aWNlLnN0YXRlO1xuXHR9O1xuXHRzZXJ2aWNlLnNldFVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0dmFyIGQgPSBuZXcgRGF0ZSgpO1xuXHRcdHZhciBuID0gZC5nZXRUaW1lKCk7XG5cdFx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmNtc0NvbmZpZy5wcmV2aWV3VXJsICsgJz9pdGVtSWQ9JytpdGVtSWQrJyZ2ZXJzaW9uPScgKyB2ZXJzaW9uSWQgKyAnJmRhdGU9JyArIG47XG5cdH07XG5cdFxuXHRzZXJ2aWNlLmNoYW5nZVVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0aWYgKHZlcnNpb25JZCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHZlcnNpb25JZCA9IDA7XG5cdFx0fVxuXHRcdHNlcnZpY2Uuc2V0VXJsKGl0ZW1JZCwgdmVyc2lvbklkKTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TGl2ZUVkaXRNb2RlVXJsQ2hhbmdlJywgc2VydmljZS51cmwpO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQ01TIEN1cnJlbnQgV2Vic2l0ZSBTRVJJVkNFXG4gKlxuICogJHNjb3BlLmN1cnJlbnRXZWJzaXRlSWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuc3RhdGVcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQ3VycmVudFdlYnNpdGVcIiwgWyckcm9vdFNjb3BlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRyb290U2NvcGUsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdGN1cnJlbnRXZWJzaXRlOiBudWxsLFxuXHRcdGRlZmF1bHRXZWJzaXRlOiBudWxsXG5cdH07XG5cblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlID0gU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMuZmluZCh3ID0+IHcuaXNfZGVmYXVsdCk7XG5cdFx0c2VydmljZS50b2dnbGUoc2VydmljZS5kZWZhdWx0V2Vic2l0ZS5pZCk7XG5cdH1cblxuXHRzZXJ2aWNlLnRvZ2dsZSA9IGZ1bmN0aW9uKHdlYnNpdGVJZCkge1xuXHRcdGlmICh3ZWJzaXRlSWQgJiYgKCFzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlIHx8IHNlcnZpY2UuY3VycmVudFdlYnNpdGUuaWQgIT09IHdlYnNpdGVJZCkpIHtcblx0XHRcdHNlcnZpY2UuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcy5maW5kKHcgPT4gdy5pZCA9PT0gd2Vic2l0ZUlkKTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbnphYS5mYWN0b3J5KFwiU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvblwiLCBbZnVuY3Rpb24oKSB7XG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdHBhZ2UgOiB7fVxuXHR9O1xuXG5cblxuXHRzZXJ2aWNlLnN0b3JlID0gZnVuY3Rpb24ocGFnZUlkLCB2ZXJzaW9uSWQpIHtcblx0XHRzZXJ2aWNlLnBhZ2VbcGFnZUlkXSA9IHZlcnNpb25JZDtcblx0fTtcblxuXG5cdHNlcnZpY2UuaGFzVmVyc2lvbiA9IGZ1bmN0aW9uKHBhZ2VJZCkge1xuXHRcdGlmIChzZXJ2aWNlLnBhZ2UuaGFzT3duUHJvcGVydHkocGFnZUlkKSkge1xuXHRcdFx0cmV0dXJuIHNlcnZpY2UucGFnZVtwYWdlSWRdO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTsiXX0=