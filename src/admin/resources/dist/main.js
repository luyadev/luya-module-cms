function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function () {
  "use strict"; // directive.js

  zaa.directive("menuDropdown", ['ServiceMenuData', 'ServiceCurrentWebsite', '$filter', function (ServiceMenuData, ServiceCurrentWebsite, $filter) {
    return {
      restrict: 'E',
      scope: {
        navId: '='
      },
      controller: ['$scope', function ($scope) {
        $scope.changeModel = function (data) {
          $scope.navId = data.id;
        };

        $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
        $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
          $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
        });
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
        return '<div>' + '<div class="input-group mb-2">' + '<div class="input-group-prepend" ng-hide="searchQuery"><div class="input-group-text"><i class="material-icons">search</i></div></div>' + '<div class="input-group-prepend" ng-show="searchQuery" ng-click="searchQuery = \'\'"><div class="input-group-text"><i class="material-icons">clear</i></div></div>' + '<input class="form-control" ng-model="searchQuery" type="text" placeholder="' + i18n['ngrest_crud_search_text'] + '">' + '</div>' + '<div ng-repeat="(key, container) in menuData.containers | menuwebsitefilter:currentWebsite.id" ng-if="(menuData.items | menuparentfilter:container.id:0).length > 0" class="card mb-2" ng-class="{\'card-closed\': !container.isHidden}">' + '<div class="card-header" ng-click="container.isHidden=!container.isHidden">' + '<span class="material-icons card-toggle-indicator">keyboard_arrow_down</span>' + '<span>{{container.name}}</span>' + '</div>' + '<div class="card-body">' + '<div class="treeview treeview-chooser">' + '<ul class="treeview-items treeview-items-lvl1">' + '<li class="treeview-item treeview-item-lvl1" ng-class="{\'treeview-item-has-children\' : (menuData.items | menuparentfilter:container.id:0).length}" ng-repeat="(key, data) in menuData.items | menuparentfilter:container.id:0 track by data.id" ng-include="\'menuDropdownReverse\'"></li>' + '</ul>' + '</div>' + '</div>' + '</div>' + '</div>';
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
          if (ServiceCurrentWebsite.currentWebsite) {
            $scope.data.nav_container_id = ServiceCurrentWebsite.currentWebsite.default_container_id;
          }
        });
        $scope.languagesData = ServiceLanguagesData.data;
        $scope.$on('service:LanguagesData', function (event, data) {
          $scope.languagesData = data;
        });
        $scope.isDefaultItem = $scope.languagesData.find(function (item) {
          return item.is_default;
        });
        $scope.data.lang_id = $scope.isDefaultItem.id;
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

        $scope.arrayToSelect = function (input, valueField, labelField) {
          var output = [];
          angular.forEach(input, function (value) {
            output.push({
              "label": value[labelField],
              "value": value[valueField]
            });
          });
          return output;
        };

        $scope.$on('service:LayoutsData', function (event, data) {
          $scope.layoutsData = []; // $scope.arrayToSelect(data); // @TODO REMOVE IF VERIFIED
        });
        $scope.versionsData = [];

        $scope.getVersionList = function () {
          $http.get('admin/api-cms-navitempage/versions', {
            params: {
              navItemId: $scope.navItemId
            }
          }).then(function (response) {
            $scope.versionsData = $scope.arrayToSelect(response.data, 'id', 'version_alias');
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

        $scope.arrayToSelect = function (input, valueField, labelField) {
          var output = [];
          angular.forEach(input, function (value) {
            output.push({
              "label": value[labelField],
              "value": value[valueField]
            });
          });
          return output;
        };

        function init() {
          $scope.drafts = $scope.arrayToSelect($scope.menuData.drafts, 'id', 'title');
          $scope.layouts = $scope.arrayToSelect($scope.layoutsData, 'id', 'name');
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

    $scope.isAnyRequiredAttributeEmpty = function () {
      var response = false;
      angular.forEach($scope.block.vars, function (varItem) {
        if (varItem.required && $scope.isEmpty($scope.data, varItem.var)) {
          AdminToastService.error(i18nParam('js_block_attribute_empty', {
            label: varItem.label
          }));
          response = true;
        }
      });
      angular.forEach($scope.block.cfgs, function (varItem) {
        if (varItem.required && $scope.isEmpty($scope.cfgdata, varItem.var)) {
          AdminToastService.error(i18nParam('js_block_attribute_empty', {
            label: varItem.label
          }));
          response = true;
        }
      });
      return response;
    };

    $scope.isEmpty = function (values, key) {
      if (values.hasOwnProperty(key) && values[key]) {
        if (values[key].length == 0) {
          return true;
        }

        return false;
      }

      return true;
    };

    $scope.save = function () {
      if ($scope.isAnyRequiredAttributeEmpty()) {
        return;
      }

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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiU2VydmljZUN1cnJlbnRXZWJzaXRlIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsImN1cnJlbnRXZWJzaXRlIiwiJG9uIiwiZXZlbnQiLCJtZW51RGF0YSIsImFuZ3VsYXIiLCJjb3B5IiwibWVudURhdGFPcmlnaW5hbCIsImluaXQiLCJsZW5ndGgiLCJsb2FkIiwiY29udGFpbmVyIiwiY29udGFpbmVycyIsImlzSGlkZGVuIiwiJHdhdGNoIiwibiIsIml0ZW1zIiwidGl0bGUiLCJmb3JFYWNoIiwidmFsdWUiLCJidWJibGVQYXJlbnRzIiwicGFyZW50TmF2SWQiLCJjb250YWluZXJJZCIsImluZGV4IiwiaXRlbSIsImV4aXN0cyIsImkiLCJwdXNoIiwicGFyZW50X25hdl9pZCIsIm5hdl9jb250YWluZXJfaWQiLCJ0b2dnbGVyIiwidGVtcGxhdGUiLCJpMThuIiwiJGh0dHAiLCIkc3RhdGUiLCJnZXQiLCJwYXJhbXMiLCJ0aGVuIiwicmVzcG9uc2UiLCJwYXRoIiwidGVtcGxhdGVVcmwiLCJTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSIsIkFkbWluVG9hc3RTZXJ2aWNlIiwiZXJyb3IiLCJzdWNjZXNzIiwiJHBhcmVudCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImlzRGVmYXVsdEl0ZW0iLCJmaW5kIiwiaXNfZGVmYXVsdCIsImxhbmdfaWQiLCJuYXZpdGVtcyIsIm8iLCJ1bmRlZmluZWQiLCJhbGlhc1N1Z2dlc3Rpb24iLCJhbGlhcyIsImV4ZWMiLCJzYXZlIiwiaXNJbmxpbmUiLCJnZXRJdGVtIiwibmF2X2lkIiwicmVhc29uIiwia2V5IiwiU2VydmljZUxheW91dHNEYXRhIiwicGFyZW50IiwibmF2SXRlbUlkIiwibGF5b3V0X2lkIiwibGF5b3V0c0RhdGEiLCJhcnJheVRvU2VsZWN0IiwiaW5wdXQiLCJ2YWx1ZUZpZWxkIiwibGFiZWxGaWVsZCIsIm91dHB1dCIsInZlcnNpb25zRGF0YSIsImdldFZlcnNpb25MaXN0IiwiaXNFZGl0QXZhaWxhYmxlIiwidXNlX2RyYWZ0IiwiZnJvbV9kcmFmdF9pZCIsImRyYWZ0cyIsImxheW91dHMiLCJtb2R1bGVzIiwiY29udHJvbGxlcnMiLCJhY3Rpb25zIiwiYWRkUGFyYW0iLCJoYXNPd25Qcm9wZXJ0eSIsImFjdGlvbl9wYXJhbXMiLCJtb2R1bGVfbmFtZSIsImNvbnRyb2xsZXJfbmFtZSIsImZpbHRlciIsIndlYnNpdGVJZCIsInJlc3VsdCIsIndlYnNpdGVfaWQiLCJyZXR1cm5WYWx1ZSIsImZhY3RvcnkiLCJzZXJ2aWNlIiwic3RhdHVzIiwiZGVsZWdhdGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsInN0YXRlIiwidXJsIiwiZ28iLCJkYXNoYm9hcmQiLCJwb3N0IiwiaGVhZGVycyIsImNyZWF0ZU5ld1ZlcnNpb25TdWJtaXQiLCJjb3B5RXhpc3RpbmdWZXJzaW9uIiwidmVyc2lvbkxheW91dElkIiwiJCIsInBhcmFtIiwidmVyc2lvbk5hbWUiLCJmcm9tVmVyc2lvblBhZ2VJZCIsInJlZnJlc2hGb3JjZSIsImlzT3BlbiIsIml0ZW1TZWxlY3Rpb24iLCJzZWxlY3Rpb24iLCJOYXZJdGVtQ29udHJvbGxlciIsInNlbGVjdCIsImxvYWRJdGVtcyIsIk5hdkNvbnRyb2xsZXIiLCJuYXZEYXRhIiwibGFuZyIsInJlZnJlc2giLCJlcnJvckFycmF5IiwiJHJvb3RTY29wZSIsIlNlcnZpY2VMaXZlRWRpdE1vZGUiLCJsaXZlRWRpdFN0YXRlIiwibG9hZENtc0NvbmZpZyIsImNtc0NvbmZpZyIsInRvZ2dsZSIsImN1cnJlbnRXZWJzaXRlVG9nZ2xlciIsImRyb3BFbXB0eUNvbnRhaW5lciIsImRyYWdnZWQiLCJkcm9wcGVkIiwicG9zaXRpb24iLCJjYXRJZCIsIm1vdmVJdGVtSWQiLCJkcm9wcGVkT25DYXRJZCIsInN1Y2NlcyIsImRyb3BJdGVtIiwiZHJhZyIsImRyb3AiLCJwb3MiLCJhcGkiLCJkcm9wcGVkQWZ0ZXJJdGVtSWQiLCJkcm9wcGVkQmVmb3JlSXRlbUlkIiwiZHJvcHBlZE9uSXRlbUlkIiwidmFsaWRJdGVtIiwiaG92ZXIiLCJkcmFnZWQiLCJycml0ZW1zIiwicmVjdXJzaXZJdGVtVmFsaWRpdHkiLCJpbmRleE9mIiwidG9nZ2xlSXRlbSIsInRvZ2dsZV9vcGVuIiwiaWdub3JlTG9hZGluZ0JhciIsImNoYW5nZVVybCIsIm5hdl9pdGVtX2lkIiwic2hvd0RyYWciLCJpc0N1cnJlbnRFbGVtZW50IiwiaGlkZGVuQ2F0cyIsInRvZ2dsZUNhdCIsInRvZ2dsZUlzSGlkZGVuIiwiJHEiLCJyZXNvbHZlIiwicmVqZWN0IiwiJHN0YXRlUGFyYW1zIiwiUGxhY2Vob2xkZXJTZXJ2aWNlIiwiU2VydmljZVByb3BlcnRpZXNEYXRhIiwiQWRtaW5DbGFzc1NlcnZpY2UiLCJBZG1pbkxhbmdTZXJ2aWNlIiwiSHRtbFN0b3JhZ2UiLCJwYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuIiwicGFnZVNldHRpbmdzT3ZlcmxheVRhYiIsInRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkiLCJ0IiwibmF2Q2ZnIiwiaGVscHRhZ3MiLCJsdXlhY2ZnIiwiZGlzcGxheUxpdmVDb250YWluZXIiLCJsaXZlVXJsIiwicHJvcGVydGllc0RhdGEiLCJwbGFjZWhvbGRlclN0YXRlIiwiaXNCbG9ja2hvbGRlclNtYWxsIiwiZ2V0VmFsdWUiLCJ0b2dnbGVCbG9ja2hvbGRlclNpemUiLCJzZXRWYWx1ZSIsInNpZGViYXIiLCJlbmFibGVTaWRlYmFyIiwidG9nZ2xlU2lkZWJhciIsInNob3dBY3Rpb25zIiwicGFyc2VJbnQiLCJpc0RlbGV0ZWQiLCJwcm9wVmFsdWVzIiwiaGFzVmFsdWVzIiwicGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHkiLCJzYXZlUGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHlBc1RlbXBsYXRlIiwibG9hZE5hdlByb3BlcnRpZXMiLCJkIiwiYWRtaW5fcHJvcF9pZCIsInRvZ2dsZVByb3BNYXNrIiwic2hvd1Byb3BGb3JtIiwic3RvcmVQcm9wVmFsdWVzIiwidHJhc2giLCJjb25maXJtIiwiJHRvYXN0IiwiY2xvc2UiLCJpc0RyYWZ0Iiwic3VibWl0TmF2Rm9ybSIsImkxOG5QYXJhbSIsIm1lc3NhZ2UiLCJpc19vZmZsaW5lIiwib2ZmbGluZVN0YXR1cyIsImluZm8iLCJpc19oaWRkZW4iLCJoaWRkZW5TdGF0dXMiLCJpc19ob21lIiwiaG9tZVN0YXRlIiwiJHRpbWVvdXQiLCJTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uIiwibG9hZGVkIiwib3BlbkxpdmVVcmwiLCJ2ZXJzaW9uSWQiLCJsb2FkTGl2ZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbiIsImlzVHJhbnNsYXRlZCIsIml0ZW1Db3B5Iiwic2V0dGluZ3MiLCJ0eXBlRGF0YUNvcHkiLCJ0eXBlRGF0YSIsImVycm9ycyIsImhvbWVVcmwiLCJjdXJyZW50UGFnZVZlcnNpb25BbGlhcyIsInRyYXNoSXRlbSIsImRlbGV0ZSIsIiRicm9hZGNhc3QiLCJyZXNldCIsIm5hdl9pdGVtX3R5cGVfaWQiLCJ1cGRhdGVOYXZJdGVtRGF0YSIsInRpdGxlX3RhZyIsImRlc2NyaXB0aW9uIiwia2V5d29yZHMiLCJ0aW1lc3RhbXBfY3JlYXRlIiwiaW1hZ2VfaWQiLCJpc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQiLCJpc19jYWNoZWFibGUiLCJwYWdlVmVyc2lvbktleSIsIk9iamVjdCIsImtleXMiLCJ0b2dnbGVTZXR0aW5nc092ZXJsYXkiLCJlcnJvckNhbGxiYWNrIiwicmVtb3ZlVmVyc2lvbiIsInZlcnNpb24iLCJ2ZXJzaW9uX2FsaWFzIiwicGFnZUlkIiwiZWRpdFZlcnNpb25JdGVtIiwidGFiIiwiZWRpdFZlcnNpb24iLCJ2ZXJzaW9uSXRlbSIsImNoYW5nZVRhYiIsImVkaXRWZXJzaW9uVXBkYXRlIiwibGFuZ0lkIiwibWV0aG9kIiwibGFzdFZlcnNpb24iLCJoYXNWZXJzaW9uIiwic3dpdGNoVmVyc2lvbiIsInZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSIsInRvZ2dsZVZlcnNpb25zRHJvcGRvd24iLCJwYWdlVmVyc2lvbmlkIiwic3RvcmUiLCJpc0luU2VsZWN0aW9uIiwic2hvcnRfY29kZSIsInNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkiLCJyZWZyZXNoTmVzdGVkIiwicHJldklkIiwicGxhY2Vob2xkZXJWYXIiLCJuYXZJdGVtUGFnZUlkIiwiX19wbGFjZWhvbGRlcnMiLCJwbGFjZWhvbGRlciIsInJldlBsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVycyIsInJlcGxhY2VDb250ZW50IiwicGxhY2Vob2xkZXJSb3ciLCJwbGFjZWhvbGRlcktleSIsInByZXZfaWQiLCJyZXZGaW5kIiwiaG9sZGVyS2V5IiwiaG9sZGVyIiwiZHJvcEl0ZW1QbGFjZWhvbGRlciIsInNvcnRfaW5kZXgiLCJibG9ja19pZCIsInBsYWNlaG9sZGVyX3ZhciIsIm5hdl9pdGVtX3BhZ2VfaWQiLCJjb3B5QmxvY2tJZCIsInB1dCIsIiRzY2UiLCJTZXJ2aWNlQmxvY2tDb3B5U3RhY2siLCJOYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyIiwidmFyIiwiZWxlbWVudCIsInNvcnRJbmRleCIsIiRpbmRleCIsInJlbW92ZSIsImNvcHlCbG9jayIsImJsb2NrIiwidG9nZ2xlSGlkZGVuIiwiYmxvY2tJZCIsImhpZGRlblN0YXRlIiwibmFtZSIsImlzRWRpdGFibGUiLCJ2YXJzIiwiaXNDb25maWd1cmFibGUiLCJjZmdzIiwidmFsdWVzIiwidmFyaWF0aW9uIiwiZXZhbFZhcmlhdGlvblZpc2JpbGl0eSIsImdldEluZm8iLCJ2YXJGaWVsZE5hbWUiLCJmaWVsZF9oZWxwIiwidmFyaWF0ZW5OYW1lIiwidmFyaWF0aW9ucyIsImlzT2JqZWN0IiwidiIsImsiLCJvYmplY3QiLCJpbnZpc2libGUiLCJjZmdkYXRhIiwiY2ZndmFsdWVzIiwiZWRpdCIsIm1vZGFsSGlkZGVuIiwibW9kYWxNb2RlIiwiaW5pdE1vZGFsTW9kZSIsInRvZ2dsZUVkaXQiLCJyZW5kZXJUZW1wbGF0ZSIsImRhdGFWYXJzIiwiY2ZnVmFycyIsImV4dHJhcyIsIlR3aWciLCJ0d2lnIiwiY29udGVudCIsInJlbmRlciIsInRydXN0QXNIdG1sIiwicmVtb3ZlQmxvY2siLCJpc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkiLCJ2YXJJdGVtIiwicmVxdWlyZWQiLCJpc0VtcHR5IiwibGFiZWwiLCJqc29uX2NvbmZpZ192YWx1ZXMiLCJqc29uX2NvbmZpZ19jZmdfdmFsdWVzIiwiaXNfZGlydHkiLCJvYmplY3RkZXRhaWwiLCJTZXJ2aWNlQmxvY2tzRGF0YSIsImJsb2Nrc0RhdGEiLCJibG9ja3NEYXRhUmVzdG9yZSIsImJsb2Nrc0RhdGFSZWxvYWQiLCJhZGRUb0ZhdiIsInJlbW92ZUZyb21GYXYiLCJ0b2dnbGVHcm91cCIsImdyb3VwIiwiaXNQcmV2aWV3RW5hYmxlZCIsInByZXZpZXdfZW5hYmxlZCIsImNvcHlTdGFjayIsInN0YWNrIiwiY2xlYXJTdGFjayIsImNsZWFyIiwic2VhcmNoUXVlcnkiLCJzZWFyY2hJc0RpcnR5IiwiaXNfZmF2Iiwic3BsaWNlIiwicmVzb2x2ZXJQcm92aWRlciIsImFkZENhbGxiYWNrIiwiTHV5YUxvYWRpbmciLCJzdGFydCIsInIiLCJzdG9wIiwic2hpZnQiLCJpY29uIiwiY29weXN0YWNrIiwiZm9yY2VSZWxvYWQiLCJzZXRVcmwiLCJpdGVtSWQiLCJEYXRlIiwiZ2V0VGltZSIsInByZXZpZXdVcmwiLCJkZWZhdWx0V2Vic2l0ZSIsIndlYnNpdGVzIiwidyIsInBhZ2UiXSwibWFwcGluZ3MiOiI7O0FBQUEsQ0FBQyxZQUFXO0FBQ1gsZUFEVyxDQUdY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LGNBQVIsQ0FBdUJELEVBQXZCLEtBQThCZ0csU0FBOUQsQ0FBYixFQUF1RjtBQUN0RkssTUFBQUEsT0FBTyxDQUFDcEcsY0FBUixHQUF5QlgsZUFBZSxDQUFDUyxJQUFoQixDQUFxQjRZLFFBQXJCLENBQThCcFYsSUFBOUIsQ0FBbUMsVUFBQXFWLENBQUM7QUFBQSxlQUFJQSxDQUFDLENBQUM1WSxFQUFGLEtBQVNnRyxTQUFiO0FBQUEsT0FBcEMsQ0FBekI7QUFDQW1DLE1BQUFBLFVBQVUsQ0FBQ2lILFVBQVgsQ0FBc0IsK0JBQXRCLEVBQXVEL0ksT0FBTyxDQUFDcEcsY0FBL0Q7QUFDQTtBQUNELEdBTEQ7O0FBT0EsU0FBT29HLE9BQVA7QUFDQSxDQXBCb0MsQ0FBckM7QUFzQkFqSCxHQUFHLENBQUNnSCxPQUFKLENBQVksMkJBQVosRUFBeUMsQ0FBQyxZQUFXO0FBQ3BELE1BQUlDLE9BQU8sR0FBRztBQUNid1MsSUFBQUEsSUFBSSxFQUFHO0FBRE0sR0FBZDs7QUFNQXhTLEVBQUFBLE9BQU8sQ0FBQ2lMLEtBQVIsR0FBZ0IsVUFBU2YsTUFBVCxFQUFpQmhDLFNBQWpCLEVBQTRCO0FBQzNDbEksSUFBQUEsT0FBTyxDQUFDd1MsSUFBUixDQUFhdEksTUFBYixJQUF1QmhDLFNBQXZCO0FBQ0EsR0FGRDs7QUFLQWxJLEVBQUFBLE9BQU8sQ0FBQzRLLFVBQVIsR0FBcUIsVUFBU1YsTUFBVCxFQUFpQjtBQUNyQyxRQUFJbEssT0FBTyxDQUFDd1MsSUFBUixDQUFhbFQsY0FBYixDQUE0QjRLLE1BQTVCLENBQUosRUFBeUM7QUFDeEMsYUFBT2xLLE9BQU8sQ0FBQ3dTLElBQVIsQ0FBYXRJLE1BQWIsQ0FBUDtBQUNBOztBQUVELFdBQU8sS0FBUDtBQUNBLEdBTkQ7O0FBUUEsU0FBT2xLLE9BQVA7QUFDQSxDQXJCd0MsQ0FBekMiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFxuXHQvLyBkaXJlY3RpdmUuanNcblxuICAgIHphYS5kaXJlY3RpdmUoXCJtZW51RHJvcGRvd25cIiwgWydTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgJyRmaWx0ZXInLCBmdW5jdGlvbihTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSwgJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3QgOiAnRScsXG4gICAgICAgICAgICBzY29wZSA6IHtcbiAgICAgICAgICAgICAgICBuYXZJZCA6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIgOiBbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmF2SWQgPSBkYXRhLmlkO1xuICAgICAgICAgICAgICAgIH1cblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShTZXJ2aWNlTWVudURhdGEuZGF0YSk7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YU9yaWdpbmFsID0gYW5ndWxhci5jb3B5KFNlcnZpY2VNZW51RGF0YS5kYXRhKTtcblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShkYXRhKTtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFPcmlnaW5hbCA9IGFuZ3VsYXIuY29weShkYXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubWVudURhdGEubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjb250YWluZXIgaW4gJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVyXS5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdzZWFyY2hRdWVyeScsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobiA9PSBudWxsIHx8IG4gPT0gJycpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YS5pdGVtcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBpdGVtcyA9ICRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zLCB7dGl0bGU6IG59KTtcblxuXHRcdFx0XHRcdC8vIGZpbmQgYWxsIHBhcmVudCBlbGVtZW50cyBvZiB0aGUgZm91bmQgZWxlbWVudHMgYW5kIHJlIGFkZCB0aGVtIHRvIHRoZSBtYXAgaW4gb3JkZXIgdG8gXG5cdFx0XHRcdFx0Ly8gZW5zdXJlIGEgY29ycmVjdCBtZW51IHRyZWUuXG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlWydwYXJlbnRfbmF2X2lkJ10gPiAwKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzKHZhbHVlWydwYXJlbnRfbmF2X2lkJ10sIHZhbHVlWyduYXZfY29udGFpbmVyX2lkJ10sIGl0ZW1zKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YS5pdGVtcyA9IGl0ZW1zO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyA9IGZ1bmN0aW9uKHBhcmVudE5hdklkLCBjb250YWluZXJJZCwgaW5kZXgpIHtcblx0XHRcdFx0XHR2YXIgaXRlbSA9ICRmaWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicpKCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHRcdFx0XHRcdGlmIChpdGVtKSB7XG5cdFx0XHRcdFx0XHR2YXIgZXhpc3RzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaW5kZXgsIGZ1bmN0aW9uKGkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGkuaWQgPT0gaXRlbS5pZCkge1xuXHRcdFx0XHRcdFx0XHRcdGV4aXN0cyA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRpZiAoIWV4aXN0cykge1xuXHRcdFx0XHRcdFx0XHRpbmRleC5wdXNoKGl0ZW0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMoaXRlbS5wYXJlbnRfbmF2X2lkLCBpdGVtLm5hdl9jb250YWluZXJfaWQsIGluZGV4KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlciA9IHRydWU7XG5cblx0XHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB0ZW1wbGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJzxkaXY+Jytcblx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwIG1iLTJcIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1wcmVwZW5kXCIgbmctaGlkZT1cInNlYXJjaFF1ZXJ5XCI+PGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+c2VhcmNoPC9pPjwvZGl2PjwvZGl2PicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXByZXBlbmRcIiBuZy1zaG93PVwic2VhcmNoUXVlcnlcIiBuZy1jbGljaz1cInNlYXJjaFF1ZXJ5ID0gXFwnXFwnXCI+PGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+Y2xlYXI8L2k+PC9kaXY+PC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBuZy1tb2RlbD1cInNlYXJjaFF1ZXJ5XCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIicraTE4blsnbmdyZXN0X2NydWRfc2VhcmNoX3RleHQnXSsnXCI+Jytcblx0XHRcdFx0XHQnPC9kaXY+JyArIFxuXHRcdFx0XHRcdCc8ZGl2IG5nLXJlcGVhdD1cIihrZXksIGNvbnRhaW5lcikgaW4gbWVudURhdGEuY29udGFpbmVycyB8IG1lbnV3ZWJzaXRlZmlsdGVyOmN1cnJlbnRXZWJzaXRlLmlkXCIgbmctaWY9XCIobWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDowKS5sZW5ndGggPiAwXCIgY2xhc3M9XCJjYXJkIG1iLTJcIiBuZy1jbGFzcz1cIntcXCdjYXJkLWNsb3NlZFxcJzogIWNvbnRhaW5lci5pc0hpZGRlbn1cIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlclwiIG5nLWNsaWNrPVwiY29udGFpbmVyLmlzSGlkZGVuPSFjb250YWluZXIuaXNIaWRkZW5cIj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBjYXJkLXRvZ2dsZS1pbmRpY2F0b3JcIj5rZXlib2FyZF9hcnJvd19kb3duPC9zcGFuPicrXG5cdFx0XHRcdFx0XHRcdCc8c3Bhbj57e2NvbnRhaW5lci5uYW1lfX08L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj4nKyBcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ0cmVldmlldyB0cmVldmlldy1jaG9vc2VyXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0Jzx1bCBjbGFzcz1cInRyZWV2aWV3LWl0ZW1zIHRyZWV2aWV3LWl0ZW1zLWx2bDFcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJ0cmVldmlldy1pdGVtIHRyZWV2aWV3LWl0ZW0tbHZsMVwiIG5nLWNsYXNzPVwie1xcJ3RyZWV2aWV3LWl0ZW0taGFzLWNoaWxkcmVuXFwnIDogKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCkubGVuZ3RofVwiIG5nLXJlcGVhdD1cIihrZXksIGRhdGEpIGluIG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCB0cmFjayBieSBkYXRhLmlkXCIgbmctaW5jbHVkZT1cIlxcJ21lbnVEcm9wZG93blJldmVyc2VcXCdcIj48L2xpPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3VsPicgK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0JzwvZGl2PicrXG5cdFx0XHRcdCc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJ6YWFDbXNQYWdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwiPVwiLFxuICAgICAgICAgICAgICAgIFwib3B0aW9uc1wiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQGxhYmVsXCIsXG4gICAgICAgICAgICAgICAgXCJpMThuXCI6IFwiQGkxOG5cIixcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiQGZpZWxkaWRcIixcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJAZmllbGRuYW1lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcdHJldHVybiAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIGZvcm0tc2lkZS1ieS1zaWRlXCIgbmctY2xhc3M9XCJ7XFwnaW5wdXQtLWhpZGUtbGFiZWxcXCc6IGkxOG59XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGUgZm9ybS1zaWRlLWxhYmVsXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWw+e3tsYWJlbH19PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxtZW51LWRyb3Bkb3duIGNsYXNzPVwibWVudS1kcm9wZG93blwiIG5hdi1pZD1cIm1vZGVsXCI+PC9tZW51LWRyb3Bkb3duPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblx0emFhLmRpcmVjdGl2ZShcInNob3dJbnRlcm5hbFJlZGlyZWN0aW9uXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRuYXZJZCA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkc3RhdGUpIHtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCduYXZJZCcsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1pdGVtLXBhdGgnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnBhdGggPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9nZXQtbmF2LWNvbnRhaW5lci1uYW1lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dLFxuXHRcdFx0dGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8YSBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbVwiIHVpLXNyZWY9XCJjdXN0b20uY21zZWRpdCh7IG5hdklkIDogbmF2SWQsIHRlbXBsYXRlSWQ6IFxcJ2Ntc2FkbWluL2RlZmF1bHQvaW5kZXhcXCd9KVwiPnt7cGF0aH19PC9hPiBpbiB7e2NvbnRhaW5lcn19Jztcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1cIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gZmFsc2U7XG5cblx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudSA9ICRzY29wZS5tZW51RGF0YS5pdGVtcztcblx0XHRcdFx0XHQkc2NvcGUubmF2Y29udGFpbmVycyA9ICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdGlhbGl6ZXIoKTtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPSAxO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuaXNfZHJhZnQgPSAwO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHRpZiAoU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlLmRlZmF1bHRfY29udGFpbmVyX2lkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGFuZ3VhZ2VzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuaXNEZWZhdWx0SXRlbSA9ICRzY29wZS5sYW5ndWFnZXNEYXRhLmZpbmQoaXRlbSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW0uaXNfZGVmYXVsdDtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9ICRzY29wZS5pc0RlZmF1bHRJdGVtLmlkO1xuXG5cdFx0XHRcdCRzY29wZS5uYXZpdGVtcyA9IFtdO1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiAhPT0gdW5kZWZpbmVkICYmIG4gIT09IG8pIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLnBhcmVudF9uYXZfaWQgPSAwO1xuXHRcdFx0XHRcdFx0JHNjb3BlLm5hdml0ZW1zID0gJHNjb3BlLm1lbnVbbl1bJ19faXRlbXMnXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hbGlhc1N1Z2dlc3Rpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuZGF0YS50aXRsZSk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnZGF0YS5hbGlhcycsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiE9byAmJiBuIT1udWxsKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKShuKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5leGVjID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5jb250cm9sbGVyLnNhdmUoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdCRzY29wZS5lcnJvciA9IFtdO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEudGl0bGUgPSBudWxsO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSBudWxsO1xuXHRcdFx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLmlzSW5saW5lKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LiRwYXJlbnQuZ2V0SXRlbSgkc2NvcGUuZGF0YS5sYW5nX2lkLCAkc2NvcGUuZGF0YS5uYXZfaWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWyd2aWV3X2luZGV4X3BhZ2Vfc3VjY2VzcyddKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZWFzb24pIHtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZWFzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IodmFsdWVbMF0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3IgPSByZWFzb247XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qKiBQQUdFIENSRUFURSAmIFVQREFURSAqL1xuICAgIHphYS5kaXJlY3RpdmUoXCJ1cGRhdGVGb3JtUGFnZVwiLCBbJ1NlcnZpY2VMYXlvdXRzRGF0YScsIGZ1bmN0aW9uKFNlcnZpY2VMYXlvdXRzRGF0YSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3QgOiAnRUEnLFxuICAgICAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgICAgICAgZGF0YSA6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsIDogJ3VwZGF0ZWZvcm1wYWdlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXG4gICAgICAgICAgICBcdCRzY29wZS5wYXJlbnQgPSAkc2NvcGUuJHBhcmVudC4kcGFyZW50O1xuXHRcdFx0XHQkc2NvcGUubmF2SXRlbUlkID0gJHNjb3BlLnBhcmVudC5pdGVtLmlkO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGF5b3V0X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLmFycmF5VG9TZWxlY3QgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWVGaWVsZCwgbGFiZWxGaWVsZCkge1xuXHRcdFx0XHRcdHZhciBvdXRwdXQgPSBbXTtcblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRvdXRwdXQucHVzaCh7XCJsYWJlbFwiOiB2YWx1ZVtsYWJlbEZpZWxkXSwgXCJ2YWx1ZVwiOiB2YWx1ZVt2YWx1ZUZpZWxkXX0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpMYXlvdXRzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gW107IC8vICRzY29wZS5hcnJheVRvU2VsZWN0KGRhdGEpOyAvLyBAVE9ETyBSRU1PVkUgSUYgVkVSSUZJRURcblx0XHRcdFx0fSk7XG5cblxuXHRcdFx0XHQkc2NvcGUudmVyc2lvbnNEYXRhID0gW107XG5cblx0XHRcdFx0JHNjb3BlLmdldFZlcnNpb25MaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlL3ZlcnNpb25zJywgeyBwYXJhbXMgOiB7IG5hdkl0ZW1JZCA6ICRzY29wZS5uYXZJdGVtSWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS52ZXJzaW9uc0RhdGEgPSAkc2NvcGUuYXJyYXlUb1NlbGVjdChyZXNwb25zZS5kYXRhLCAnaWQnLCAndmVyc2lvbl9hbGlhcycpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICBcdCRzY29wZS5pc0VkaXRBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnZlcnNpb25zRGF0YS5sZW5ndGg7XG4gICAgICAgICAgICBcdH07XG5cblx0XHRcdFx0ZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdFx0XHQkc2NvcGUuZ2V0VmVyc2lvbkxpc3QoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGluaXQoKTtcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cblx0fV0pO1xuXHR6YWEuZGlyZWN0aXZlKFwiY3JlYXRlRm9ybVBhZ2VcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybXBhZ2UuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdFx0XHQkc2NvcGUuZGF0YS51c2VfZHJhZnQgPSAwO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYXlvdXRfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5mcm9tX2RyYWZ0X2lkID0gMDtcblxuXHRcdFx0XHQvKiBsYXlvdXRzRGF0YSAqL1xuXG5cdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgICAgICAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICAgICAgICAgIFx0fSk7XG5cbiAgICAgICAgICAgIFx0LyogbWVudURhdGEgKi9cblxuICAgIFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hcnJheVRvU2VsZWN0ID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlRmllbGQsIGxhYmVsRmllbGQpIHtcblx0XHRcdFx0XHR2YXIgb3V0cHV0ID0gW107XG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goe1wibGFiZWxcIjogdmFsdWVbbGFiZWxGaWVsZF0sIFwidmFsdWVcIjogdmFsdWVbdmFsdWVGaWVsZF19KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICBcdGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICBcdFx0JHNjb3BlLmRyYWZ0cyA9ICRzY29wZS5hcnJheVRvU2VsZWN0KCRzY29wZS5tZW51RGF0YS5kcmFmdHMsICdpZCcsICd0aXRsZScpO1xuXHRcdFx0XHRcdCRzY29wZS5sYXlvdXRzID0gJHNjb3BlLmFycmF5VG9TZWxlY3QoJHNjb3BlLmxheW91dHNEYXRhLCAnaWQnLCAnbmFtZScpO1xuICAgICAgICAgICAgXHR9XG5cbiAgICAgICAgICAgIFx0aW5pdCgpO1xuXG5cdFx0XHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHNjb3BlLiRwYXJlbnQuZXhlYygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogUGFnZSBNT0RVTEUgKi9cblxuXHR6YWEuZGlyZWN0aXZlKFwiZm9ybU1vZHVsZVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdmb3JtbW9kdWxlLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXG5cdFx0XHRcdCRzY29wZS5tb2R1bGVzID0gW107XG5cdFx0XHRcdCRzY29wZS5jb250cm9sbGVycyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuYWN0aW9ucyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUucGFyYW1zID0ge307XG5cblx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktYWRtaW4tY29tbW9uL2RhdGEtbW9kdWxlcycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0XHRcdGlmICghJHNjb3BlLmRhdGEuaGFzT3duUHJvcGVydHkoJ2FjdGlvbl9wYXJhbXMnKSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtcyA9IHt9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hY3Rpb25fcGFyYW1zW2tleV0gPSAnJztcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuZGF0YS5tb2R1bGVfbmFtZTtcblx0XHRcdFx0fSwgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vbW9kdWxlLWNvbnRyb2xsZXJzP21vZHVsZT0nICsgbikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYWN0aW9ucyA9IFtdO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuZGF0YS5jb250cm9sbGVyX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL2NvbnRyb2xsZXItYWN0aW9ucz9tb2R1bGU9Jyskc2NvcGUuZGF0YS5tb2R1bGVfbmFtZSsnJmNvbnRyb2xsZXI9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dXG5cdFx0fVxuXHR9KTtcblxuXHQvKiBmaWx0ZXJzICovXG5cblx0emFhLmZpbHRlcihcIm1lbnV3ZWJzaXRlZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgd2Vic2l0ZUlkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLndlYnNpdGVfaWQgPT0gd2Vic2l0ZUlkKSB7XG5cdFx0XHRcdFx0cmVzdWx0LnB1c2godmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblx0fSk7XG5cblx0emFhLmZpbHRlcihcIm1lbnVwYXJlbnRmaWx0ZXJcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciByZXN1bHQgPSBbXTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAodmFsdWUucGFyZW50X25hdl9pZCA9PSBwYXJlbnROYXZJZCAmJiB2YWx1ZS5uYXZfY29udGFpbmVyX2lkID09IGNvbnRhaW5lcklkKSB7XG5cdFx0XHRcdFx0cmVzdWx0LnB1c2godmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblx0fSk7XG5cblx0emFhLmZpbHRlcignbWVudWNoaWxkZmlsdGVyJywgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciByZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICghcmV0dXJuVmFsdWUpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUuaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcmV0dXJuVmFsdWU7XG5cdFx0fTtcblx0fSk7XG5cblx0LyogZmFjdG9yeS5qcyAqL1xuXG5cdHphYS5mYWN0b3J5KCdQbGFjZWhvbGRlclNlcnZpY2UnLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VydmljZSA9IFtdO1xuXG5cdFx0c2VydmljZS5zdGF0dXMgPSAxOyAvKiAxID0gc2hvd3BsYWNlaG9sZGVyczsgMCA9IGhpZGUgcGxhY2Vob2xkZXJzICovXG5cblx0XHRzZXJ2aWNlLmRlbGVnYXRlID0gZnVuY3Rpb24oc3RhdHVzKSB7XG5cdFx0XHRzZXJ2aWNlLnN0YXR1cyA9IHN0YXR1cztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHNlcnZpY2U7XG5cdH0pO1xuXG5cdC8qIGxheW91dC5qcyAqL1xuXG5cdHphYS5jb25maWcoWyckc3RhdGVQcm92aWRlcicsIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdFx0JHN0YXRlUHJvdmlkZXJcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZWRpdFwiLCB7XG5cdFx0XHR1cmwgOiBcIi91cGRhdGUvOm5hdklkXCIsXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjbXNhZG1pbi9wYWdlL3VwZGF0ZSdcblx0XHR9KVxuXHRcdC5zdGF0ZShcImN1c3RvbS5jbXNhZGRcIiwge1xuXHRcdFx0dXJsIDogXCIvY3JlYXRlXCIsXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjbXNhZG1pbi9wYWdlL2NyZWF0ZSdcblx0XHR9KVxuXHRcdC5zdGF0ZShcImN1c3RvbS5jbXNkcmFmdFwiLCB7XG5cdFx0XHR1cmw6ICcvZHJhZnRzJyxcblx0XHRcdHRlbXBsYXRlVXJsOiAnY21zYWRtaW4vcGFnZS9kcmFmdHMnXG5cdFx0fSk7XG5cdH1dKTtcblxuXHQvKiBjb250cm9sbGVycyAqL1xuXG5cdHphYS5jb250cm9sbGVyKFwiRHJhZnRzQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckc3RhdGUnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuZ28gPSBmdW5jdGlvbihuYXZJZCkge1xuXHRcdFx0JHN0YXRlLmdvKCdjdXN0b20uY21zZWRpdCcsIHsgbmF2SWQgOiBuYXZJZCB9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNEYXNoYm9hcmRcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cdFx0JHNjb3BlLmRhc2hib2FyZCA9IFtdO1xuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXNoYm9hcmQtbG9nJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhc2hib2FyZCA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0fSk7XG5cdH1dKTtcblx0XG5cdHphYS5jb250cm9sbGVyKFwiQ29uZmlnQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdBZG1pblRvYXN0U2VydmljZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEFkbWluVG9hc3RTZXJ2aWNlKSB7XG5cdFx0JHNjb3BlLmRhdGEgPSB7fTtcblxuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHQkc2NvcGUuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnLCAkc2NvcGUuZGF0YSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX2NvbmZpZ191cGRhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiUGFnZVZlcnNpb25zQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIEFkbWluVG9hc3RTZXJ2aWNlKSB7XG5cdFx0LyoqXG5cdFx0ICogQHZhciBvYmplY3QgJHR5cGVEYXRhIEZyb20gcGFyZW50IHNjb3BlIGNvbnRyb2xsZXIgTmF2SXRlbUNvbnRyb2xsZXJcblx0XHQgKiBAdmFyIG9iamVjdCAkaXRlbSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBzdHJpbmcgJHZlcnNpb25OYW1lIEZyb20gbmctbW9kZWxcblx0XHQgKiBAdmFyIGludGVnZXIgJGZyb21WZXJzaW9uUGFnZUlkIEZyb20gbmctbW9kZWwgdGhlIHZlcnNpb24gY29weSBmcm9tIG9yIDAgPSBuZXcgZW1wdHkvYmxhbmsgdmVyc2lvblxuXHRcdCAqIEB2YXIgaW50ZWdlciAkdmVyc2lvbkxheW91dElkIEZyb20gbmctbW9kZWwsIG9ubHkgaWYgZnJvbVZlcnNpb25QYWdlSWQgaXMgMFxuIFx0XHQgKi9cblx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHQvKiBsYXlvdXRzRGF0YSAqL1xuXG5cdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgIFx0fSk7XG5cbiAgICBcdC8qIGNvbnRyb2xsZXIgbG9naWMgKi9cblxuXHRcdCRzY29wZS5jcmVhdGVOZXdWZXJzaW9uU3VibWl0ID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmIChkYXRhLmNvcHlFeGlzdGluZ1ZlcnNpb24pIHtcblx0XHRcdFx0ZGF0YS52ZXJzaW9uTGF5b3V0SWQgPSAwO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2NyZWF0ZS1wYWdlLXZlcnNpb24nLCAkLnBhcmFtKHsnbGF5b3V0SWQnOiBkYXRhLnZlcnNpb25MYXlvdXRJZCwgJ25hdkl0ZW1JZCc6ICRzY29wZS5pdGVtLmlkLCAnbmFtZSc6IGRhdGEudmVyc2lvbk5hbWUsICdmcm9tUGFnZUlkJzogZGF0YS5mcm9tVmVyc2lvblBhZ2VJZH0pLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLmVycm9yKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfdmVyc2lvbl9lcnJvcl9lbXB0eV9maWVsZHMnXSk7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc192ZXJzaW9uX2NyZWF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ29weVBhZ2VDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBBZG1pblRvYXN0U2VydmljZSkge1xuXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0JHNjb3BlLiRvbignZGVsZXRlZE5hdkl0ZW0nLCBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5pc09wZW4gPSBmYWxzZTtcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW9uID0gMDtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5OYXZJdGVtQ29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0JHNjb3BlLm5hdklkID0gMDtcblxuXHRcdCRzY29wZS5pdGVtcyA9IG51bGw7XG5cblx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cblx0XHQkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IGl0ZW0uaWQ7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGFuZ3VsYXIuY29weShpdGVtKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnaXRlbVNlbGVjdGlvbi50aXRsZScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdCRzY29wZS5hbGlhc1N1Z2dlc3Rpb24oKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKCRzY29wZS5pdGVtU2VsZWN0aW9uLnRpdGxlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLm5hdklkID0gJHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5pZDtcblxuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9maW5kLW5hdi1pdGVtcycsIHsgcGFyYW1zOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtcyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdCRzY29wZS5pc09wZW4gPSB0cnVlO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvblsndG9MYW5nSWQnXSA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5sYW5nLmlkO1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLWZyb20tcGFnZScsICQucGFyYW0oJHNjb3BlLml0ZW1TZWxlY3Rpb24pLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9vayddKTtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIucmVmcmVzaCgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX2FkZGVkX3RyYW5zbGF0aW9uX2Vycm9yJ10pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc01lbnVUcmVlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRzdGF0ZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkaHR0cCwgJGZpbHRlciwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUpIHtcblxuXHRcdC8vIGxpdmUgZWRpdCBzZXJ2aWNlXG5cblx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IDA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdsaXZlRWRpdFN0YXRlVG9nZ2xlcicsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmxvYWRDbXNDb25maWcgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRyb290U2NvcGUuY21zQ29uZmlnID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmxvYWRDbXNDb25maWcoKTtcblx0XHRcblx0XHQvLyBtZW51IERhdGFcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjdXJyZW50V2Vic2l0ZVRvZ2dsZXInLCBmdW5jdGlvbihpZCkge1xuXHRcdFx0U2VydmljZUN1cnJlbnRXZWJzaXRlLnRvZ2dsZShpZCk7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YSkge1xuXHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBkYXRhO1xuXHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGVUb2dnbGVyID0gZGF0YS5pZDtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGNvbnRyb2xsZXIgbG9naWNcblx0XHRcblx0XHQkc2NvcGUuZHJvcEVtcHR5Q29udGFpbmVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uLGNhdElkKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNvbnRhaW5lcicsIHsgcGFyYW1zOiB7bW92ZUl0ZW1JZDogZHJhZ2dlZC5pZCwgZHJvcHBlZE9uQ2F0SWQ6IGNhdElkfX0pLnRoZW4oZnVuY3Rpb24oc3VjY2VzKSB7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuZHJvcEl0ZW0gPSBmdW5jdGlvbihkcmFnLGRyb3AscG9zKSB7XG5cdFx0XHRpZiAocG9zID09ICdib3R0b20nKSB7XG5cdFx0XHRcdHZhciBhcGkgPSAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtYWZ0ZXInO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRBZnRlckl0ZW1JZDogZHJvcC5pZH07XG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAndG9wJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWJlZm9yZSc7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7bW92ZUl0ZW1JZDogZHJhZy5pZCwgZHJvcHBlZEJlZm9yZUl0ZW1JZDogZHJvcC5pZH07XG5cblx0XHRcdH0gZWxzZSBpZiAocG9zID09ICdtaWRkbGUnKSB7XG5cdFx0XHRcdHZhciBhcGkgPSAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtdG8tY2hpbGQnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRPbkl0ZW1JZDogZHJvcC5pZH07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCRodHRwLmdldChhcGksIHsgcGFyYW1zIDogcGFyYW1zIH0pLnRoZW4oZnVuY3Rpb24oc3VjY2Vzcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0sIGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUudmFsaWRJdGVtID0gZnVuY3Rpb24oaG92ZXIsIGRyYWdlZCkge1xuXHRcdFx0XG5cdFx0XHRpZiAoaG92ZXIuaWQgPT0gZHJhZ2VkLmlkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0JHNjb3BlLnJyaXRlbXMgPSBbXTtcblx0XHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eShkcmFnZWQubmF2X2NvbnRhaW5lcl9pZCwgZHJhZ2VkLmlkKTtcblx0XHRcdFxuXHRcdFx0aWYgKCRzY29wZS5ycml0ZW1zLmluZGV4T2YoaG92ZXIuaWQpID09IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUucnJpdGVtcyA9IFtdO1xuXHRcdFxuXHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eSA9IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCkge1xuXHRcdFx0dmFyIGl0ZW1zID0gJGZpbHRlcignbWVudXBhcmVudGZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0XHRcdFxuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdCRzY29wZS5ycml0ZW1zLnB1c2goaXRlbS5pZCk7XG5cdFx0XHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eShjb250YWluZXJJZCwgaXRlbS5pZCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUl0ZW0gPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YS50b2dnbGVfb3BlbiA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZGF0YVsndG9nZ2xlX29wZW4nXSA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkYXRhWyd0b2dnbGVfb3BlbiddID0gIWRhdGEudG9nZ2xlX29wZW47XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3RyZWUtaGlzdG9yeScsIHtkYXRhOiBkYXRhfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblxuXHRcdH07XG5cblx0XHQkc2NvcGUuZ28gPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybChkYXRhLm5hdl9pdGVtX2lkLCAwKTtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogZGF0YS5pZCB9KTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5zaG93RHJhZyA9IDA7XG5cblx0ICAgICRzY29wZS5pc0N1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24oZGF0YSkge1xuXHQgICAgXHRpZiAoZGF0YSAhPT0gbnVsbCAmJiAkc3RhdGUucGFyYW1zLm5hdklkID09IGRhdGEuaWQpIHtcblx0ICAgIFx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIFx0fVxuXG5cdCAgICBcdHJldHVybiBmYWxzZTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5oaWRkZW5DYXRzID0gW107XG5cblx0ICAgICRzY29wZS4kd2F0Y2goJ21lbnVEYXRhJywgZnVuY3Rpb24gKG4sIG8pIHtcblx0ICAgIFx0JHNjb3BlLmhpZGRlbkNhdHMgPSBuLmhpZGRlbkNhdHM7XG5cdCAgICB9KTtcblxuXHRcdCRzY29wZS50b2dnbGVDYXQgPSBmdW5jdGlvbihjYXRJZCkge1xuXHRcdFx0aWYgKGNhdElkIGluICRzY29wZS5oaWRkZW5DYXRzKSB7XG5cdFx0XHRcdCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9ICEkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPSAxO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9zYXZlLWNhdC10b2dnbGUnLCB7Y2F0SWQ6IGNhdElkLCBzdGF0ZTogJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUlzSGlkZGVuID0gZnVuY3Rpb24oY2F0SWQpIHtcblxuXHRcdFx0aWYgKCRzY29wZS5oaWRkZW5DYXRzID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjYXRJZCBpbiAkc2NvcGUuaGlkZGVuQ2F0cykge1xuXHRcdFx0XHRpZiAoJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID09IDEpIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNhZG1pbkNyZWF0ZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHEnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRxLCAkaHR0cCkge1xuXG5cdFx0JHNjb3BlLmRhdGEgPSB7fTtcblx0XHQkc2NvcGUuZGF0YS5pc0lubGluZSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1wYWdlJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDIpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtbW9kdWxlJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDMpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcmVkaXJlY3QnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNhZG1pbkNyZWF0ZUlubGluZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHEnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRxLCAkaHR0cCkge1xuXG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRuYXZfaWQgOiAkc2NvcGUuJHBhcmVudC5OYXZDb250cm9sbGVyLmlkXG5cdFx0fTtcblxuXHRcdCRzY29wZS5kYXRhLmlzSW5saW5lID0gdHJ1ZTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdCRzY29wZS5kYXRhLmxhbmdfaWQgPSAkc2NvcGUubGFuZy5pZDtcblxuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1wYWdlLWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMikge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1tb2R1bGUtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAzKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXJlZGlyZWN0LWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJOYXZDb250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGZpbHRlcicsICckc3RhdGUnLCAnJHN0YXRlUGFyYW1zJywgJyRodHRwJywgJ1BsYWNlaG9sZGVyU2VydmljZScsICdTZXJ2aWNlUHJvcGVydGllc0RhdGEnLCAnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VMYW5ndWFnZXNEYXRhJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnQWRtaW5MYW5nU2VydmljZScsICdIdG1sU3RvcmFnZScsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkZmlsdGVyLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgJGh0dHAsIFBsYWNlaG9sZGVyU2VydmljZSwgU2VydmljZVByb3BlcnRpZXNEYXRhLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBBZG1pblRvYXN0U2VydmljZSwgQWRtaW5DbGFzc1NlcnZpY2UsIEFkbWluTGFuZ1NlcnZpY2UsIEh0bWxTdG9yYWdlKSB7XG5cblxuXHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuID0gdHJ1ZTtcblx0XHRcblx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheVRhYiA9IDE7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkgPSBmdW5jdGlvbih0KSB7XG5cdFx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheVRhYiA9IHQ7XG5cdFx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbiA9ICEkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbjtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5uYXZDZmcgPSB7XG5cdFx0XHRoZWxwdGFnczogJHJvb3RTY29wZS5sdXlhY2ZnLmhlbHB0YWdzLFxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmRpc3BsYXlMaXZlQ29udGFpbmVyID0gbjtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS51cmwgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmxpdmVVcmwgPSBuO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS5BZG1pbkxhbmdTZXJ2aWNlID0gQWRtaW5MYW5nU2VydmljZTtcblxuXHRcdC8qIHNlcnZpY2UgQWRtaW5Qcm9wZXJ0eVNlcnZpY2UgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5wcm9wZXJ0aWVzRGF0YSA9IFNlcnZpY2VQcm9wZXJ0aWVzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpQcm9wZXJ0aWVzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUucHJvcGVydGllc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlTWVudURhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZUxhbmdhdWdlc0RhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gU2VydmljZUxhbmd1YWdlc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGFuZ3VhZ2VzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQvKiBwbGFjZWhvbGRlcnMgdG9nZ2xlciBzZXJ2aWNlICovXG5cblx0XHQkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlID0gUGxhY2Vob2xkZXJTZXJ2aWNlO1xuXG5cdFx0JHNjb3BlLnBsYWNlaG9sZGVyU3RhdGUgPSAkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlLnN0YXR1cztcblxuXHRcdCRzY29wZS4kd2F0Y2goJ3BsYWNlaG9sZGVyU3RhdGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0JHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZS5kZWxlZ2F0ZShuKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8qIEJsb2NraG9sZGVyIHNpemUgdG9nZ2xlciAqL1xuXG4gICAgICAgICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwgPSBIdG1sU3RvcmFnZS5nZXRWYWx1ZSgnYmxvY2tob2xkZXJUb2dnbGVTdGF0ZScsIHRydWUpO1xuXG4gICAgICAgICRzY29wZS50b2dnbGVCbG9ja2hvbGRlclNpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwgPSAhJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbDtcbiAgICAgICAgICAgIEh0bWxTdG9yYWdlLnNldFZhbHVlKCdibG9ja2hvbGRlclRvZ2dsZVN0YXRlJywgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogc2lkZWJhciBsb2dpYyAqL1xuXG5cdFx0JHNjb3BlLnNpZGViYXIgPSBmYWxzZTtcblxuXHQgICAgJHNjb3BlLmVuYWJsZVNpZGViYXIgPSBmdW5jdGlvbigpIHtcblx0ICAgIFx0JHNjb3BlLnNpZGViYXIgPSB0cnVlO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLnRvZ2dsZVNpZGViYXIgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAkc2NvcGUuc2lkZWJhciA9ICEkc2NvcGUuc2lkZWJhcjtcblx0ICAgIH07XG5cblx0XHQvKiBhcHAgbG9naWMgKi9cblxuXHQgICAgJHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblxuXHRcdCRzY29wZS5pZCA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5uYXZJZCk7XG5cblx0XHQkc2NvcGUuaXNEZWxldGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuQWRtaW5DbGFzc1NlcnZpY2UgPSBBZG1pbkNsYXNzU2VydmljZTtcblxuXHRcdCRzY29wZS5wcm9wVmFsdWVzID0ge307XG5cblx0XHQkc2NvcGUuaGFzVmFsdWVzID0gZmFsc2U7XG5cblx0XHQkc2NvcGUucGFnZVRhZ3MgPSBbXTtcblxuXHRcdCRzY29wZS5idWJibGVQYXJlbnRzID0gZnVuY3Rpb24ocGFyZW50TmF2SWQsIGNvbnRhaW5lcklkKSB7XG5cdCAgICBcdHZhciBpdGVtID0gJGZpbHRlcignbWVudWNoaWxkZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHQgICAgXHRpZiAoaXRlbSkge1xuXHQgICAgXHRcdGl0ZW0udG9nZ2xlX29wZW4gPSAxO1xuXHQgICAgXHRcdCRzY29wZS5idWJibGVQYXJlbnRzKGl0ZW0ucGFyZW50X25hdl9pZCwgaXRlbS5uYXZfY29udGFpbmVyX2lkKTtcblx0ICAgIFx0fVxuXHQgICAgfTtcblxuXHRcdCRzY29wZS5jcmVhdGVEZWVwUGFnZUNvcHkgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2RlZXAtcGFnZS1jb3B5Jywge25hdklkOiAkc2NvcGUuaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfY3JlYXRlX2NvcHlfc3VjY2VzcyddKTtcblx0XHRcdFx0JHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnBhZ2VUYWdzID0gW107XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2LycgKyAkc2NvcGUuaWQgKyAnL3RhZ3MnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0JHNjb3BlLnBhZ2VUYWdzLnB1c2godmFsdWUuaWQpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuc2F2ZVBhZ2VUYWdzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi8nICsgJHNjb3BlLmlkICsgJy90YWdzJywgJHNjb3BlLnBhZ2VUYWdzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfY29uZmlnX3VwZGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY3JlYXRlRGVlcFBhZ2VDb3B5QXNUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVlcC1wYWdlLWNvcHktYXMtdGVtcGxhdGUnLCB7bmF2SWQ6ICRzY29wZS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9jcmVhdGVfY29weV9hc190ZW1wbGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHQkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY3VzdG9tLmNtc2RyYWZ0Jyk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9nZXQtcHJvcGVydGllcycsIHsgcGFyYW1zOiB7bmF2SWQ6ICRzY29wZS5pZH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGZvcih2YXIgaSBpbiByZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0dmFyIGQgPSByZXNwb25zZS5kYXRhW2ldO1xuXHRcdFx0XHRcdCRzY29wZS5wcm9wVmFsdWVzW2QuYWRtaW5fcHJvcF9pZF0gPSBkLnZhbHVlO1xuXHRcdFx0XHRcdCRzY29wZS5oYXNWYWx1ZXMgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZVByb3BNYXNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gISRzY29wZS5zaG93UHJvcEZvcm07XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zdG9yZVByb3BWYWx1ZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtcHJvcGVydGllcz9uYXZJZD0nKyRzY29wZS5pZCwgJC5wYXJhbSgkc2NvcGUucHJvcFZhbHVlcyksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX3Byb3BlcnR5X3JlZnJlc2gnXSk7XG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXHRcdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gZmFsc2U7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRyYXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVsZXRlJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLmlkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0XHQkc2NvcGUuaXNEZWxldGVkID0gdHJ1ZTtcblx0ICAgIFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdCAgICBcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHQgICAgXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHQgICAgXHRcdFx0fSk7XG5cdCAgICBcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09IDQxNykge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuaXNEcmFmdCA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuc3VibWl0TmF2Rm9ybSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0ICAgIFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdXBkYXRlP2lkPScgKyAkc2NvcGUubmF2RGF0YS5pZCwgZGF0YSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX3VwZGF0ZV9sYXlvdXRfc2F2ZV9zdWNjZXNzJykpO1xuXHQgICAgXHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdCAgICBcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdCAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZS5tZXNzYWdlKTtcblx0ICAgIFx0XHR9KTtcblx0ICAgIFx0fSk7XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdCRzY29wZS5uYXZEYXRhID0gJGZpbHRlcignZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCB7aWQ6ICRzY29wZS5pZH0sIHRydWUpWzBdO1xuXHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuaXNEcmFmdCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXG5cdFx0XHRcdC8qIHByb3BlcnRpZXMgLS0+ICovXG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfb2ZmbGluZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQgICAgXHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdCAgICBcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtb2ZmbGluZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgb2ZmbGluZVN0YXR1cyA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX29mZmxpbmUgPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9vZmZsaW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfb25saW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0ICAgIFx0XHR9KTtcblx0XHRcdCAgICBcdH1cblx0XHRcdCAgICB9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaGlkZGVuJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBoaWRkZW5TdGF0dXMgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9oaWRkZW4nLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV92aXNpYmxlJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19ob21lIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCAgICBcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaG9tZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgaG9tZVN0YXRlIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19ob21lID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19zdGF0ZV9pc19ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3N0YXRlX2lzX25vdF9ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdCAgICBcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0XHRpbml0aWFsaXplcigpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUubGFuZyBmcm9tIG5nLXJlcGVhdFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJOYXZJdGVtQ29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckcm9vdFNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnJHRpbWVvdXQnLCAnU2VydmljZU1lbnVEYXRhJywgJ0FkbWluTGFuZ1NlcnZpY2UnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbicsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkaHR0cCwgJGZpbHRlciwgJHRpbWVvdXQsIFNlcnZpY2VNZW51RGF0YSwgQWRtaW5MYW5nU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbikge1xuXG5cdFx0JHNjb3BlLmxvYWRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUub3BlbkxpdmVVcmwgPSBmdW5jdGlvbihpZCwgdmVyc2lvbklkKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybChpZCwgdmVyc2lvbklkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWRMaXZlVXJsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybCgkc2NvcGUuaXRlbS5pZCwgJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbik7XG5cdFx0fTtcblxuXHRcdC8vIGxheW91dHNEYXRhXG5cblx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXHRcdFxuXHRcdC8vIHNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZVxuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TG9hZExhbmd1YWdlJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdGlmICghJHNjb3BlLmxvYWRlZCkge1xuXHRcdFx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gcHJvcGVydGllczpcblxuXHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5pdGVtID0gW107XG5cblx0XHQkc2NvcGUuaXRlbUNvcHkgPSBbXTtcblxuXHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IFtdO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhID0gW107XG5cblx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cblx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cblx0XHQkc2NvcGUuaG9tZVVybCA9ICRyb290U2NvcGUubHV5YWNmZy5ob21lVXJsO1xuXG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzO1xuXG5cdFx0JHNjb3BlLnRyYXNoSXRlbSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5sYW5nLmlzX2RlZmF1bHQgPT0gMCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdFx0JGh0dHAuZGVsZXRlKCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZGVsZXRlP25hdkl0ZW1JZD0nICsgJHNjb3BlLml0ZW0uaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW0gPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW1Db3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS50eXBlRGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS4kYnJvYWRjYXN0KCdkZWxldGVkTmF2SXRlbScpO1xuXHRcdFx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHQgICAgXHRcdFx0fSk7XG5cdFx0ICAgIFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XSk7XG5cdFx0XHR9XG5cdCAgICB9O1xuXG5cdFx0JHNjb3BlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXRlbUNvcHkgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLml0ZW0pO1xuXHRcdFx0aWYgKCRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gYW5ndWxhci5jb3B5KHsnbmF2X2l0ZW1fdHlwZV9pZCcgOiAkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlX2lkIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IGFuZ3VsYXIuY29weSgkc2NvcGUudHlwZURhdGEpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUudXBkYXRlTmF2SXRlbURhdGEgPSBmdW5jdGlvbihpdGVtQ29weSwgdHlwZURhdGFDb3B5KSB7XG5cdFx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cdFx0XHR2YXIgbmF2SXRlbUlkID0gaXRlbUNvcHkuaWQ7XG5cblx0XHRcdHR5cGVEYXRhQ29weS50aXRsZSA9IGl0ZW1Db3B5LnRpdGxlO1xuXHRcdFx0dHlwZURhdGFDb3B5LmFsaWFzID0gaXRlbUNvcHkuYWxpYXM7XG5cdFx0XHR0eXBlRGF0YUNvcHkudGl0bGVfdGFnID0gaXRlbUNvcHkudGl0bGVfdGFnO1xuXHRcdFx0dHlwZURhdGFDb3B5LmRlc2NyaXB0aW9uID0gaXRlbUNvcHkuZGVzY3JpcHRpb247XG5cdFx0XHR0eXBlRGF0YUNvcHkua2V5d29yZHMgPSBpdGVtQ29weS5rZXl3b3Jkcztcblx0XHRcdHR5cGVEYXRhQ29weS50aW1lc3RhbXBfY3JlYXRlID0gaXRlbUNvcHkudGltZXN0YW1wX2NyZWF0ZTtcblx0XHRcdHR5cGVEYXRhQ29weS5pbWFnZV9pZCA9IGl0ZW1Db3B5LmltYWdlX2lkO1xuXHRcdFx0dHlwZURhdGFDb3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCA9IGl0ZW1Db3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZDtcblx0XHRcdHR5cGVEYXRhQ29weS5pc19jYWNoZWFibGUgPSBpdGVtQ29weS5pc19jYWNoZWFibGU7XG5cdFx0XHQkaHR0cC5wb3N0KFxuXHRcdFx0XHQnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3VwZGF0ZS1wYWdlLWl0ZW0/bmF2SXRlbUlkPScgKyBuYXZJdGVtSWQgKyAnJm5hdkl0ZW1UeXBlPScgKyBpdGVtQ29weS5uYXZfaXRlbV90eXBlLFxuXHRcdFx0XHQkLnBhcmFtKHR5cGVEYXRhQ29weSksXG5cdFx0XHRcdGhlYWRlcnNcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSAhPT0gMSkge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHQvKiBzd2l0Y2ggdmVyc2lvbiBpZiB0eXBlIGlzIHBhZ2UgKi9cblx0XHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSA9PSAxICYmIHR5cGVvZiByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdFx0LyogY2hvb3NlIGdpdmVuIHZlcnNpb24gb3IgY2hvb3NlIGZpcnN0IGF2YWlsYWJsZSB2ZXJzaW9uICovXG5cdFx0XHRcdFx0XHR2YXIgcGFnZVZlcnNpb25LZXkgPSByZXNwb25zZS5kYXRhWydpdGVtJ10ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdGlmIChwYWdlVmVyc2lvbktleSA9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdHBhZ2VWZXJzaW9uS2V5ID0gT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXSlbMF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXVtwYWdlVmVyc2lvbktleV1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddW3BhZ2VWZXJzaW9uS2V5XVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHBhZ2VWZXJzaW9uS2V5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9pdGVtX3VwZGF0ZV9vaycsIHsndGl0bGUnOiBpdGVtQ29weS50aXRsZX0pKTtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHR9LCBmdW5jdGlvbiBlcnJvckNhbGxiYWNrKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaXRlbS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnaXRlbUNvcHkuYWxpYXMnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiE9byAmJiBuIT1udWxsKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtQ29weS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKShuKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS5yZW1vdmVWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm0nLCB7YWxpYXM6IHZlcnNpb24udmVyc2lvbl9hbGlhc30pLCBpMThuWydjbXNhZG1pbl92ZXJzaW9uX3JlbW92ZSddLCBbJyR0b2FzdCcsICckaHR0cCcsIGZ1bmN0aW9uKCR0b2FzdCwgJGh0dHApIHtcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbW92ZS1wYWdlLXZlcnNpb24nLCB7cGFnZUlkIDogdmVyc2lvbi5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm1fc3VjY2VzcycsIHthbGlhczogdmVyc2lvbi52ZXJzaW9uX2FsaWFzfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXHRcdFxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uSXRlbTtcbiAgICBcdFxuICAgIFx0JHNjb3BlLnRhYiA9IDE7XG4gICAgXHRcbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb25JdGVtKSB7XG4gICAgXHRcdCRzY29wZS5jaGFuZ2VUYWIoNCk7XG4gICAgXHRcdCRzY29wZS5lZGl0VmVyc2lvbkl0ZW0gPSB2ZXJzaW9uSXRlbTtcbiAgICBcdH07XG5cbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvblVwZGF0ZSA9IGZ1bmN0aW9uKGVkaXRWZXJzaW9uSXRlbSkge1xuICAgIFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vY2hhbmdlLXBhZ2UtdmVyc2lvbi1sYXlvdXQnLCB7J3BhZ2VJdGVtSWQnOiBlZGl0VmVyc2lvbkl0ZW0uaWQsICdsYXlvdXRJZCc6IGVkaXRWZXJzaW9uSXRlbS5sYXlvdXRfaWQsICdhbGlhcyc6IGVkaXRWZXJzaW9uSXRlbS52ZXJzaW9uX2FsaWFzfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcbiAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3ZlcnNpb25fdXBkYXRlX3N1Y2Nlc3MnXSk7XG4gICAgXHRcdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSk7XG4gICAgXHR9O1xuICAgIFx0XG5cdFx0JHNjb3BlLmdldEl0ZW0gPSBmdW5jdGlvbihsYW5nSWQsIG5hdklkKSB7XG5cdFx0XHQkaHR0cCh7XG5cdFx0XHQgICAgdXJsOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL25hdi1sYW5nLWl0ZW0nLFxuXHRcdFx0ICAgIG1ldGhvZDogXCJHRVRcIixcblx0XHRcdCAgICBwYXJhbXM6IHsgbGFuZ0lkIDogbGFuZ0lkLCBuYXZJZCA6IG5hdklkIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLml0ZW0gPSByZXNwb25zZS5kYXRhWydpdGVtJ107XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YSA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ107XG5cdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSB0cnVlO1xuXHRcdFx0XHQkc2NvcGUucmVzZXQoKTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmICghcmVzcG9uc2UuZGF0YVsnbmF2J10uaXNfZHJhZnQpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2Q29udHJvbGxlci5idWJibGVQYXJlbnRzKCRzY29wZS5OYXZDb250cm9sbGVyLm5hdkRhdGEucGFyZW50X25hdl9pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5uYXZfY29udGFpbmVyX2lkKTtcblx0XHRcdFx0XHRpZiAoJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cblx0XHRcdFx0XHRcdHZhciBsYXN0VmVyc2lvbiA9IFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24uaGFzVmVyc2lvbigkc2NvcGUuaXRlbS5pZCk7XG5cblx0XHRcdFx0XHRcdGlmIChsYXN0VmVyc2lvbikge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3dpdGNoVmVyc2lvbihsYXN0VmVyc2lvbik7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZCBpbiByZXNwb25zZS5kYXRhLnR5cGVEYXRhKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gJHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gdHJ1ZVxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0Ly8gaXRzIGxvYWRlZCwgYnV0IHRoZSBkYXRhIGRvZXMgbm90IGV4aXN0cy5cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IHRydWU7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkgPSBmYWxzZTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlVmVyc2lvbnNEcm9wZG93biA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSA9ICEkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5O1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnN3aXRjaFZlcnNpb24gPSBmdW5jdGlvbihwYWdlVmVyc2lvbmlkLCB0b2dnbGUpIHtcblx0XHRcdFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24uc3RvcmUoJHNjb3BlLml0ZW0uaWQsIHBhZ2VWZXJzaW9uaWQpO1xuXHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9ICRzY29wZS50eXBlRGF0YVtwYWdlVmVyc2lvbmlkXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9ICRzY29wZS50eXBlRGF0YVtwYWdlVmVyc2lvbmlkXVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHBhZ2VWZXJzaW9uaWQ7XG5cdFx0XHQkc2NvcGUubG9hZExpdmVVcmwoKTtcblx0XHRcdGlmICh0b2dnbGUpwqB7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVWZXJzaW9uc0Ryb3Bkb3duKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZWZyZXNoRm9yY2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5nZXRJdGVtKCRzY29wZS5sYW5nLmlkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5pZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoQWRtaW5MYW5nU2VydmljZS5pc0luU2VsZWN0aW9uKCRzY29wZS5sYW5nLnNob3J0X2NvZGUpKSB7XG5cdFx0XHRcdCRzY29wZS5nZXRJdGVtKCRzY29wZS5sYW5nLmlkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5pZCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKiBuZXcgc2V0dGluZ3Mgb3ZlcmxheSAqL1xuXHRcdFxuXHRcdCRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5ID0gdHJ1ZTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5ID0gZnVuY3Rpb24odGFiKSB7XG5cdFx0XHQkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSA9ICEkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eTtcblx0XHRcdGlmICh0YWIpIHtcblx0XHRcdFx0JHNjb3BlLnRhYiA9IHRhYjtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0JHNjb3BlLmNoYW5nZVRhYiA9IGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0JHNjb3BlLnRhYiA9IHRhYjtcblx0XHR9XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogUmVmcmVzaCB0aGUgY3VycmVudCBsYXlvdXQgY29udGFpbmVyIGJsb2Nrcy5cblx0XHQgKiBcblx0XHQgKiBBZnRlciBzdWNjZXNzZnVsbCBhcGkgcmVzcG9uc2UgYWxsIGNtcyBsYXlvdXQgYXJlIGZvcmVhY2ggYW5kIHRoZSB2YWx1ZXMgYXJlIHBhc3NlZCB0byByZXZQbGFjZWhvbGRlcnMoKSBtZXRob2QuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQgPSBmdW5jdGlvbihwcmV2SWQsIHBsYWNlaG9sZGVyVmFyKSB7XG5cdFx0XHQkaHR0cCh7XG5cdFx0XHRcdHVybCA6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vcmVsb2FkLXBsYWNlaG9sZGVyJyxcblx0XHRcdFx0bWV0aG9kIDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtcyA6IHsgbmF2SXRlbVBhZ2VJZCA6ICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24sIHByZXZJZCA6IHByZXZJZCwgcGxhY2Vob2xkZXJWYXIgOiBwbGFjZWhvbGRlclZhcn1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoJHNjb3BlLml0ZW0uaWQsICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24pO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmNvbnRhaW5lci5fX3BsYWNlaG9sZGVycywgZnVuY3Rpb24ocGxhY2Vob2xkZXIpIHtcblx0XHRcdFx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzKHBsYWNlaG9sZGVyLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSByZXZQbGFjZWhvbGRlcnMgbWV0aG9kIGdvZXMgdHJvdXJnaCB0aGUgbmV3IHJvdy9jb2wgKGdyaWQpIHN5c3RlbSBjb250YWluZXIganNvbiBsYXlvdXQgd2hlcmU6XG5cdFx0ICogXG5cdFx0ICogcm93c1tdWzFdID0gY29sIGxlZnRcblx0XHQgKiByb3dzW11bMl0gPSBjb2wgcmlnaHRcblx0XHQgKiBcblx0XHQgKiBXaGVyZSBhIGxheW91dCBoYXZlIGF0IGxlYXN0IG9uIHJvdyB3aGljaCBjYW4gaGF2ZSBjb2xzIGluc2lkZS4gU28gdGhlcmUgcmV2UGxhY2Vob2xkZXJzIG1ldGhvZCBnb2VzIHRyb3VnaCB0aGUgY29sc1xuXHRcdCAqIGFuZCBjaGVjayBpZiB0aGUgY29sIGlzIGVxdWFsIHRoZSBnaXZlbiBjb2wgdG8gcmVwbGFjZSB0aGUgY29udGVudCB3aXRoICAoZnJvbSByZWZyZXNoTmVzdGVkIG1ldGhvZCkuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyA9IGZ1bmN0aW9uKHBsYWNlaG9sZGVycywgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpIHtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChwbGFjZWhvbGRlcnMsIGZ1bmN0aW9uKHBsYWNlaG9sZGVyUm93LCBwbGFjZWhvbGRlcktleSkge1xuXHRcdFx0XHRpZiAocGFyc2VJbnQocHJldklkKSA9PSBwYXJzZUludChwbGFjZWhvbGRlclJvdy5wcmV2X2lkKSAmJiBwbGFjZWhvbGRlclZhciA9PSBwbGFjZWhvbGRlclJvd1sndmFyJ10pIHtcblx0XHRcdFx0XHRwbGFjZWhvbGRlcnNbcGxhY2Vob2xkZXJLZXldWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXSA9IHJlcGxhY2VDb250ZW50O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5yZXZGaW5kKHBsYWNlaG9sZGVyUm93LCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogVGhlIHJldkZpbmQgbWV0aG9kIGRvZXMgdGhlIHJlY3Vyc2l2IGpvYiB3aXRoaW4gYSBibG9jayBhbiBwYXNzZXMgdGhlIHZhbHVlIGJhY2sgdG8gcmV2UGxhY2Vob2xkZXJzKCkuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJldkZpbmQgPSBmdW5jdGlvbihwbGFjZWhvbGRlciwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpIHtcblx0XHRcdGZvciAodmFyIGkgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddKSB7XG5cdFx0XHRcdGZvciAodmFyIGhvbGRlcktleSBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ10pIHtcblx0XHRcdFx0XHRmb3IgKHZhciBob2xkZXIgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddW2hvbGRlcktleV0pIHtcblx0XHRcdFx0XHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMocGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddW2hvbGRlcktleV0sIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIGRyb3BzIGl0ZW1zIGluIGFuIGVtcHR5IHBhZ2UgcGxhY2Vob2xkZXIgb2YgQ01TIExBWU9VVCBQTEFDRUhPTERFUlxuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbVBsYWNlaG9sZGVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uKSB7XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7XG5cdFx0XHRcdFx0cHJldl9pZDogZHJvcHBlZC5wcmV2X2lkLCBcblx0XHRcdFx0XHRzb3J0X2luZGV4OjAsIFxuXHRcdFx0XHRcdGJsb2NrX2lkOiBkcmFnZ2VkLmlkLCBcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZChkcm9wcGVkWydwcmV2X2lkJ10sIGRyb3BwZWRbJ3ZhciddKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkKGRyb3BwZWRbJ3ByZXZfaWQnXSwgZHJvcHBlZFsndmFyJ10pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdH1dKTtcblxuXHQvKipcblx0ICogQHBhcmFtICRzY29wZS5ibG9jayBGcm9tIG5nLXJlcGVhdCBzY29wZSBhc3NpZ25tZW50XG5cdCAqL1xuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VCbG9ja0VkaXRDb250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRzY2UnLCAnJGh0dHAnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUJsb2NrQ29weVN0YWNrJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHNjZSwgJGh0dHAsIEFkbWluQ2xhc3NTZXJ2aWNlLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUJsb2NrQ29weVN0YWNrLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlKSB7XG5cblx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0LyoqXG5cdFx0ICogZHJvcHMgYW4gaXRlbSBpbiBhbiBlbXB0eSBwbGFjZWhvbGRlciBvZiBhIEJMT0NLXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtUGxhY2Vob2xkZXIgPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24pIHtcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHtcblx0XHRcdFx0XHRwcmV2X2lkIDogZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6MCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQgOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQgOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZC5wcmV2X2lkLCBkcm9wcGVkLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkIDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBEcm9wcyBhIGJsb2NrIGFib3ZlL2JlbG93IGFuIEVYSVNUSU5HIEJMT0NLXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uLGVsZW1lbnQpIHtcblx0XHRcdHZhciBzb3J0SW5kZXggPSAkc2NvcGUuJGluZGV4O1xuXHRcdFx0XG5cdFx0XHRpZiAocG9zaXRpb24gPT0gJ2JvdHRvbScpIHtcblx0XHRcdFx0c29ydEluZGV4ID0gc29ydEluZGV4ICsgMTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywgeyBcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXgsIFxuXHRcdFx0XHRcdGJsb2NrX2lkOiBkcmFnZ2VkLmlkLCBcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4LFxuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSxcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiAkc2NvcGUucGxhY2Vob2xkZXIubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4XG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdCAqIEBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2x1eWFkZXYvbHV5YS9pc3N1ZXMvMTYyOVxuXHRcdFx0XHRcdCAqIFRoZSBtb3ZlZCBibG9jaywgc2hvdWxkIHJlbW92ZWQgZnJvbSB0aGUgcHJldmlvdXMgYXJyYXkuIFRoaXMgaXMgb25seSB0aGUgY2FzZSB3aGVuIGRyYWdnaW5nIGZyb20gYW4gT1VURVIgYmxvY2sgaW50byBhbiBJTk5FUiBibG9ja1xuXHRcdFx0XHRcdCAqIGlzIHRoaXMgd2lsbCBub3QgcmVmcmVzaCB0aGUgT1VURVIgYmxvY2ssIGJ1dCBhbHdheXMgd2lsbCBpbiB0aGUgb3Bwb3NpdGUgd2F5LlxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChlbGVtZW50KS5yZW1vdmUoKTtcblx0XHRcdFx0XHQvLyBhcyB0aGUgYmxvY2sgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIGV4aXN0aW5nLCByZWZyZXNoIHRoZSBuZXcgcGxhY2Vob2xkZXIuXG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmNvcHlCbG9jayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUJsb2NrQ29weVN0YWNrLnB1c2goJHNjb3BlLmJsb2NrKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUhpZGRlbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay5pc19oaWRkZW4gPT0gMCkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfaGlkZGVuID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19oaWRkZW4gPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cCh7XG5cdFx0XHQgICAgdXJsOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3RvZ2dsZS1ibG9jay1oaWRkZW4nLFxuXHRcdFx0ICAgIG1ldGhvZDogXCJHRVRcIixcblx0XHRcdCAgICBwYXJhbXM6IHsgYmxvY2tJZCA6ICRzY29wZS5ibG9jay5pZCwgaGlkZGVuU3RhdGU6ICRzY29wZS5ibG9jay5pc19oaWRkZW4gfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQvKiBsb2FkIGxpdmUgdXJsIG9uIGhpZGRlbiB0cmlnZ2VyICovXG5cdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLiRwYXJlbnQuJHBhcmVudC5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHQvLyBzdWNjZXNzZnVsbCB0b2dnbGUgaGlkZGVuIHN0YXRlIG9mIGJsb2NrXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX3Zpc2JpbGl0eV9jaGFuZ2UnLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICRzY29wZS5ibG9jay52YXJzICE9IFwidW5kZWZpbmVkXCIgJiYgJHNjb3BlLmJsb2NrLnZhcnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNDb25maWd1cmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgJHNjb3BlLmJsb2NrLmNmZ3MgIT0gXCJ1bmRlZmluZWRcIiAmJiAkc2NvcGUuYmxvY2suY2Zncy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXHRcdFxuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuYmxvY2sudmFsdWVzIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5kYXRhID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuYmxvY2sudmFyaWF0aW9uIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5KG4pO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS5nZXRJbmZvID0gZnVuY3Rpb24odmFyRmllbGROYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLmZpZWxkX2hlbHAuaGFzT3duUHJvcGVydHkodmFyRmllbGROYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gJHNjb3BlLmJsb2NrLmZpZWxkX2hlbHBbdmFyRmllbGROYW1lXTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5ID0gZnVuY3Rpb24odmFyaWF0ZW5OYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLnZhcmlhdGlvbnMuaGFzT3duUHJvcGVydHkodmFyaWF0ZW5OYW1lKSkge1xuXHRcdFx0XHR2YXIgdmFyaWF0aW9uID0gJHNjb3BlLmJsb2NrLnZhcmlhdGlvbnNbJHNjb3BlLmJsb2NrLnZhcmlhdGlvbl07XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCh2YXJpYXRpb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRpZiAoYW5ndWxhci5pc09iamVjdCh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24odiwgaykge1xuXHRcdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrW2tleV0sIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChrID09IG9iamVjdC52YXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLmNmZ3MsIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2sudmFycywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNmZ2RhdGEgPSAkc2NvcGUuYmxvY2suY2ZndmFsdWVzIHx8IHt9O1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmYWxzZTtcblx0XHRcblx0XHQkc2NvcGUubW9kYWxIaWRkZW4gPSB0cnVlO1xuXG5cdFx0JHNjb3BlLm1vZGFsTW9kZSA9IDE7XG5cblx0XHQkc2NvcGUuaW5pdE1vZGFsTW9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay52YXJzLmxlbmd0aCAgPT0gMCkge1xuXHRcdFx0XHQkc2NvcGUubW9kYWxNb2RlID0gMjtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUVkaXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuaXNFZGl0YWJsZSgpIHx8ICRzY29wZS5pc0NvbmZpZ3VyYWJsZSgpKSB7XG5cdFx0XHRcdCRzY29wZS5tb2RhbEhpZGRlbiA9ICEkc2NvcGUubW9kYWxIaWRkZW47XG5cdFx0XHRcdCRzY29wZS5lZGl0ID0gISRzY29wZS5lZGl0O1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZSwgZGF0YVZhcnMsIGNmZ1ZhcnMsIGJsb2NrLCBleHRyYXMpIHtcblx0XHRcdGlmICh0ZW1wbGF0ZSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHRlbXBsYXRlID0gVHdpZy50d2lnKHtcblx0XHRcdCAgICBkYXRhOiB0ZW1wbGF0ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBjb250ZW50ID0gdGVtcGxhdGUucmVuZGVyKHtcblx0XHRcdFx0dmFycyA6IGRhdGFWYXJzLFxuXHRcdFx0XHRjZmdzIDogY2ZnVmFycyxcblx0XHRcdFx0YmxvY2sgOiBibG9jayxcblx0XHRcdFx0ZXh0cmFzIDogZXh0cmFzXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoY29udGVudCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVCbG9jayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfZGVsZXRlX2NvbmZpcm0nLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSwgaTE4blsndmlld191cGRhdGVfYmxvY2tfdG9vbHRpcF9kZWxldGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0JGh0dHAuZGVsZXRlKCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2RlbGV0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja19yZW1vdmVfb2snLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuaXNBbnlSZXF1aXJlZEF0dHJpYnV0ZUVtcHR5ID0gIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgcmVzcG9uc2UgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2sudmFycywgZnVuY3Rpb24odmFySXRlbSkge1xuXHRcdFx0XHRpZiAodmFySXRlbS5yZXF1aXJlZCAmJiAkc2NvcGUuaXNFbXB0eSgkc2NvcGUuZGF0YSwgdmFySXRlbS52YXIpKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blBhcmFtKCdqc19ibG9ja19hdHRyaWJ1dGVfZW1wdHknLCB7bGFiZWw6IHZhckl0ZW0ubGFiZWx9KSk7XG5cdFx0XHRcdFx0cmVzcG9uc2UgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay5jZmdzLCBmdW5jdGlvbih2YXJJdGVtKSB7XG5cblx0XHRcdFx0aWYgKHZhckl0ZW0ucmVxdWlyZWQgJiYgJHNjb3BlLmlzRW1wdHkoJHNjb3BlLmNmZ2RhdGEsIHZhckl0ZW0udmFyKSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5QYXJhbSgnanNfYmxvY2tfYXR0cmlidXRlX2VtcHR5Jywge2xhYmVsOiB2YXJJdGVtLmxhYmVsfSkpO1xuXHRcdFx0XHRcdHJlc3BvbnNlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzRW1wdHkgPSBmdW5jdGlvbih2YWx1ZXMsIGtleSkge1xuXHRcdFx0aWYgKHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIHZhbHVlc1trZXldKSB7XG5cdFx0XHRcdGlmICh2YWx1ZXNba2V5XS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0aWYgKCRzY29wZS5pc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkoKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkLCB7XG5cdFx0XHRcdGpzb25fY29uZmlnX3ZhbHVlczogJHNjb3BlLmRhdGEsXG5cdFx0XHRcdGpzb25fY29uZmlnX2NmZ192YWx1ZXM6ICRzY29wZS5jZmdkYXRhLFxuXHRcdFx0XHR2YXJpYXRpb246ICRzY29wZS5ibG9jay52YXJpYXRpb25cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdXBkYXRlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlRWRpdCgpO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfZGlydHkgPSAxO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2sgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5vYmplY3RkZXRhaWwpO1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSgkc2NvcGUuYmxvY2sudmFyaWF0aW9uKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkRyb3BwYWJsZUJsb2Nrc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnU2VydmljZUJsb2Nrc0RhdGEnLCAnU2VydmljZUJsb2NrQ29weVN0YWNrJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgQWRtaW5DbGFzc1NlcnZpY2UsIFNlcnZpY2VCbG9ja3NEYXRhLCBTZXJ2aWNlQmxvY2tDb3B5U3RhY2spIHtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZUJsb2Nrc0RhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhID0gU2VydmljZUJsb2Nrc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYmxvY2tzRGF0YSk7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKHRydWUpO1xuXHRcdH1cblxuXHRcdCRzY29wZS5hZGRUb0ZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG8tZmF2Jywge2Jsb2NrOiBpdGVtIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlRnJvbUZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svcmVtb3ZlLWZhdicsIHtibG9jazogaXRlbSB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUdyb3VwID0gZnVuY3Rpb24oZ3JvdXApIHtcblx0XHRcdGlmIChncm91cC50b2dnbGVfb3BlbiA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAhZ3JvdXAudG9nZ2xlX29wZW47XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG9nZ2xlLWdyb3VwJywge2dyb3VwOiBncm91cH0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc1ByZXZpZXdFbmFibGVkID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ucHJldmlld19lbmFibGVkO1xuXHRcdH07XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cblx0XHQkc2NvcGUuY29weVN0YWNrID0gU2VydmljZUJsb2NrQ29weVN0YWNrLnN0YWNrO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDb3B5U3RhY2snLCBmdW5jdGlvbihldmVudCwgc3RhY2spIHtcblx0XHRcdCRzY29wZS5jb3B5U3RhY2sgPSBzdGFjaztcblx0XHR9KTtcblxuXHRcdCRzY29wZS5jbGVhclN0YWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQmxvY2tDb3B5U3RhY2suY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cblx0XHQkc2NvcGUuc2VhcmNoSXNEaXJ0eSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnc2VhcmNoUXVlcnknLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiAhPT0gJycpIHtcblx0XHRcdFx0JHNjb3BlLnNlYXJjaElzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2Nrc0RhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUuZ3JvdXAuaXNfZmF2KSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YS5zcGxpY2Uoa2V5LCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFsdWUuZ3JvdXAudG9nZ2xlX29wZW4gPSAxXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmKCRzY29wZS5zZWFyY2hJc0RpcnR5KSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhID0gYW5ndWxhci5jb3B5KCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBhbGwgZ2xvYmFsIGFkbWluIHNlcnZpY2VzXG4gKiBcbiAqIGNvbnRyb2xsZXIgcmVzb2x2ZTogaHR0cHM6Ly9naXRodWIuY29tL2pvaG5wYXBhL2FuZ3VsYXItc3R5bGVndWlkZSNzdHlsZS15MDgwXG4gKiBcbiAqIFNlcnZpY2UgSW5oZXJpdGFuY2U6XG4gKiBcbiAqIDEuIFNlcnZpY2UgbXVzdCBiZSBwcmVmaXggd2l0aCBTZXJ2aWNlXG4gKiAyLiBTZXJ2aWNlIG11c3QgY29udGFpbiBhIGZvcmNlUmVsb2FkIHN0YXRlXG4gKiAzLiBTZXJ2aWNlIG11c3QgYnJvYWRjYXN0IGFuIGV2ZW50ICdzZXJ2aWNlOkZvbGRlcnNEYXRhJ1xuICogNC4gQ29udHJvbGxlciBpbnRlZ3JhdGlvbiBtdXN0IGxvb2sgbGlrZVxuICogXG4gKiBgYGBcbiAqICRzY29wZS5mb2xkZXJzRGF0YSA9IFNlcnZpY2VGb2xkZXJzRGF0YS5kYXRhO1xuICpcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpGb2xkZXJzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiAgICAgICRzY29wZS5mb2xkZXJzRGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqXHRcdFx0XHRcbiAqICRzY29wZS5mb2xkZXJzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogICAgIHJldHVybiBTZXJ2aWNlRm9sZGVyc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIGBgYFxuICogXG4gKi9cblx0XG56YWEuY29uZmlnKFsncmVzb2x2ZXJQcm92aWRlcicsIGZ1bmN0aW9uKHJlc29sdmVyUHJvdmlkZXIpIHtcblx0cmVzb2x2ZXJQcm92aWRlci5hZGRDYWxsYmFjayhbJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlQmxvY2tzRGF0YScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgJ0x1eWFMb2FkaW5nJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlQmxvY2tzRGF0YSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUsIEx1eWFMb2FkaW5nKSB7XG5cdFx0THV5YUxvYWRpbmcuc3RhcnQoKTtcblx0XHRTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKCk7XG5cdFx0U2VydmljZUxheW91dHNEYXRhLmxvYWQoKTtcblx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCgpLnRoZW4oZnVuY3Rpb24ocikge1xuXHRcdFx0U2VydmljZUN1cnJlbnRXZWJzaXRlLmxvYWQoKTtcblx0XHRcdEx1eWFMb2FkaW5nLnN0b3AoKTtcblx0XHR9KTtcblx0fV0pO1xufV0pO1xuXG5cbi8qKlxuICogQ29weSBCbG9jayBTdGFjayBzZXJ2aWNlLlxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VCbG9ja0NvcHlTdGFja1wiLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLnN0YWNrID0gW107XG5cdFxuXHRzZXJ2aWNlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGFjayA9IFtdO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDb3B5U3RhY2snLCBzZXJ2aWNlLnN0YWNrKTtcblx0fTtcblx0XG5cdHNlcnZpY2UucHVzaCA9IGZ1bmN0aW9uKGJsb2NrKSB7XG5cdFx0aWYgKHNlcnZpY2Uuc3RhY2subGVuZ3RoID4gNCkge1xuXHRcdFx0c2VydmljZS5zdGFjay5zaGlmdCgpO1xuXHRcdH1cblx0XHRzZXJ2aWNlLnN0YWNrLnB1c2goe2Jsb2NrSWQ6IGJsb2NrLmJsb2NrX2lkLCBuYW1lOiBibG9jay5uYW1lLCBpY29uOmJsb2NrLmljb24sIGlkOiBibG9jay5pZCwgY29weXN0YWNrOiAxfSk7XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkNvcHlTdGFjaycsIHNlcnZpY2Uuc3RhY2spO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogTWVudSBTZXJ2aWNlLlxuICogXG4gKiAkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcbiAqIFx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqIFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqIFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogXHRcdFx0XHRcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTWVudURhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtbWVudS9kYXRhLW1lbnVcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOk1lbnVEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQmxvY2tzIFNlcnZpY2UuXG4gKiBcbiAqIFxuICogJHNjb3BlLmJsb2Nrc0RhdGEgPSBTZXJ2aWNlQmxvY2tzRGF0YS5kYXRhO1xuICogXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiBcdCRzY29wZS5ibG9ja3NEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogXHRyZXR1cm4gU2VydmljZUJsb2Nrc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIFx0XHRcdFx0XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUJsb2Nrc0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1ibG9ja3NcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBMYXlvdXRzIFNlcnZpY2UuXG5cbiRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXHRcdFx0XHRcbiRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG59KTtcblxuJHNjb3BlLmxheW91dHNEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBTZXJ2aWNlTGF5b3V0c0RhdGEubG9hZCh0cnVlKTtcbn1cblx0XHRcdFx0XG4qL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTGF5b3V0c0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1sYXlvdXRzXCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpMYXlvdXRzRGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIENNUyBMSVZFIEVESVQgU0VSSVZDRVxuICogXG4gKiAkc2NvcGUubGl2ZUVkaXRNb2RlID0gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZVxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VMaXZlRWRpdE1vZGVcIiwgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuXHRcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2Uuc3RhdGUgPSAwO1xuXHRcblx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmx1eWFjZmcuaG9tZVVybDtcblx0XG5cdHNlcnZpY2UudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGF0ZSA9ICFzZXJ2aWNlLnN0YXRlO1xuXHR9O1xuXHRzZXJ2aWNlLnNldFVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0dmFyIGQgPSBuZXcgRGF0ZSgpO1xuXHRcdHZhciBuID0gZC5nZXRUaW1lKCk7XG5cdFx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmNtc0NvbmZpZy5wcmV2aWV3VXJsICsgJz9pdGVtSWQ9JytpdGVtSWQrJyZ2ZXJzaW9uPScgKyB2ZXJzaW9uSWQgKyAnJmRhdGU9JyArIG47XG5cdH07XG5cdFxuXHRzZXJ2aWNlLmNoYW5nZVVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0aWYgKHZlcnNpb25JZCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHZlcnNpb25JZCA9IDA7XG5cdFx0fVxuXHRcdHNlcnZpY2Uuc2V0VXJsKGl0ZW1JZCwgdmVyc2lvbklkKTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TGl2ZUVkaXRNb2RlVXJsQ2hhbmdlJywgc2VydmljZS51cmwpO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQ01TIEN1cnJlbnQgV2Vic2l0ZSBTRVJJVkNFXG4gKlxuICogJHNjb3BlLmN1cnJlbnRXZWJzaXRlSWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuc3RhdGVcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQ3VycmVudFdlYnNpdGVcIiwgWyckcm9vdFNjb3BlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRyb290U2NvcGUsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdGN1cnJlbnRXZWJzaXRlOiBudWxsLFxuXHRcdGRlZmF1bHRXZWJzaXRlOiBudWxsXG5cdH07XG5cblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlID0gU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMuZmluZCh3ID0+IHcuaXNfZGVmYXVsdCk7XG5cdFx0c2VydmljZS50b2dnbGUoc2VydmljZS5kZWZhdWx0V2Vic2l0ZS5pZCk7XG5cdH1cblxuXHRzZXJ2aWNlLnRvZ2dsZSA9IGZ1bmN0aW9uKHdlYnNpdGVJZCkge1xuXHRcdGlmICh3ZWJzaXRlSWQgJiYgKCFzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlIHx8IHNlcnZpY2UuY3VycmVudFdlYnNpdGUuaWQgIT09IHdlYnNpdGVJZCkpIHtcblx0XHRcdHNlcnZpY2UuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcy5maW5kKHcgPT4gdy5pZCA9PT0gd2Vic2l0ZUlkKTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbnphYS5mYWN0b3J5KFwiU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvblwiLCBbZnVuY3Rpb24oKSB7XG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdHBhZ2UgOiB7fVxuXHR9O1xuXG5cblxuXHRzZXJ2aWNlLnN0b3JlID0gZnVuY3Rpb24ocGFnZUlkLCB2ZXJzaW9uSWQpIHtcblx0XHRzZXJ2aWNlLnBhZ2VbcGFnZUlkXSA9IHZlcnNpb25JZDtcblx0fTtcblxuXG5cdHNlcnZpY2UuaGFzVmVyc2lvbiA9IGZ1bmN0aW9uKHBhZ2VJZCkge1xuXHRcdGlmIChzZXJ2aWNlLnBhZ2UuaGFzT3duUHJvcGVydHkocGFnZUlkKSkge1xuXHRcdFx0cmV0dXJuIHNlcnZpY2UucGFnZVtwYWdlSWRdO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTsiXX0=