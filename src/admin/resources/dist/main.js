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
            ServiceMenuData.load().then(function () {
              ServiceCurrentWebsite.load();
            });
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
        "name": "@fieldname",
        "clearable": "@clearable"
      },
      controller: ['$scope', function ($scope) {
        $scope.resetValue = function () {
          $scope.model = null;
        };
      }],
      template: function template() {
        return '<div class="form-group form-side-by-side" ng-class="{\'input--hide-label\': i18n}">' + '<div class="form-side form-side-label">' + '<label>{{label}}</label>' + '</div>' + '<div class="form-side">' + '<menu-dropdown class="menu-dropdown" nav-id="model"></menu-dropdown>' + '<button ng-if="clearable && model" ng-click="resetValue()" type="button" class="btn btn-sm btn-secondary"><i class="material-icons">clear</i></button>' + '</div>' + '</div>';
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
        $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
        $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
          if (ServiceCurrentWebsite.currentWebsite) {
            $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
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
        $scope.$watch(function () {
          return $scope.data.nav_container_id;
        }, function (n, o) {
          if (n !== undefined && n !== o) {
            $scope.data.parent_nav_id = 0;
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
    }; // Contains the current website id, is initialized with false as value


    $scope.currentWebsiteToggler = false;
    $scope.$watch('currentWebsiteToggler', function (newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        ServiceCurrentWebsite.toggle(newValue);
      }
    }); // initialize the state of the current menu service

    $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite; // if the state has recived a value, after the service event has been triggered, this ensures
    // the current website is displayed. Like a lazy load ensurance

    if ($scope.currentWebsite) {
      $scope.currentWebsiteToggler = $scope.currentWebsite.id;
    }

    $scope.$on('service:CurrentWebsiteChanged', function (event, data) {
      $scope.currentWebsite = data;
      $scope.currentWebsiteToggler = data.id;
      ServiceMenuData.load();
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

    $scope.save = function (close) {
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

        if (close) {
          $scope.toggleEdit();
        }

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
    ServiceMenuData.load().then(function () {
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
 * $scope.currentWebsite = ServiceCurrentWebsite.currentWebsite 
 * 
 * $scope.$on('service:CurrentWebsiteChanged', function(event, data) {
 *  	$scope.currentWebsite = data;
 * });
 */

zaa.factory("ServiceCurrentWebsite", ['$rootScope', 'ServiceMenuData', function ($rootScope, ServiceMenuData) {
  var service = {
    currentWebsite: null,
    defaultWebsite: null
  };

  service.load = function () {
    service.defaultWebsite = ServiceMenuData.data.websites.find(function (w) {
      return w.is_default;
    }) || ServiceMenuData.data.websites[0];

    if (service.defaultWebsite) {
      service.toggle(service.defaultWebsite.id);
    }
  };

  service.toggle = function (websiteId) {
    if (websiteId && ServiceMenuData.data.websites && (!service.currentWebsite || service.currentWebsite.id !== websiteId)) {
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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiU2VydmljZUN1cnJlbnRXZWJzaXRlIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsImN1cnJlbnRXZWJzaXRlIiwiJG9uIiwiZXZlbnQiLCJtZW51RGF0YSIsImFuZ3VsYXIiLCJjb3B5IiwibWVudURhdGFPcmlnaW5hbCIsImluaXQiLCJsZW5ndGgiLCJsb2FkIiwidGhlbiIsImNvbnRhaW5lciIsImNvbnRhaW5lcnMiLCJpc0hpZGRlbiIsIiR3YXRjaCIsIm4iLCJpdGVtcyIsInRpdGxlIiwiZm9yRWFjaCIsInZhbHVlIiwiYnViYmxlUGFyZW50cyIsInBhcmVudE5hdklkIiwiY29udGFpbmVySWQiLCJpbmRleCIsIml0ZW0iLCJleGlzdHMiLCJpIiwicHVzaCIsInBhcmVudF9uYXZfaWQiLCJuYXZfY29udGFpbmVyX2lkIiwidG9nZ2xlciIsInRlbXBsYXRlIiwiaTE4biIsInJlc2V0VmFsdWUiLCJtb2RlbCIsIiRodHRwIiwiJHN0YXRlIiwiZ2V0IiwicGFyYW1zIiwicmVzcG9uc2UiLCJwYXRoIiwidGVtcGxhdGVVcmwiLCJTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSIsIkFkbWluVG9hc3RTZXJ2aWNlIiwiZXJyb3IiLCJzdWNjZXNzIiwiJHBhcmVudCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImlzRGVmYXVsdEl0ZW0iLCJmaW5kIiwiaXNfZGVmYXVsdCIsImxhbmdfaWQiLCJvIiwidW5kZWZpbmVkIiwiYWxpYXNTdWdnZXN0aW9uIiwiYWxpYXMiLCJleGVjIiwic2F2ZSIsImlzSW5saW5lIiwiZ2V0SXRlbSIsIm5hdl9pZCIsInJlYXNvbiIsImtleSIsIlNlcnZpY2VMYXlvdXRzRGF0YSIsInBhcmVudCIsIm5hdkl0ZW1JZCIsImxheW91dF9pZCIsImxheW91dHNEYXRhIiwiYXJyYXlUb1NlbGVjdCIsImlucHV0IiwidmFsdWVGaWVsZCIsImxhYmVsRmllbGQiLCJvdXRwdXQiLCJ2ZXJzaW9uc0RhdGEiLCJnZXRWZXJzaW9uTGlzdCIsImlzRWRpdEF2YWlsYWJsZSIsInVzZV9kcmFmdCIsImZyb21fZHJhZnRfaWQiLCJkcmFmdHMiLCJsYXlvdXRzIiwibW9kdWxlcyIsImNvbnRyb2xsZXJzIiwiYWN0aW9ucyIsImFkZFBhcmFtIiwiaGFzT3duUHJvcGVydHkiLCJhY3Rpb25fcGFyYW1zIiwibW9kdWxlX25hbWUiLCJjb250cm9sbGVyX25hbWUiLCJmaWx0ZXIiLCJ3ZWJzaXRlSWQiLCJyZXN1bHQiLCJ3ZWJzaXRlX2lkIiwicmV0dXJuVmFsdWUiLCJmYWN0b3J5Iiwic2VydmljZSIsInN0YXR1cyIsImRlbGVnYXRlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCJzdGF0ZSIsInVybCIsImdvIiwiZGFzaGJvYXJkIiwicG9zdCIsImhlYWRlcnMiLCJjcmVhdGVOZXdWZXJzaW9uU3VibWl0IiwiY29weUV4aXN0aW5nVmVyc2lvbiIsInZlcnNpb25MYXlvdXRJZCIsIiQiLCJwYXJhbSIsInZlcnNpb25OYW1lIiwiZnJvbVZlcnNpb25QYWdlSWQiLCJyZWZyZXNoRm9yY2UiLCJpc09wZW4iLCJpdGVtU2VsZWN0aW9uIiwic2VsZWN0aW9uIiwiTmF2SXRlbUNvbnRyb2xsZXIiLCJzZWxlY3QiLCJsb2FkSXRlbXMiLCJOYXZDb250cm9sbGVyIiwibmF2RGF0YSIsImxhbmciLCJyZWZyZXNoIiwiZXJyb3JBcnJheSIsIiRyb290U2NvcGUiLCJTZXJ2aWNlTGl2ZUVkaXRNb2RlIiwibGl2ZUVkaXRTdGF0ZSIsImxvYWRDbXNDb25maWciLCJjbXNDb25maWciLCJjdXJyZW50V2Vic2l0ZVRvZ2dsZXIiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwidG9nZ2xlIiwiZHJvcEVtcHR5Q29udGFpbmVyIiwiZHJhZ2dlZCIsImRyb3BwZWQiLCJwb3NpdGlvbiIsImNhdElkIiwibW92ZUl0ZW1JZCIsImRyb3BwZWRPbkNhdElkIiwic3VjY2VzIiwiZHJvcEl0ZW0iLCJkcmFnIiwiZHJvcCIsInBvcyIsImFwaSIsImRyb3BwZWRBZnRlckl0ZW1JZCIsImRyb3BwZWRCZWZvcmVJdGVtSWQiLCJkcm9wcGVkT25JdGVtSWQiLCJ2YWxpZEl0ZW0iLCJob3ZlciIsImRyYWdlZCIsInJyaXRlbXMiLCJyZWN1cnNpdkl0ZW1WYWxpZGl0eSIsImluZGV4T2YiLCJ0b2dnbGVJdGVtIiwidG9nZ2xlX29wZW4iLCJpZ25vcmVMb2FkaW5nQmFyIiwiY2hhbmdlVXJsIiwibmF2X2l0ZW1faWQiLCJzaG93RHJhZyIsImlzQ3VycmVudEVsZW1lbnQiLCJoaWRkZW5DYXRzIiwidG9nZ2xlQ2F0IiwidG9nZ2xlSXNIaWRkZW4iLCIkcSIsInJlc29sdmUiLCJyZWplY3QiLCIkc3RhdGVQYXJhbXMiLCJQbGFjZWhvbGRlclNlcnZpY2UiLCJTZXJ2aWNlUHJvcGVydGllc0RhdGEiLCJBZG1pbkNsYXNzU2VydmljZSIsIkFkbWluTGFuZ1NlcnZpY2UiLCJIdG1sU3RvcmFnZSIsInBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4iLCJwYWdlU2V0dGluZ3NPdmVybGF5VGFiIiwidG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSIsInQiLCJuYXZDZmciLCJoZWxwdGFncyIsImx1eWFjZmciLCJkaXNwbGF5TGl2ZUNvbnRhaW5lciIsImxpdmVVcmwiLCJwcm9wZXJ0aWVzRGF0YSIsInBsYWNlaG9sZGVyU3RhdGUiLCJpc0Jsb2NraG9sZGVyU21hbGwiLCJnZXRWYWx1ZSIsInRvZ2dsZUJsb2NraG9sZGVyU2l6ZSIsInNldFZhbHVlIiwic2lkZWJhciIsImVuYWJsZVNpZGViYXIiLCJ0b2dnbGVTaWRlYmFyIiwic2hvd0FjdGlvbnMiLCJwYXJzZUludCIsImlzRGVsZXRlZCIsInByb3BWYWx1ZXMiLCJoYXNWYWx1ZXMiLCJwYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weSIsInNhdmVQYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weUFzVGVtcGxhdGUiLCJsb2FkTmF2UHJvcGVydGllcyIsImQiLCJhZG1pbl9wcm9wX2lkIiwidG9nZ2xlUHJvcE1hc2siLCJzaG93UHJvcEZvcm0iLCJzdG9yZVByb3BWYWx1ZXMiLCJ0cmFzaCIsImNvbmZpcm0iLCIkdG9hc3QiLCJjbG9zZSIsImlzRHJhZnQiLCJzdWJtaXROYXZGb3JtIiwiaTE4blBhcmFtIiwibWVzc2FnZSIsImlzX29mZmxpbmUiLCJvZmZsaW5lU3RhdHVzIiwiaW5mbyIsImlzX2hpZGRlbiIsImhpZGRlblN0YXR1cyIsImlzX2hvbWUiLCJob21lU3RhdGUiLCIkdGltZW91dCIsIlNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24iLCJsb2FkZWQiLCJvcGVuTGl2ZVVybCIsInZlcnNpb25JZCIsImxvYWRMaXZlVXJsIiwiY3VycmVudFBhZ2VWZXJzaW9uIiwiaXNUcmFuc2xhdGVkIiwiaXRlbUNvcHkiLCJzZXR0aW5ncyIsInR5cGVEYXRhQ29weSIsInR5cGVEYXRhIiwiZXJyb3JzIiwiaG9tZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzIiwidHJhc2hJdGVtIiwiZGVsZXRlIiwiJGJyb2FkY2FzdCIsInJlc2V0IiwibmF2X2l0ZW1fdHlwZV9pZCIsInVwZGF0ZU5hdkl0ZW1EYXRhIiwidGl0bGVfdGFnIiwiZGVzY3JpcHRpb24iLCJrZXl3b3JkcyIsInRpbWVzdGFtcF9jcmVhdGUiLCJpbWFnZV9pZCIsImlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCIsImlzX2NhY2hlYWJsZSIsInBhZ2VWZXJzaW9uS2V5IiwiT2JqZWN0Iiwia2V5cyIsInRvZ2dsZVNldHRpbmdzT3ZlcmxheSIsImVycm9yQ2FsbGJhY2siLCJyZW1vdmVWZXJzaW9uIiwidmVyc2lvbiIsInZlcnNpb25fYWxpYXMiLCJwYWdlSWQiLCJlZGl0VmVyc2lvbkl0ZW0iLCJ0YWIiLCJlZGl0VmVyc2lvbiIsInZlcnNpb25JdGVtIiwiY2hhbmdlVGFiIiwiZWRpdFZlcnNpb25VcGRhdGUiLCJsYW5nSWQiLCJtZXRob2QiLCJsYXN0VmVyc2lvbiIsImhhc1ZlcnNpb24iLCJzd2l0Y2hWZXJzaW9uIiwidmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5IiwidG9nZ2xlVmVyc2lvbnNEcm9wZG93biIsInBhZ2VWZXJzaW9uaWQiLCJzdG9yZSIsImlzSW5TZWxlY3Rpb24iLCJzaG9ydF9jb2RlIiwic2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSIsInJlZnJlc2hOZXN0ZWQiLCJwcmV2SWQiLCJwbGFjZWhvbGRlclZhciIsIm5hdkl0ZW1QYWdlSWQiLCJfX3BsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVyIiwicmV2UGxhY2Vob2xkZXJzIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZUNvbnRlbnQiLCJwbGFjZWhvbGRlclJvdyIsInBsYWNlaG9sZGVyS2V5IiwicHJldl9pZCIsInJldkZpbmQiLCJob2xkZXJLZXkiLCJob2xkZXIiLCJkcm9wSXRlbVBsYWNlaG9sZGVyIiwic29ydF9pbmRleCIsImJsb2NrX2lkIiwicGxhY2Vob2xkZXJfdmFyIiwibmF2X2l0ZW1fcGFnZV9pZCIsImNvcHlCbG9ja0lkIiwicHV0IiwiJHNjZSIsIlNlcnZpY2VCbG9ja0NvcHlTdGFjayIsIk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIiLCJ2YXIiLCJlbGVtZW50Iiwic29ydEluZGV4IiwiJGluZGV4IiwicmVtb3ZlIiwiY29weUJsb2NrIiwiYmxvY2siLCJ0b2dnbGVIaWRkZW4iLCJibG9ja0lkIiwiaGlkZGVuU3RhdGUiLCJuYW1lIiwiaXNFZGl0YWJsZSIsInZhcnMiLCJpc0NvbmZpZ3VyYWJsZSIsImNmZ3MiLCJ2YWx1ZXMiLCJ2YXJpYXRpb24iLCJldmFsVmFyaWF0aW9uVmlzYmlsaXR5IiwiZ2V0SW5mbyIsInZhckZpZWxkTmFtZSIsImZpZWxkX2hlbHAiLCJ2YXJpYXRlbk5hbWUiLCJ2YXJpYXRpb25zIiwiaXNPYmplY3QiLCJ2IiwiayIsIm9iamVjdCIsImludmlzaWJsZSIsImNmZ2RhdGEiLCJjZmd2YWx1ZXMiLCJlZGl0IiwibW9kYWxIaWRkZW4iLCJtb2RhbE1vZGUiLCJpbml0TW9kYWxNb2RlIiwidG9nZ2xlRWRpdCIsInJlbmRlclRlbXBsYXRlIiwiZGF0YVZhcnMiLCJjZmdWYXJzIiwiZXh0cmFzIiwiVHdpZyIsInR3aWciLCJjb250ZW50IiwicmVuZGVyIiwidHJ1c3RBc0h0bWwiLCJyZW1vdmVCbG9jayIsImlzQW55UmVxdWlyZWRBdHRyaWJ1dGVFbXB0eSIsInZhckl0ZW0iLCJyZXF1aXJlZCIsImlzRW1wdHkiLCJsYWJlbCIsImpzb25fY29uZmlnX3ZhbHVlcyIsImpzb25fY29uZmlnX2NmZ192YWx1ZXMiLCJpc19kaXJ0eSIsIm9iamVjdGRldGFpbCIsIlNlcnZpY2VCbG9ja3NEYXRhIiwiYmxvY2tzRGF0YSIsImJsb2Nrc0RhdGFSZXN0b3JlIiwiYmxvY2tzRGF0YVJlbG9hZCIsImFkZFRvRmF2IiwicmVtb3ZlRnJvbUZhdiIsInRvZ2dsZUdyb3VwIiwiZ3JvdXAiLCJpc1ByZXZpZXdFbmFibGVkIiwicHJldmlld19lbmFibGVkIiwiY29weVN0YWNrIiwic3RhY2siLCJjbGVhclN0YWNrIiwiY2xlYXIiLCJzZWFyY2hRdWVyeSIsInNlYXJjaElzRGlydHkiLCJpc19mYXYiLCJzcGxpY2UiLCJyZXNvbHZlclByb3ZpZGVyIiwiYWRkQ2FsbGJhY2siLCJMdXlhTG9hZGluZyIsInN0YXJ0Iiwic3RvcCIsInNoaWZ0IiwiaWNvbiIsImNvcHlzdGFjayIsImZvcmNlUmVsb2FkIiwic2V0VXJsIiwiaXRlbUlkIiwiRGF0ZSIsImdldFRpbWUiLCJwcmV2aWV3VXJsIiwiZGVmYXVsdFdlYnNpdGUiLCJ3ZWJzaXRlcyIsInciLCJwYWdlIl0sIm1hcHBpbmdzIjoiOztB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QUEsZUFBSUEsQ0FBQyxDQUFDOVksRUFBRixLQUFTaUcsU0FBYjtBQUFBLE9BQXBDLENBQXpCO0FBQ0FtQyxNQUFBQSxVQUFVLENBQUNtSCxVQUFYLENBQXNCLCtCQUF0QixFQUF1RGpKLE9BQU8sQ0FBQ3JHLGNBQS9EO0FBQ0E7QUFDRCxHQUxEOztBQU9BLFNBQU9xRyxPQUFQO0FBQ0EsQ0F0Qm9DLENBQXJDO0FBd0JBbEgsR0FBRyxDQUFDaUgsT0FBSixDQUFZLDJCQUFaLEVBQXlDLENBQUMsWUFBVztBQUNwRCxNQUFJQyxPQUFPLEdBQUc7QUFDYnlTLElBQUFBLElBQUksRUFBRTtBQURPLEdBQWQ7O0FBSUF6UyxFQUFBQSxPQUFPLENBQUNtTCxLQUFSLEdBQWdCLFVBQVNmLE1BQVQsRUFBaUJoQyxTQUFqQixFQUE0QjtBQUMzQ3BJLElBQUFBLE9BQU8sQ0FBQ3lTLElBQVIsQ0FBYXJJLE1BQWIsSUFBdUJoQyxTQUF2QjtBQUNBLEdBRkQ7O0FBSUFwSSxFQUFBQSxPQUFPLENBQUM4SyxVQUFSLEdBQXFCLFVBQVNWLE1BQVQsRUFBaUI7QUFDckMsUUFBSXBLLE9BQU8sQ0FBQ3lTLElBQVIsQ0FBYW5ULGNBQWIsQ0FBNEI4SyxNQUE1QixDQUFKLEVBQXlDO0FBQ3hDLGFBQU9wSyxPQUFPLENBQUN5UyxJQUFSLENBQWFySSxNQUFiLENBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQU5EOztBQVFBLFNBQU9wSyxPQUFQO0FBQ0EsQ0FsQndDLENBQXpDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXHRcblx0Ly8gZGlyZWN0aXZlLmpzXG5cbiAgICB6YWEuZGlyZWN0aXZlKFwibWVudURyb3Bkb3duXCIsIFsnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsICckZmlsdGVyJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUsICRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgICAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgICAgICAgbmF2SWQgOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5hdklkID0gZGF0YS5pZDtcbiAgICAgICAgICAgICAgICB9XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBhbmd1bGFyLmNvcHkoU2VydmljZU1lbnVEYXRhLmRhdGEpO1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFPcmlnaW5hbCA9IGFuZ3VsYXIuY29weShTZXJ2aWNlTWVudURhdGEuZGF0YSk7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBhbmd1bGFyLmNvcHkoZGF0YSk7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwgPSBhbmd1bGFyLmNvcHkoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLm1lbnVEYXRhLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlTWVudURhdGEubG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5sb2FkKCk7XG5cdFx0XHRcdFx0XHR9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY29udGFpbmVyIGluICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzW2NvbnRhaW5lcl0uaXNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnc2VhcmNoUXVlcnknLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4gPT0gbnVsbCB8fCBuID09ICcnKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEuaXRlbXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgaXRlbXMgPSAkZmlsdGVyKCdmaWx0ZXInKSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcywge3RpdGxlOiBufSk7XG5cblx0XHRcdFx0XHQvLyBmaW5kIGFsbCBwYXJlbnQgZWxlbWVudHMgb2YgdGhlIGZvdW5kIGVsZW1lbnRzIGFuZCByZSBhZGQgdGhlbSB0byB0aGUgbWFwIGluIG9yZGVyIHRvIFxuXHRcdFx0XHRcdC8vIGVuc3VyZSBhIGNvcnJlY3QgbWVudSB0cmVlLlxuXHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0XHRcdGlmICh2YWx1ZVsncGFyZW50X25hdl9pZCddID4gMCkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyh2YWx1ZVsncGFyZW50X25hdl9pZCddLCB2YWx1ZVsnbmF2X2NvbnRhaW5lcl9pZCddLCBpdGVtcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEuaXRlbXMgPSBpdGVtcztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQsIGluZGV4KSB7XG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0XHRcdFx0XHRpZiAoaXRlbSkge1xuXHRcdFx0XHRcdFx0dmFyIGV4aXN0cyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGluZGV4LCBmdW5jdGlvbihpKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChpLmlkID09IGl0ZW0uaWQpIHtcblx0XHRcdFx0XHRcdFx0XHRleGlzdHMgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0aWYgKCFleGlzdHMpIHtcblx0XHRcdFx0XHRcdFx0aW5kZXgucHVzaChpdGVtKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzKGl0ZW0ucGFyZW50X25hdl9pZCwgaXRlbS5uYXZfY29udGFpbmVyX2lkLCBpbmRleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZXIgPSB0cnVlO1xuXG5cdFx0XHRcdGluaXQoKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgdGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8ZGl2PicrXG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBtYi0yXCI+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtcHJlcGVuZFwiIG5nLWhpZGU9XCJzZWFyY2hRdWVyeVwiPjxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPnNlYXJjaDwvaT48L2Rpdj48L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1wcmVwZW5kXCIgbmctc2hvdz1cInNlYXJjaFF1ZXJ5XCIgbmctY2xpY2s9XCJzZWFyY2hRdWVyeSA9IFxcJ1xcJ1wiPjxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPmNsZWFyPC9pPjwvZGl2PjwvZGl2PicrXG5cdFx0XHRcdFx0XHQnPGlucHV0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgbmctbW9kZWw9XCJzZWFyY2hRdWVyeVwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCInK2kxOG5bJ25ncmVzdF9jcnVkX3NlYXJjaF90ZXh0J10rJ1wiPicrXG5cdFx0XHRcdFx0JzwvZGl2PicgKyBcblx0XHRcdFx0XHQnPGRpdiBuZy1yZXBlYXQ9XCIoa2V5LCBjb250YWluZXIpIGluIG1lbnVEYXRhLmNvbnRhaW5lcnMgfCBtZW51d2Vic2l0ZWZpbHRlcjpjdXJyZW50V2Vic2l0ZS5pZFwiIG5nLWlmPVwiKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCkubGVuZ3RoID4gMFwiIGNsYXNzPVwiY2FyZCBtYi0yXCIgbmctY2xhc3M9XCJ7XFwnY2FyZC1jbG9zZWRcXCc6ICFjb250YWluZXIuaXNIaWRkZW59XCI+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiY2FyZC1oZWFkZXJcIiBuZy1jbGljaz1cImNvbnRhaW5lci5pc0hpZGRlbj0hY29udGFpbmVyLmlzSGlkZGVuXCI+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMgY2FyZC10b2dnbGUtaW5kaWNhdG9yXCI+a2V5Ym9hcmRfYXJyb3dfZG93bjwvc3Bhbj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4+e3tjb250YWluZXIubmFtZX19PC9zcGFuPicrXG5cdFx0XHRcdFx0XHQnPC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5XCI+JysgXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwidHJlZXZpZXcgdHJlZXZpZXctY2hvb3NlclwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8dWwgY2xhc3M9XCJ0cmVldmlldy1pdGVtcyB0cmVldmlldy1pdGVtcy1sdmwxXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPGxpIGNsYXNzPVwidHJlZXZpZXctaXRlbSB0cmVldmlldy1pdGVtLWx2bDFcIiBuZy1jbGFzcz1cIntcXCd0cmVldmlldy1pdGVtLWhhcy1jaGlsZHJlblxcJyA6IChtZW51RGF0YS5pdGVtcyB8IG1lbnVwYXJlbnRmaWx0ZXI6Y29udGFpbmVyLmlkOjApLmxlbmd0aH1cIiBuZy1yZXBlYXQ9XCIoa2V5LCBkYXRhKSBpbiBtZW51RGF0YS5pdGVtcyB8IG1lbnVwYXJlbnRmaWx0ZXI6Y29udGFpbmVyLmlkOjAgdHJhY2sgYnkgZGF0YS5pZFwiIG5nLWluY2x1ZGU9XCJcXCdtZW51RHJvcGRvd25SZXZlcnNlXFwnXCI+PC9saT4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC91bD4nICtcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0XHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHQnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuXHR6YWEuZGlyZWN0aXZlKFwiemFhQ21zUGFnZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiBcIkVcIixcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcIm9wdGlvbnNcIjogXCI9XCIsXG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkBsYWJlbFwiLFxuICAgICAgICAgICAgICAgIFwiaTE4blwiOiBcIkBpMThuXCIsXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIkBmaWVsZGlkXCIsXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiQGZpZWxkbmFtZVwiLFxuXHRcdFx0XHRcImNsZWFyYWJsZVwiOiBcIkBjbGVhcmFibGVcIlxuICAgICAgICAgICAgfSxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xuXHRcdFx0XHQkc2NvcGUucmVzZXRWYWx1ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS5tb2RlbCA9IG51bGxcblx0XHRcdFx0fVxuXHRcdFx0fV0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcdHJldHVybiAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIGZvcm0tc2lkZS1ieS1zaWRlXCIgbmctY2xhc3M9XCJ7XFwnaW5wdXQtLWhpZGUtbGFiZWxcXCc6IGkxOG59XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGUgZm9ybS1zaWRlLWxhYmVsXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWw+e3tsYWJlbH19PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxtZW51LWRyb3Bkb3duIGNsYXNzPVwibWVudS1kcm9wZG93blwiIG5hdi1pZD1cIm1vZGVsXCI+PC9tZW51LWRyb3Bkb3duPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8YnV0dG9uIG5nLWlmPVwiY2xlYXJhYmxlICYmIG1vZGVsXCIgbmctY2xpY2s9XCJyZXNldFZhbHVlKClcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLXNtIGJ0bi1zZWNvbmRhcnlcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+Y2xlYXI8L2k+PC9idXR0b24+JyArIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblx0emFhLmRpcmVjdGl2ZShcInNob3dJbnRlcm5hbFJlZGlyZWN0aW9uXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRuYXZJZCA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkc3RhdGUpIHtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCduYXZJZCcsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1pdGVtLXBhdGgnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnBhdGggPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9nZXQtbmF2LWNvbnRhaW5lci1uYW1lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dLFxuXHRcdFx0dGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8YSBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbVwiIHVpLXNyZWY9XCJjdXN0b20uY21zZWRpdCh7IG5hdklkIDogbmF2SWQsIHRlbXBsYXRlSWQ6IFxcJ2Ntc2FkbWluL2RlZmF1bHQvaW5kZXhcXCd9KVwiPnt7cGF0aH19PC9hPiBpbiB7e2NvbnRhaW5lcn19Jztcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1cIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gZmFsc2U7XG5cblx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudSA9ICRzY29wZS5tZW51RGF0YS5pdGVtcztcblx0XHRcdFx0XHQkc2NvcGUubmF2Y29udGFpbmVycyA9ICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdGlhbGl6ZXIoKTtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPSAxO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuaXNfZHJhZnQgPSAwO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0aWYgKFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZS5kZWZhdWx0X2NvbnRhaW5lcl9pZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gU2VydmljZUxhbmd1YWdlc0RhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxhbmd1YWdlc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmlzRGVmYXVsdEl0ZW0gPSAkc2NvcGUubGFuZ3VhZ2VzRGF0YS5maW5kKGl0ZW0gPT4ge1xuXHRcdFx0XHRcdHJldHVybiBpdGVtLmlzX2RlZmF1bHQ7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLmxhbmdfaWQgPSAkc2NvcGUuaXNEZWZhdWx0SXRlbS5pZDtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4gIT09IHVuZGVmaW5lZCAmJiBuICE9PSBvKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hbGlhc1N1Z2dlc3Rpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuZGF0YS50aXRsZSk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnZGF0YS5hbGlhcycsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiE9byAmJiBuIT1udWxsKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKShuKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5leGVjID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdCRzY29wZS5jb250cm9sbGVyLnNhdmUoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdCRzY29wZS5lcnJvciA9IFtdO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEudGl0bGUgPSBudWxsO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSBudWxsO1xuXHRcdFx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLmlzSW5saW5lKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LiRwYXJlbnQuZ2V0SXRlbSgkc2NvcGUuZGF0YS5sYW5nX2lkLCAkc2NvcGUuZGF0YS5uYXZfaWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWyd2aWV3X2luZGV4X3BhZ2Vfc3VjY2VzcyddKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZWFzb24pIHtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZWFzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IodmFsdWVbMF0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3IgPSByZWFzb247XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qKiBQQUdFIENSRUFURSAmIFVQREFURSAqL1xuICAgIHphYS5kaXJlY3RpdmUoXCJ1cGRhdGVGb3JtUGFnZVwiLCBbJ1NlcnZpY2VMYXlvdXRzRGF0YScsIGZ1bmN0aW9uKFNlcnZpY2VMYXlvdXRzRGF0YSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3QgOiAnRUEnLFxuICAgICAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgICAgICAgZGF0YSA6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsIDogJ3VwZGF0ZWZvcm1wYWdlLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXG4gICAgICAgICAgICBcdCRzY29wZS5wYXJlbnQgPSAkc2NvcGUuJHBhcmVudC4kcGFyZW50O1xuXHRcdFx0XHQkc2NvcGUubmF2SXRlbUlkID0gJHNjb3BlLnBhcmVudC5pdGVtLmlkO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGF5b3V0X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLmFycmF5VG9TZWxlY3QgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWVGaWVsZCwgbGFiZWxGaWVsZCkge1xuXHRcdFx0XHRcdHZhciBvdXRwdXQgPSBbXTtcblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRvdXRwdXQucHVzaCh7XCJsYWJlbFwiOiB2YWx1ZVtsYWJlbEZpZWxkXSwgXCJ2YWx1ZVwiOiB2YWx1ZVt2YWx1ZUZpZWxkXX0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpMYXlvdXRzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gW107IC8vICRzY29wZS5hcnJheVRvU2VsZWN0KGRhdGEpOyAvLyBAVE9ETyBSRU1PVkUgSUYgVkVSSUZJRURcblx0XHRcdFx0fSk7XG5cblxuXHRcdFx0XHQkc2NvcGUudmVyc2lvbnNEYXRhID0gW107XG5cblx0XHRcdFx0JHNjb3BlLmdldFZlcnNpb25MaXN0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlL3ZlcnNpb25zJywgeyBwYXJhbXMgOiB7IG5hdkl0ZW1JZCA6ICRzY29wZS5uYXZJdGVtSWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS52ZXJzaW9uc0RhdGEgPSAkc2NvcGUuYXJyYXlUb1NlbGVjdChyZXNwb25zZS5kYXRhLCAnaWQnLCAndmVyc2lvbl9hbGlhcycpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICBcdCRzY29wZS5pc0VkaXRBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLnZlcnNpb25zRGF0YS5sZW5ndGg7XG4gICAgICAgICAgICBcdH07XG5cblx0XHRcdFx0ZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdFx0XHQkc2NvcGUuZ2V0VmVyc2lvbkxpc3QoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGluaXQoKTtcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cblx0fV0pO1xuXHR6YWEuZGlyZWN0aXZlKFwiY3JlYXRlRm9ybVBhZ2VcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybXBhZ2UuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdFx0XHQkc2NvcGUuZGF0YS51c2VfZHJhZnQgPSAwO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYXlvdXRfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5mcm9tX2RyYWZ0X2lkID0gMDtcblxuXHRcdFx0XHQvKiBsYXlvdXRzRGF0YSAqL1xuXG5cdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgICAgICAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgICAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICAgICAgICAgIFx0fSk7XG5cbiAgICAgICAgICAgIFx0LyogbWVudURhdGEgKi9cblxuICAgIFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hcnJheVRvU2VsZWN0ID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlRmllbGQsIGxhYmVsRmllbGQpIHtcblx0XHRcdFx0XHR2YXIgb3V0cHV0ID0gW107XG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goe1wibGFiZWxcIjogdmFsdWVbbGFiZWxGaWVsZF0sIFwidmFsdWVcIjogdmFsdWVbdmFsdWVGaWVsZF19KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICBcdGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICBcdFx0JHNjb3BlLmRyYWZ0cyA9ICRzY29wZS5hcnJheVRvU2VsZWN0KCRzY29wZS5tZW51RGF0YS5kcmFmdHMsICdpZCcsICd0aXRsZScpO1xuXHRcdFx0XHRcdCRzY29wZS5sYXlvdXRzID0gJHNjb3BlLmFycmF5VG9TZWxlY3QoJHNjb3BlLmxheW91dHNEYXRhLCAnaWQnLCAnbmFtZScpO1xuICAgICAgICAgICAgXHR9XG5cbiAgICAgICAgICAgIFx0aW5pdCgpO1xuXG5cdFx0XHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHNjb3BlLiRwYXJlbnQuZXhlYygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogUGFnZSBNT0RVTEUgKi9cblxuXHR6YWEuZGlyZWN0aXZlKFwiZm9ybU1vZHVsZVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdmb3JtbW9kdWxlLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXG5cdFx0XHRcdCRzY29wZS5tb2R1bGVzID0gW107XG5cdFx0XHRcdCRzY29wZS5jb250cm9sbGVycyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuYWN0aW9ucyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUucGFyYW1zID0ge307XG5cblx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktYWRtaW4tY29tbW9uL2RhdGEtbW9kdWxlcycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5hZGRQYXJhbSA9IGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0XHRcdGlmICghJHNjb3BlLmRhdGEuaGFzT3duUHJvcGVydHkoJ2FjdGlvbl9wYXJhbXMnKSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtcyA9IHt9O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hY3Rpb25fcGFyYW1zW2tleV0gPSAnJztcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuZGF0YS5tb2R1bGVfbmFtZTtcblx0XHRcdFx0fSwgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vbW9kdWxlLWNvbnRyb2xsZXJzP21vZHVsZT0nICsgbikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYWN0aW9ucyA9IFtdO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUuZGF0YS5jb250cm9sbGVyX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL2NvbnRyb2xsZXItYWN0aW9ucz9tb2R1bGU9Jyskc2NvcGUuZGF0YS5tb2R1bGVfbmFtZSsnJmNvbnRyb2xsZXI9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dXG5cdFx0fVxuXHR9KTtcblxuXHQvKiBmaWx0ZXJzICovXG5cblx0emFhLmZpbHRlcihcIm1lbnV3ZWJzaXRlZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgd2Vic2l0ZUlkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLndlYnNpdGVfaWQgPT0gd2Vic2l0ZUlkKSB7XG5cdFx0XHRcdFx0cmVzdWx0LnB1c2godmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblx0fSk7XG5cblx0emFhLmZpbHRlcihcIm1lbnVwYXJlbnRmaWx0ZXJcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciByZXN1bHQgPSBbXTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAodmFsdWUucGFyZW50X25hdl9pZCA9PSBwYXJlbnROYXZJZCAmJiB2YWx1ZS5uYXZfY29udGFpbmVyX2lkID09IGNvbnRhaW5lcklkKSB7XG5cdFx0XHRcdFx0cmVzdWx0LnB1c2godmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fTtcblx0fSk7XG5cblx0emFhLmZpbHRlcignbWVudWNoaWxkZmlsdGVyJywgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciByZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICghcmV0dXJuVmFsdWUpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUuaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcmV0dXJuVmFsdWU7XG5cdFx0fTtcblx0fSk7XG5cblx0LyogZmFjdG9yeS5qcyAqL1xuXG5cdHphYS5mYWN0b3J5KCdQbGFjZWhvbGRlclNlcnZpY2UnLCBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VydmljZSA9IFtdO1xuXG5cdFx0c2VydmljZS5zdGF0dXMgPSAxOyAvKiAxID0gc2hvd3BsYWNlaG9sZGVyczsgMCA9IGhpZGUgcGxhY2Vob2xkZXJzICovXG5cblx0XHRzZXJ2aWNlLmRlbGVnYXRlID0gZnVuY3Rpb24oc3RhdHVzKSB7XG5cdFx0XHRzZXJ2aWNlLnN0YXR1cyA9IHN0YXR1cztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHNlcnZpY2U7XG5cdH0pO1xuXG5cdC8qIGxheW91dC5qcyAqL1xuXG5cdHphYS5jb25maWcoWyckc3RhdGVQcm92aWRlcicsIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdFx0JHN0YXRlUHJvdmlkZXJcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZWRpdFwiLCB7XG5cdFx0XHR1cmwgOiBcIi91cGRhdGUvOm5hdklkXCIsXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjbXNhZG1pbi9wYWdlL3VwZGF0ZSdcblx0XHR9KVxuXHRcdC5zdGF0ZShcImN1c3RvbS5jbXNhZGRcIiwge1xuXHRcdFx0dXJsIDogXCIvY3JlYXRlXCIsXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjbXNhZG1pbi9wYWdlL2NyZWF0ZSdcblx0XHR9KVxuXHRcdC5zdGF0ZShcImN1c3RvbS5jbXNkcmFmdFwiLCB7XG5cdFx0XHR1cmw6ICcvZHJhZnRzJyxcblx0XHRcdHRlbXBsYXRlVXJsOiAnY21zYWRtaW4vcGFnZS9kcmFmdHMnXG5cdFx0fSk7XG5cdH1dKTtcblxuXHQvKiBjb250cm9sbGVycyAqL1xuXG5cdHphYS5jb250cm9sbGVyKFwiRHJhZnRzQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckc3RhdGUnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuZ28gPSBmdW5jdGlvbihuYXZJZCkge1xuXHRcdFx0JHN0YXRlLmdvKCdjdXN0b20uY21zZWRpdCcsIHsgbmF2SWQgOiBuYXZJZCB9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNEYXNoYm9hcmRcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cdFx0JHNjb3BlLmRhc2hib2FyZCA9IFtdO1xuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXNoYm9hcmQtbG9nJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhc2hib2FyZCA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0fSk7XG5cdH1dKTtcblx0XG5cdHphYS5jb250cm9sbGVyKFwiQ29uZmlnQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdBZG1pblRvYXN0U2VydmljZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEFkbWluVG9hc3RTZXJ2aWNlKSB7XG5cdFx0JHNjb3BlLmRhdGEgPSB7fTtcblxuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHQkc2NvcGUuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnLCAkc2NvcGUuZGF0YSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX2NvbmZpZ191cGRhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiUGFnZVZlcnNpb25zQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIEFkbWluVG9hc3RTZXJ2aWNlKSB7XG5cdFx0LyoqXG5cdFx0ICogQHZhciBvYmplY3QgJHR5cGVEYXRhIEZyb20gcGFyZW50IHNjb3BlIGNvbnRyb2xsZXIgTmF2SXRlbUNvbnRyb2xsZXJcblx0XHQgKiBAdmFyIG9iamVjdCAkaXRlbSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBzdHJpbmcgJHZlcnNpb25OYW1lIEZyb20gbmctbW9kZWxcblx0XHQgKiBAdmFyIGludGVnZXIgJGZyb21WZXJzaW9uUGFnZUlkIEZyb20gbmctbW9kZWwgdGhlIHZlcnNpb24gY29weSBmcm9tIG9yIDAgPSBuZXcgZW1wdHkvYmxhbmsgdmVyc2lvblxuXHRcdCAqIEB2YXIgaW50ZWdlciAkdmVyc2lvbkxheW91dElkIEZyb20gbmctbW9kZWwsIG9ubHkgaWYgZnJvbVZlcnNpb25QYWdlSWQgaXMgMFxuIFx0XHQgKi9cblx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHQvKiBsYXlvdXRzRGF0YSAqL1xuXG5cdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgIFx0fSk7XG5cbiAgICBcdC8qIGNvbnRyb2xsZXIgbG9naWMgKi9cblxuXHRcdCRzY29wZS5jcmVhdGVOZXdWZXJzaW9uU3VibWl0ID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmIChkYXRhLmNvcHlFeGlzdGluZ1ZlcnNpb24pIHtcblx0XHRcdFx0ZGF0YS52ZXJzaW9uTGF5b3V0SWQgPSAwO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2NyZWF0ZS1wYWdlLXZlcnNpb24nLCAkLnBhcmFtKHsnbGF5b3V0SWQnOiBkYXRhLnZlcnNpb25MYXlvdXRJZCwgJ25hdkl0ZW1JZCc6ICRzY29wZS5pdGVtLmlkLCAnbmFtZSc6IGRhdGEudmVyc2lvbk5hbWUsICdmcm9tUGFnZUlkJzogZGF0YS5mcm9tVmVyc2lvblBhZ2VJZH0pLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLmVycm9yKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfdmVyc2lvbl9lcnJvcl9lbXB0eV9maWVsZHMnXSk7XG5cdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc192ZXJzaW9uX2NyZWF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ29weVBhZ2VDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBBZG1pblRvYXN0U2VydmljZSkge1xuXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0JHNjb3BlLiRvbignZGVsZXRlZE5hdkl0ZW0nLCBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5pc09wZW4gPSBmYWxzZTtcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW9uID0gMDtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5OYXZJdGVtQ29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0JHNjb3BlLm5hdklkID0gMDtcblxuXHRcdCRzY29wZS5pdGVtcyA9IG51bGw7XG5cblx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cblx0XHQkc2NvcGUuc2VsZWN0ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IGl0ZW0uaWQ7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGFuZ3VsYXIuY29weShpdGVtKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnaXRlbVNlbGVjdGlvbi50aXRsZScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdCRzY29wZS5hbGlhc1N1Z2dlc3Rpb24oKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKCRzY29wZS5pdGVtU2VsZWN0aW9uLnRpdGxlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWRJdGVtcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLm5hdklkID0gJHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5pZDtcblxuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9maW5kLW5hdi1pdGVtcycsIHsgcGFyYW1zOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtcyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdCRzY29wZS5pc09wZW4gPSB0cnVlO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvblsndG9MYW5nSWQnXSA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5sYW5nLmlkO1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLWZyb20tcGFnZScsICQucGFyYW0oJHNjb3BlLml0ZW1TZWxlY3Rpb24pLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9vayddKTtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIucmVmcmVzaCgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX2FkZGVkX3RyYW5zbGF0aW9uX2Vycm9yJ10pO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc01lbnVUcmVlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcm9vdFNjb3BlJywgJyRzdGF0ZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlLCAkaHR0cCwgJGZpbHRlciwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUpIHtcblxuXHRcdC8vIGxpdmUgZWRpdCBzZXJ2aWNlXG5cblx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IDA7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdsaXZlRWRpdFN0YXRlVG9nZ2xlcicsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmxvYWRDbXNDb25maWcgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb25maWcnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRyb290U2NvcGUuY21zQ29uZmlnID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmxvYWRDbXNDb25maWcoKTtcblx0XHRcblx0XHQvLyBtZW51IERhdGFcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQvLyBDb250YWlucyB0aGUgY3VycmVudCB3ZWJzaXRlIGlkLCBpcyBpbml0aWFsaXplZCB3aXRoIGZhbHNlIGFzIHZhbHVlXG5cdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9IGZhbHNlXG5cblx0XHQkc2NvcGUuJHdhdGNoKCdjdXJyZW50V2Vic2l0ZVRvZ2dsZXInLCBmdW5jdGlvbihuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcblx0XHRcdGlmIChuZXdWYWx1ZSAmJiBuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpIHtcblx0XHRcdFx0U2VydmljZUN1cnJlbnRXZWJzaXRlLnRvZ2dsZShuZXdWYWx1ZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBpbml0aWFsaXplIHRoZSBzdGF0ZSBvZiB0aGUgY3VycmVudCBtZW51IHNlcnZpY2Vcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGVcblxuXHRcdC8vIGlmIHRoZSBzdGF0ZSBoYXMgcmVjaXZlZCBhIHZhbHVlLCBhZnRlciB0aGUgc2VydmljZSBldmVudCBoYXMgYmVlbiB0cmlnZ2VyZWQsIHRoaXMgZW5zdXJlc1xuXHRcdC8vIHRoZSBjdXJyZW50IHdlYnNpdGUgaXMgZGlzcGxheWVkLiBMaWtlIGEgbGF6eSBsb2FkIGVuc3VyYW5jZVxuXHRcdGlmICgkc2NvcGUuY3VycmVudFdlYnNpdGUpIHtcblx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZVRvZ2dsZXIgPSAkc2NvcGUuY3VycmVudFdlYnNpdGUuaWRcblx0XHR9XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBkYXRhO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9IGRhdGEuaWQ7XG5cdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gY29udHJvbGxlciBsb2dpY1xuXHRcdFxuXHRcdCRzY29wZS5kcm9wRW1wdHlDb250YWluZXIgPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24sY2F0SWQpIHtcblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtdG8tY29udGFpbmVyJywgeyBwYXJhbXM6IHttb3ZlSXRlbUlkOiBkcmFnZ2VkLmlkLCBkcm9wcGVkT25DYXRJZDogY2F0SWR9fSkudGhlbihmdW5jdGlvbihzdWNjZXMpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5kcm9wSXRlbSA9IGZ1bmN0aW9uKGRyYWcsZHJvcCxwb3MpIHtcblx0XHRcdGlmIChwb3MgPT0gJ2JvdHRvbScpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS1hZnRlcic7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7bW92ZUl0ZW1JZDogZHJhZy5pZCwgZHJvcHBlZEFmdGVySXRlbUlkOiBkcm9wLmlkfTtcblx0XHRcdH0gZWxzZSBpZiAocG9zID09ICd0b3AnKSB7XG5cdFx0XHRcdHZhciBhcGkgPSAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtYmVmb3JlJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkQmVmb3JlSXRlbUlkOiBkcm9wLmlkfTtcblxuXHRcdFx0fSBlbHNlIGlmIChwb3MgPT0gJ21pZGRsZScpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS10by1jaGlsZCc7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7bW92ZUl0ZW1JZDogZHJhZy5pZCwgZHJvcHBlZE9uSXRlbUlkOiBkcm9wLmlkfTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0JGh0dHAuZ2V0KGFwaSwgeyBwYXJhbXMgOiBwYXJhbXMgfSkudGhlbihmdW5jdGlvbihzdWNjZXNzKSB7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0fSwgZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS52YWxpZEl0ZW0gPSBmdW5jdGlvbihob3ZlciwgZHJhZ2VkKSB7XG5cdFx0XHRcblx0XHRcdGlmIChob3Zlci5pZCA9PSBkcmFnZWQuaWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkc2NvcGUucnJpdGVtcyA9IFtdO1xuXHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGRyYWdlZC5uYXZfY29udGFpbmVyX2lkLCBkcmFnZWQuaWQpO1xuXHRcdFx0XG5cdFx0XHRpZiAoJHNjb3BlLnJyaXRlbXMuaW5kZXhPZihob3Zlci5pZCkgPT0gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5ycml0ZW1zID0gW107XG5cdFx0XG5cdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5ID0gZnVuY3Rpb24oY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgaXRlbXMgPSAkZmlsdGVyKCdtZW51cGFyZW50ZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHRcdFx0XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0JHNjb3BlLnJyaXRlbXMucHVzaChpdGVtLmlkKTtcblx0XHRcdFx0JHNjb3BlLnJlY3Vyc2l2SXRlbVZhbGlkaXR5KGNvbnRhaW5lcklkLCBpdGVtLmlkKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXRlbSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhLnRvZ2dsZV9vcGVuID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRkYXRhWyd0b2dnbGVfb3BlbiddID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRhdGFbJ3RvZ2dsZV9vcGVuJ10gPSAhZGF0YS50b2dnbGVfb3Blbjtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdHJlZS1oaXN0b3J5Jywge2RhdGE6IGRhdGF9LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXG5cdFx0fTtcblxuXHRcdCRzY29wZS5nbyA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKGRhdGEubmF2X2l0ZW1faWQsIDApO1xuXHRcdFx0JHN0YXRlLmdvKCdjdXN0b20uY21zZWRpdCcsIHsgbmF2SWQgOiBkYXRhLmlkIH0pO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLnNob3dEcmFnID0gMDtcblxuXHQgICAgJHNjb3BlLmlzQ3VycmVudEVsZW1lbnQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdCAgICBcdGlmIChkYXRhICE9PSBudWxsICYmICRzdGF0ZS5wYXJhbXMubmF2SWQgPT0gZGF0YS5pZCkge1xuXHQgICAgXHRcdHJldHVybiB0cnVlO1xuXHQgICAgXHR9XG5cblx0ICAgIFx0cmV0dXJuIGZhbHNlO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLmhpZGRlbkNhdHMgPSBbXTtcblxuXHQgICAgJHNjb3BlLiR3YXRjaCgnbWVudURhdGEnLCBmdW5jdGlvbiAobiwgbykge1xuXHQgICAgXHQkc2NvcGUuaGlkZGVuQ2F0cyA9IG4uaGlkZGVuQ2F0cztcblx0ICAgIH0pO1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUNhdCA9IGZ1bmN0aW9uKGNhdElkKSB7XG5cdFx0XHRpZiAoY2F0SWQgaW4gJHNjb3BlLmhpZGRlbkNhdHMpIHtcblx0XHRcdFx0JHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID0gISRzY29wZS5oaWRkZW5DYXRzW2NhdElkXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9IDE7XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtY2F0LXRvZ2dsZScsIHtjYXRJZDogY2F0SWQsIHN0YXRlOiAkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF19LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSXNIaWRkZW4gPSBmdW5jdGlvbihjYXRJZCkge1xuXG5cdFx0XHRpZiAoJHNjb3BlLmhpZGRlbkNhdHMgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNhdElkIGluICRzY29wZS5oaWRkZW5DYXRzKSB7XG5cdFx0XHRcdGlmICgkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPT0gMSkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9O1xuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHt9O1xuXHRcdCRzY29wZS5kYXRhLmlzSW5saW5lID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMikge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1tb2R1bGUnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMykge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1yZWRpcmVjdCcsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc2FkbWluQ3JlYXRlSW5saW5lQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckcScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJHEsICRodHRwKSB7XG5cblx0XHQkc2NvcGUuZGF0YSA9IHtcblx0XHRcdG5hdl9pZCA6ICRzY29wZS4kcGFyZW50Lk5hdkNvbnRyb2xsZXIuaWRcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmRhdGEuaXNJbmxpbmUgPSB0cnVlO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9ICRzY29wZS5sYW5nLmlkO1xuXG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXBhZ2UtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAyKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLW1vZHVsZS1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDMpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcmVkaXJlY3QtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIk5hdkNvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHJvb3RTY29wZScsICckZmlsdGVyJywgJyRzdGF0ZScsICckc3RhdGVQYXJhbXMnLCAnJGh0dHAnLCAnUGxhY2Vob2xkZXJTZXJ2aWNlJywgJ1NlcnZpY2VQcm9wZXJ0aWVzRGF0YScsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxhbmd1YWdlc0RhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdBZG1pblRvYXN0U2VydmljZScsICdBZG1pbkNsYXNzU2VydmljZScsICdBZG1pbkxhbmdTZXJ2aWNlJywgJ0h0bWxTdG9yYWdlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRmaWx0ZXIsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCAkaHR0cCwgUGxhY2Vob2xkZXJTZXJ2aWNlLCBTZXJ2aWNlUHJvcGVydGllc0RhdGEsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxhbmd1YWdlc0RhdGEsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIEFkbWluVG9hc3RTZXJ2aWNlLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5MYW5nU2VydmljZSwgSHRtbFN0b3JhZ2UpIHtcblxuXG5cdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4gPSB0cnVlO1xuXHRcdFxuXHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gMTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHQpIHtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5VGFiID0gdDtcblx0XHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuID0gISRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLm5hdkNmZyA9IHtcblx0XHRcdGhlbHB0YWdzOiAkcm9vdFNjb3BlLmx1eWFjZmcuaGVscHRhZ3MsXG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGlzcGxheUxpdmVDb250YWluZXIgPSBuO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnVybCB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZVVybCA9IG47XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLkFkbWluTGFuZ1NlcnZpY2UgPSBBZG1pbkxhbmdTZXJ2aWNlO1xuXG5cdFx0Lyogc2VydmljZSBBZG1pblByb3BlcnR5U2VydmljZSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLnByb3BlcnRpZXNEYXRhID0gU2VydmljZVByb3BlcnRpZXNEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOlByb3BlcnRpZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5wcm9wZXJ0aWVzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlTGFuZ2F1Z2VzRGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdC8qIHBsYWNlaG9sZGVycyB0b2dnbGVyIHNlcnZpY2UgKi9cblxuXHRcdCRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2UgPSBQbGFjZWhvbGRlclNlcnZpY2U7XG5cblx0XHQkc2NvcGUucGxhY2Vob2xkZXJTdGF0ZSA9ICRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2Uuc3RhdHVzO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgncGxhY2Vob2xkZXJTdGF0ZScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlLmRlbGVnYXRlKG4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0LyogQmxvY2tob2xkZXIgc2l6ZSB0b2dnbGVyICovXG5cbiAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9IEh0bWxTdG9yYWdlLmdldFZhbHVlKCdibG9ja2hvbGRlclRvZ2dsZVN0YXRlJywgdHJ1ZSk7XG5cbiAgICAgICAgJHNjb3BlLnRvZ2dsZUJsb2NraG9sZGVyU2l6ZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCA9ICEkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsO1xuICAgICAgICAgICAgSHRtbFN0b3JhZ2Uuc2V0VmFsdWUoJ2Jsb2NraG9sZGVyVG9nZ2xlU3RhdGUnLCAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvKiBzaWRlYmFyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuc2lkZWJhciA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuZW5hYmxlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgXHQkc2NvcGUuc2lkZWJhciA9IHRydWU7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUudG9nZ2xlU2lkZWJhciA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICRzY29wZS5zaWRlYmFyID0gISRzY29wZS5zaWRlYmFyO1xuXHQgICAgfTtcblxuXHRcdC8qIGFwcCBsb2dpYyAqL1xuXG5cdCAgICAkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXG5cdFx0JHNjb3BlLmlkID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLm5hdklkKTtcblxuXHRcdCRzY29wZS5pc0RlbGV0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5BZG1pbkNsYXNzU2VydmljZSA9IEFkbWluQ2xhc3NTZXJ2aWNlO1xuXG5cdFx0JHNjb3BlLnByb3BWYWx1ZXMgPSB7fTtcblxuXHRcdCRzY29wZS5oYXNWYWx1ZXMgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5wYWdlVGFncyA9IFtdO1xuXG5cdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQpIHtcblx0ICAgIFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdCAgICBcdGlmIChpdGVtKSB7XG5cdCAgICBcdFx0aXRlbS50b2dnbGVfb3BlbiA9IDE7XG5cdCAgICBcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMoaXRlbS5wYXJlbnRfbmF2X2lkLCBpdGVtLm5hdl9jb250YWluZXJfaWQpO1xuXHQgICAgXHR9XG5cdCAgICB9O1xuXG5cdFx0JHNjb3BlLmNyZWF0ZURlZXBQYWdlQ29weSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVlcC1wYWdlLWNvcHknLCB7bmF2SWQ6ICRzY29wZS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9jcmVhdGVfY29weV9zdWNjZXNzJ10pO1xuXHRcdFx0XHQkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucGFnZVRhZ3MgPSBbXTtcblxuXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvJyArICRzY29wZS5pZCArICcvdGFncycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHQkc2NvcGUucGFnZVRhZ3MucHVzaCh2YWx1ZS5pZCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5zYXZlUGFnZVRhZ3MgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2LycgKyAkc2NvcGUuaWQgKyAnL3RhZ3MnLCAkc2NvcGUucGFnZVRhZ3MpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jcmVhdGVEZWVwUGFnZUNvcHlBc1RlbXBsYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9kZWVwLXBhZ2UtY29weS1hcy10ZW1wbGF0ZScsIHtuYXZJZDogJHNjb3BlLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX2NyZWF0ZV9jb3B5X2FzX3RlbXBsYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdCRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjdXN0b20uY21zZHJhZnQnKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L2dldC1wcm9wZXJ0aWVzJywgeyBwYXJhbXM6IHtuYXZJZDogJHNjb3BlLmlkfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0Zm9yKHZhciBpIGluIHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHR2YXIgZCA9IHJlc3BvbnNlLmRhdGFbaV07XG5cdFx0XHRcdFx0JHNjb3BlLnByb3BWYWx1ZXNbZC5hZG1pbl9wcm9wX2lkXSA9IGQudmFsdWU7XG5cdFx0XHRcdFx0JHNjb3BlLmhhc1ZhbHVlcyA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlUHJvcE1hc2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSAhJHNjb3BlLnNob3dQcm9wRm9ybTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnN0b3JlUHJvcFZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvc2F2ZS1wcm9wZXJ0aWVzP25hdklkPScrJHNjb3BlLmlkLCAkLnBhcmFtKCRzY29wZS5wcm9wVmFsdWVzKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfcHJvcGVydHlfcmVmcmVzaCddKTtcblx0XHRcdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzKCk7XG5cdFx0XHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSBmYWxzZTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudHJhc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blsnanNfcGFnZV9jb25maXJtX2RlbGV0ZSddLCBpMThuWydjbXNhZG1pbl9zZXR0aW5nc190cmFzaHBhZ2VfdGl0bGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9kZWxldGUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUuaWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRcdCRzY29wZS5pc0RlbGV0ZWQgPSB0cnVlO1xuXHQgICAgXHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0ICAgIFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdCAgICBcdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdCAgICBcdFx0XHR9KTtcblx0ICAgIFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdGlmIChyZXNwb25zZS5zdGF0dXMgPT0gNDE3KSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19wYWdlX2RlbGV0ZV9lcnJvcl9jYXVzZV9yZWRpcmVjdHMnXSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5pc0RyYWZ0ID0gZmFsc2U7XG5cblx0ICAgICRzY29wZS5zdWJtaXROYXZGb3JtID0gZnVuY3Rpb24oZGF0YSkge1xuXHQgICAgXHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi91cGRhdGU/aWQ9JyArICRzY29wZS5uYXZEYXRhLmlkLCBkYXRhKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfdXBkYXRlX2xheW91dF9zYXZlX3N1Y2Nlc3MnKSk7XG5cdCAgICBcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0ICAgIFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcblx0ICAgIFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKHZhbHVlLm1lc3NhZ2UpO1xuXHQgICAgXHRcdH0pO1xuXHQgICAgXHR9KTtcblx0ICAgIH07XG5cblx0ICAgIGZ1bmN0aW9uIGluaXRpYWxpemVyKCkge1xuXHRcdFx0JHNjb3BlLm5hdkRhdGEgPSAkZmlsdGVyKCdmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIHtpZDogJHNjb3BlLmlkfSwgdHJ1ZSlbMF07XG5cdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCRzY29wZS5pc0RyYWZ0ID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0JHNjb3BlLmxvYWROYXZQcm9wZXJ0aWVzKCk7XG5cblx0XHRcdFx0LyogcHJvcGVydGllcyAtLT4gKi9cblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19vZmZsaW5lIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCAgICBcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ICAgIFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1vZmZsaW5lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBvZmZsaW5lU3RhdHVzIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfb2ZmbGluZSA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX29mZmxpbmUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9vbmxpbmUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHQgICAgXHRcdH0pO1xuXHRcdFx0ICAgIFx0fVxuXHRcdFx0ICAgIH0pO1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX2hpZGRlbiB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1oaWRkZW4nLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIGhpZGRlblN0YXR1cyA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX2hpZGRlbiA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX2hpZGRlbicsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX3Zpc2libGUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX2hvbWUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0ICAgIFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L3RvZ2dsZS1ob21lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBob21lU3RhdGUgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX2hvbWUgPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3N0YXRlX2lzX2hvbWUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfc3RhdGVfaXNfbm90X2hvbWUnLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0ICAgIFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRcdGluaXRpYWxpemVyKCk7XG5cdH1dKTtcblxuXHQvKipcblx0ICogQHBhcmFtICRzY29wZS5sYW5nIGZyb20gbmctcmVwZWF0XG5cdCAqL1xuXHR6YWEuY29udHJvbGxlcihcIk5hdkl0ZW1Db250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICckdGltZW91dCcsICdTZXJ2aWNlTWVudURhdGEnLCAnQWRtaW5MYW5nU2VydmljZScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRodHRwLCAkZmlsdGVyLCAkdGltZW91dCwgU2VydmljZU1lbnVEYXRhLCBBZG1pbkxhbmdTZXJ2aWNlLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uKSB7XG5cblx0XHQkc2NvcGUubG9hZGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuTmF2Q29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSBmYWxzZTtcblxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5vcGVuTGl2ZVVybCA9IGZ1bmN0aW9uKGlkLCB2ZXJzaW9uSWQpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKGlkLCB2ZXJzaW9uSWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUubG9hZExpdmVVcmwgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKCRzY29wZS5pdGVtLmlkLCAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uKTtcblx0XHR9O1xuXG5cdFx0Ly8gbGF5b3V0c0RhdGFcblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgIFx0fSk7XG5cdFx0XG5cdFx0Ly8gc2VydmljZU1lbnVEYXRhIGluaGVyaXRhbmNlXG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpMb2FkTGFuZ3VhZ2UnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0aWYgKCEkc2NvcGUubG9hZGVkKSB7XG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBwcm9wZXJ0aWVzOlxuXG5cdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW0gPSBbXTtcblxuXHRcdCRzY29wZS5pdGVtQ29weSA9IFtdO1xuXG5cdFx0JHNjb3BlLnNldHRpbmdzID0gZmFsc2U7XG5cblx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gW107XG5cblx0XHQkc2NvcGUudHlwZURhdGEgPSBbXTtcblxuXHRcdCRzY29wZS5jb250YWluZXIgPSBbXTtcblxuXHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblxuXHRcdCRzY29wZS5ob21lVXJsID0gJHJvb3RTY29wZS5sdXlhY2ZnLmhvbWVVcmw7XG5cblx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcblx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXM7XG5cblx0XHQkc2NvcGUudHJhc2hJdGVtID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmxhbmcuaXNfZGVmYXVsdCA9PSAwKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blsnanNfcGFnZV9jb25maXJtX2RlbGV0ZSddLCBpMThuWydjbXNhZG1pbl9zZXR0aW5nc190cmFzaHBhZ2VfdGl0bGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0XHQkaHR0cC5kZWxldGUoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9kZWxldGU/bmF2SXRlbUlkPScgKyAkc2NvcGUuaXRlbS5pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXRlbSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXRlbUNvcHkgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnNldHRpbmdzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLiRicm9hZGNhc3QoJ2RlbGV0ZWROYXZJdGVtJyk7XG5cdFx0XHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdCAgICBcdFx0XHR9KTtcblx0XHQgICAgXHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19wYWdlX2RlbGV0ZV9lcnJvcl9jYXVzZV9yZWRpcmVjdHMnXSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1dKTtcblx0XHRcdH1cblx0ICAgIH07XG5cblx0XHQkc2NvcGUucmVzZXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5pdGVtQ29weSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuaXRlbSk7XG5cdFx0XHRpZiAoJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBhbmd1bGFyLmNvcHkoeyduYXZfaXRlbV90eXBlX2lkJyA6ICRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gYW5ndWxhci5jb3B5KCRzY29wZS50eXBlRGF0YSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS51cGRhdGVOYXZJdGVtRGF0YSA9IGZ1bmN0aW9uKGl0ZW1Db3B5LCB0eXBlRGF0YUNvcHkpIHtcblx0XHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblx0XHRcdHZhciBuYXZJdGVtSWQgPSBpdGVtQ29weS5pZDtcblxuXHRcdFx0dHlwZURhdGFDb3B5LnRpdGxlID0gaXRlbUNvcHkudGl0bGU7XG5cdFx0XHR0eXBlRGF0YUNvcHkuYWxpYXMgPSBpdGVtQ29weS5hbGlhcztcblx0XHRcdHR5cGVEYXRhQ29weS50aXRsZV90YWcgPSBpdGVtQ29weS50aXRsZV90YWc7XG5cdFx0XHR0eXBlRGF0YUNvcHkuZGVzY3JpcHRpb24gPSBpdGVtQ29weS5kZXNjcmlwdGlvbjtcblx0XHRcdHR5cGVEYXRhQ29weS5rZXl3b3JkcyA9IGl0ZW1Db3B5LmtleXdvcmRzO1xuXHRcdFx0dHlwZURhdGFDb3B5LnRpbWVzdGFtcF9jcmVhdGUgPSBpdGVtQ29weS50aW1lc3RhbXBfY3JlYXRlO1xuXHRcdFx0dHlwZURhdGFDb3B5LmltYWdlX2lkID0gaXRlbUNvcHkuaW1hZ2VfaWQ7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaXNfdXJsX3N0cmljdF9wYXJzaW5nX2Rpc2FibGVkID0gaXRlbUNvcHkuaXNfdXJsX3N0cmljdF9wYXJzaW5nX2Rpc2FibGVkO1xuXHRcdFx0dHlwZURhdGFDb3B5LmlzX2NhY2hlYWJsZSA9IGl0ZW1Db3B5LmlzX2NhY2hlYWJsZTtcblx0XHRcdCRodHRwLnBvc3QoXG5cdFx0XHRcdCdhZG1pbi9hcGktY21zLW5hdml0ZW0vdXBkYXRlLXBhZ2UtaXRlbT9uYXZJdGVtSWQ9JyArIG5hdkl0ZW1JZCArICcmbmF2SXRlbVR5cGU9JyArIGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUsXG5cdFx0XHRcdCQucGFyYW0odHlwZURhdGFDb3B5KSxcblx0XHRcdFx0aGVhZGVyc1xuXHRcdFx0KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGlmIChpdGVtQ29weS5uYXZfaXRlbV90eXBlICE9PSAxKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IGZhbHNlO1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdC8qIHN3aXRjaCB2ZXJzaW9uIGlmIHR5cGUgaXMgcGFnZSAqL1xuXHRcdFx0XHRcdGlmIChpdGVtQ29weS5uYXZfaXRlbV90eXBlID09IDEgJiYgdHlwZW9mIHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ10gPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdFx0XHQvKiBjaG9vc2UgZ2l2ZW4gdmVyc2lvbiBvciBjaG9vc2UgZmlyc3QgYXZhaWxhYmxlIHZlcnNpb24gKi9cblx0XHRcdFx0XHRcdHZhciBwYWdlVmVyc2lvbktleSA9IHJlc3BvbnNlLmRhdGFbJ2l0ZW0nXS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdFx0aWYgKHBhZ2VWZXJzaW9uS2V5ID09IDApIHtcblx0XHRcdFx0XHRcdFx0cGFnZVZlcnNpb25LZXkgPSBPYmplY3Qua2V5cyhyZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddKVswXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddW3BhZ2VWZXJzaW9uS2V5XVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ11bcGFnZVZlcnNpb25LZXldWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcGFnZVZlcnNpb25LZXk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX2l0ZW1fdXBkYXRlX29rJywgeyd0aXRsZSc6IGl0ZW1Db3B5LnRpdGxlfSkpO1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0XHQkc2NvcGUucmVzZXQoKTtcblx0XHRcdH0sIGZ1bmN0aW9uIGVycm9yQ2FsbGJhY2socmVzcG9uc2UpIHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpdGVtLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdpdGVtQ29weS5hbGlhcycsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuIT1vICYmIG4hPW51bGwpIHtcblx0XHRcdFx0JHNjb3BlLml0ZW1Db3B5LmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKG4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnJlbW92ZVZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5QYXJhbSgnanNfdmVyc2lvbl9kZWxldGVfY29uZmlybScsIHthbGlhczogdmVyc2lvbi52ZXJzaW9uX2FsaWFzfSksIGkxOG5bJ2Ntc2FkbWluX3ZlcnNpb25fcmVtb3ZlJ10sIFsnJHRvYXN0JywgJyRodHRwJywgZnVuY3Rpb24oJHRvYXN0LCAkaHR0cCkge1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vcmVtb3ZlLXBhZ2UtdmVyc2lvbicsIHtwYWdlSWQgOiB2ZXJzaW9uLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfdmVyc2lvbl9kZWxldGVfY29uZmlybV9zdWNjZXNzJywge2FsaWFzOiB2ZXJzaW9uLnZlcnNpb25fYWxpYXN9KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHRcdH07XG5cdFx0XG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb25JdGVtO1xuICAgIFx0XG4gICAgXHQkc2NvcGUudGFiID0gMTtcbiAgICBcdFxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbkl0ZW0pIHtcbiAgICBcdFx0JHNjb3BlLmNoYW5nZVRhYig0KTtcbiAgICBcdFx0JHNjb3BlLmVkaXRWZXJzaW9uSXRlbSA9IHZlcnNpb25JdGVtO1xuICAgIFx0fTtcblxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uVXBkYXRlID0gZnVuY3Rpb24oZWRpdFZlcnNpb25JdGVtKSB7XG4gICAgXHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jaGFuZ2UtcGFnZS12ZXJzaW9uLWxheW91dCcsIHsncGFnZUl0ZW1JZCc6IGVkaXRWZXJzaW9uSXRlbS5pZCwgJ2xheW91dElkJzogZWRpdFZlcnNpb25JdGVtLmxheW91dF9pZCwgJ2FsaWFzJzogZWRpdFZlcnNpb25JdGVtLnZlcnNpb25fYWxpYXN9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgXHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuICAgIFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl91cGRhdGVfc3VjY2VzcyddKTtcbiAgICBcdFx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9KTtcbiAgICBcdH07XG4gICAgXHRcblx0XHQkc2NvcGUuZ2V0SXRlbSA9IGZ1bmN0aW9uKGxhbmdJZCwgbmF2SWQpIHtcblx0XHRcdCRodHRwKHtcblx0XHRcdCAgICB1cmw6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbmF2LWxhbmctaXRlbScsXG5cdFx0XHQgICAgbWV0aG9kOiBcIkdFVFwiLFxuXHRcdFx0ICAgIHBhcmFtczogeyBsYW5nSWQgOiBsYW5nSWQsIG5hdklkIDogbmF2SWQgfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbSA9IHJlc3BvbnNlLmRhdGFbJ2l0ZW0nXTtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXTtcblx0XHRcdFx0JHNjb3BlLmlzVHJhbnNsYXRlZCA9IHRydWU7XG5cdFx0XHRcdCRzY29wZS5yZXNldCgpO1xuXHRcdFx0XHRcblx0XHRcdFx0aWYgKCFyZXNwb25zZS5kYXRhWyduYXYnXS5pc19kcmFmdCkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZDb250cm9sbGVyLmJ1YmJsZVBhcmVudHMoJHNjb3BlLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5wYXJlbnRfbmF2X2lkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5uYXZEYXRhLm5hdl9jb250YWluZXJfaWQpO1xuXHRcdFx0XHRcdGlmICgkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlID09IDEpIHtcblxuXHRcdFx0XHRcdFx0dmFyIGxhc3RWZXJzaW9uID0gU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbi5oYXNWZXJzaW9uKCRzY29wZS5pdGVtLmlkKTtcblxuXHRcdFx0XHRcdFx0aWYgKGxhc3RWZXJzaW9uKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uKGxhc3RWZXJzaW9uKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID09IDApIHtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkIGluIHJlc3BvbnNlLmRhdGEudHlwZURhdGEpIHtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSByZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSB0cnVlXG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHQvLyBpdHMgbG9hZGVkLCBidXQgdGhlIGRhdGEgZG9lcyBub3QgZXhpc3RzLlxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSA9IGZhbHNlO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVWZXJzaW9uc0Ryb3Bkb3duID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5ID0gISRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuc3dpdGNoVmVyc2lvbiA9IGZ1bmN0aW9uKHBhZ2VWZXJzaW9uaWQsIHRvZ2dsZSkge1xuXHRcdFx0U2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbi5zdG9yZSgkc2NvcGUuaXRlbS5pZCwgcGFnZVZlcnNpb25pZCk7XG5cdFx0XHQkc2NvcGUuY29udGFpbmVyID0gJHNjb3BlLnR5cGVEYXRhW3BhZ2VWZXJzaW9uaWRdWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gJHNjb3BlLnR5cGVEYXRhW3BhZ2VWZXJzaW9uaWRdWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcGFnZVZlcnNpb25pZDtcblx0XHRcdCRzY29wZS5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0aWYgKHRvZ2dsZSnCoHtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVZlcnNpb25zRHJvcGRvd24oKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLmdldEl0ZW0oJHNjb3BlLmxhbmcuaWQsICRzY29wZS5OYXZDb250cm9sbGVyLmlkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChBZG1pbkxhbmdTZXJ2aWNlLmlzSW5TZWxlY3Rpb24oJHNjb3BlLmxhbmcuc2hvcnRfY29kZSkpIHtcblx0XHRcdFx0JHNjb3BlLmdldEl0ZW0oJHNjb3BlLmxhbmcuaWQsICRzY29wZS5OYXZDb250cm9sbGVyLmlkKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qIG5ldyBzZXR0aW5ncyBvdmVybGF5ICovXG5cdFx0XG5cdFx0JHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkgPSB0cnVlO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkgPSBmdW5jdGlvbih0YWIpIHtcblx0XHRcdCRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5ID0gISRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5O1xuXHRcdFx0aWYgKHRhYikge1xuXHRcdFx0XHQkc2NvcGUudGFiID0gdGFiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRcblx0XHQkc2NvcGUuY2hhbmdlVGFiID0gZnVuY3Rpb24odGFiKSB7XG5cdFx0XHQkc2NvcGUudGFiID0gdGFiO1xuXHRcdH1cblx0XHRcblx0XHQvKipcblx0XHQgKiBSZWZyZXNoIHRoZSBjdXJyZW50IGxheW91dCBjb250YWluZXIgYmxvY2tzLlxuXHRcdCAqIFxuXHRcdCAqIEFmdGVyIHN1Y2Nlc3NmdWxsIGFwaSByZXNwb25zZSBhbGwgY21zIGxheW91dCBhcmUgZm9yZWFjaCBhbmQgdGhlIHZhbHVlcyBhcmUgcGFzc2VkIHRvIHJldlBsYWNlaG9sZGVycygpIG1ldGhvZC5cblx0XHQgKi9cblx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZCA9IGZ1bmN0aW9uKHByZXZJZCwgcGxhY2Vob2xkZXJWYXIpIHtcblx0XHRcdCRodHRwKHtcblx0XHRcdFx0dXJsIDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9yZWxvYWQtcGxhY2Vob2xkZXInLFxuXHRcdFx0XHRtZXRob2QgOiAnR0VUJyxcblx0XHRcdFx0cGFyYW1zIDogeyBuYXZJdGVtUGFnZUlkIDogJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiwgcHJldklkIDogcHJldklkLCBwbGFjZWhvbGRlclZhciA6IHBsYWNlaG9sZGVyVmFyfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybCgkc2NvcGUuaXRlbS5pZCwgJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbik7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuY29udGFpbmVyLl9fcGxhY2Vob2xkZXJzLCBmdW5jdGlvbihwbGFjZWhvbGRlcikge1xuXHRcdFx0XHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMocGxhY2Vob2xkZXIsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogVGhlIHJldlBsYWNlaG9sZGVycyBtZXRob2QgZ29lcyB0cm91cmdoIHRoZSBuZXcgcm93L2NvbCAoZ3JpZCkgc3lzdGVtIGNvbnRhaW5lciBqc29uIGxheW91dCB3aGVyZTpcblx0XHQgKiBcblx0XHQgKiByb3dzW11bMV0gPSBjb2wgbGVmdFxuXHRcdCAqIHJvd3NbXVsyXSA9IGNvbCByaWdodFxuXHRcdCAqIFxuXHRcdCAqIFdoZXJlIGEgbGF5b3V0IGhhdmUgYXQgbGVhc3Qgb24gcm93IHdoaWNoIGNhbiBoYXZlIGNvbHMgaW5zaWRlLiBTbyB0aGVyZSByZXZQbGFjZWhvbGRlcnMgbWV0aG9kIGdvZXMgdHJvdWdoIHRoZSBjb2xzXG5cdFx0ICogYW5kIGNoZWNrIGlmIHRoZSBjb2wgaXMgZXF1YWwgdGhlIGdpdmVuIGNvbCB0byByZXBsYWNlIHRoZSBjb250ZW50IHdpdGggIChmcm9tIHJlZnJlc2hOZXN0ZWQgbWV0aG9kKS5cblx0XHQgKi9cblx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzID0gZnVuY3Rpb24ocGxhY2Vob2xkZXJzLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCkge1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKHBsYWNlaG9sZGVycywgZnVuY3Rpb24ocGxhY2Vob2xkZXJSb3csIHBsYWNlaG9sZGVyS2V5KSB7XG5cdFx0XHRcdGlmIChwYXJzZUludChwcmV2SWQpID09IHBhcnNlSW50KHBsYWNlaG9sZGVyUm93LnByZXZfaWQpICYmIHBsYWNlaG9sZGVyVmFyID09IHBsYWNlaG9sZGVyUm93Wyd2YXInXSkge1xuXHRcdFx0XHRcdHBsYWNlaG9sZGVyc1twbGFjZWhvbGRlcktleV1bJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddID0gcmVwbGFjZUNvbnRlbnQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJldkZpbmQocGxhY2Vob2xkZXJSb3csIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgcmV2RmluZCBtZXRob2QgZG9lcyB0aGUgcmVjdXJzaXYgam9iIHdpdGhpbiBhIGJsb2NrIGFuIHBhc3NlcyB0aGUgdmFsdWUgYmFjayB0byByZXZQbGFjZWhvbGRlcnMoKS5cblx0XHQgKi9cblx0XHQkc2NvcGUucmV2RmluZCA9IGZ1bmN0aW9uKHBsYWNlaG9sZGVyLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCkge1xuXHRcdFx0Zm9yICh2YXIgaSBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ10pIHtcblx0XHRcdFx0Zm9yICh2YXIgaG9sZGVyS2V5IGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXSkge1xuXHRcdFx0XHRcdGZvciAodmFyIGhvbGRlciBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ11baG9sZGVyS2V5XSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyhwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ11baG9sZGVyS2V5XSwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogZHJvcHMgaXRlbXMgaW4gYW4gZW1wdHkgcGFnZSBwbGFjZWhvbGRlciBvZiBDTVMgTEFZT1VUIFBMQUNFSE9MREVSXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtUGxhY2Vob2xkZXIgPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24pIHtcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHtcblx0XHRcdFx0XHRwcmV2X2lkOiBkcm9wcGVkLnByZXZfaWQsIFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6MCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQ6IGRyYWdnZWQuaWQsIFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkKGRyb3BwZWRbJ3ByZXZfaWQnXSwgZHJvcHBlZFsndmFyJ10pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZFsncHJldl9pZCddLCBkcm9wcGVkWyd2YXInXSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0fV0pO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0gJHNjb3BlLmJsb2NrIEZyb20gbmctcmVwZWF0IHNjb3BlIGFzc2lnbm1lbnRcblx0ICovXG5cdHphYS5jb250cm9sbGVyKFwiUGFnZUJsb2NrRWRpdENvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHNjZScsICckaHR0cCcsICdBZG1pbkNsYXNzU2VydmljZScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQmxvY2tDb3B5U3RhY2snLCAnU2VydmljZUxpdmVFZGl0TW9kZScsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkc2NlLCAkaHR0cCwgQWRtaW5DbGFzc1NlcnZpY2UsIEFkbWluVG9hc3RTZXJ2aWNlLCBTZXJ2aWNlQmxvY2tDb3B5U3RhY2ssIFNlcnZpY2VMaXZlRWRpdE1vZGUpIHtcblxuXHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHQvKipcblx0XHQgKiBkcm9wcyBhbiBpdGVtIGluIGFuIGVtcHR5IHBsYWNlaG9sZGVyIG9mIGEgQkxPQ0tcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW1QbGFjZWhvbGRlciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbikge1xuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywge1xuXHRcdFx0XHRcdHByZXZfaWQgOiBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDowLCBcblx0XHRcdFx0XHRibG9ja19pZCA6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZCA6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZChkcm9wcGVkLnByZXZfaWQsIGRyb3BwZWQudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQgOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIERyb3BzIGEgYmxvY2sgYWJvdmUvYmVsb3cgYW4gRVhJU1RJTkcgQkxPQ0tcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW0gPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24sZWxlbWVudCkge1xuXHRcdFx0dmFyIHNvcnRJbmRleCA9ICRzY29wZS4kaW5kZXg7XG5cdFx0XHRcblx0XHRcdGlmIChwb3NpdGlvbiA9PSAnYm90dG9tJykge1xuXHRcdFx0XHRzb3J0SW5kZXggPSBzb3J0SW5kZXggKyAxO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7IFxuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQ6IGRyYWdnZWQuaWQsIFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXgsXG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXhcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0ICogQGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vbHV5YWRldi9sdXlhL2lzc3Vlcy8xNjI5XG5cdFx0XHRcdFx0ICogVGhlIG1vdmVkIGJsb2NrLCBzaG91bGQgcmVtb3ZlZCBmcm9tIHRoZSBwcmV2aW91cyBhcnJheS4gVGhpcyBpcyBvbmx5IHRoZSBjYXNlIHdoZW4gZHJhZ2dpbmcgZnJvbSBhbiBPVVRFUiBibG9jayBpbnRvIGFuIElOTkVSIGJsb2NrXG5cdFx0XHRcdFx0ICogaXMgdGhpcyB3aWxsIG5vdCByZWZyZXNoIHRoZSBPVVRFUiBibG9jaywgYnV0IGFsd2F5cyB3aWxsIGluIHRoZSBvcHBvc2l0ZSB3YXkuXG5cdFx0XHRcdFx0ICovXG5cdFx0XHRcdFx0YW5ndWxhci5lbGVtZW50KGVsZW1lbnQpLnJlbW92ZSgpO1xuXHRcdFx0XHRcdC8vIGFzIHRoZSBibG9jayBoYXMgYmVlbiByZW1vdmVkIGZyb20gZXhpc3RpbmcsIHJlZnJlc2ggdGhlIG5ldyBwbGFjZWhvbGRlci5cblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuY29weUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQmxvY2tDb3B5U3RhY2sucHVzaCgkc2NvcGUuYmxvY2spO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlSGlkZGVuID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19oaWRkZW4gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwKHtcblx0XHRcdCAgICB1cmw6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vdG9nZ2xlLWJsb2NrLWhpZGRlbicsXG5cdFx0XHQgICAgbWV0aG9kOiBcIkdFVFwiLFxuXHRcdFx0ICAgIHBhcmFtczogeyBibG9ja0lkIDogJHNjb3BlLmJsb2NrLmlkLCBoaWRkZW5TdGF0ZTogJHNjb3BlLmJsb2NrLmlzX2hpZGRlbiB9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdC8qIGxvYWQgbGl2ZSB1cmwgb24gaGlkZGVuIHRyaWdnZXIgKi9cblx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIuJHBhcmVudC4kcGFyZW50LmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdC8vIHN1Y2Nlc3NmdWxsIHRvZ2dsZSBoaWRkZW4gc3RhdGUgb2YgYmxvY2tcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdmlzYmlsaXR5X2NoYW5nZScsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cbiAgICAgICAgJHNjb3BlLmlzRWRpdGFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgJHNjb3BlLmJsb2NrLnZhcnMgIT0gXCJ1bmRlZmluZWRcIiAmJiAkc2NvcGUuYmxvY2sudmFycy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5pc0NvbmZpZ3VyYWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAkc2NvcGUuYmxvY2suY2ZncyAhPSBcInVuZGVmaW5lZFwiICYmICRzY29wZS5ibG9jay5jZmdzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cdFx0XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5ibG9jay52YWx1ZXMgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5ibG9jay52YXJpYXRpb24gfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkobik7XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmdldEluZm8gPSBmdW5jdGlvbih2YXJGaWVsZE5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2suZmllbGRfaGVscC5oYXNPd25Qcm9wZXJ0eSh2YXJGaWVsZE5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiAkc2NvcGUuYmxvY2suZmllbGRfaGVscFt2YXJGaWVsZE5hbWVdO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkgPSBmdW5jdGlvbih2YXJpYXRlbk5hbWUpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2sudmFyaWF0aW9ucy5oYXNPd25Qcm9wZXJ0eSh2YXJpYXRlbk5hbWUpKSB7XG5cdFx0XHRcdHZhciB2YXJpYXRpb24gPSAkc2NvcGUuYmxvY2sudmFyaWF0aW9uc1skc2NvcGUuYmxvY2sudmFyaWF0aW9uXTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHZhcmlhdGlvbiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdGlmIChhbmd1bGFyLmlzT2JqZWN0KHZhbHVlKSkge1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHZhbHVlLCBmdW5jdGlvbih2LCBrKSB7XG5cdFx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2tba2V5XSwgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0XHRcdFx0aWYgKGsgPT0gb2JqZWN0LnZhcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2suY2ZncywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay52YXJzLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUuY2ZnZGF0YSA9ICRzY29wZS5ibG9jay5jZmd2YWx1ZXMgfHwge307XG5cblx0XHQkc2NvcGUuZWRpdCA9IGZhbHNlO1xuXHRcdFxuXHRcdCRzY29wZS5tb2RhbEhpZGRlbiA9IHRydWU7XG5cblx0XHQkc2NvcGUubW9kYWxNb2RlID0gMTtcblxuXHRcdCRzY29wZS5pbml0TW9kYWxNb2RlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLnZhcnMubGVuZ3RoICA9PSAwKSB7XG5cdFx0XHRcdCRzY29wZS5tb2RhbE1vZGUgPSAyO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlRWRpdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5pc0VkaXRhYmxlKCkgfHwgJHNjb3BlLmlzQ29uZmlndXJhYmxlKCkpIHtcblx0XHRcdFx0JHNjb3BlLm1vZGFsSGlkZGVuID0gISRzY29wZS5tb2RhbEhpZGRlbjtcblx0XHRcdFx0JHNjb3BlLmVkaXQgPSAhJHNjb3BlLmVkaXQ7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW5kZXJUZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlLCBkYXRhVmFycywgY2ZnVmFycywgYmxvY2ssIGV4dHJhcykge1xuXHRcdFx0aWYgKHRlbXBsYXRlID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gJyc7XG5cdFx0XHR9XG5cdFx0XHR2YXIgdGVtcGxhdGUgPSBUd2lnLnR3aWcoe1xuXHRcdFx0ICAgIGRhdGE6IHRlbXBsYXRlXG5cdFx0XHR9KTtcblxuXHRcdFx0dmFyIGNvbnRlbnQgPSB0ZW1wbGF0ZS5yZW5kZXIoe1xuXHRcdFx0XHR2YXJzIDogZGF0YVZhcnMsXG5cdFx0XHRcdGNmZ3MgOiBjZmdWYXJzLFxuXHRcdFx0XHRibG9jayA6IGJsb2NrLFxuXHRcdFx0XHRleHRyYXMgOiBleHRyYXNcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gJHNjZS50cnVzdEFzSHRtbChjb250ZW50KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZUJsb2NrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja19kZWxldGVfY29uZmlybScsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pLCBpMThuWyd2aWV3X3VwZGF0ZV9ibG9ja190b29sdGlwX2RlbGV0ZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHQkaHR0cC5kZWxldGUoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vZGVsZXRlP2lkPScgKyAkc2NvcGUuYmxvY2suaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX3JlbW92ZV9vaycsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkgPSAgZnVuY3Rpb24oKSB7XG5cblx0XHRcdHZhciByZXNwb25zZSA9IGZhbHNlO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay52YXJzLCBmdW5jdGlvbih2YXJJdGVtKSB7XG5cdFx0XHRcdGlmICh2YXJJdGVtLnJlcXVpcmVkICYmICRzY29wZS5pc0VtcHR5KCRzY29wZS5kYXRhLCB2YXJJdGVtLnZhcikpIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuUGFyYW0oJ2pzX2Jsb2NrX2F0dHJpYnV0ZV9lbXB0eScsIHtsYWJlbDogdmFySXRlbS5sYWJlbH0pKTtcblx0XHRcdFx0XHRyZXNwb25zZSA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLmNmZ3MsIGZ1bmN0aW9uKHZhckl0ZW0pIHtcblxuXHRcdFx0XHRpZiAodmFySXRlbS5yZXF1aXJlZCAmJiAkc2NvcGUuaXNFbXB0eSgkc2NvcGUuY2ZnZGF0YSwgdmFySXRlbS52YXIpKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blBhcmFtKCdqc19ibG9ja19hdHRyaWJ1dGVfZW1wdHknLCB7bGFiZWw6IHZhckl0ZW0ubGFiZWx9KSk7XG5cdFx0XHRcdFx0cmVzcG9uc2UgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuaXNFbXB0eSA9IGZ1bmN0aW9uKHZhbHVlcywga2V5KSB7XG5cdFx0XHRpZiAodmFsdWVzLmhhc093blByb3BlcnR5KGtleSkgJiYgdmFsdWVzW2tleV0pIHtcblx0XHRcdFx0aWYgKHZhbHVlc1trZXldLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oY2xvc2UpIHtcblx0XHRcdGlmICgkc2NvcGUuaXNBbnlSZXF1aXJlZEF0dHJpYnV0ZUVtcHR5KCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkLCB7XG5cdFx0XHRcdGpzb25fY29uZmlnX3ZhbHVlczogJHNjb3BlLmRhdGEsXG5cdFx0XHRcdGpzb25fY29uZmlnX2NmZ192YWx1ZXM6ICRzY29wZS5jZmdkYXRhLFxuXHRcdFx0XHR2YXJpYXRpb246ICRzY29wZS5ibG9jay52YXJpYXRpb25cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdXBkYXRlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHRpZiAoY2xvc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUudG9nZ2xlRWRpdCgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19kaXJ0eSA9IDE7XG5cdFx0XHRcdCRzY29wZS5ibG9jayA9IGFuZ3VsYXIuY29weShyZXNwb25zZS5kYXRhLm9iamVjdGRldGFpbCk7XG5cdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5KCRzY29wZS5ibG9jay52YXJpYXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiRHJvcHBhYmxlQmxvY2tzQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICdBZG1pbkNsYXNzU2VydmljZScsICdTZXJ2aWNlQmxvY2tzRGF0YScsICdTZXJ2aWNlQmxvY2tDb3B5U3RhY2snLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pbkNsYXNzU2VydmljZSwgU2VydmljZUJsb2Nrc0RhdGEsIFNlcnZpY2VCbG9ja0NvcHlTdGFjaykge1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlQmxvY2tzRGF0YSBpbmhlcml0YW5jZSAqL1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBTZXJ2aWNlQmxvY2tzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZXN0b3JlID0gYW5ndWxhci5jb3B5KCRzY29wZS5ibG9ja3NEYXRhKTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmFkZFRvRmF2ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay90by1mYXYnLCB7YmxvY2s6IGl0ZW0gfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVGcm9tRmF2ID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay9yZW1vdmUtZmF2Jywge2Jsb2NrOiBpdGVtIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUudG9nZ2xlR3JvdXAgPSBmdW5jdGlvbihncm91cCkge1xuXHRcdFx0aWYgKGdyb3VwLnRvZ2dsZV9vcGVuID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRncm91cC50b2dnbGVfb3BlbiA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRncm91cC50b2dnbGVfb3BlbiA9ICFncm91cC50b2dnbGVfb3Blbjtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1ibG9jay90b2dnbGUtZ3JvdXAnLCB7Z3JvdXA6IGdyb3VwfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzUHJldmlld0VuYWJsZWQgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRyZXR1cm4gaXRlbS5wcmV2aWV3X2VuYWJsZWQ7XG5cdFx0fTtcblxuXHRcdC8vIGNvbnRyb2xsZXIgbG9naWNcblxuXHRcdCRzY29wZS5jb3B5U3RhY2sgPSBTZXJ2aWNlQmxvY2tDb3B5U3RhY2suc3RhY2s7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkNvcHlTdGFjaycsIGZ1bmN0aW9uKGV2ZW50LCBzdGFjaykge1xuXHRcdFx0JHNjb3BlLmNvcHlTdGFjayA9IHN0YWNrO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmNsZWFyU3RhY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VCbG9ja0NvcHlTdGFjay5jbGVhcigpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2VhcmNoUXVlcnkgPSAnJztcblxuXHRcdCRzY29wZS5zZWFyY2hJc0RpcnR5ID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdzZWFyY2hRdWVyeScsIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdGlmIChuICE9PSAnJykge1xuXHRcdFx0XHQkc2NvcGUuc2VhcmNoSXNEaXJ0eSA9IHRydWU7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2tzRGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdGlmICh2YWx1ZS5ncm91cC5pc19mYXYpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhLnNwbGljZShrZXksIDEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YWx1ZS5ncm91cC50b2dnbGVfb3BlbiA9IDFcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYoJHNjb3BlLnNlYXJjaElzRGlydHkpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmJsb2Nrc0RhdGFSZXN0b3JlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fV0pO1xufSkoKTsiLCIvKipcbiAqIGFsbCBnbG9iYWwgYWRtaW4gc2VydmljZXNcbiAqIFxuICogY29udHJvbGxlciByZXNvbHZlOiBodHRwczovL2dpdGh1Yi5jb20vam9obnBhcGEvYW5ndWxhci1zdHlsZWd1aWRlI3N0eWxlLXkwODBcbiAqIFxuICogU2VydmljZSBJbmhlcml0YW5jZTpcbiAqIFxuICogMS4gU2VydmljZSBtdXN0IGJlIHByZWZpeCB3aXRoIFNlcnZpY2VcbiAqIDIuIFNlcnZpY2UgbXVzdCBjb250YWluIGEgZm9yY2VSZWxvYWQgc3RhdGVcbiAqIDMuIFNlcnZpY2UgbXVzdCBicm9hZGNhc3QgYW4gZXZlbnQgJ3NlcnZpY2U6Rm9sZGVyc0RhdGEnXG4gKiA0LiBDb250cm9sbGVyIGludGVncmF0aW9uIG11c3QgbG9vayBsaWtlXG4gKiBcbiAqIGBgYFxuICogJHNjb3BlLmZvbGRlcnNEYXRhID0gU2VydmljZUZvbGRlcnNEYXRhLmRhdGE7XG4gKlx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOkZvbGRlcnNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqICAgICAgJHNjb3BlLmZvbGRlcnNEYXRhID0gZGF0YTtcbiAqIH0pO1xuICpcdFx0XHRcdFxuICogJHNjb3BlLmZvbGRlcnNEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiAgICAgcmV0dXJuIFNlcnZpY2VGb2xkZXJzRGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogYGBgXG4gKiBcbiAqL1xuXHRcbnphYS5jb25maWcoWydyZXNvbHZlclByb3ZpZGVyJywgZnVuY3Rpb24ocmVzb2x2ZXJQcm92aWRlcikge1xuXHRyZXNvbHZlclByb3ZpZGVyLmFkZENhbGxiYWNrKFsnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VCbG9ja3NEYXRhJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCAnTHV5YUxvYWRpbmcnLCBmdW5jdGlvbihTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VCbG9ja3NEYXRhLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSwgTHV5YUxvYWRpbmcpIHtcblx0XHRMdXlhTG9hZGluZy5zdGFydCgpO1xuXHRcdFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQoKTtcblx0XHRTZXJ2aWNlTGF5b3V0c0RhdGEubG9hZCgpO1xuXHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5sb2FkKCk7XG5cdFx0XHRMdXlhTG9hZGluZy5zdG9wKCk7XG5cdFx0fSk7XG5cdH1dKTtcbn1dKTtcblxuXG4vKipcbiAqIENvcHkgQmxvY2sgU3RhY2sgc2VydmljZS5cbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQmxvY2tDb3B5U3RhY2tcIiwgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5zdGFjayA9IFtdO1xuXHRcblx0c2VydmljZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlcnZpY2Uuc3RhY2sgPSBbXTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q29weVN0YWNrJywgc2VydmljZS5zdGFjayk7XG5cdH07XG5cdFxuXHRzZXJ2aWNlLnB1c2ggPSBmdW5jdGlvbihibG9jaykge1xuXHRcdGlmIChzZXJ2aWNlLnN0YWNrLmxlbmd0aCA+IDQpIHtcblx0XHRcdHNlcnZpY2Uuc3RhY2suc2hpZnQoKTtcblx0XHR9XG5cdFx0c2VydmljZS5zdGFjay5wdXNoKHtibG9ja0lkOiBibG9jay5ibG9ja19pZCwgbmFtZTogYmxvY2submFtZSwgaWNvbjpibG9jay5pY29uLCBpZDogYmxvY2suaWQsIGNvcHlzdGFjazogMX0pO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDb3B5U3RhY2snLCBzZXJ2aWNlLnN0YWNrKTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIE1lbnUgU2VydmljZS5cbiAqIFxuICogJHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG4gKiBcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiBcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqIFxuICogJHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiBcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIFx0XHRcdFx0XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZU1lbnVEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLW1lbnUvZGF0YS1tZW51XCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpNZW51RGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIEJsb2NrcyBTZXJ2aWNlLlxuICogXG4gKiBcbiAqICRzY29wZS5ibG9ja3NEYXRhID0gU2VydmljZUJsb2Nrc0RhdGEuZGF0YTtcbiAqIFx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogXHQkc2NvcGUuYmxvY2tzRGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqIFxuICogJHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqIFx0cmV0dXJuIFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBcdFx0XHRcdFxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VCbG9ja3NEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLWFkbWluL2RhdGEtYmxvY2tzXCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpCbG9ja3NEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogTGF5b3V0cyBTZXJ2aWNlLlxuXG4kc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblx0XHRcdFx0XG4kc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xufSk7XG5cbiRzY29wZS5sYXlvdXRzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gU2VydmljZUxheW91dHNEYXRhLmxvYWQodHJ1ZSk7XG59XG5cdFx0XHRcdFxuKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUxheW91dHNEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLWFkbWluL2RhdGEtbGF5b3V0c1wiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBDTVMgTElWRSBFRElUIFNFUklWQ0VcbiAqIFxuICogJHNjb3BlLmxpdmVFZGl0TW9kZSA9IFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGVcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTGl2ZUVkaXRNb2RlXCIsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRyb290U2NvcGUpIHtcblx0XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLnN0YXRlID0gMDtcblx0XG5cdHNlcnZpY2UudXJsID0gJHJvb3RTY29wZS5sdXlhY2ZnLmhvbWVVcmw7XG5cdFxuXHRzZXJ2aWNlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlcnZpY2Uuc3RhdGUgPSAhc2VydmljZS5zdGF0ZTtcblx0fTtcblx0c2VydmljZS5zZXRVcmwgPSBmdW5jdGlvbihpdGVtSWQsIHZlcnNpb25JZCkge1xuXHRcdHZhciBkID0gbmV3IERhdGUoKTtcblx0XHR2YXIgbiA9IGQuZ2V0VGltZSgpO1xuXHRcdHNlcnZpY2UudXJsID0gJHJvb3RTY29wZS5jbXNDb25maWcucHJldmlld1VybCArICc/aXRlbUlkPScraXRlbUlkKycmdmVyc2lvbj0nICsgdmVyc2lvbklkICsgJyZkYXRlPScgKyBuO1xuXHR9O1xuXHRcblx0c2VydmljZS5jaGFuZ2VVcmwgPSBmdW5jdGlvbihpdGVtSWQsIHZlcnNpb25JZCkge1xuXHRcdGlmICh2ZXJzaW9uSWQgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2ZXJzaW9uSWQgPSAwO1xuXHRcdH1cblx0XHRzZXJ2aWNlLnNldFVybChpdGVtSWQsIHZlcnNpb25JZCk7XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkxpdmVFZGl0TW9kZVVybENoYW5nZScsIHNlcnZpY2UudXJsKTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIENNUyBDdXJyZW50IFdlYnNpdGUgU0VSSVZDRVxuICpcbiAqICRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZSBcbiAqIFxuICogJHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogIFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gZGF0YTtcbiAqIH0pO1xuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VDdXJyZW50V2Vic2l0ZVwiLCBbJyRyb290U2NvcGUnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgU2VydmljZU1lbnVEYXRhKSB7XG5cblx0dmFyIHNlcnZpY2UgPSB7XG5cdFx0Y3VycmVudFdlYnNpdGU6IG51bGwsXG5cdFx0ZGVmYXVsdFdlYnNpdGU6IG51bGxcblx0fTtcblxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlID0gU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMuZmluZCh3ID0+IHcuaXNfZGVmYXVsdCkgfHwgU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXNbMF07XG5cdFx0aWYgKHNlcnZpY2UuZGVmYXVsdFdlYnNpdGUpIHtcblx0XHRcdHNlcnZpY2UudG9nZ2xlKHNlcnZpY2UuZGVmYXVsdFdlYnNpdGUuaWQpO1xuXHRcdH1cblx0fVxuXG5cdHNlcnZpY2UudG9nZ2xlID0gZnVuY3Rpb24od2Vic2l0ZUlkKSB7XG5cdFx0aWYgKHdlYnNpdGVJZCAmJiBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcyAmJiAoIXNlcnZpY2UuY3VycmVudFdlYnNpdGUgfHwgc2VydmljZS5jdXJyZW50V2Vic2l0ZS5pZCAhPT0gd2Vic2l0ZUlkKSkge1xuXHRcdFx0c2VydmljZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzLmZpbmQodyA9PiB3LmlkID09PSB3ZWJzaXRlSWQpO1xuXHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIHNlcnZpY2UuY3VycmVudFdlYnNpdGUpO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuemFhLmZhY3RvcnkoXCJTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uXCIsIFtmdW5jdGlvbigpIHtcblx0dmFyIHNlcnZpY2UgPSB7XG5cdFx0cGFnZToge31cblx0fTtcblxuXHRzZXJ2aWNlLnN0b3JlID0gZnVuY3Rpb24ocGFnZUlkLCB2ZXJzaW9uSWQpIHtcblx0XHRzZXJ2aWNlLnBhZ2VbcGFnZUlkXSA9IHZlcnNpb25JZDtcblx0fTtcblxuXHRzZXJ2aWNlLmhhc1ZlcnNpb24gPSBmdW5jdGlvbihwYWdlSWQpIHtcblx0XHRpZiAoc2VydmljZS5wYWdlLmhhc093blByb3BlcnR5KHBhZ2VJZCkpIHtcblx0XHRcdHJldHVybiBzZXJ2aWNlLnBhZ2VbcGFnZUlkXTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7Il19