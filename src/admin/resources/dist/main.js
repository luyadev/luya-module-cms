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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiU2VydmljZUN1cnJlbnRXZWJzaXRlIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsImN1cnJlbnRXZWJzaXRlIiwiJG9uIiwiZXZlbnQiLCJtZW51RGF0YSIsImFuZ3VsYXIiLCJjb3B5IiwibWVudURhdGFPcmlnaW5hbCIsImluaXQiLCJsZW5ndGgiLCJsb2FkIiwiY29udGFpbmVyIiwiY29udGFpbmVycyIsImlzSGlkZGVuIiwiJHdhdGNoIiwibiIsIml0ZW1zIiwidGl0bGUiLCJmb3JFYWNoIiwidmFsdWUiLCJidWJibGVQYXJlbnRzIiwicGFyZW50TmF2SWQiLCJjb250YWluZXJJZCIsImluZGV4IiwiaXRlbSIsImV4aXN0cyIsImkiLCJwdXNoIiwicGFyZW50X25hdl9pZCIsIm5hdl9jb250YWluZXJfaWQiLCJ0b2dnbGVyIiwidGVtcGxhdGUiLCJpMThuIiwiJGh0dHAiLCIkc3RhdGUiLCJnZXQiLCJwYXJhbXMiLCJ0aGVuIiwicmVzcG9uc2UiLCJwYXRoIiwidGVtcGxhdGVVcmwiLCJTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSIsIkFkbWluVG9hc3RTZXJ2aWNlIiwiZXJyb3IiLCJzdWNjZXNzIiwiJHBhcmVudCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImlzRGVmYXVsdEl0ZW0iLCJmaW5kIiwiaXNfZGVmYXVsdCIsImxhbmdfaWQiLCJuYXZpdGVtcyIsIm8iLCJ1bmRlZmluZWQiLCJhbGlhc1N1Z2dlc3Rpb24iLCJhbGlhcyIsImV4ZWMiLCJzYXZlIiwiaXNJbmxpbmUiLCJnZXRJdGVtIiwibmF2X2lkIiwicmVhc29uIiwia2V5IiwiU2VydmljZUxheW91dHNEYXRhIiwicGFyZW50IiwibmF2SXRlbUlkIiwibGF5b3V0X2lkIiwibGF5b3V0c0RhdGEiLCJhcnJheVRvU2VsZWN0IiwiaW5wdXQiLCJ2YWx1ZUZpZWxkIiwibGFiZWxGaWVsZCIsIm91dHB1dCIsInZlcnNpb25zRGF0YSIsImdldFZlcnNpb25MaXN0IiwiaXNFZGl0QXZhaWxhYmxlIiwidXNlX2RyYWZ0IiwiZnJvbV9kcmFmdF9pZCIsImRyYWZ0cyIsImxheW91dHMiLCJtb2R1bGVzIiwiY29udHJvbGxlcnMiLCJhY3Rpb25zIiwiYWRkUGFyYW0iLCJoYXNPd25Qcm9wZXJ0eSIsImFjdGlvbl9wYXJhbXMiLCJtb2R1bGVfbmFtZSIsImNvbnRyb2xsZXJfbmFtZSIsImZpbHRlciIsIndlYnNpdGVJZCIsInJlc3VsdCIsIndlYnNpdGVfaWQiLCJyZXR1cm5WYWx1ZSIsImZhY3RvcnkiLCJzZXJ2aWNlIiwic3RhdHVzIiwiZGVsZWdhdGUiLCJjb25maWciLCIkc3RhdGVQcm92aWRlciIsInN0YXRlIiwidXJsIiwiZ28iLCJkYXNoYm9hcmQiLCJwb3N0IiwiaGVhZGVycyIsImNyZWF0ZU5ld1ZlcnNpb25TdWJtaXQiLCJjb3B5RXhpc3RpbmdWZXJzaW9uIiwidmVyc2lvbkxheW91dElkIiwiJCIsInBhcmFtIiwidmVyc2lvbk5hbWUiLCJmcm9tVmVyc2lvblBhZ2VJZCIsInJlZnJlc2hGb3JjZSIsImlzT3BlbiIsIml0ZW1TZWxlY3Rpb24iLCJzZWxlY3Rpb24iLCJOYXZJdGVtQ29udHJvbGxlciIsInNlbGVjdCIsImxvYWRJdGVtcyIsIk5hdkNvbnRyb2xsZXIiLCJuYXZEYXRhIiwibGFuZyIsInJlZnJlc2giLCJlcnJvckFycmF5IiwiJHJvb3RTY29wZSIsIlNlcnZpY2VMaXZlRWRpdE1vZGUiLCJsaXZlRWRpdFN0YXRlIiwibG9hZENtc0NvbmZpZyIsImNtc0NvbmZpZyIsInRvZ2dsZSIsImN1cnJlbnRXZWJzaXRlVG9nZ2xlciIsImRyb3BFbXB0eUNvbnRhaW5lciIsImRyYWdnZWQiLCJkcm9wcGVkIiwicG9zaXRpb24iLCJjYXRJZCIsIm1vdmVJdGVtSWQiLCJkcm9wcGVkT25DYXRJZCIsInN1Y2NlcyIsImRyb3BJdGVtIiwiZHJhZyIsImRyb3AiLCJwb3MiLCJhcGkiLCJkcm9wcGVkQWZ0ZXJJdGVtSWQiLCJkcm9wcGVkQmVmb3JlSXRlbUlkIiwiZHJvcHBlZE9uSXRlbUlkIiwidmFsaWRJdGVtIiwiaG92ZXIiLCJkcmFnZWQiLCJycml0ZW1zIiwicmVjdXJzaXZJdGVtVmFsaWRpdHkiLCJpbmRleE9mIiwidG9nZ2xlSXRlbSIsInRvZ2dsZV9vcGVuIiwiaWdub3JlTG9hZGluZ0JhciIsImNoYW5nZVVybCIsIm5hdl9pdGVtX2lkIiwic2hvd0RyYWciLCJpc0N1cnJlbnRFbGVtZW50IiwiaGlkZGVuQ2F0cyIsInRvZ2dsZUNhdCIsInRvZ2dsZUlzSGlkZGVuIiwiJHEiLCJyZXNvbHZlIiwicmVqZWN0IiwiJHN0YXRlUGFyYW1zIiwiUGxhY2Vob2xkZXJTZXJ2aWNlIiwiU2VydmljZVByb3BlcnRpZXNEYXRhIiwiQWRtaW5DbGFzc1NlcnZpY2UiLCJBZG1pbkxhbmdTZXJ2aWNlIiwiSHRtbFN0b3JhZ2UiLCJwYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuIiwicGFnZVNldHRpbmdzT3ZlcmxheVRhYiIsInRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkiLCJ0IiwibmF2Q2ZnIiwiaGVscHRhZ3MiLCJsdXlhY2ZnIiwiZGlzcGxheUxpdmVDb250YWluZXIiLCJsaXZlVXJsIiwicHJvcGVydGllc0RhdGEiLCJwbGFjZWhvbGRlclN0YXRlIiwiaXNCbG9ja2hvbGRlclNtYWxsIiwiZ2V0VmFsdWUiLCJ0b2dnbGVCbG9ja2hvbGRlclNpemUiLCJzZXRWYWx1ZSIsInNpZGViYXIiLCJlbmFibGVTaWRlYmFyIiwidG9nZ2xlU2lkZWJhciIsInNob3dBY3Rpb25zIiwicGFyc2VJbnQiLCJpc0RlbGV0ZWQiLCJwcm9wVmFsdWVzIiwiaGFzVmFsdWVzIiwicGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHkiLCJzYXZlUGFnZVRhZ3MiLCJjcmVhdGVEZWVwUGFnZUNvcHlBc1RlbXBsYXRlIiwibG9hZE5hdlByb3BlcnRpZXMiLCJkIiwiYWRtaW5fcHJvcF9pZCIsInRvZ2dsZVByb3BNYXNrIiwic2hvd1Byb3BGb3JtIiwic3RvcmVQcm9wVmFsdWVzIiwidHJhc2giLCJjb25maXJtIiwiJHRvYXN0IiwiY2xvc2UiLCJpc0RyYWZ0Iiwic3VibWl0TmF2Rm9ybSIsImkxOG5QYXJhbSIsIm1lc3NhZ2UiLCJpc19vZmZsaW5lIiwib2ZmbGluZVN0YXR1cyIsImluZm8iLCJpc19oaWRkZW4iLCJoaWRkZW5TdGF0dXMiLCJpc19ob21lIiwiaG9tZVN0YXRlIiwiJHRpbWVvdXQiLCJTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uIiwibG9hZGVkIiwib3BlbkxpdmVVcmwiLCJ2ZXJzaW9uSWQiLCJsb2FkTGl2ZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbiIsImlzVHJhbnNsYXRlZCIsIml0ZW1Db3B5Iiwic2V0dGluZ3MiLCJ0eXBlRGF0YUNvcHkiLCJ0eXBlRGF0YSIsImVycm9ycyIsImhvbWVVcmwiLCJjdXJyZW50UGFnZVZlcnNpb25BbGlhcyIsInRyYXNoSXRlbSIsImRlbGV0ZSIsIiRicm9hZGNhc3QiLCJyZXNldCIsIm5hdl9pdGVtX3R5cGVfaWQiLCJ1cGRhdGVOYXZJdGVtRGF0YSIsInRpdGxlX3RhZyIsImRlc2NyaXB0aW9uIiwia2V5d29yZHMiLCJ0aW1lc3RhbXBfY3JlYXRlIiwiaW1hZ2VfaWQiLCJpc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQiLCJpc19jYWNoZWFibGUiLCJwYWdlVmVyc2lvbktleSIsIk9iamVjdCIsImtleXMiLCJ0b2dnbGVTZXR0aW5nc092ZXJsYXkiLCJlcnJvckNhbGxiYWNrIiwicmVtb3ZlVmVyc2lvbiIsInZlcnNpb24iLCJ2ZXJzaW9uX2FsaWFzIiwicGFnZUlkIiwiZWRpdFZlcnNpb25JdGVtIiwidGFiIiwiZWRpdFZlcnNpb24iLCJ2ZXJzaW9uSXRlbSIsImNoYW5nZVRhYiIsImVkaXRWZXJzaW9uVXBkYXRlIiwibGFuZ0lkIiwibWV0aG9kIiwibGFzdFZlcnNpb24iLCJoYXNWZXJzaW9uIiwic3dpdGNoVmVyc2lvbiIsInZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSIsInRvZ2dsZVZlcnNpb25zRHJvcGRvd24iLCJwYWdlVmVyc2lvbmlkIiwic3RvcmUiLCJpc0luU2VsZWN0aW9uIiwic2hvcnRfY29kZSIsInNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkiLCJyZWZyZXNoTmVzdGVkIiwicHJldklkIiwicGxhY2Vob2xkZXJWYXIiLCJuYXZJdGVtUGFnZUlkIiwiX19wbGFjZWhvbGRlcnMiLCJwbGFjZWhvbGRlciIsInJldlBsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVycyIsInJlcGxhY2VDb250ZW50IiwicGxhY2Vob2xkZXJSb3ciLCJwbGFjZWhvbGRlcktleSIsInByZXZfaWQiLCJyZXZGaW5kIiwiaG9sZGVyS2V5IiwiaG9sZGVyIiwiZHJvcEl0ZW1QbGFjZWhvbGRlciIsInNvcnRfaW5kZXgiLCJibG9ja19pZCIsInBsYWNlaG9sZGVyX3ZhciIsIm5hdl9pdGVtX3BhZ2VfaWQiLCJjb3B5QmxvY2tJZCIsInB1dCIsIiRzY2UiLCJTZXJ2aWNlQmxvY2tDb3B5U3RhY2siLCJOYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyIiwidmFyIiwiZWxlbWVudCIsInNvcnRJbmRleCIsIiRpbmRleCIsInJlbW92ZSIsImNvcHlCbG9jayIsImJsb2NrIiwidG9nZ2xlSGlkZGVuIiwiYmxvY2tJZCIsImhpZGRlblN0YXRlIiwibmFtZSIsImlzRWRpdGFibGUiLCJ2YXJzIiwiaXNDb25maWd1cmFibGUiLCJjZmdzIiwidmFsdWVzIiwidmFyaWF0aW9uIiwiZXZhbFZhcmlhdGlvblZpc2JpbGl0eSIsImdldEluZm8iLCJ2YXJGaWVsZE5hbWUiLCJmaWVsZF9oZWxwIiwidmFyaWF0ZW5OYW1lIiwidmFyaWF0aW9ucyIsImlzT2JqZWN0IiwidiIsImsiLCJvYmplY3QiLCJpbnZpc2libGUiLCJjZmdkYXRhIiwiY2ZndmFsdWVzIiwiZWRpdCIsIm1vZGFsSGlkZGVuIiwibW9kYWxNb2RlIiwiaW5pdE1vZGFsTW9kZSIsInRvZ2dsZUVkaXQiLCJyZW5kZXJUZW1wbGF0ZSIsImRhdGFWYXJzIiwiY2ZnVmFycyIsImV4dHJhcyIsIlR3aWciLCJ0d2lnIiwiY29udGVudCIsInJlbmRlciIsInRydXN0QXNIdG1sIiwicmVtb3ZlQmxvY2siLCJpc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkiLCJ2YXJJdGVtIiwicmVxdWlyZWQiLCJpc0VtcHR5IiwibGFiZWwiLCJqc29uX2NvbmZpZ192YWx1ZXMiLCJqc29uX2NvbmZpZ19jZmdfdmFsdWVzIiwiaXNfZGlydHkiLCJvYmplY3RkZXRhaWwiLCJTZXJ2aWNlQmxvY2tzRGF0YSIsImJsb2Nrc0RhdGEiLCJibG9ja3NEYXRhUmVzdG9yZSIsImJsb2Nrc0RhdGFSZWxvYWQiLCJhZGRUb0ZhdiIsInJlbW92ZUZyb21GYXYiLCJ0b2dnbGVHcm91cCIsImdyb3VwIiwiaXNQcmV2aWV3RW5hYmxlZCIsInByZXZpZXdfZW5hYmxlZCIsImNvcHlTdGFjayIsInN0YWNrIiwiY2xlYXJTdGFjayIsImNsZWFyIiwic2VhcmNoUXVlcnkiLCJzZWFyY2hJc0RpcnR5IiwiaXNfZmF2Iiwic3BsaWNlIiwicmVzb2x2ZXJQcm92aWRlciIsImFkZENhbGxiYWNrIiwiTHV5YUxvYWRpbmciLCJzdGFydCIsInIiLCJzdG9wIiwic2hpZnQiLCJpY29uIiwiY29weXN0YWNrIiwiZm9yY2VSZWxvYWQiLCJzZXRVcmwiLCJpdGVtSWQiLCJEYXRlIiwiZ2V0VGltZSIsInByZXZpZXdVcmwiLCJkZWZhdWx0V2Vic2l0ZSIsIndlYnNpdGVzIiwidyIsInBhZ2UiXSwibWFwcGluZ3MiOiI7O0FBQUEsQ0FBQyxZQUFXO0FBQ1gsZUFEVyxDQUdY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Q0FBekMiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdFxuXHQvLyBkaXJlY3RpdmUuanNcblxuICAgIHphYS5kaXJlY3RpdmUoXCJtZW51RHJvcGRvd25cIiwgWydTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgJyRmaWx0ZXInLCBmdW5jdGlvbihTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSwgJGZpbHRlcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3QgOiAnRScsXG4gICAgICAgICAgICBzY29wZSA6IHtcbiAgICAgICAgICAgICAgICBuYXZJZCA6ICc9J1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIgOiBbJyRzY29wZScsIGZ1bmN0aW9uKCRzY29wZSkge1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubmF2SWQgPSBkYXRhLmlkO1xuICAgICAgICAgICAgICAgIH1cblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShTZXJ2aWNlTWVudURhdGEuZGF0YSk7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YU9yaWdpbmFsID0gYW5ndWxhci5jb3B5KFNlcnZpY2VNZW51RGF0YS5kYXRhKTtcblxuICAgICAgICAgICAgICAgICRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGFuZ3VsYXIuY29weShkYXRhKTtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFPcmlnaW5hbCA9IGFuZ3VsYXIuY29weShkYXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2NvcGUubWVudURhdGEubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjb250YWluZXIgaW4gJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnNbY29udGFpbmVyXS5pc0hpZGRlbiA9IGZhbHNlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdzZWFyY2hRdWVyeScsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobiA9PSBudWxsIHx8IG4gPT0gJycpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YS5pdGVtcyA9IGFuZ3VsYXIuY29weSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcyk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBpdGVtcyA9ICRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zLCB7dGl0bGU6IG59KTtcblxuXHRcdFx0XHRcdC8vIGZpbmQgYWxsIHBhcmVudCBlbGVtZW50cyBvZiB0aGUgZm91bmQgZWxlbWVudHMgYW5kIHJlIGFkZCB0aGVtIHRvIHRoZSBtYXAgaW4gb3JkZXIgdG8gXG5cdFx0XHRcdFx0Ly8gZW5zdXJlIGEgY29ycmVjdCBtZW51IHRyZWUuXG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0aWYgKHZhbHVlWydwYXJlbnRfbmF2X2lkJ10gPiAwKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzKHZhbHVlWydwYXJlbnRfbmF2X2lkJ10sIHZhbHVlWyduYXZfY29udGFpbmVyX2lkJ10sIGl0ZW1zKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YS5pdGVtcyA9IGl0ZW1zO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyA9IGZ1bmN0aW9uKHBhcmVudE5hdklkLCBjb250YWluZXJJZCwgaW5kZXgpIHtcblx0XHRcdFx0XHR2YXIgaXRlbSA9ICRmaWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicpKCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHRcdFx0XHRcdGlmIChpdGVtKSB7XG5cdFx0XHRcdFx0XHR2YXIgZXhpc3RzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaW5kZXgsIGZ1bmN0aW9uKGkpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGkuaWQgPT0gaXRlbS5pZCkge1xuXHRcdFx0XHRcdFx0XHRcdGV4aXN0cyA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRpZiAoIWV4aXN0cykge1xuXHRcdFx0XHRcdFx0XHRpbmRleC5wdXNoKGl0ZW0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMoaXRlbS5wYXJlbnRfbmF2X2lkLCBpdGVtLm5hdl9jb250YWluZXJfaWQsIGluZGV4KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUudG9nZ2xlciA9IHRydWU7XG5cblx0XHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB0ZW1wbGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJzxkaXY+Jytcblx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwIG1iLTJcIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1wcmVwZW5kXCIgbmctaGlkZT1cInNlYXJjaFF1ZXJ5XCI+PGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+c2VhcmNoPC9pPjwvZGl2PjwvZGl2PicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXByZXBlbmRcIiBuZy1zaG93PVwic2VhcmNoUXVlcnlcIiBuZy1jbGljaz1cInNlYXJjaFF1ZXJ5ID0gXFwnXFwnXCI+PGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXRleHRcIj48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+Y2xlYXI8L2k+PC9kaXY+PC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8aW5wdXQgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBuZy1tb2RlbD1cInNlYXJjaFF1ZXJ5XCIgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIicraTE4blsnbmdyZXN0X2NydWRfc2VhcmNoX3RleHQnXSsnXCI+Jytcblx0XHRcdFx0XHQnPC9kaXY+JyArIFxuXHRcdFx0XHRcdCc8ZGl2IG5nLXJlcGVhdD1cIihrZXksIGNvbnRhaW5lcikgaW4gbWVudURhdGEuY29udGFpbmVycyB8IG1lbnV3ZWJzaXRlZmlsdGVyOmN1cnJlbnRXZWJzaXRlLmlkXCIgbmctaWY9XCIobWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDowKS5sZW5ndGggPiAwXCIgY2xhc3M9XCJjYXJkIG1iLTJcIiBuZy1jbGFzcz1cIntcXCdjYXJkLWNsb3NlZFxcJzogIWNvbnRhaW5lci5pc0hpZGRlbn1cIj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlclwiIG5nLWNsaWNrPVwiY29udGFpbmVyLmlzSGlkZGVuPSFjb250YWluZXIuaXNIaWRkZW5cIj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4gY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBjYXJkLXRvZ2dsZS1pbmRpY2F0b3JcIj5rZXlib2FyZF9hcnJvd19kb3duPC9zcGFuPicrXG5cdFx0XHRcdFx0XHRcdCc8c3Bhbj57e2NvbnRhaW5lci5uYW1lfX08L3NwYW4+Jytcblx0XHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJjYXJkLWJvZHlcIj4nKyBcblx0XHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJ0cmVldmlldyB0cmVldmlldy1jaG9vc2VyXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0Jzx1bCBjbGFzcz1cInRyZWV2aWV3LWl0ZW1zIHRyZWV2aWV3LWl0ZW1zLWx2bDFcIj4nICtcblx0XHRcdFx0XHRcdFx0XHRcdCc8bGkgY2xhc3M9XCJ0cmVldmlldy1pdGVtIHRyZWV2aWV3LWl0ZW0tbHZsMVwiIG5nLWNsYXNzPVwie1xcJ3RyZWV2aWV3LWl0ZW0taGFzLWNoaWxkcmVuXFwnIDogKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCkubGVuZ3RofVwiIG5nLXJlcGVhdD1cIihrZXksIGRhdGEpIGluIG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCB0cmFjayBieSBkYXRhLmlkXCIgbmctaW5jbHVkZT1cIlxcJ21lbnVEcm9wZG93blJldmVyc2VcXCdcIj48L2xpPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8L3VsPicgK1xuXHRcdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0XHQnPC9kaXY+JyArXG5cdFx0XHRcdFx0JzwvZGl2PicrXG5cdFx0XHRcdCc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfV0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJ6YWFDbXNQYWdlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6IFwiRVwiLFxuICAgICAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICAgICBcIm1vZGVsXCI6IFwiPVwiLFxuICAgICAgICAgICAgICAgIFwib3B0aW9uc1wiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQGxhYmVsXCIsXG4gICAgICAgICAgICAgICAgXCJpMThuXCI6IFwiQGkxOG5cIixcbiAgICAgICAgICAgICAgICBcImlkXCI6IFwiQGZpZWxkaWRcIixcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJAZmllbGRuYW1lXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBcdHJldHVybiAgJzxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwIGZvcm0tc2lkZS1ieS1zaWRlXCIgbmctY2xhc3M9XCJ7XFwnaW5wdXQtLWhpZGUtbGFiZWxcXCc6IGkxOG59XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGUgZm9ybS1zaWRlLWxhYmVsXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWw+e3tsYWJlbH19PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJmb3JtLXNpZGVcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxtZW51LWRyb3Bkb3duIGNsYXNzPVwibWVudS1kcm9wZG93blwiIG5hdi1pZD1cIm1vZGVsXCI+PC9tZW51LWRyb3Bkb3duPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblx0emFhLmRpcmVjdGl2ZShcInNob3dJbnRlcm5hbFJlZGlyZWN0aW9uXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRuYXZJZCA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckc3RhdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkc3RhdGUpIHtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCduYXZJZCcsIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1pdGVtLXBhdGgnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnBhdGggPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9nZXQtbmF2LWNvbnRhaW5lci1uYW1lJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1dLFxuXHRcdFx0dGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8YSBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1zbVwiIHVpLXNyZWY9XCJjdXN0b20uY21zZWRpdCh7IG5hdklkIDogbmF2SWQsIHRlbXBsYXRlSWQ6IFxcJ2Ntc2FkbWluL2RlZmF1bHQvaW5kZXhcXCd9KVwiPnt7cGF0aH19PC9hPiBpbiB7e2NvbnRhaW5lcn19Jztcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHRcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1cIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY3JlYXRlZm9ybS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdBZG1pblRvYXN0U2VydmljZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCAkZmlsdGVyLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdCRzY29wZS5zdWNjZXNzID0gZmFsc2U7XG5cblx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudSA9ICRzY29wZS5tZW51RGF0YS5pdGVtcztcblx0XHRcdFx0XHQkc2NvcGUubmF2Y29udGFpbmVycyA9ICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdGlhbGl6ZXIoKTtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPSAxO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuaXNfZHJhZnQgPSAwO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0aWYgKFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZS5kZWZhdWx0X2NvbnRhaW5lcl9pZDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gU2VydmljZUxhbmd1YWdlc0RhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxhbmd1YWdlc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmlzRGVmYXVsdEl0ZW0gPSAkc2NvcGUubGFuZ3VhZ2VzRGF0YS5maW5kKGl0ZW0gPT4ge1xuXHRcdFx0XHRcdHJldHVybiBpdGVtLmlzX2RlZmF1bHQ7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLmxhbmdfaWQgPSAkc2NvcGUuaXNEZWZhdWx0SXRlbS5pZDtcblxuXHRcdFx0XHQkc2NvcGUubmF2aXRlbXMgPSBbXTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4gIT09IHVuZGVmaW5lZCAmJiBuICE9PSBvKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5wYXJlbnRfbmF2X2lkID0gMDtcblx0XHRcdFx0XHRcdCRzY29wZS5uYXZpdGVtcyA9ICRzY29wZS5tZW51W25dWydfX2l0ZW1zJ107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5JykoJHNjb3BlLmRhdGEudGl0bGUpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goJ2RhdGEuYWxpYXMnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4hPW8gJiYgbiE9bnVsbCkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5Jykobik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuZXhlYyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUuY29udHJvbGxlci5zYXZlKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdFx0XHQkc2NvcGUuc3VjY2VzcyA9IHRydWU7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3IgPSBbXTtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLnRpdGxlID0gbnVsbDtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gbnVsbDtcblx0XHRcdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5pc0lubGluZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuJHBhcmVudC4kcGFyZW50LmdldEl0ZW0oJHNjb3BlLmRhdGEubGFuZ19pZCwgJHNjb3BlLmRhdGEubmF2X2lkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsndmlld19pbmRleF9wYWdlX3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVhc29uKSB7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2gocmVhc29uLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKHZhbHVlWzBdKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmVycm9yID0gcmVhc29uO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1dXG5cdFx0fVxuXHR9KTtcblxuXHQvKiogUEFHRSBDUkVBVEUgJiBVUERBVEUgKi9cbiAgICB6YWEuZGlyZWN0aXZlKFwidXBkYXRlRm9ybVBhZ2VcIiwgWydTZXJ2aWNlTGF5b3V0c0RhdGEnLCBmdW5jdGlvbihTZXJ2aWNlTGF5b3V0c0RhdGEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0VBJyxcbiAgICAgICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgICAgICAgIGRhdGEgOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybCA6ICd1cGRhdGVmb3JtcGFnZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuICAgICAgICAgICAgXHQkc2NvcGUucGFyZW50ID0gJHNjb3BlLiRwYXJlbnQuJHBhcmVudDtcblx0XHRcdFx0JHNjb3BlLm5hdkl0ZW1JZCA9ICRzY29wZS5wYXJlbnQuaXRlbS5pZDtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLmxheW91dF9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS5hcnJheVRvU2VsZWN0ID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlRmllbGQsIGxhYmVsRmllbGQpIHtcblx0XHRcdFx0XHR2YXIgb3V0cHV0ID0gW107XG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goe1wibGFiZWxcIjogdmFsdWVbbGFiZWxGaWVsZF0sIFwidmFsdWVcIjogdmFsdWVbdmFsdWVGaWVsZF19KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFtdOyAvLyAkc2NvcGUuYXJyYXlUb1NlbGVjdChkYXRhKTsgLy8gQFRPRE8gUkVNT1ZFIElGIFZFUklGSUVEXG5cdFx0XHRcdH0pO1xuXG5cblx0XHRcdFx0JHNjb3BlLnZlcnNpb25zRGF0YSA9IFtdO1xuXG5cdFx0XHRcdCRzY29wZS5nZXRWZXJzaW9uTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZS92ZXJzaW9ucycsIHsgcGFyYW1zIDogeyBuYXZJdGVtSWQgOiAkc2NvcGUubmF2SXRlbUlkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUudmVyc2lvbnNEYXRhID0gJHNjb3BlLmFycmF5VG9TZWxlY3QocmVzcG9uc2UuZGF0YSwgJ2lkJywgJ3ZlcnNpb25fYWxpYXMnKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgXHQkc2NvcGUuaXNFZGl0QXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS52ZXJzaW9uc0RhdGEubGVuZ3RoO1xuICAgICAgICAgICAgXHR9O1xuXG5cdFx0XHRcdGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmdldFZlcnNpb25MaXN0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpbml0KCk7XG4gICAgICAgICAgICB9XVxuICAgICAgICB9XG5cdH1dKTtcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1QYWdlXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFQScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0ZGF0YSA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2NyZWF0ZWZvcm1wYWdlLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlTWVudURhdGEnLCBmdW5jdGlvbigkc2NvcGUsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZU1lbnVEYXRhKSB7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEudXNlX2RyYWZ0ID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEubGF5b3V0X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuZnJvbV9kcmFmdF9pZCA9IDA7XG5cblx0XHRcdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgICAgICAgICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICBcdH0pO1xuXG4gICAgICAgICAgICBcdC8qIG1lbnVEYXRhICovXG5cbiAgICBcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYXJyYXlUb1NlbGVjdCA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZUZpZWxkLCBsYWJlbEZpZWxkKSB7XG5cdFx0XHRcdFx0dmFyIG91dHB1dCA9IFtdO1xuXHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKHtcImxhYmVsXCI6IHZhbHVlW2xhYmVsRmllbGRdLCBcInZhbHVlXCI6IHZhbHVlW3ZhbHVlRmllbGRdfSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgXHRmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgICAgXHRcdCRzY29wZS5kcmFmdHMgPSAkc2NvcGUuYXJyYXlUb1NlbGVjdCgkc2NvcGUubWVudURhdGEuZHJhZnRzLCAnaWQnLCAndGl0bGUnKTtcblx0XHRcdFx0XHQkc2NvcGUubGF5b3V0cyA9ICRzY29wZS5hcnJheVRvU2VsZWN0KCRzY29wZS5sYXlvdXRzRGF0YSwgJ2lkJywgJ25hbWUnKTtcbiAgICAgICAgICAgIFx0fVxuXG4gICAgICAgICAgICBcdGluaXQoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LmV4ZWMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qIFBhZ2UgTU9EVUxFICovXG5cblx0emFhLmRpcmVjdGl2ZShcImZvcm1Nb2R1bGVcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnZm9ybW1vZHVsZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuXHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLnBhcmFtcyA9IHt9O1xuXG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWFkbWluLWNvbW1vbi9kYXRhLW1vZHVsZXMnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1vZHVsZXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWRkUGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0XHRpZiAoISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCdhY3Rpb25fcGFyYW1zJykpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFjdGlvbl9wYXJhbXMgPSB7fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtc1trZXldID0gJyc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEubW9kdWxlX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL21vZHVsZS1jb250cm9sbGVycz9tb2R1bGU9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXJzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEuY29udHJvbGxlcl9uYW1lO1xuXHRcdFx0XHR9LCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb250cm9sbGVyLWFjdGlvbnM/bW9kdWxlPScrJHNjb3BlLmRhdGEubW9kdWxlX25hbWUrJyZjb250cm9sbGVyPScgKyBuKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogZmlsdGVycyAqL1xuXG5cdHphYS5maWx0ZXIoXCJtZW51d2Vic2l0ZWZpbHRlclwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHdlYnNpdGVJZCkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICh2YWx1ZS53ZWJzaXRlX2lkID09IHdlYnNpdGVJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoXCJtZW51cGFyZW50ZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnBhcmVudF9uYXZfaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAoIXJldHVyblZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmlkID09IHBhcmVudE5hdklkICYmIHZhbHVlLm5hdl9jb250YWluZXJfaWQgPT0gY29udGFpbmVySWQpIHtcblx0XHRcdFx0XHRcdHJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHRcdH07XG5cdH0pO1xuXG5cdC8qIGZhY3RvcnkuanMgKi9cblxuXHR6YWEuZmFjdG9yeSgnUGxhY2Vob2xkZXJTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSBbXTtcblxuXHRcdHNlcnZpY2Uuc3RhdHVzID0gMTsgLyogMSA9IHNob3dwbGFjZWhvbGRlcnM7IDAgPSBoaWRlIHBsYWNlaG9sZGVycyAqL1xuXG5cdFx0c2VydmljZS5kZWxlZ2F0ZSA9IGZ1bmN0aW9uKHN0YXR1cykge1xuXHRcdFx0c2VydmljZS5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0fTtcblxuXHRcdHJldHVybiBzZXJ2aWNlO1xuXHR9KTtcblxuXHQvKiBsYXlvdXQuanMgKi9cblxuXHR6YWEuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInLCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHRcdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2VkaXRcIiwge1xuXHRcdFx0dXJsIDogXCIvdXBkYXRlLzpuYXZJZFwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS91cGRhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zYWRkXCIsIHtcblx0XHRcdHVybCA6IFwiL2NyZWF0ZVwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS9jcmVhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZHJhZnRcIiwge1xuXHRcdFx0dXJsOiAnL2RyYWZ0cycsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2Ntc2FkbWluL3BhZ2UvZHJhZnRzJ1xuXHRcdH0pO1xuXHR9XSk7XG5cblx0LyogY29udHJvbGxlcnMgKi9cblxuXHR6YWEuY29udHJvbGxlcihcIkRyYWZ0c0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHN0YXRlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24obmF2SWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogbmF2SWQgfSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zRGFzaGJvYXJkXCIsIFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXHRcdCRzY29wZS5kYXNoYm9hcmQgPSBbXTtcblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vZGFzaGJvYXJkLWxvZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCRzY29wZS5kYXNoYm9hcmQgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXHR9XSk7XG5cdFxuXHR6YWEuY29udHJvbGxlcihcIkNvbmZpZ0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdCRzY29wZS5kYXRhID0ge307XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJywgJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VWZXJzaW9uc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VydmljZUxheW91dHNEYXRhLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdC8qKlxuXHRcdCAqIEB2YXIgb2JqZWN0ICR0eXBlRGF0YSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBvYmplY3QgJGl0ZW0gRnJvbSBwYXJlbnQgc2NvcGUgY29udHJvbGxlciBOYXZJdGVtQ29udHJvbGxlclxuXHRcdCAqIEB2YXIgc3RyaW5nICR2ZXJzaW9uTmFtZSBGcm9tIG5nLW1vZGVsXG5cdFx0ICogQHZhciBpbnRlZ2VyICRmcm9tVmVyc2lvblBhZ2VJZCBGcm9tIG5nLW1vZGVsIHRoZSB2ZXJzaW9uIGNvcHkgZnJvbSBvciAwID0gbmV3IGVtcHR5L2JsYW5rIHZlcnNpb25cblx0XHQgKiBAdmFyIGludGVnZXIgJHZlcnNpb25MYXlvdXRJZCBGcm9tIG5nLW1vZGVsLCBvbmx5IGlmIGZyb21WZXJzaW9uUGFnZUlkIGlzIDBcbiBcdFx0ICovXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXG4gICAgXHQvKiBjb250cm9sbGVyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuY3JlYXRlTmV3VmVyc2lvblN1Ym1pdCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc192ZXJzaW9uX2Vycm9yX2VtcHR5X2ZpZWxkcyddKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5jb3B5RXhpc3RpbmdWZXJzaW9uKSB7XG5cdFx0XHRcdGRhdGEudmVyc2lvbkxheW91dElkID0gMDtcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jcmVhdGUtcGFnZS12ZXJzaW9uJywgJC5wYXJhbSh7J2xheW91dElkJzogZGF0YS52ZXJzaW9uTGF5b3V0SWQsICduYXZJdGVtSWQnOiAkc2NvcGUuaXRlbS5pZCwgJ25hbWUnOiBkYXRhLnZlcnNpb25OYW1lLCAnZnJvbVBhZ2VJZCc6IGRhdGEuZnJvbVZlcnNpb25QYWdlSWR9KSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl9jcmVhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNvcHlQYWdlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblxuXHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdCRzY29wZS4kb24oJ2RlbGV0ZWROYXZJdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5uYXZJZCA9IDA7XG5cblx0XHQkc2NvcGUuaXRlbXMgPSBudWxsO1xuXG5cdFx0JHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3Rpb24gPSAwO1xuXG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRzY29wZS5zZWxlY3Rpb24gPSBpdGVtLmlkO1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBhbmd1bGFyLmNvcHkoaXRlbSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1TZWxlY3Rpb24udGl0bGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobikge1xuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbi5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuaXRlbVNlbGVjdGlvbi50aXRsZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkSXRlbXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5uYXZJZCA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5OYXZDb250cm9sbGVyLm5hdkRhdGEuaWQ7XG5cblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZmluZC1uYXYtaXRlbXMnLCB7IHBhcmFtczogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHQkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb25bJ3RvTGFuZ0lkJ10gPSAkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIubGFuZy5pZDtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1mcm9tLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5pdGVtU2VsZWN0aW9uKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfYWRkZWRfdHJhbnNsYXRpb25fb2snXSk7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLnJlZnJlc2goKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9lcnJvciddKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNNZW51VHJlZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckc3RhdGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRzdGF0ZSwgJGh0dHAsICRmaWx0ZXIsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHQvLyBsaXZlIGVkaXQgc2VydmljZVxuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSAwO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnbGl2ZUVkaXRTdGF0ZVRvZ2dsZXInLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkcm9vdFNjb3BlLmNtc0NvbmZpZyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnKCk7XG5cdFx0XG5cdFx0Ly8gbWVudSBEYXRhXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY3VycmVudFdlYnNpdGVUb2dnbGVyJywgZnVuY3Rpb24oaWQpIHtcblx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS50b2dnbGUoaWQpO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEpIHtcblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gZGF0YTtcblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9IGRhdGEuaWQ7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BFbXB0eUNvbnRhaW5lciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixjYXRJZCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS10by1jb250YWluZXInLCB7IHBhcmFtczoge21vdmVJdGVtSWQ6IGRyYWdnZWQuaWQsIGRyb3BwZWRPbkNhdElkOiBjYXRJZH19KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZyxkcm9wLHBvcykge1xuXHRcdFx0aWYgKHBvcyA9PSAnYm90dG9tJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWFmdGVyJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkQWZ0ZXJJdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fSBlbHNlIGlmIChwb3MgPT0gJ3RvcCcpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS1iZWZvcmUnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRCZWZvcmVJdGVtSWQ6IGRyb3AuaWR9O1xuXG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAnbWlkZGxlJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNoaWxkJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkT25JdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkaHR0cC5nZXQoYXBpLCB7IHBhcmFtcyA6IHBhcmFtcyB9KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnZhbGlkSXRlbSA9IGZ1bmN0aW9uKGhvdmVyLCBkcmFnZWQpIHtcblx0XHRcdFxuXHRcdFx0aWYgKGhvdmVyLmlkID09IGRyYWdlZC5pZCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCRzY29wZS5ycml0ZW1zID0gW107XG5cdFx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkoZHJhZ2VkLm5hdl9jb250YWluZXJfaWQsIGRyYWdlZC5pZCk7XG5cdFx0XHRcblx0XHRcdGlmICgkc2NvcGUucnJpdGVtcy5pbmRleE9mKGhvdmVyLmlkKSA9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnJyaXRlbXMgPSBbXTtcblx0XHRcblx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkgPSBmdW5jdGlvbihjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciBpdGVtcyA9ICRmaWx0ZXIoJ21lbnVwYXJlbnRmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdFx0XHRcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHQkc2NvcGUucnJpdGVtcy5wdXNoKGl0ZW0uaWQpO1xuXHRcdFx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkoY29udGFpbmVySWQsIGl0ZW0uaWQpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVJdGVtID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEudG9nZ2xlX29wZW4gPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGRhdGFbJ3RvZ2dsZV9vcGVuJ10gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGF0YVsndG9nZ2xlX29wZW4nXSA9ICFkYXRhLnRvZ2dsZV9vcGVuO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi90cmVlLWhpc3RvcnknLCB7ZGF0YTogZGF0YX0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoZGF0YS5uYXZfaXRlbV9pZCwgMCk7XG5cdFx0XHQkc3RhdGUuZ28oJ2N1c3RvbS5jbXNlZGl0JywgeyBuYXZJZCA6IGRhdGEuaWQgfSk7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuc2hvd0RyYWcgPSAwO1xuXG5cdCAgICAkc2NvcGUuaXNDdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0ICAgIFx0aWYgKGRhdGEgIT09IG51bGwgJiYgJHN0YXRlLnBhcmFtcy5uYXZJZCA9PSBkYXRhLmlkKSB7XG5cdCAgICBcdFx0cmV0dXJuIHRydWU7XG5cdCAgICBcdH1cblxuXHQgICAgXHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuaGlkZGVuQ2F0cyA9IFtdO1xuXG5cdCAgICAkc2NvcGUuJHdhdGNoKCdtZW51RGF0YScsIGZ1bmN0aW9uIChuLCBvKSB7XG5cdCAgICBcdCRzY29wZS5oaWRkZW5DYXRzID0gbi5oaWRkZW5DYXRzO1xuXHQgICAgfSk7XG5cblx0XHQkc2NvcGUudG9nZ2xlQ2F0ID0gZnVuY3Rpb24oY2F0SWQpIHtcblx0XHRcdGlmIChjYXRJZCBpbiAkc2NvcGUuaGlkZGVuQ2F0cykge1xuXHRcdFx0XHQkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPSAhJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID0gMTtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvc2F2ZS1jYXQtdG9nZ2xlJywge2NhdElkOiBjYXRJZCwgc3RhdGU6ICRzY29wZS5oaWRkZW5DYXRzW2NhdElkXX0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVJc0hpZGRlbiA9IGZ1bmN0aW9uKGNhdElkKSB7XG5cblx0XHRcdGlmICgkc2NvcGUuaGlkZGVuQ2F0cyA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY2F0SWQgaW4gJHNjb3BlLmhpZGRlbkNhdHMpIHtcblx0XHRcdFx0aWYgKCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9PSAxKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zYWRtaW5DcmVhdGVDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRxJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkcSwgJGh0dHApIHtcblxuXHRcdCRzY29wZS5kYXRhID0ge307XG5cdFx0JHNjb3BlLmRhdGEuaXNJbmxpbmUgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcGFnZScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAyKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLW1vZHVsZScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAzKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXJlZGlyZWN0JywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zYWRtaW5DcmVhdGVJbmxpbmVDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRxJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkcSwgJGh0dHApIHtcblxuXHRcdCRzY29wZS5kYXRhID0ge1xuXHRcdFx0bmF2X2lkIDogJHNjb3BlLiRwYXJlbnQuTmF2Q29udHJvbGxlci5pZFxuXHRcdH07XG5cblx0XHQkc2NvcGUuZGF0YS5pc0lubGluZSA9IHRydWU7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQkc2NvcGUuZGF0YS5sYW5nX2lkID0gJHNjb3BlLmxhbmcuaWQ7XG5cblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcGFnZS1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDIpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtbW9kdWxlLWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMykge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1yZWRpcmVjdC1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiTmF2Q29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckcm9vdFNjb3BlJywgJyRmaWx0ZXInLCAnJHN0YXRlJywgJyRzdGF0ZVBhcmFtcycsICckaHR0cCcsICdQbGFjZWhvbGRlclNlcnZpY2UnLCAnU2VydmljZVByb3BlcnRpZXNEYXRhJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ0FkbWluTGFuZ1NlcnZpY2UnLCAnSHRtbFN0b3JhZ2UnLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGZpbHRlciwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRodHRwLCBQbGFjZWhvbGRlclNlcnZpY2UsIFNlcnZpY2VQcm9wZXJ0aWVzRGF0YSwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIEFkbWluQ2xhc3NTZXJ2aWNlLCBBZG1pbkxhbmdTZXJ2aWNlLCBIdG1sU3RvcmFnZSkge1xuXG5cblx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbiA9IHRydWU7XG5cdFx0XG5cdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlUYWIgPSAxO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5ID0gZnVuY3Rpb24odCkge1xuXHRcdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlUYWIgPSB0O1xuXHRcdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4gPSAhJHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW47XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUubmF2Q2ZnID0ge1xuXHRcdFx0aGVscHRhZ3M6ICRyb290U2NvcGUubHV5YWNmZy5oZWxwdGFncyxcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5kaXNwbGF5TGl2ZUNvbnRhaW5lciA9IG47XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUudXJsIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5saXZlVXJsID0gbjtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuQWRtaW5MYW5nU2VydmljZSA9IEFkbWluTGFuZ1NlcnZpY2U7XG5cblx0XHQvKiBzZXJ2aWNlIEFkbWluUHJvcGVydHlTZXJ2aWNlIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUucHJvcGVydGllc0RhdGEgPSBTZXJ2aWNlUHJvcGVydGllc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6UHJvcGVydGllc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLnByb3BlcnRpZXNEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZU1lbnVEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VMYW5nYXVnZXNEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IFNlcnZpY2VMYW5ndWFnZXNEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxhbmd1YWdlc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0LyogcGxhY2Vob2xkZXJzIHRvZ2dsZXIgc2VydmljZSAqL1xuXG5cdFx0JHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZSA9IFBsYWNlaG9sZGVyU2VydmljZTtcblxuXHRcdCRzY29wZS5wbGFjZWhvbGRlclN0YXRlID0gJHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZS5zdGF0dXM7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdwbGFjZWhvbGRlclN0YXRlJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2UuZGVsZWdhdGUobik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvKiBCbG9ja2hvbGRlciBzaXplIHRvZ2dsZXIgKi9cblxuICAgICAgICAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsID0gSHRtbFN0b3JhZ2UuZ2V0VmFsdWUoJ2Jsb2NraG9sZGVyVG9nZ2xlU3RhdGUnLCB0cnVlKTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlQmxvY2tob2xkZXJTaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsID0gISRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGw7XG4gICAgICAgICAgICBIdG1sU3RvcmFnZS5zZXRWYWx1ZSgnYmxvY2tob2xkZXJUb2dnbGVTdGF0ZScsICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIHNpZGViYXIgbG9naWMgKi9cblxuXHRcdCRzY29wZS5zaWRlYmFyID0gZmFsc2U7XG5cblx0ICAgICRzY29wZS5lbmFibGVTaWRlYmFyID0gZnVuY3Rpb24oKSB7XG5cdCAgICBcdCRzY29wZS5zaWRlYmFyID0gdHJ1ZTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS50b2dnbGVTaWRlYmFyID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgJHNjb3BlLnNpZGViYXIgPSAhJHNjb3BlLnNpZGViYXI7XG5cdCAgICB9O1xuXG5cdFx0LyogYXBwIGxvZ2ljICovXG5cblx0ICAgICRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cblx0XHQkc2NvcGUuaWQgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMubmF2SWQpO1xuXG5cdFx0JHNjb3BlLmlzRGVsZXRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLkFkbWluQ2xhc3NTZXJ2aWNlID0gQWRtaW5DbGFzc1NlcnZpY2U7XG5cblx0XHQkc2NvcGUucHJvcFZhbHVlcyA9IHt9O1xuXG5cdFx0JHNjb3BlLmhhc1ZhbHVlcyA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnBhZ2VUYWdzID0gW107XG5cblx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyA9IGZ1bmN0aW9uKHBhcmVudE5hdklkLCBjb250YWluZXJJZCkge1xuXHQgICAgXHR2YXIgaXRlbSA9ICRmaWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0ICAgIFx0aWYgKGl0ZW0pIHtcblx0ICAgIFx0XHRpdGVtLnRvZ2dsZV9vcGVuID0gMTtcblx0ICAgIFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyhpdGVtLnBhcmVudF9uYXZfaWQsIGl0ZW0ubmF2X2NvbnRhaW5lcl9pZCk7XG5cdCAgICBcdH1cblx0ICAgIH07XG5cblx0XHQkc2NvcGUuY3JlYXRlRGVlcFBhZ2VDb3B5ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9kZWVwLXBhZ2UtY29weScsIHtuYXZJZDogJHNjb3BlLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX2NyZWF0ZV9jb3B5X3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdCRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5wYWdlVGFncyA9IFtdO1xuXG5cdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi8nICsgJHNjb3BlLmlkICsgJy90YWdzJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdCRzY29wZS5wYWdlVGFncy5wdXNoKHZhbHVlLmlkKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmVQYWdlVGFncyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvJyArICRzY29wZS5pZCArICcvdGFncycsICRzY29wZS5wYWdlVGFncykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX2NvbmZpZ191cGRhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNyZWF0ZURlZXBQYWdlQ29weUFzVGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2RlZXAtcGFnZS1jb3B5LWFzLXRlbXBsYXRlJywge25hdklkOiAkc2NvcGUuaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfY3JlYXRlX2NvcHlfYXNfdGVtcGxhdGVfc3VjY2VzcyddKTtcblx0XHRcdFx0JHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2N1c3RvbS5jbXNkcmFmdCcpO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZ2V0LXByb3BlcnRpZXMnLCB7IHBhcmFtczoge25hdklkOiAkc2NvcGUuaWR9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRmb3IodmFyIGkgaW4gcmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdHZhciBkID0gcmVzcG9uc2UuZGF0YVtpXTtcblx0XHRcdFx0XHQkc2NvcGUucHJvcFZhbHVlc1tkLmFkbWluX3Byb3BfaWRdID0gZC52YWx1ZTtcblx0XHRcdFx0XHQkc2NvcGUuaGFzVmFsdWVzID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVQcm9wTWFzayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9ICEkc2NvcGUuc2hvd1Byb3BGb3JtO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc3RvcmVQcm9wVmFsdWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9zYXZlLXByb3BlcnRpZXM/bmF2SWQ9Jyskc2NvcGUuaWQsICQucGFyYW0oJHNjb3BlLnByb3BWYWx1ZXMpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9wcm9wZXJ0eV9yZWZyZXNoJ10pO1xuXHRcdFx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMoKTtcblx0XHRcdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9IGZhbHNlO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50cmFzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuWydqc19wYWdlX2NvbmZpcm1fZGVsZXRlJ10sIGkxOG5bJ2Ntc2FkbWluX3NldHRpbmdzX3RyYXNocGFnZV90aXRsZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L2RlbGV0ZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5pZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdFx0JHNjb3BlLmlzRGVsZXRlZCA9IHRydWU7XG5cdCAgICBcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHQgICAgXHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0ICAgIFx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0ICAgIFx0XHRcdH0pO1xuXHQgICAgXHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PSA0MTcpIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3BhZ2VfZGVsZXRlX2Vycm9yX2NhdXNlX3JlZGlyZWN0cyddKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLmlzRHJhZnQgPSBmYWxzZTtcblxuXHQgICAgJHNjb3BlLnN1Ym1pdE5hdkZvcm0gPSBmdW5jdGlvbihkYXRhKSB7XG5cdCAgICBcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3VwZGF0ZT9pZD0nICsgJHNjb3BlLm5hdkRhdGEuaWQsIGRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV91cGRhdGVfbGF5b3V0X3NhdmVfc3VjY2VzcycpKTtcblx0ICAgIFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHQgICAgXHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbih2YWx1ZSkge1xuXHQgICAgXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IodmFsdWUubWVzc2FnZSk7XG5cdCAgICBcdFx0fSk7XG5cdCAgICBcdH0pO1xuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZXIoKSB7XG5cdFx0XHQkc2NvcGUubmF2RGF0YSA9ICRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywge2lkOiAkc2NvcGUuaWR9LCB0cnVlKVswXTtcblx0XHRcdGlmICgkc2NvcGUubmF2RGF0YSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0JHNjb3BlLmlzRHJhZnQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMoKTtcblxuXHRcdFx0XHQvKiBwcm9wZXJ0aWVzIC0tPiAqL1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX29mZmxpbmUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0ICAgIFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQgICAgXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLW9mZmxpbmUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIG9mZmxpbmVTdGF0dXMgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19vZmZsaW5lID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfb2ZmbGluZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX29ubGluZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdCAgICBcdFx0fSk7XG5cdFx0XHQgICAgXHR9XG5cdFx0XHQgICAgfSk7XG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfaGlkZGVuIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLWhpZGRlbicsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgaGlkZGVuU3RhdHVzIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfaGlkZGVuID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfaGlkZGVuJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfdmlzaWJsZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfaG9tZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQgICAgXHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLWhvbWUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIGhvbWVTdGF0ZSA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfaG9tZSA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfc3RhdGVfaXNfaG9tZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19zdGF0ZV9pc19ub3RfaG9tZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHQgICAgXHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdFx0aW5pdGlhbGl6ZXIoKTtcblx0fV0pO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0gJHNjb3BlLmxhbmcgZnJvbSBuZy1yZXBlYXRcblx0ICovXG5cdHphYS5jb250cm9sbGVyKFwiTmF2SXRlbUNvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHJvb3RTY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJyR0aW1lb3V0JywgJ1NlcnZpY2VNZW51RGF0YScsICdBZG1pbkxhbmdTZXJ2aWNlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24nLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGh0dHAsICRmaWx0ZXIsICR0aW1lb3V0LCBTZXJ2aWNlTWVudURhdGEsIEFkbWluTGFuZ1NlcnZpY2UsIEFkbWluVG9hc3RTZXJ2aWNlLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24pIHtcblxuXHRcdCRzY29wZS5sb2FkZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5OYXZDb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLm9wZW5MaXZlVXJsID0gZnVuY3Rpb24oaWQsIHZlcnNpb25JZCkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoaWQsIHZlcnNpb25JZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkTGl2ZVVybCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoJHNjb3BlLml0ZW0uaWQsICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24pO1xuXHRcdH07XG5cblx0XHQvLyBsYXlvdXRzRGF0YVxuXG5cdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG4gICAgXHR9KTtcblx0XHRcblx0XHQvLyBzZXJ2aWNlTWVudURhdGEgaW5oZXJpdGFuY2VcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxvYWRMYW5ndWFnZScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRpZiAoISRzY29wZS5sb2FkZWQpIHtcblx0XHRcdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIHByb3BlcnRpZXM6XG5cblx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuaXRlbSA9IFtdO1xuXG5cdFx0JHNjb3BlLml0ZW1Db3B5ID0gW107XG5cblx0XHQkc2NvcGUuc2V0dGluZ3MgPSBmYWxzZTtcblxuXHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBbXTtcblxuXHRcdCRzY29wZS50eXBlRGF0YSA9IFtdO1xuXG5cdFx0JHNjb3BlLmNvbnRhaW5lciA9IFtdO1xuXG5cdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXG5cdFx0JHNjb3BlLmhvbWVVcmwgPSAkcm9vdFNjb3BlLmx1eWFjZmcuaG9tZVVybDtcblxuXHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFxuXHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcztcblxuXHRcdCRzY29wZS50cmFzaEl0ZW0gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUubGFuZy5pc19kZWZhdWx0ID09IDApIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuWydqc19wYWdlX2NvbmZpcm1fZGVsZXRlJ10sIGkxOG5bJ2Ntc2FkbWluX3NldHRpbmdzX3RyYXNocGFnZV90aXRsZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHRcdCRodHRwLmRlbGV0ZSgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2RlbGV0ZT9uYXZJdGVtSWQ9JyArICRzY29wZS5pdGVtLmlkKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pdGVtID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pdGVtQ29weSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc2V0dGluZ3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUudHlwZURhdGEgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuJGJyb2FkY2FzdCgnZGVsZXRlZE5hdkl0ZW0nKTtcblx0XHRcdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0ICAgIFx0XHRcdH0pO1xuXHRcdCAgICBcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3BhZ2VfZGVsZXRlX2Vycm9yX2NhdXNlX3JlZGlyZWN0cyddKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fV0pO1xuXHRcdFx0fVxuXHQgICAgfTtcblxuXHRcdCRzY29wZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1Db3B5ID0gYW5ndWxhci5jb3B5KCRzY29wZS5pdGVtKTtcblx0XHRcdGlmICgkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IGFuZ3VsYXIuY29weSh7J25hdl9pdGVtX3R5cGVfaWQnIDogJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZCB9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnR5cGVEYXRhKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnVwZGF0ZU5hdkl0ZW1EYXRhID0gZnVuY3Rpb24oaXRlbUNvcHksIHR5cGVEYXRhQ29weSkge1xuXHRcdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXHRcdFx0dmFyIG5hdkl0ZW1JZCA9IGl0ZW1Db3B5LmlkO1xuXG5cdFx0XHR0eXBlRGF0YUNvcHkudGl0bGUgPSBpdGVtQ29weS50aXRsZTtcblx0XHRcdHR5cGVEYXRhQ29weS5hbGlhcyA9IGl0ZW1Db3B5LmFsaWFzO1xuXHRcdFx0dHlwZURhdGFDb3B5LnRpdGxlX3RhZyA9IGl0ZW1Db3B5LnRpdGxlX3RhZztcblx0XHRcdHR5cGVEYXRhQ29weS5kZXNjcmlwdGlvbiA9IGl0ZW1Db3B5LmRlc2NyaXB0aW9uO1xuXHRcdFx0dHlwZURhdGFDb3B5LmtleXdvcmRzID0gaXRlbUNvcHkua2V5d29yZHM7XG5cdFx0XHR0eXBlRGF0YUNvcHkudGltZXN0YW1wX2NyZWF0ZSA9IGl0ZW1Db3B5LnRpbWVzdGFtcF9jcmVhdGU7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaW1hZ2VfaWQgPSBpdGVtQ29weS5pbWFnZV9pZDtcblx0XHRcdHR5cGVEYXRhQ29weS5pc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQgPSBpdGVtQ29weS5pc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQ7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaXNfY2FjaGVhYmxlID0gaXRlbUNvcHkuaXNfY2FjaGVhYmxlO1xuXHRcdFx0JGh0dHAucG9zdChcblx0XHRcdFx0J2FkbWluL2FwaS1jbXMtbmF2aXRlbS91cGRhdGUtcGFnZS1pdGVtP25hdkl0ZW1JZD0nICsgbmF2SXRlbUlkICsgJyZuYXZJdGVtVHlwZT0nICsgaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSxcblx0XHRcdFx0JC5wYXJhbSh0eXBlRGF0YUNvcHkpLFxuXHRcdFx0XHRoZWFkZXJzXG5cdFx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUgIT09IDEpIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0Lyogc3dpdGNoIHZlcnNpb24gaWYgdHlwZSBpcyBwYWdlICovXG5cdFx0XHRcdFx0aWYgKGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUgPT0gMSAmJiB0eXBlb2YgcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdC8qIGNob29zZSBnaXZlbiB2ZXJzaW9uIG9yIGNob29zZSBmaXJzdCBhdmFpbGFibGUgdmVyc2lvbiAqL1xuXHRcdFx0XHRcdFx0dmFyIHBhZ2VWZXJzaW9uS2V5ID0gcmVzcG9uc2UuZGF0YVsnaXRlbSddLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0XHRpZiAocGFnZVZlcnNpb25LZXkgPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRwYWdlVmVyc2lvbktleSA9IE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ10pWzBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ11bcGFnZVZlcnNpb25LZXldWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXVtwYWdlVmVyc2lvbktleV1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSBwYWdlVmVyc2lvbktleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfaXRlbV91cGRhdGVfb2snLCB7J3RpdGxlJzogaXRlbUNvcHkudGl0bGV9KSk7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHRcdCRzY29wZS5yZXNldCgpO1xuXHRcdFx0fSwgZnVuY3Rpb24gZXJyb3JDYWxsYmFjayhyZXNwb25zZSkge1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGl0ZW0ubWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1Db3B5LmFsaWFzJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4hPW8gJiYgbiE9bnVsbCkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbUNvcHkuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5Jykobik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUucmVtb3ZlVmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb24pIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blBhcmFtKCdqc192ZXJzaW9uX2RlbGV0ZV9jb25maXJtJywge2FsaWFzOiB2ZXJzaW9uLnZlcnNpb25fYWxpYXN9KSwgaTE4blsnY21zYWRtaW5fdmVyc2lvbl9yZW1vdmUnXSwgWyckdG9hc3QnLCAnJGh0dHAnLCBmdW5jdGlvbigkdG9hc3QsICRodHRwKSB7XG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9yZW1vdmUtcGFnZS12ZXJzaW9uJywge3BhZ2VJZCA6IHZlcnNpb24uaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc192ZXJzaW9uX2RlbGV0ZV9jb25maXJtX3N1Y2Nlc3MnLCB7YWxpYXM6IHZlcnNpb24udmVyc2lvbl9hbGlhc30pKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdFx0fTtcblx0XHRcbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvbkl0ZW07XG4gICAgXHRcbiAgICBcdCRzY29wZS50YWIgPSAxO1xuICAgIFx0XG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uSXRlbSkge1xuICAgIFx0XHQkc2NvcGUuY2hhbmdlVGFiKDQpO1xuICAgIFx0XHQkc2NvcGUuZWRpdFZlcnNpb25JdGVtID0gdmVyc2lvbkl0ZW07XG4gICAgXHR9O1xuXG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb25VcGRhdGUgPSBmdW5jdGlvbihlZGl0VmVyc2lvbkl0ZW0pIHtcbiAgICBcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2NoYW5nZS1wYWdlLXZlcnNpb24tbGF5b3V0JywgeydwYWdlSXRlbUlkJzogZWRpdFZlcnNpb25JdGVtLmlkLCAnbGF5b3V0SWQnOiBlZGl0VmVyc2lvbkl0ZW0ubGF5b3V0X2lkLCAnYWxpYXMnOiBlZGl0VmVyc2lvbkl0ZW0udmVyc2lvbl9hbGlhc30pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG4gICAgXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc192ZXJzaW9uX3VwZGF0ZV9zdWNjZXNzJ10pO1xuICAgIFx0XHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0pO1xuICAgIFx0fTtcbiAgICBcdFxuXHRcdCRzY29wZS5nZXRJdGVtID0gZnVuY3Rpb24obGFuZ0lkLCBuYXZJZCkge1xuXHRcdFx0JGh0dHAoe1xuXHRcdFx0ICAgIHVybDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9uYXYtbGFuZy1pdGVtJyxcblx0XHRcdCAgICBtZXRob2Q6IFwiR0VUXCIsXG5cdFx0XHQgICAgcGFyYW1zOiB7IGxhbmdJZCA6IGxhbmdJZCwgbmF2SWQgOiBuYXZJZCB9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtID0gcmVzcG9uc2UuZGF0YVsnaXRlbSddO1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGEgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddO1xuXHRcdFx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gdHJ1ZTtcblx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoIXJlc3BvbnNlLmRhdGFbJ25hdiddLmlzX2RyYWZ0KSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIuYnViYmxlUGFyZW50cygkc2NvcGUuTmF2Q29udHJvbGxlci5uYXZEYXRhLnBhcmVudF9uYXZfaWQsICRzY29wZS5OYXZDb250cm9sbGVyLm5hdkRhdGEubmF2X2NvbnRhaW5lcl9pZCk7XG5cdFx0XHRcdFx0aWYgKCRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXG5cdFx0XHRcdFx0XHR2YXIgbGFzdFZlcnNpb24gPSBTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uLmhhc1ZlcnNpb24oJHNjb3BlLml0ZW0uaWQpO1xuXG5cdFx0XHRcdFx0XHRpZiAobGFzdFZlcnNpb24pIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN3aXRjaFZlcnNpb24obGFzdFZlcnNpb24pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSByZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQgaW4gcmVzcG9uc2UuZGF0YS50eXBlRGF0YSkge1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9ICRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IHRydWVcblx0XHRcdH0sIGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdC8vIGl0cyBsb2FkZWQsIGJ1dCB0aGUgZGF0YSBkb2VzIG5vdCBleGlzdHMuXG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSB0cnVlO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVZlcnNpb25zRHJvcGRvd24gPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkgPSAhJHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uID0gZnVuY3Rpb24ocGFnZVZlcnNpb25pZCwgdG9nZ2xlKSB7XG5cdFx0XHRTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uLnN0b3JlKCRzY29wZS5pdGVtLmlkLCBwYWdlVmVyc2lvbmlkKTtcblx0XHRcdCRzY29wZS5jb250YWluZXIgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSBwYWdlVmVyc2lvbmlkO1xuXHRcdFx0JHNjb3BlLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRpZiAodG9nZ2xlKcKge1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlVmVyc2lvbnNEcm9wZG93bigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaEZvcmNlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKEFkbWluTGFuZ1NlcnZpY2UuaXNJblNlbGVjdGlvbigkc2NvcGUubGFuZy5zaG9ydF9jb2RlKSkge1xuXHRcdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyogbmV3IHNldHRpbmdzIG92ZXJsYXkgKi9cblx0XHRcblx0XHQkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSA9IHRydWU7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0JHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkgPSAhJHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHk7XG5cdFx0XHRpZiAodGFiKSB7XG5cdFx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdCRzY29wZS5jaGFuZ2VUYWIgPSBmdW5jdGlvbih0YWIpIHtcblx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0fVxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFJlZnJlc2ggdGhlIGN1cnJlbnQgbGF5b3V0IGNvbnRhaW5lciBibG9ja3MuXG5cdFx0ICogXG5cdFx0ICogQWZ0ZXIgc3VjY2Vzc2Z1bGwgYXBpIHJlc3BvbnNlIGFsbCBjbXMgbGF5b3V0IGFyZSBmb3JlYWNoIGFuZCB0aGUgdmFsdWVzIGFyZSBwYXNzZWQgdG8gcmV2UGxhY2Vob2xkZXJzKCkgbWV0aG9kLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkID0gZnVuY3Rpb24ocHJldklkLCBwbGFjZWhvbGRlclZhcikge1xuXHRcdFx0JGh0dHAoe1xuXHRcdFx0XHR1cmwgOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbG9hZC1wbGFjZWhvbGRlcicsXG5cdFx0XHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXMgOiB7IG5hdkl0ZW1QYWdlSWQgOiAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uLCBwcmV2SWQgOiBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyIDogcGxhY2Vob2xkZXJWYXJ9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKCRzY29wZS5pdGVtLmlkLCAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uKTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5jb250YWluZXIuX19wbGFjZWhvbGRlcnMsIGZ1bmN0aW9uKHBsYWNlaG9sZGVyKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyhwbGFjZWhvbGRlciwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgcmV2UGxhY2Vob2xkZXJzIG1ldGhvZCBnb2VzIHRyb3VyZ2ggdGhlIG5ldyByb3cvY29sIChncmlkKSBzeXN0ZW0gY29udGFpbmVyIGpzb24gbGF5b3V0IHdoZXJlOlxuXHRcdCAqIFxuXHRcdCAqIHJvd3NbXVsxXSA9IGNvbCBsZWZ0XG5cdFx0ICogcm93c1tdWzJdID0gY29sIHJpZ2h0XG5cdFx0ICogXG5cdFx0ICogV2hlcmUgYSBsYXlvdXQgaGF2ZSBhdCBsZWFzdCBvbiByb3cgd2hpY2ggY2FuIGhhdmUgY29scyBpbnNpZGUuIFNvIHRoZXJlIHJldlBsYWNlaG9sZGVycyBtZXRob2QgZ29lcyB0cm91Z2ggdGhlIGNvbHNcblx0XHQgKiBhbmQgY2hlY2sgaWYgdGhlIGNvbCBpcyBlcXVhbCB0aGUgZ2l2ZW4gY29sIHRvIHJlcGxhY2UgdGhlIGNvbnRlbnQgd2l0aCAgKGZyb20gcmVmcmVzaE5lc3RlZCBtZXRob2QpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMgPSBmdW5jdGlvbihwbGFjZWhvbGRlcnMsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocGxhY2Vob2xkZXJzLCBmdW5jdGlvbihwbGFjZWhvbGRlclJvdywgcGxhY2Vob2xkZXJLZXkpIHtcblx0XHRcdFx0aWYgKHBhcnNlSW50KHByZXZJZCkgPT0gcGFyc2VJbnQocGxhY2Vob2xkZXJSb3cucHJldl9pZCkgJiYgcGxhY2Vob2xkZXJWYXIgPT0gcGxhY2Vob2xkZXJSb3dbJ3ZhciddKSB7XG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJzW3BsYWNlaG9sZGVyS2V5XVsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ10gPSByZXBsYWNlQ29udGVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUucmV2RmluZChwbGFjZWhvbGRlclJvdywgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSByZXZGaW5kIG1ldGhvZCBkb2VzIHRoZSByZWN1cnNpdiBqb2Igd2l0aGluIGEgYmxvY2sgYW4gcGFzc2VzIHRoZSB2YWx1ZSBiYWNrIHRvIHJldlBsYWNlaG9sZGVycygpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZGaW5kID0gZnVuY3Rpb24ocGxhY2Vob2xkZXIsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRmb3IgKHZhciBpIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXSkge1xuXHRcdFx0XHRmb3IgKHZhciBob2xkZXJLZXkgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaG9sZGVyIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzKHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBkcm9wcyBpdGVtcyBpbiBhbiBlbXB0eSBwYWdlIHBsYWNlaG9sZGVyIG9mIENNUyBMQVlPVVQgUExBQ0VIT0xERVJcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW1QbGFjZWhvbGRlciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbikge1xuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywge1xuXHRcdFx0XHRcdHByZXZfaWQ6IGRyb3BwZWQucHJldl9pZCwgXG5cdFx0XHRcdFx0c29ydF9pbmRleDowLCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZFsncHJldl9pZCddLCBkcm9wcGVkWyd2YXInXSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZChkcm9wcGVkWydwcmV2X2lkJ10sIGRyb3BwZWRbJ3ZhciddKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUuYmxvY2sgRnJvbSBuZy1yZXBlYXQgc2NvcGUgYXNzaWdubWVudFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJQYWdlQmxvY2tFZGl0Q29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckc2NlJywgJyRodHRwJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VCbG9ja0NvcHlTdGFjaycsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRzY2UsICRodHRwLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VCbG9ja0NvcHlTdGFjaywgU2VydmljZUxpdmVFZGl0TW9kZSkge1xuXG5cdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdC8qKlxuXHRcdCAqIGRyb3BzIGFuIGl0ZW0gaW4gYW4gZW1wdHkgcGxhY2Vob2xkZXIgb2YgYSBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbVBsYWNlaG9sZGVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uKSB7XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7XG5cdFx0XHRcdFx0cHJldl9pZCA6IGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OjAsIFxuXHRcdFx0XHRcdGJsb2NrX2lkIDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkIDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKGRyb3BwZWQucHJldl9pZCwgZHJvcHBlZC52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZCA6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogRHJvcHMgYSBibG9jayBhYm92ZS9iZWxvdyBhbiBFWElTVElORyBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbSA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixlbGVtZW50KSB7XG5cdFx0XHR2YXIgc29ydEluZGV4ID0gJHNjb3BlLiRpbmRleDtcblx0XHRcdFxuXHRcdFx0aWYgKHBvc2l0aW9uID09ICdib3R0b20nKSB7XG5cdFx0XHRcdHNvcnRJbmRleCA9IHNvcnRJbmRleCArIDE7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHsgXG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4LCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiAkc2NvcGUucGxhY2Vob2xkZXIubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleCxcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0Lypcblx0XHRcdFx0XHQgKiBAaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9sdXlhZGV2L2x1eWEvaXNzdWVzLzE2Mjlcblx0XHRcdFx0XHQgKiBUaGUgbW92ZWQgYmxvY2ssIHNob3VsZCByZW1vdmVkIGZyb20gdGhlIHByZXZpb3VzIGFycmF5LiBUaGlzIGlzIG9ubHkgdGhlIGNhc2Ugd2hlbiBkcmFnZ2luZyBmcm9tIGFuIE9VVEVSIGJsb2NrIGludG8gYW4gSU5ORVIgYmxvY2tcblx0XHRcdFx0XHQgKiBpcyB0aGlzIHdpbGwgbm90IHJlZnJlc2ggdGhlIE9VVEVSIGJsb2NrLCBidXQgYWx3YXlzIHdpbGwgaW4gdGhlIG9wcG9zaXRlIHdheS5cblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZWxlbWVudCkucmVtb3ZlKCk7XG5cdFx0XHRcdFx0Ly8gYXMgdGhlIGJsb2NrIGhhcyBiZWVuIHJlbW92ZWQgZnJvbSBleGlzdGluZywgcmVmcmVzaCB0aGUgbmV3IHBsYWNlaG9sZGVyLlxuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5jb3B5QmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VCbG9ja0NvcHlTdGFjay5wdXNoKCRzY29wZS5ibG9jayk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVIaWRkZW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2suaXNfaGlkZGVuID09IDApIHtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfaGlkZGVuID0gMDtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAoe1xuXHRcdFx0ICAgIHVybDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS90b2dnbGUtYmxvY2staGlkZGVuJyxcblx0XHRcdCAgICBtZXRob2Q6IFwiR0VUXCIsXG5cdFx0XHQgICAgcGFyYW1zOiB7IGJsb2NrSWQgOiAkc2NvcGUuYmxvY2suaWQsIGhpZGRlblN0YXRlOiAkc2NvcGUuYmxvY2suaXNfaGlkZGVuIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0LyogbG9hZCBsaXZlIHVybCBvbiBoaWRkZW4gdHJpZ2dlciAqL1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci4kcGFyZW50LiRwYXJlbnQubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0Ly8gc3VjY2Vzc2Z1bGwgdG9nZ2xlIGhpZGRlbiBzdGF0ZSBvZiBibG9ja1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja192aXNiaWxpdHlfY2hhbmdlJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAkc2NvcGUuYmxvY2sudmFycyAhPSBcInVuZGVmaW5lZFwiICYmICRzY29wZS5ibG9jay52YXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzQ29uZmlndXJhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICRzY29wZS5ibG9jay5jZmdzICE9IFwidW5kZWZpbmVkXCIgJiYgJHNjb3BlLmJsb2NrLmNmZ3MubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblx0XHRcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhbHVlcyB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGF0YSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhcmlhdGlvbiB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eShuKTtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuZ2V0SW5mbyA9IGZ1bmN0aW9uKHZhckZpZWxkTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay5maWVsZF9oZWxwLmhhc093blByb3BlcnR5KHZhckZpZWxkTmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuICRzY29wZS5ibG9jay5maWVsZF9oZWxwW3ZhckZpZWxkTmFtZV07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSA9IGZ1bmN0aW9uKHZhcmlhdGVuTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay52YXJpYXRpb25zLmhhc093blByb3BlcnR5KHZhcmlhdGVuTmFtZSkpIHtcblx0XHRcdFx0dmFyIHZhcmlhdGlvbiA9ICRzY29wZS5ibG9jay52YXJpYXRpb25zWyRzY29wZS5ibG9jay52YXJpYXRpb25dO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFyaWF0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFsdWUsIGZ1bmN0aW9uKHYsIGspIHtcblx0XHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9ja1trZXldLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoayA9PSBvYmplY3QudmFyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay5jZmdzLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLnZhcnMsIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jZmdkYXRhID0gJHNjb3BlLmJsb2NrLmNmZ3ZhbHVlcyB8fCB7fTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLm1vZGFsSGlkZGVuID0gdHJ1ZTtcblxuXHRcdCRzY29wZS5tb2RhbE1vZGUgPSAxO1xuXG5cdFx0JHNjb3BlLmluaXRNb2RhbE1vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2sudmFycy5sZW5ndGggID09IDApIHtcblx0XHRcdFx0JHNjb3BlLm1vZGFsTW9kZSA9IDI7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVFZGl0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmlzRWRpdGFibGUoKSB8fCAkc2NvcGUuaXNDb25maWd1cmFibGUoKSkge1xuXHRcdFx0XHQkc2NvcGUubW9kYWxIaWRkZW4gPSAhJHNjb3BlLm1vZGFsSGlkZGVuO1xuXHRcdFx0XHQkc2NvcGUuZWRpdCA9ICEkc2NvcGUuZWRpdDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbmRlclRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUsIGRhdGFWYXJzLCBjZmdWYXJzLCBibG9jaywgZXh0cmFzKSB7XG5cdFx0XHRpZiAodGVtcGxhdGUgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH1cblx0XHRcdHZhciB0ZW1wbGF0ZSA9IFR3aWcudHdpZyh7XG5cdFx0XHQgICAgZGF0YTogdGVtcGxhdGVcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgY29udGVudCA9IHRlbXBsYXRlLnJlbmRlcih7XG5cdFx0XHRcdHZhcnMgOiBkYXRhVmFycyxcblx0XHRcdFx0Y2ZncyA6IGNmZ1ZhcnMsXG5cdFx0XHRcdGJsb2NrIDogYmxvY2ssXG5cdFx0XHRcdGV4dHJhcyA6IGV4dHJhc1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiAkc2NlLnRydXN0QXNIdG1sKGNvbnRlbnQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlQmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX2RlbGV0ZV9jb25maXJtJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSksIGkxOG5bJ3ZpZXdfdXBkYXRlX2Jsb2NrX3Rvb2x0aXBfZGVsZXRlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmRlbGV0ZSgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9kZWxldGU/aWQ9JyArICRzY29wZS5ibG9jay5pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfcmVtb3ZlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzQW55UmVxdWlyZWRBdHRyaWJ1dGVFbXB0eSA9ICBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyIHJlc3BvbnNlID0gZmFsc2U7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLnZhcnMsIGZ1bmN0aW9uKHZhckl0ZW0pIHtcblx0XHRcdFx0aWYgKHZhckl0ZW0ucmVxdWlyZWQgJiYgJHNjb3BlLmlzRW1wdHkoJHNjb3BlLmRhdGEsIHZhckl0ZW0udmFyKSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5QYXJhbSgnanNfYmxvY2tfYXR0cmlidXRlX2VtcHR5Jywge2xhYmVsOiB2YXJJdGVtLmxhYmVsfSkpO1xuXHRcdFx0XHRcdHJlc3BvbnNlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2suY2ZncywgZnVuY3Rpb24odmFySXRlbSkge1xuXG5cdFx0XHRcdGlmICh2YXJJdGVtLnJlcXVpcmVkICYmICRzY29wZS5pc0VtcHR5KCRzY29wZS5jZmdkYXRhLCB2YXJJdGVtLnZhcikpIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuUGFyYW0oJ2pzX2Jsb2NrX2F0dHJpYnV0ZV9lbXB0eScsIHtsYWJlbDogdmFySXRlbS5sYWJlbH0pKTtcblx0XHRcdFx0XHRyZXNwb25zZSA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc0VtcHR5ID0gZnVuY3Rpb24odmFsdWVzLCBrZXkpIHtcblx0XHRcdGlmICh2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiB2YWx1ZXNba2V5XSkge1xuXHRcdFx0XHRpZiAodmFsdWVzW2tleV0ubGVuZ3RoID09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdGlmICgkc2NvcGUuaXNBbnlSZXF1aXJlZEF0dHJpYnV0ZUVtcHR5KCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cblx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArICRzY29wZS5ibG9jay5pZCwge1xuXHRcdFx0XHRqc29uX2NvbmZpZ192YWx1ZXM6ICRzY29wZS5kYXRhLFxuXHRcdFx0XHRqc29uX2NvbmZpZ19jZmdfdmFsdWVzOiAkc2NvcGUuY2ZnZGF0YSxcblx0XHRcdFx0dmFyaWF0aW9uOiAkc2NvcGUuYmxvY2sudmFyaWF0aW9uXG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX3VwZGF0ZV9vaycsIHtuYW1lOiAkc2NvcGUuYmxvY2submFtZX0pKTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZUVkaXQoKTtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2RpcnR5ID0gMTtcblx0XHRcdFx0JHNjb3BlLmJsb2NrID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEub2JqZWN0ZGV0YWlsKTtcblx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkoJHNjb3BlLmJsb2NrLnZhcmlhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJEcm9wcGFibGVCbG9ja3NDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ1NlcnZpY2VCbG9ja3NEYXRhJywgJ1NlcnZpY2VCbG9ja0NvcHlTdGFjaycsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEFkbWluQ2xhc3NTZXJ2aWNlLCBTZXJ2aWNlQmxvY2tzRGF0YSwgU2VydmljZUJsb2NrQ29weVN0YWNrKSB7XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VCbG9ja3NEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IFNlcnZpY2VCbG9ja3NEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlc3RvcmUgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmJsb2Nrc0RhdGEpO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5ibG9ja3NEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZUJsb2Nrc0RhdGEubG9hZCh0cnVlKTtcblx0XHR9XG5cblx0XHQkc2NvcGUuYWRkVG9GYXYgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3RvLWZhdicsIHtibG9jazogaXRlbSB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZUZyb21GYXYgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3JlbW92ZS1mYXYnLCB7YmxvY2s6IGl0ZW0gfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVHcm91cCA9IGZ1bmN0aW9uKGdyb3VwKSB7XG5cdFx0XHRpZiAoZ3JvdXAudG9nZ2xlX29wZW4gPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGdyb3VwLnRvZ2dsZV9vcGVuID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGdyb3VwLnRvZ2dsZV9vcGVuID0gIWdyb3VwLnRvZ2dsZV9vcGVuO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3RvZ2dsZS1ncm91cCcsIHtncm91cDogZ3JvdXB9LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuaXNQcmV2aWV3RW5hYmxlZCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBpdGVtLnByZXZpZXdfZW5hYmxlZDtcblx0XHR9O1xuXG5cdFx0Ly8gY29udHJvbGxlciBsb2dpY1xuXG5cdFx0JHNjb3BlLmNvcHlTdGFjayA9IFNlcnZpY2VCbG9ja0NvcHlTdGFjay5zdGFjaztcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q29weVN0YWNrJywgZnVuY3Rpb24oZXZlbnQsIHN0YWNrKSB7XG5cdFx0XHQkc2NvcGUuY29weVN0YWNrID0gc3RhY2s7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuY2xlYXJTdGFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUJsb2NrQ29weVN0YWNrLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zZWFyY2hRdWVyeSA9ICcnO1xuXG5cdFx0JHNjb3BlLnNlYXJjaElzRGlydHkgPSBmYWxzZTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ3NlYXJjaFF1ZXJ5JywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4gIT09ICcnKSB7XG5cdFx0XHRcdCRzY29wZS5zZWFyY2hJc0RpcnR5ID0gdHJ1ZTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9ja3NEYXRhLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmdyb3VwLmlzX2Zhdikge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEuc3BsaWNlKGtleSwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhbHVlLmdyb3VwLnRvZ2dsZV9vcGVuID0gMVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZigkc2NvcGUuc2VhcmNoSXNEaXJ0eSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYmxvY2tzRGF0YVJlc3RvcmUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XSk7XG59KSgpOyIsIi8qKlxuICogYWxsIGdsb2JhbCBhZG1pbiBzZXJ2aWNlc1xuICogXG4gKiBjb250cm9sbGVyIHJlc29sdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb2hucGFwYS9hbmd1bGFyLXN0eWxlZ3VpZGUjc3R5bGUteTA4MFxuICogXG4gKiBTZXJ2aWNlIEluaGVyaXRhbmNlOlxuICogXG4gKiAxLiBTZXJ2aWNlIG11c3QgYmUgcHJlZml4IHdpdGggU2VydmljZVxuICogMi4gU2VydmljZSBtdXN0IGNvbnRhaW4gYSBmb3JjZVJlbG9hZCBzdGF0ZVxuICogMy4gU2VydmljZSBtdXN0IGJyb2FkY2FzdCBhbiBldmVudCAnc2VydmljZTpGb2xkZXJzRGF0YSdcbiAqIDQuIENvbnRyb2xsZXIgaW50ZWdyYXRpb24gbXVzdCBsb29rIGxpa2VcbiAqIFxuICogYGBgXG4gKiAkc2NvcGUuZm9sZGVyc0RhdGEgPSBTZXJ2aWNlRm9sZGVyc0RhdGEuZGF0YTtcbiAqXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6Rm9sZGVyc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogICAgICAkc2NvcGUuZm9sZGVyc0RhdGEgPSBkYXRhO1xuICogfSk7XG4gKlx0XHRcdFx0XG4gKiAkc2NvcGUuZm9sZGVyc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqICAgICByZXR1cm4gU2VydmljZUZvbGRlcnNEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBgYGBcbiAqIFxuICovXG5cdFxuemFhLmNvbmZpZyhbJ3Jlc29sdmVyUHJvdmlkZXInLCBmdW5jdGlvbihyZXNvbHZlclByb3ZpZGVyKSB7XG5cdHJlc29sdmVyUHJvdmlkZXIuYWRkQ2FsbGJhY2soWydTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUJsb2Nrc0RhdGEnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsICdMdXlhTG9hZGluZycsIGZ1bmN0aW9uKFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUJsb2Nrc0RhdGEsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZUN1cnJlbnRXZWJzaXRlLCBMdXlhTG9hZGluZykge1xuXHRcdEx1eWFMb2FkaW5nLnN0YXJ0KCk7XG5cdFx0U2VydmljZUJsb2Nrc0RhdGEubG9hZCgpO1xuXHRcdFNlcnZpY2VMYXlvdXRzRGF0YS5sb2FkKCk7XG5cdFx0U2VydmljZU1lbnVEYXRhLmxvYWQoKS50aGVuKGZ1bmN0aW9uKHIpIHtcblx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5sb2FkKCk7XG5cdFx0XHRMdXlhTG9hZGluZy5zdG9wKCk7XG5cdFx0fSk7XG5cdH1dKTtcbn1dKTtcblxuXG4vKipcbiAqIENvcHkgQmxvY2sgU3RhY2sgc2VydmljZS5cbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQmxvY2tDb3B5U3RhY2tcIiwgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5zdGFjayA9IFtdO1xuXHRcblx0c2VydmljZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlcnZpY2Uuc3RhY2sgPSBbXTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q29weVN0YWNrJywgc2VydmljZS5zdGFjayk7XG5cdH07XG5cdFxuXHRzZXJ2aWNlLnB1c2ggPSBmdW5jdGlvbihibG9jaykge1xuXHRcdGlmIChzZXJ2aWNlLnN0YWNrLmxlbmd0aCA+IDQpIHtcblx0XHRcdHNlcnZpY2Uuc3RhY2suc2hpZnQoKTtcblx0XHR9XG5cdFx0c2VydmljZS5zdGFjay5wdXNoKHtibG9ja0lkOiBibG9jay5ibG9ja19pZCwgbmFtZTogYmxvY2submFtZSwgaWNvbjpibG9jay5pY29uLCBpZDogYmxvY2suaWQsIGNvcHlzdGFjazogMX0pO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDb3B5U3RhY2snLCBzZXJ2aWNlLnN0YWNrKTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIE1lbnUgU2VydmljZS5cbiAqIFxuICogJHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG4gKiBcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiBcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqIFxuICogJHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiBcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIFx0XHRcdFx0XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZU1lbnVEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLW1lbnUvZGF0YS1tZW51XCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpNZW51RGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIEJsb2NrcyBTZXJ2aWNlLlxuICogXG4gKiBcbiAqICRzY29wZS5ibG9ja3NEYXRhID0gU2VydmljZUJsb2Nrc0RhdGEuZGF0YTtcbiAqIFx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogXHQkc2NvcGUuYmxvY2tzRGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqIFxuICogJHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqIFx0cmV0dXJuIFNlcnZpY2VCbG9ja3NEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBcdFx0XHRcdFxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VCbG9ja3NEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLWFkbWluL2RhdGEtYmxvY2tzXCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpCbG9ja3NEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogTGF5b3V0cyBTZXJ2aWNlLlxuXG4kc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblx0XHRcdFx0XG4kc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xufSk7XG5cbiRzY29wZS5sYXlvdXRzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gU2VydmljZUxheW91dHNEYXRhLmxvYWQodHJ1ZSk7XG59XG5cdFx0XHRcdFxuKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUxheW91dHNEYXRhXCIsIFsnJGh0dHAnLCAnJHEnLCAnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRodHRwLCAkcSwgJHJvb3RTY29wZSkge1xuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5kYXRhID0gW107XG5cdFxuXHRzZXJ2aWNlLmxvYWQgPSBmdW5jdGlvbihmb3JjZVJlbG9hZCkge1xuXHRcdHJldHVybiAkcShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcblx0XHRcdGlmIChzZXJ2aWNlLmRhdGEubGVuZ3RoID4gMCAmJiBmb3JjZVJlbG9hZCAhPT0gdHJ1ZSkge1xuXHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkaHR0cC5nZXQoXCJhZG1pbi9hcGktY21zLWFkbWluL2RhdGEtbGF5b3V0c1wiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBDTVMgTElWRSBFRElUIFNFUklWQ0VcbiAqIFxuICogJHNjb3BlLmxpdmVFZGl0TW9kZSA9IFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGVcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTGl2ZUVkaXRNb2RlXCIsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRyb290U2NvcGUpIHtcblx0XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLnN0YXRlID0gMDtcblx0XG5cdHNlcnZpY2UudXJsID0gJHJvb3RTY29wZS5sdXlhY2ZnLmhvbWVVcmw7XG5cdFxuXHRzZXJ2aWNlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlcnZpY2Uuc3RhdGUgPSAhc2VydmljZS5zdGF0ZTtcblx0fTtcblx0c2VydmljZS5zZXRVcmwgPSBmdW5jdGlvbihpdGVtSWQsIHZlcnNpb25JZCkge1xuXHRcdHZhciBkID0gbmV3IERhdGUoKTtcblx0XHR2YXIgbiA9IGQuZ2V0VGltZSgpO1xuXHRcdHNlcnZpY2UudXJsID0gJHJvb3RTY29wZS5jbXNDb25maWcucHJldmlld1VybCArICc/aXRlbUlkPScraXRlbUlkKycmdmVyc2lvbj0nICsgdmVyc2lvbklkICsgJyZkYXRlPScgKyBuO1xuXHR9O1xuXHRcblx0c2VydmljZS5jaGFuZ2VVcmwgPSBmdW5jdGlvbihpdGVtSWQsIHZlcnNpb25JZCkge1xuXHRcdGlmICh2ZXJzaW9uSWQgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2ZXJzaW9uSWQgPSAwO1xuXHRcdH1cblx0XHRzZXJ2aWNlLnNldFVybChpdGVtSWQsIHZlcnNpb25JZCk7XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkxpdmVFZGl0TW9kZVVybENoYW5nZScsIHNlcnZpY2UudXJsKTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIENNUyBDdXJyZW50IFdlYnNpdGUgU0VSSVZDRVxuICpcbiAqICRzY29wZS5jdXJyZW50V2Vic2l0ZUlkID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLnN0YXRlXG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUN1cnJlbnRXZWJzaXRlXCIsIFsnJHJvb3RTY29wZScsICdTZXJ2aWNlTWVudURhdGEnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHR2YXIgc2VydmljZSA9IHtcblx0XHRjdXJyZW50V2Vic2l0ZTogbnVsbCxcblx0XHRkZWZhdWx0V2Vic2l0ZTogbnVsbFxuXHR9O1xuXG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0c2VydmljZS5kZWZhdWx0V2Vic2l0ZSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzLmZpbmQodyA9PiB3LmlzX2RlZmF1bHQpO1xuXHRcdHNlcnZpY2UudG9nZ2xlKHNlcnZpY2UuZGVmYXVsdFdlYnNpdGUuaWQpO1xuXHR9XG5cblx0c2VydmljZS50b2dnbGUgPSBmdW5jdGlvbih3ZWJzaXRlSWQpIHtcblx0XHRpZiAod2Vic2l0ZUlkICYmICghc2VydmljZS5jdXJyZW50V2Vic2l0ZSB8fCBzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlLmlkICE9PSB3ZWJzaXRlSWQpKSB7XG5cdFx0XHRzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMuZmluZCh3ID0+IHcuaWQgPT09IHdlYnNpdGVJZCk7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgc2VydmljZS5jdXJyZW50V2Vic2l0ZSk7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG56YWEuZmFjdG9yeShcIlNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb25cIiwgW2Z1bmN0aW9uKCkge1xuXHR2YXIgc2VydmljZSA9IHtcblx0XHRwYWdlIDoge31cblx0fTtcblxuXG5cblx0c2VydmljZS5zdG9yZSA9IGZ1bmN0aW9uKHBhZ2VJZCwgdmVyc2lvbklkKSB7XG5cdFx0c2VydmljZS5wYWdlW3BhZ2VJZF0gPSB2ZXJzaW9uSWQ7XG5cdH07XG5cblxuXHRzZXJ2aWNlLmhhc1ZlcnNpb24gPSBmdW5jdGlvbihwYWdlSWQpIHtcblx0XHRpZiAoc2VydmljZS5wYWdlLmhhc093blByb3BlcnR5KHBhZ2VJZCkpIHtcblx0XHRcdHJldHVybiBzZXJ2aWNlLnBhZ2VbcGFnZUlkXTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7Il19