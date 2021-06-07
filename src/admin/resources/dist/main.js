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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiU2VydmljZUN1cnJlbnRXZWJzaXRlIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsImN1cnJlbnRXZWJzaXRlIiwiJG9uIiwiZXZlbnQiLCJtZW51RGF0YSIsImFuZ3VsYXIiLCJjb3B5IiwibWVudURhdGFPcmlnaW5hbCIsImluaXQiLCJsZW5ndGgiLCJsb2FkIiwiY29udGFpbmVyIiwiY29udGFpbmVycyIsImlzSGlkZGVuIiwiJHdhdGNoIiwibiIsIml0ZW1zIiwidGl0bGUiLCJmb3JFYWNoIiwidmFsdWUiLCJidWJibGVQYXJlbnRzIiwicGFyZW50TmF2SWQiLCJjb250YWluZXJJZCIsImluZGV4IiwiaXRlbSIsImV4aXN0cyIsImkiLCJwdXNoIiwicGFyZW50X25hdl9pZCIsIm5hdl9jb250YWluZXJfaWQiLCJ0b2dnbGVyIiwidGVtcGxhdGUiLCJpMThuIiwiJGh0dHAiLCIkc3RhdGUiLCJnZXQiLCJwYXJhbXMiLCJ0aGVuIiwicmVzcG9uc2UiLCJwYXRoIiwidGVtcGxhdGVVcmwiLCJTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSIsIkFkbWluVG9hc3RTZXJ2aWNlIiwiZXJyb3IiLCJzdWNjZXNzIiwiJHBhcmVudCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImlzRGVmYXVsdEl0ZW0iLCJmaW5kIiwiaXNfZGVmYXVsdCIsImxhbmdfaWQiLCJvIiwidW5kZWZpbmVkIiwiYWxpYXNTdWdnZXN0aW9uIiwiYWxpYXMiLCJleGVjIiwic2F2ZSIsImlzSW5saW5lIiwiZ2V0SXRlbSIsIm5hdl9pZCIsInJlYXNvbiIsImtleSIsIlNlcnZpY2VMYXlvdXRzRGF0YSIsInBhcmVudCIsIm5hdkl0ZW1JZCIsImxheW91dF9pZCIsImxheW91dHNEYXRhIiwiYXJyYXlUb1NlbGVjdCIsImlucHV0IiwidmFsdWVGaWVsZCIsImxhYmVsRmllbGQiLCJvdXRwdXQiLCJ2ZXJzaW9uc0RhdGEiLCJnZXRWZXJzaW9uTGlzdCIsImlzRWRpdEF2YWlsYWJsZSIsInVzZV9kcmFmdCIsImZyb21fZHJhZnRfaWQiLCJkcmFmdHMiLCJsYXlvdXRzIiwibW9kdWxlcyIsImNvbnRyb2xsZXJzIiwiYWN0aW9ucyIsImFkZFBhcmFtIiwiaGFzT3duUHJvcGVydHkiLCJhY3Rpb25fcGFyYW1zIiwibW9kdWxlX25hbWUiLCJjb250cm9sbGVyX25hbWUiLCJmaWx0ZXIiLCJ3ZWJzaXRlSWQiLCJyZXN1bHQiLCJ3ZWJzaXRlX2lkIiwicmV0dXJuVmFsdWUiLCJmYWN0b3J5Iiwic2VydmljZSIsInN0YXR1cyIsImRlbGVnYXRlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCJzdGF0ZSIsInVybCIsImdvIiwiZGFzaGJvYXJkIiwicG9zdCIsImhlYWRlcnMiLCJjcmVhdGVOZXdWZXJzaW9uU3VibWl0IiwiY29weUV4aXN0aW5nVmVyc2lvbiIsInZlcnNpb25MYXlvdXRJZCIsIiQiLCJwYXJhbSIsInZlcnNpb25OYW1lIiwiZnJvbVZlcnNpb25QYWdlSWQiLCJyZWZyZXNoRm9yY2UiLCJpc09wZW4iLCJpdGVtU2VsZWN0aW9uIiwic2VsZWN0aW9uIiwiTmF2SXRlbUNvbnRyb2xsZXIiLCJzZWxlY3QiLCJsb2FkSXRlbXMiLCJOYXZDb250cm9sbGVyIiwibmF2RGF0YSIsImxhbmciLCJyZWZyZXNoIiwiZXJyb3JBcnJheSIsIiRyb290U2NvcGUiLCJTZXJ2aWNlTGl2ZUVkaXRNb2RlIiwibGl2ZUVkaXRTdGF0ZSIsImxvYWRDbXNDb25maWciLCJjbXNDb25maWciLCJjdXJyZW50V2Vic2l0ZVRvZ2dsZXIiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwidG9nZ2xlIiwiZHJvcEVtcHR5Q29udGFpbmVyIiwiZHJhZ2dlZCIsImRyb3BwZWQiLCJwb3NpdGlvbiIsImNhdElkIiwibW92ZUl0ZW1JZCIsImRyb3BwZWRPbkNhdElkIiwic3VjY2VzIiwiZHJvcEl0ZW0iLCJkcmFnIiwiZHJvcCIsInBvcyIsImFwaSIsImRyb3BwZWRBZnRlckl0ZW1JZCIsImRyb3BwZWRCZWZvcmVJdGVtSWQiLCJkcm9wcGVkT25JdGVtSWQiLCJ2YWxpZEl0ZW0iLCJob3ZlciIsImRyYWdlZCIsInJyaXRlbXMiLCJyZWN1cnNpdkl0ZW1WYWxpZGl0eSIsImluZGV4T2YiLCJ0b2dnbGVJdGVtIiwidG9nZ2xlX29wZW4iLCJpZ25vcmVMb2FkaW5nQmFyIiwiY2hhbmdlVXJsIiwibmF2X2l0ZW1faWQiLCJzaG93RHJhZyIsImlzQ3VycmVudEVsZW1lbnQiLCJoaWRkZW5DYXRzIiwidG9nZ2xlQ2F0IiwidG9nZ2xlSXNIaWRkZW4iLCIkcSIsInJlc29sdmUiLCJyZWplY3QiLCIkc3RhdGVQYXJhbXMiLCJQbGFjZWhvbGRlclNlcnZpY2UiLCJTZXJ2aWNlUHJvcGVydGllc0RhdGEiLCJBZG1pbkNsYXNzU2VydmljZSIsIkFkbWluTGFuZ1NlcnZpY2UiLCJIdG1sU3RvcmFnZSIsInBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4iLCJwYWdlU2V0dGluZ3NPdmVybGF5VGFiIiwidG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSIsInQiLCJuYXZDZmciLCJoZWxwdGFncyIsImx1eWFjZmciLCJkaXNwbGF5TGl2ZUNvbnRhaW5lciIsImxpdmVVcmwiLCJwcm9wZXJ0aWVzRGF0YSIsInBsYWNlaG9sZGVyU3RhdGUiLCJpc0Jsb2NraG9sZGVyU21hbGwiLCJnZXRWYWx1ZSIsInRvZ2dsZUJsb2NraG9sZGVyU2l6ZSIsInNldFZhbHVlIiwic2lkZWJhciIsImVuYWJsZVNpZGViYXIiLCJ0b2dnbGVTaWRlYmFyIiwic2hvd0FjdGlvbnMiLCJwYXJzZUludCIsImlzRGVsZXRlZCIsInByb3BWYWx1ZXMiLCJoYXNWYWx1ZXMiLCJwYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weSIsInNhdmVQYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weUFzVGVtcGxhdGUiLCJsb2FkTmF2UHJvcGVydGllcyIsImQiLCJhZG1pbl9wcm9wX2lkIiwidG9nZ2xlUHJvcE1hc2siLCJzaG93UHJvcEZvcm0iLCJzdG9yZVByb3BWYWx1ZXMiLCJ0cmFzaCIsImNvbmZpcm0iLCIkdG9hc3QiLCJjbG9zZSIsImlzRHJhZnQiLCJzdWJtaXROYXZGb3JtIiwiaTE4blBhcmFtIiwibWVzc2FnZSIsImlzX29mZmxpbmUiLCJvZmZsaW5lU3RhdHVzIiwiaW5mbyIsImlzX2hpZGRlbiIsImhpZGRlblN0YXR1cyIsImlzX2hvbWUiLCJob21lU3RhdGUiLCIkdGltZW91dCIsIlNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24iLCJsb2FkZWQiLCJvcGVuTGl2ZVVybCIsInZlcnNpb25JZCIsImxvYWRMaXZlVXJsIiwiY3VycmVudFBhZ2VWZXJzaW9uIiwiaXNUcmFuc2xhdGVkIiwiaXRlbUNvcHkiLCJzZXR0aW5ncyIsInR5cGVEYXRhQ29weSIsInR5cGVEYXRhIiwiZXJyb3JzIiwiaG9tZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzIiwidHJhc2hJdGVtIiwiZGVsZXRlIiwiJGJyb2FkY2FzdCIsInJlc2V0IiwibmF2X2l0ZW1fdHlwZV9pZCIsInVwZGF0ZU5hdkl0ZW1EYXRhIiwidGl0bGVfdGFnIiwiZGVzY3JpcHRpb24iLCJrZXl3b3JkcyIsInRpbWVzdGFtcF9jcmVhdGUiLCJpbWFnZV9pZCIsImlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCIsImlzX2NhY2hlYWJsZSIsInBhZ2VWZXJzaW9uS2V5IiwiT2JqZWN0Iiwia2V5cyIsInRvZ2dsZVNldHRpbmdzT3ZlcmxheSIsImVycm9yQ2FsbGJhY2siLCJyZW1vdmVWZXJzaW9uIiwidmVyc2lvbiIsInZlcnNpb25fYWxpYXMiLCJwYWdlSWQiLCJlZGl0VmVyc2lvbkl0ZW0iLCJ0YWIiLCJlZGl0VmVyc2lvbiIsInZlcnNpb25JdGVtIiwiY2hhbmdlVGFiIiwiZWRpdFZlcnNpb25VcGRhdGUiLCJsYW5nSWQiLCJtZXRob2QiLCJsYXN0VmVyc2lvbiIsImhhc1ZlcnNpb24iLCJzd2l0Y2hWZXJzaW9uIiwidmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5IiwidG9nZ2xlVmVyc2lvbnNEcm9wZG93biIsInBhZ2VWZXJzaW9uaWQiLCJzdG9yZSIsImlzSW5TZWxlY3Rpb24iLCJzaG9ydF9jb2RlIiwic2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSIsInJlZnJlc2hOZXN0ZWQiLCJwcmV2SWQiLCJwbGFjZWhvbGRlclZhciIsIm5hdkl0ZW1QYWdlSWQiLCJfX3BsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVyIiwicmV2UGxhY2Vob2xkZXJzIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZUNvbnRlbnQiLCJwbGFjZWhvbGRlclJvdyIsInBsYWNlaG9sZGVyS2V5IiwicHJldl9pZCIsInJldkZpbmQiLCJob2xkZXJLZXkiLCJob2xkZXIiLCJkcm9wSXRlbVBsYWNlaG9sZGVyIiwic29ydF9pbmRleCIsImJsb2NrX2lkIiwicGxhY2Vob2xkZXJfdmFyIiwibmF2X2l0ZW1fcGFnZV9pZCIsImNvcHlCbG9ja0lkIiwicHV0IiwiJHNjZSIsIlNlcnZpY2VCbG9ja0NvcHlTdGFjayIsIk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIiLCJ2YXIiLCJlbGVtZW50Iiwic29ydEluZGV4IiwiJGluZGV4IiwicmVtb3ZlIiwiY29weUJsb2NrIiwiYmxvY2siLCJ0b2dnbGVIaWRkZW4iLCJibG9ja0lkIiwiaGlkZGVuU3RhdGUiLCJuYW1lIiwiaXNFZGl0YWJsZSIsInZhcnMiLCJpc0NvbmZpZ3VyYWJsZSIsImNmZ3MiLCJ2YWx1ZXMiLCJ2YXJpYXRpb24iLCJldmFsVmFyaWF0aW9uVmlzYmlsaXR5IiwiZ2V0SW5mbyIsInZhckZpZWxkTmFtZSIsImZpZWxkX2hlbHAiLCJ2YXJpYXRlbk5hbWUiLCJ2YXJpYXRpb25zIiwiaXNPYmplY3QiLCJ2IiwiayIsIm9iamVjdCIsImludmlzaWJsZSIsImNmZ2RhdGEiLCJjZmd2YWx1ZXMiLCJlZGl0IiwibW9kYWxIaWRkZW4iLCJtb2RhbE1vZGUiLCJpbml0TW9kYWxNb2RlIiwidG9nZ2xlRWRpdCIsInJlbmRlclRlbXBsYXRlIiwiZGF0YVZhcnMiLCJjZmdWYXJzIiwiZXh0cmFzIiwiVHdpZyIsInR3aWciLCJjb250ZW50IiwicmVuZGVyIiwidHJ1c3RBc0h0bWwiLCJyZW1vdmVCbG9jayIsImlzQW55UmVxdWlyZWRBdHRyaWJ1dGVFbXB0eSIsInZhckl0ZW0iLCJyZXF1aXJlZCIsImlzRW1wdHkiLCJsYWJlbCIsImpzb25fY29uZmlnX3ZhbHVlcyIsImpzb25fY29uZmlnX2NmZ192YWx1ZXMiLCJpc19kaXJ0eSIsIm9iamVjdGRldGFpbCIsIlNlcnZpY2VCbG9ja3NEYXRhIiwiYmxvY2tzRGF0YSIsImJsb2Nrc0RhdGFSZXN0b3JlIiwiYmxvY2tzRGF0YVJlbG9hZCIsImFkZFRvRmF2IiwicmVtb3ZlRnJvbUZhdiIsInRvZ2dsZUdyb3VwIiwiZ3JvdXAiLCJpc1ByZXZpZXdFbmFibGVkIiwicHJldmlld19lbmFibGVkIiwiY29weVN0YWNrIiwic3RhY2siLCJjbGVhclN0YWNrIiwiY2xlYXIiLCJzZWFyY2hRdWVyeSIsInNlYXJjaElzRGlydHkiLCJpc19mYXYiLCJzcGxpY2UiLCJyZXNvbHZlclByb3ZpZGVyIiwiYWRkQ2FsbGJhY2siLCJMdXlhTG9hZGluZyIsInN0YXJ0Iiwic3RvcCIsInNoaWZ0IiwiaWNvbiIsImNvcHlzdGFjayIsImZvcmNlUmVsb2FkIiwic2V0VXJsIiwiaXRlbUlkIiwiRGF0ZSIsImdldFRpbWUiLCJwcmV2aWV3VXJsIiwiZGVmYXVsdFdlYnNpdGUiLCJ3ZWJzaXRlcyIsInciLCJwYWdlIl0sIm1hcHBpbmdzIjoiOztBQUFBLENBQUMsWUFBVztBQUNYLGVB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Q0FBQ3lTLElBQVIsQ0FBYXJJLE1BQWIsSUFBdUJoQyxTQUF2QjtBQUNBLEdBRkQ7O0FBSUFwSSxFQUFBQSxPQUFPLENBQUM4SyxVQUFSLEdBQXFCLFVBQVNWLE1BQVQsRUFBaUI7QUFDckMsUUFBSXBLLE9BQU8sQ0FBQ3lTLElBQVIsQ0FBYW5ULGNBQWIsQ0FBNEI4SyxNQUE1QixDQUFKLEVBQXlDO0FBQ3hDLGFBQU9wSyxPQUFPLENBQUN5UyxJQUFSLENBQWFySSxNQUFiLENBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQU5EOztBQVFBLFNBQU9wSyxPQUFQO0FBQ0EsQ0FsQndDLENBQXpDIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXHRcblx0Ly8gZGlyZWN0aXZlLmpzXG5cbiAgICB6YWEuZGlyZWN0aXZlKFwibWVudURyb3Bkb3duXCIsIFsnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsICckZmlsdGVyJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUsICRmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0UnLFxuICAgICAgICAgICAgc2NvcGUgOiB7XG4gICAgICAgICAgICAgICAgbmF2SWQgOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCBmdW5jdGlvbigkc2NvcGUpIHtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5hdklkID0gZGF0YS5pZDtcbiAgICAgICAgICAgICAgICB9XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBhbmd1bGFyLmNvcHkoU2VydmljZU1lbnVEYXRhLmRhdGEpO1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFPcmlnaW5hbCA9IGFuZ3VsYXIuY29weShTZXJ2aWNlTWVudURhdGEuZGF0YSk7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBhbmd1bGFyLmNvcHkoZGF0YSk7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwgPSBhbmd1bGFyLmNvcHkoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNjb3BlLm1lbnVEYXRhLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlTWVudURhdGEubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY29udGFpbmVyIGluICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5tZW51RGF0YS5jb250YWluZXJzW2NvbnRhaW5lcl0uaXNIaWRkZW4gPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnc2VhcmNoUXVlcnknLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4gPT0gbnVsbCB8fCBuID09ICcnKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEuaXRlbXMgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YXIgaXRlbXMgPSAkZmlsdGVyKCdmaWx0ZXInKSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcywge3RpdGxlOiBufSk7XG5cblx0XHRcdFx0XHQvLyBmaW5kIGFsbCBwYXJlbnQgZWxlbWVudHMgb2YgdGhlIGZvdW5kIGVsZW1lbnRzIGFuZCByZSBhZGQgdGhlbSB0byB0aGUgbWFwIGluIG9yZGVyIHRvIFxuXHRcdFx0XHRcdC8vIGVuc3VyZSBhIGNvcnJlY3QgbWVudSB0cmVlLlxuXHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0XHRcdGlmICh2YWx1ZVsncGFyZW50X25hdl9pZCddID4gMCkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyh2YWx1ZVsncGFyZW50X25hdl9pZCddLCB2YWx1ZVsnbmF2X2NvbnRhaW5lcl9pZCddLCBpdGVtcyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEuaXRlbXMgPSBpdGVtcztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHMgPSBmdW5jdGlvbihwYXJlbnROYXZJZCwgY29udGFpbmVySWQsIGluZGV4KSB7XG5cdFx0XHRcdFx0dmFyIGl0ZW0gPSAkZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInKSgkc2NvcGUubWVudURhdGFPcmlnaW5hbC5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0XHRcdFx0XHRpZiAoaXRlbSkge1xuXHRcdFx0XHRcdFx0dmFyIGV4aXN0cyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGluZGV4LCBmdW5jdGlvbihpKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChpLmlkID09IGl0ZW0uaWQpIHtcblx0XHRcdFx0XHRcdFx0XHRleGlzdHMgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0aWYgKCFleGlzdHMpIHtcblx0XHRcdFx0XHRcdFx0aW5kZXgucHVzaChpdGVtKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzKGl0ZW0ucGFyZW50X25hdl9pZCwgaXRlbS5uYXZfY29udGFpbmVyX2lkLCBpbmRleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLnRvZ2dsZXIgPSB0cnVlO1xuXG5cdFx0XHRcdGluaXQoKTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgdGVtcGxhdGUgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICc8ZGl2PicrXG5cdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cCBtYi0yXCI+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtcHJlcGVuZFwiIG5nLWhpZGU9XCJzZWFyY2hRdWVyeVwiPjxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPnNlYXJjaDwvaT48L2Rpdj48L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC1wcmVwZW5kXCIgbmctc2hvdz1cInNlYXJjaFF1ZXJ5XCIgbmctY2xpY2s9XCJzZWFyY2hRdWVyeSA9IFxcJ1xcJ1wiPjxkaXYgY2xhc3M9XCJpbnB1dC1ncm91cC10ZXh0XCI+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPmNsZWFyPC9pPjwvZGl2PjwvZGl2PicrXG5cdFx0XHRcdFx0XHQnPGlucHV0IGNsYXNzPVwiZm9ybS1jb250cm9sXCIgbmctbW9kZWw9XCJzZWFyY2hRdWVyeVwiIHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCInK2kxOG5bJ25ncmVzdF9jcnVkX3NlYXJjaF90ZXh0J10rJ1wiPicrXG5cdFx0XHRcdFx0JzwvZGl2PicgKyBcblx0XHRcdFx0XHQnPGRpdiBuZy1yZXBlYXQ9XCIoa2V5LCBjb250YWluZXIpIGluIG1lbnVEYXRhLmNvbnRhaW5lcnMgfCBtZW51d2Vic2l0ZWZpbHRlcjpjdXJyZW50V2Vic2l0ZS5pZFwiIG5nLWlmPVwiKG1lbnVEYXRhLml0ZW1zIHwgbWVudXBhcmVudGZpbHRlcjpjb250YWluZXIuaWQ6MCkubGVuZ3RoID4gMFwiIGNsYXNzPVwiY2FyZCBtYi0yXCIgbmctY2xhc3M9XCJ7XFwnY2FyZC1jbG9zZWRcXCc6ICFjb250YWluZXIuaXNIaWRkZW59XCI+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiY2FyZC1oZWFkZXJcIiBuZy1jbGljaz1cImNvbnRhaW5lci5pc0hpZGRlbj0hY29udGFpbmVyLmlzSGlkZGVuXCI+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMgY2FyZC10b2dnbGUtaW5kaWNhdG9yXCI+a2V5Ym9hcmRfYXJyb3dfZG93bjwvc3Bhbj4nK1xuXHRcdFx0XHRcdFx0XHQnPHNwYW4+e3tjb250YWluZXIubmFtZX19PC9zcGFuPicrXG5cdFx0XHRcdFx0XHQnPC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiY2FyZC1ib2R5XCI+JysgXG5cdFx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwidHJlZXZpZXcgdHJlZXZpZXctY2hvb3NlclwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdCc8dWwgY2xhc3M9XCJ0cmVldmlldy1pdGVtcyB0cmVldmlldy1pdGVtcy1sdmwxXCI+JyArXG5cdFx0XHRcdFx0XHRcdFx0XHQnPGxpIGNsYXNzPVwidHJlZXZpZXctaXRlbSB0cmVldmlldy1pdGVtLWx2bDFcIiBuZy1jbGFzcz1cIntcXCd0cmVldmlldy1pdGVtLWhhcy1jaGlsZHJlblxcJyA6IChtZW51RGF0YS5pdGVtcyB8IG1lbnVwYXJlbnRmaWx0ZXI6Y29udGFpbmVyLmlkOjApLmxlbmd0aH1cIiBuZy1yZXBlYXQ9XCIoa2V5LCBkYXRhKSBpbiBtZW51RGF0YS5pdGVtcyB8IG1lbnVwYXJlbnRmaWx0ZXI6Y29udGFpbmVyLmlkOjAgdHJhY2sgYnkgZGF0YS5pZFwiIG5nLWluY2x1ZGU9XCJcXCdtZW51RHJvcGRvd25SZXZlcnNlXFwnXCI+PC9saT4nICtcblx0XHRcdFx0XHRcdFx0XHQnPC91bD4nICtcblx0XHRcdFx0XHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0XHRcdFx0JzwvZGl2PicgK1xuXHRcdFx0XHRcdCc8L2Rpdj4nK1xuXHRcdFx0XHQnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuXHR6YWEuZGlyZWN0aXZlKFwiemFhQ21zUGFnZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiBcIkVcIixcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgXCJtb2RlbFwiOiBcIj1cIixcbiAgICAgICAgICAgICAgICBcIm9wdGlvbnNcIjogXCI9XCIsXG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkBsYWJlbFwiLFxuICAgICAgICAgICAgICAgIFwiaTE4blwiOiBcIkBpMThuXCIsXG4gICAgICAgICAgICAgICAgXCJpZFwiOiBcIkBmaWVsZGlkXCIsXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiQGZpZWxkbmFtZVwiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgXHRyZXR1cm4gICc8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cCBmb3JtLXNpZGUtYnktc2lkZVwiIG5nLWNsYXNzPVwie1xcJ2lucHV0LS1oaWRlLWxhYmVsXFwnOiBpMThufVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1zaWRlIGZvcm0tc2lkZS1sYWJlbFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsPnt7bGFiZWx9fTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiZm9ybS1zaWRlXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bWVudS1kcm9wZG93biBjbGFzcz1cIm1lbnUtZHJvcGRvd25cIiBuYXYtaWQ9XCJtb2RlbFwiPjwvbWVudS1kcm9wZG93bj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cdHphYS5kaXJlY3RpdmUoXCJzaG93SW50ZXJuYWxSZWRpcmVjdGlvblwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0bmF2SWQgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCAnJHN0YXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJHN0YXRlKSB7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaCgnbmF2SWQnLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2dldC1uYXYtaXRlbS1wYXRoJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdklkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5wYXRoID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZ2V0LW5hdi1jb250YWluZXItbmFtZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XSxcblx0XHRcdHRlbXBsYXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAnPGEgY2xhc3M9XCJidG4gYnRuLXNlY29uZGFyeSBidG4tc21cIiB1aS1zcmVmPVwiY3VzdG9tLmNtc2VkaXQoeyBuYXZJZCA6IG5hdklkLCB0ZW1wbGF0ZUlkOiBcXCdjbXNhZG1pbi9kZWZhdWx0L2luZGV4XFwnfSlcIj57e3BhdGh9fTwvYT4gaW4ge3tjb250YWluZXJ9fSc7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblx0XG5cdHphYS5kaXJlY3RpdmUoXCJjcmVhdGVGb3JtXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFQScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0ZGF0YSA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2NyZWF0ZWZvcm0uaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxhbmd1YWdlc0RhdGEnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSkge1xuXG5cdFx0XHRcdCRzY29wZS5lcnJvciA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuc3VjY2VzcyA9IGZhbHNlO1xuXG5cdFx0XHRcdCRzY29wZS5jb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZnVuY3Rpb24gaW5pdGlhbGl6ZXIoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnUgPSAkc2NvcGUubWVudURhdGEuaXRlbXM7XG5cdFx0XHRcdFx0JHNjb3BlLm5hdmNvbnRhaW5lcnMgPSAkc2NvcGUubWVudURhdGEuY29udGFpbmVycztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGluaXRpYWxpemVyKCk7XG5cblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID0gMTtcblx0XHRcdFx0JHNjb3BlLmRhdGEucGFyZW50X25hdl9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmlzX2RyYWZ0ID0gMDtcblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlLmRlZmF1bHRfY29udGFpbmVyX2lkO1xuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdGlmIChTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUuZGVmYXVsdF9jb250YWluZXJfaWQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IFNlcnZpY2VMYW5ndWFnZXNEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpMYW5ndWFnZXNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5pc0RlZmF1bHRJdGVtID0gJHNjb3BlLmxhbmd1YWdlc0RhdGEuZmluZChpdGVtID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbS5pc19kZWZhdWx0O1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYW5nX2lkID0gJHNjb3BlLmlzRGVmYXVsdEl0ZW0uaWQ7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5kYXRhLm5hdl9jb250YWluZXJfaWQgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSB1bmRlZmluZWQgJiYgbiAhPT0gbykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEucGFyZW50X25hdl9pZCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5JykoJHNjb3BlLmRhdGEudGl0bGUpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goJ2RhdGEuYWxpYXMnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRcdFx0aWYgKG4hPW8gJiYgbiE9bnVsbCkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5Jykobik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuZXhlYyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHQkc2NvcGUuY29udHJvbGxlci5zYXZlKCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdFx0XHQkc2NvcGUuc3VjY2VzcyA9IHRydWU7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3IgPSBbXTtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLnRpdGxlID0gbnVsbDtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gbnVsbDtcblx0XHRcdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5pc0lubGluZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuJHBhcmVudC4kcGFyZW50LmdldEl0ZW0oJHNjb3BlLmRhdGEubGFuZ19pZCwgJHNjb3BlLmRhdGEubmF2X2lkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsndmlld19pbmRleF9wYWdlX3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVhc29uKSB7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2gocmVhc29uLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKHZhbHVlWzBdKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmVycm9yID0gcmVhc29uO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1dXG5cdFx0fVxuXHR9KTtcblxuXHQvKiogUEFHRSBDUkVBVEUgJiBVUERBVEUgKi9cbiAgICB6YWEuZGlyZWN0aXZlKFwidXBkYXRlRm9ybVBhZ2VcIiwgWydTZXJ2aWNlTGF5b3V0c0RhdGEnLCBmdW5jdGlvbihTZXJ2aWNlTGF5b3V0c0RhdGEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0IDogJ0VBJyxcbiAgICAgICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgICAgICAgIGRhdGEgOiAnPSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybCA6ICd1cGRhdGVmb3JtcGFnZS5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuICAgICAgICAgICAgXHQkc2NvcGUucGFyZW50ID0gJHNjb3BlLiRwYXJlbnQuJHBhcmVudDtcblx0XHRcdFx0JHNjb3BlLm5hdkl0ZW1JZCA9ICRzY29wZS5wYXJlbnQuaXRlbS5pZDtcblxuXG5cdFx0XHRcdCRzY29wZS5kYXRhLmxheW91dF9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS5hcnJheVRvU2VsZWN0ID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlRmllbGQsIGxhYmVsRmllbGQpIHtcblx0XHRcdFx0XHR2YXIgb3V0cHV0ID0gW107XG5cdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goe1wibGFiZWxcIjogdmFsdWVbbGFiZWxGaWVsZF0sIFwidmFsdWVcIjogdmFsdWVbdmFsdWVGaWVsZF19KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRyZXR1cm4gb3V0cHV0O1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGF5b3V0c0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFtdOyAvLyAkc2NvcGUuYXJyYXlUb1NlbGVjdChkYXRhKTsgLy8gQFRPRE8gUkVNT1ZFIElGIFZFUklGSUVEXG5cdFx0XHRcdH0pO1xuXG5cblx0XHRcdFx0JHNjb3BlLnZlcnNpb25zRGF0YSA9IFtdO1xuXG5cdFx0XHRcdCRzY29wZS5nZXRWZXJzaW9uTGlzdCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZS92ZXJzaW9ucycsIHsgcGFyYW1zIDogeyBuYXZJdGVtSWQgOiAkc2NvcGUubmF2SXRlbUlkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUudmVyc2lvbnNEYXRhID0gJHNjb3BlLmFycmF5VG9TZWxlY3QocmVzcG9uc2UuZGF0YSwgJ2lkJywgJ3ZlcnNpb25fYWxpYXMnKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgXHQkc2NvcGUuaXNFZGl0QXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS52ZXJzaW9uc0RhdGEubGVuZ3RoO1xuICAgICAgICAgICAgXHR9O1xuXG5cdFx0XHRcdGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmdldFZlcnNpb25MaXN0KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpbml0KCk7XG4gICAgICAgICAgICB9XVxuICAgICAgICB9XG5cdH1dKTtcblx0emFhLmRpcmVjdGl2ZShcImNyZWF0ZUZvcm1QYWdlXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFQScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0ZGF0YSA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2NyZWF0ZWZvcm1wYWdlLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdTZXJ2aWNlTWVudURhdGEnLCBmdW5jdGlvbigkc2NvcGUsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZU1lbnVEYXRhKSB7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEudXNlX2RyYWZ0ID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEubGF5b3V0X2lkID0gMDtcblx0XHRcdFx0JHNjb3BlLmRhdGEuZnJvbV9kcmFmdF9pZCA9IDA7XG5cblx0XHRcdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgICAgICAgICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICAgICAgICAgICAgXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG4gICAgICAgICAgICBcdH0pO1xuXG4gICAgICAgICAgICBcdC8qIG1lbnVEYXRhICovXG5cbiAgICBcdFx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYXJyYXlUb1NlbGVjdCA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZUZpZWxkLCBsYWJlbEZpZWxkKSB7XG5cdFx0XHRcdFx0dmFyIG91dHB1dCA9IFtdO1xuXHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKHtcImxhYmVsXCI6IHZhbHVlW2xhYmVsRmllbGRdLCBcInZhbHVlXCI6IHZhbHVlW3ZhbHVlRmllbGRdfSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgXHRmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICAgICAgXHRcdCRzY29wZS5kcmFmdHMgPSAkc2NvcGUuYXJyYXlUb1NlbGVjdCgkc2NvcGUubWVudURhdGEuZHJhZnRzLCAnaWQnLCAndGl0bGUnKTtcblx0XHRcdFx0XHQkc2NvcGUubGF5b3V0cyA9ICRzY29wZS5hcnJheVRvU2VsZWN0KCRzY29wZS5sYXlvdXRzRGF0YSwgJ2lkJywgJ25hbWUnKTtcbiAgICAgICAgICAgIFx0fVxuXG4gICAgICAgICAgICBcdGluaXQoKTtcblxuXHRcdFx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS4kcGFyZW50LmV4ZWMoKTtcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qIFBhZ2UgTU9EVUxFICovXG5cblx0emFhLmRpcmVjdGl2ZShcImZvcm1Nb2R1bGVcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0VBJyxcblx0XHRcdHNjb3BlIDoge1xuXHRcdFx0XHRkYXRhIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnZm9ybW1vZHVsZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblxuXHRcdFx0XHQkc2NvcGUubW9kdWxlcyA9IFtdO1xuXHRcdFx0XHQkc2NvcGUuY29udHJvbGxlcnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLnBhcmFtcyA9IHt9O1xuXG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWFkbWluLWNvbW1vbi9kYXRhLW1vZHVsZXMnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1vZHVsZXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuYWRkUGFyYW0gPSBmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0XHRpZiAoISRzY29wZS5kYXRhLmhhc093blByb3BlcnR5KCdhY3Rpb25fcGFyYW1zJykpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFjdGlvbl9wYXJhbXMgPSB7fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0JHNjb3BlLmRhdGEuYWN0aW9uX3BhcmFtc1trZXldID0gJyc7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEubW9kdWxlX25hbWU7XG5cdFx0XHRcdH0sIGZ1bmN0aW9uKG4pIHtcblx0XHRcdFx0XHRpZiAobikge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL21vZHVsZS1jb250cm9sbGVycz9tb2R1bGU9JyArIG4pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXJzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmFjdGlvbnMgPSBbXTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRyZXR1cm4gJHNjb3BlLmRhdGEuY29udHJvbGxlcl9uYW1lO1xuXHRcdFx0XHR9LCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9jb250cm9sbGVyLWFjdGlvbnM/bW9kdWxlPScrJHNjb3BlLmRhdGEubW9kdWxlX25hbWUrJyZjb250cm9sbGVyPScgKyBuKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyogZmlsdGVycyAqL1xuXG5cdHphYS5maWx0ZXIoXCJtZW51d2Vic2l0ZWZpbHRlclwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHdlYnNpdGVJZCkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICh2YWx1ZS53ZWJzaXRlX2lkID09IHdlYnNpdGVJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoXCJtZW51cGFyZW50ZmlsdGVyXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKHZhbHVlLnBhcmVudF9uYXZfaWQgPT0gcGFyZW50TmF2SWQgJiYgdmFsdWUubmF2X2NvbnRhaW5lcl9pZCA9PSBjb250YWluZXJJZCkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH07XG5cdH0pO1xuXG5cdHphYS5maWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCwgY29udGFpbmVySWQsIHBhcmVudE5hdklkKSB7XG5cdFx0XHR2YXIgcmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAoIXJldHVyblZhbHVlKSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmlkID09IHBhcmVudE5hdklkICYmIHZhbHVlLm5hdl9jb250YWluZXJfaWQgPT0gY29udGFpbmVySWQpIHtcblx0XHRcdFx0XHRcdHJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJldHVyblZhbHVlO1xuXHRcdH07XG5cdH0pO1xuXG5cdC8qIGZhY3RvcnkuanMgKi9cblxuXHR6YWEuZmFjdG9yeSgnUGxhY2Vob2xkZXJTZXJ2aWNlJywgZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2UgPSBbXTtcblxuXHRcdHNlcnZpY2Uuc3RhdHVzID0gMTsgLyogMSA9IHNob3dwbGFjZWhvbGRlcnM7IDAgPSBoaWRlIHBsYWNlaG9sZGVycyAqL1xuXG5cdFx0c2VydmljZS5kZWxlZ2F0ZSA9IGZ1bmN0aW9uKHN0YXR1cykge1xuXHRcdFx0c2VydmljZS5zdGF0dXMgPSBzdGF0dXM7XG5cdFx0fTtcblxuXHRcdHJldHVybiBzZXJ2aWNlO1xuXHR9KTtcblxuXHQvKiBsYXlvdXQuanMgKi9cblxuXHR6YWEuY29uZmlnKFsnJHN0YXRlUHJvdmlkZXInLCBmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHRcdCRzdGF0ZVByb3ZpZGVyXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2VkaXRcIiwge1xuXHRcdFx0dXJsIDogXCIvdXBkYXRlLzpuYXZJZFwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS91cGRhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zYWRkXCIsIHtcblx0XHRcdHVybCA6IFwiL2NyZWF0ZVwiLFxuXHRcdFx0dGVtcGxhdGVVcmwgOiAnY21zYWRtaW4vcGFnZS9jcmVhdGUnXG5cdFx0fSlcblx0XHQuc3RhdGUoXCJjdXN0b20uY21zZHJhZnRcIiwge1xuXHRcdFx0dXJsOiAnL2RyYWZ0cycsXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2Ntc2FkbWluL3BhZ2UvZHJhZnRzJ1xuXHRcdH0pO1xuXHR9XSk7XG5cblx0LyogY29udHJvbGxlcnMgKi9cblxuXHR6YWEuY29udHJvbGxlcihcIkRyYWZ0c0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHN0YXRlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24obmF2SWQpIHtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogbmF2SWQgfSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zRGFzaGJvYXJkXCIsIFsnJHNjb3BlJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCkge1xuXHRcdCRzY29wZS5kYXNoYm9hcmQgPSBbXTtcblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vZGFzaGJvYXJkLWxvZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCRzY29wZS5kYXNoYm9hcmQgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXHR9XSk7XG5cdFxuXHR6YWEuY29udHJvbGxlcihcIkNvbmZpZ0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdCRzY29wZS5kYXRhID0ge307XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0JHNjb3BlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJywgJHNjb3BlLmRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19jb25maWdfdXBkYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VWZXJzaW9uc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgU2VydmljZUxheW91dHNEYXRhLCBBZG1pblRvYXN0U2VydmljZSkge1xuXHRcdC8qKlxuXHRcdCAqIEB2YXIgb2JqZWN0ICR0eXBlRGF0YSBGcm9tIHBhcmVudCBzY29wZSBjb250cm9sbGVyIE5hdkl0ZW1Db250cm9sbGVyXG5cdFx0ICogQHZhciBvYmplY3QgJGl0ZW0gRnJvbSBwYXJlbnQgc2NvcGUgY29udHJvbGxlciBOYXZJdGVtQ29udHJvbGxlclxuXHRcdCAqIEB2YXIgc3RyaW5nICR2ZXJzaW9uTmFtZSBGcm9tIG5nLW1vZGVsXG5cdFx0ICogQHZhciBpbnRlZ2VyICRmcm9tVmVyc2lvblBhZ2VJZCBGcm9tIG5nLW1vZGVsIHRoZSB2ZXJzaW9uIGNvcHkgZnJvbSBvciAwID0gbmV3IGVtcHR5L2JsYW5rIHZlcnNpb25cblx0XHQgKiBAdmFyIGludGVnZXIgJHZlcnNpb25MYXlvdXRJZCBGcm9tIG5nLW1vZGVsLCBvbmx5IGlmIGZyb21WZXJzaW9uUGFnZUlkIGlzIDBcbiBcdFx0ICovXG5cdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0LyogbGF5b3V0c0RhdGEgKi9cblxuXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXG4gICAgXHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXG4gICAgXHQvKiBjb250cm9sbGVyIGxvZ2ljICovXG5cblx0XHQkc2NvcGUuY3JlYXRlTmV3VmVyc2lvblN1Ym1pdCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc192ZXJzaW9uX2Vycm9yX2VtcHR5X2ZpZWxkcyddKTtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5jb3B5RXhpc3RpbmdWZXJzaW9uKSB7XG5cdFx0XHRcdGRhdGEudmVyc2lvbkxheW91dElkID0gMDtcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9jcmVhdGUtcGFnZS12ZXJzaW9uJywgJC5wYXJhbSh7J2xheW91dElkJzogZGF0YS52ZXJzaW9uTGF5b3V0SWQsICduYXZJdGVtSWQnOiAkc2NvcGUuaXRlbS5pZCwgJ25hbWUnOiBkYXRhLnZlcnNpb25OYW1lLCAnZnJvbVBhZ2VJZCc6IGRhdGEuZnJvbVZlcnNpb25QYWdlSWR9KSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5lcnJvcikge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3ZlcnNpb25fZXJyb3JfZW1wdHlfZmllbGRzJ10pO1xuXHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfdmVyc2lvbl9jcmVhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNvcHlQYWdlQ29udHJvbGxlclwiLCBbJyRzY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgJGZpbHRlciwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblxuXHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdCRzY29wZS4kb24oJ2RlbGV0ZWROYXZJdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXNPcGVuID0gZmFsc2U7XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbiA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGlvbiA9IDA7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5uYXZJZCA9IDA7XG5cblx0XHQkc2NvcGUuaXRlbXMgPSBudWxsO1xuXG5cdFx0JHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zZWxlY3Rpb24gPSAwO1xuXG5cdFx0JHNjb3BlLnNlbGVjdCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRzY29wZS5zZWxlY3Rpb24gPSBpdGVtLmlkO1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBhbmd1bGFyLmNvcHkoaXRlbSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1TZWxlY3Rpb24udGl0bGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobikge1xuXHRcdFx0XHQkc2NvcGUuYWxpYXNTdWdnZXN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XG5cdFx0XHQkc2NvcGUuaXRlbVNlbGVjdGlvbi5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKSgkc2NvcGUuaXRlbVNlbGVjdGlvbi50aXRsZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkSXRlbXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5uYXZJZCA9ICRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5OYXZDb250cm9sbGVyLm5hdkRhdGEuaWQ7XG5cblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZmluZC1uYXYtaXRlbXMnLCB7IHBhcmFtczogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbXMgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHQkc2NvcGUuaXNPcGVuID0gdHJ1ZTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb25bJ3RvTGFuZ0lkJ10gPSAkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIubGFuZy5pZDtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1mcm9tLXBhZ2UnLCAkLnBhcmFtKCRzY29wZS5pdGVtU2VsZWN0aW9uKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfYWRkZWRfdHJhbnNsYXRpb25fb2snXSk7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLnJlZnJlc2goKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc19hZGRlZF90cmFuc2xhdGlvbl9lcnJvciddKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNNZW51VHJlZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHJvb3RTY29wZScsICckc3RhdGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRzdGF0ZSwgJGh0dHAsICRmaWx0ZXIsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgU2VydmljZUN1cnJlbnRXZWJzaXRlKSB7XG5cblx0XHQvLyBsaXZlIGVkaXQgc2VydmljZVxuXG5cdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSAwO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnbGl2ZUVkaXRTdGF0ZVRvZ2dsZXInLCBmdW5jdGlvbihuKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29uZmlnJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkcm9vdFNjb3BlLmNtc0NvbmZpZyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5sb2FkQ21zQ29uZmlnKCk7XG5cdFx0XG5cdFx0Ly8gbWVudSBEYXRhXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHR9O1xuXG5cdFx0Ly8gQ29udGFpbnMgdGhlIGN1cnJlbnQgd2Vic2l0ZSBpZCwgaXMgaW5pdGlhbGl6ZWQgd2l0aCBmYWxzZSBhcyB2YWx1ZVxuXHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZVRvZ2dsZXIgPSBmYWxzZVxuXG5cdFx0JHNjb3BlLiR3YXRjaCgnY3VycmVudFdlYnNpdGVUb2dnbGVyJywgZnVuY3Rpb24obmV3VmFsdWUsIG9sZFZhbHVlKSB7XG5cdFx0XHRpZiAobmV3VmFsdWUgJiYgbmV3VmFsdWUgIT09IG9sZFZhbHVlKSB7XG5cdFx0XHRcdFNlcnZpY2VDdXJyZW50V2Vic2l0ZS50b2dnbGUobmV3VmFsdWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gaW5pdGlhbGl6ZSB0aGUgc3RhdGUgb2YgdGhlIGN1cnJlbnQgbWVudSBzZXJ2aWNlXG5cdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlXG5cblx0XHQvLyBpZiB0aGUgc3RhdGUgaGFzIHJlY2l2ZWQgYSB2YWx1ZSwgYWZ0ZXIgdGhlIHNlcnZpY2UgZXZlbnQgaGFzIGJlZW4gdHJpZ2dlcmVkLCB0aGlzIGVuc3VyZXNcblx0XHQvLyB0aGUgY3VycmVudCB3ZWJzaXRlIGlzIGRpc3BsYXllZC4gTGlrZSBhIGxhenkgbG9hZCBlbnN1cmFuY2Vcblx0XHRpZiAoJHNjb3BlLmN1cnJlbnRXZWJzaXRlKSB7XG5cdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGVUb2dnbGVyID0gJHNjb3BlLmN1cnJlbnRXZWJzaXRlLmlkXG5cdFx0fVxuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gZGF0YTtcblx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZVRvZ2dsZXIgPSBkYXRhLmlkO1xuXHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQoKTtcblx0XHR9KTtcblxuXHRcdC8vIGNvbnRyb2xsZXIgbG9naWNcblx0XHRcblx0XHQkc2NvcGUuZHJvcEVtcHR5Q29udGFpbmVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uLGNhdElkKSB7XG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNvbnRhaW5lcicsIHsgcGFyYW1zOiB7bW92ZUl0ZW1JZDogZHJhZ2dlZC5pZCwgZHJvcHBlZE9uQ2F0SWQ6IGNhdElkfX0pLnRoZW4oZnVuY3Rpb24oc3VjY2VzKSB7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUuZHJvcEl0ZW0gPSBmdW5jdGlvbihkcmFnLGRyb3AscG9zKSB7XG5cdFx0XHRpZiAocG9zID09ICdib3R0b20nKSB7XG5cdFx0XHRcdHZhciBhcGkgPSAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtYWZ0ZXInO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRBZnRlckl0ZW1JZDogZHJvcC5pZH07XG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAndG9wJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWJlZm9yZSc7XG5cdFx0XHRcdHZhciBwYXJhbXMgPSB7bW92ZUl0ZW1JZDogZHJhZy5pZCwgZHJvcHBlZEJlZm9yZUl0ZW1JZDogZHJvcC5pZH07XG5cblx0XHRcdH0gZWxzZSBpZiAocG9zID09ICdtaWRkbGUnKSB7XG5cdFx0XHRcdHZhciBhcGkgPSAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL21vdmUtdG8tY2hpbGQnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRPbkl0ZW1JZDogZHJvcC5pZH07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCRodHRwLmdldChhcGksIHsgcGFyYW1zIDogcGFyYW1zIH0pLnRoZW4oZnVuY3Rpb24oc3VjY2Vzcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0sIGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUudmFsaWRJdGVtID0gZnVuY3Rpb24oaG92ZXIsIGRyYWdlZCkge1xuXHRcdFx0XG5cdFx0XHRpZiAoaG92ZXIuaWQgPT0gZHJhZ2VkLmlkKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0JHNjb3BlLnJyaXRlbXMgPSBbXTtcblx0XHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eShkcmFnZWQubmF2X2NvbnRhaW5lcl9pZCwgZHJhZ2VkLmlkKTtcblx0XHRcdFxuXHRcdFx0aWYgKCRzY29wZS5ycml0ZW1zLmluZGV4T2YoaG92ZXIuaWQpID09IC0xKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUucnJpdGVtcyA9IFtdO1xuXHRcdFxuXHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eSA9IGZ1bmN0aW9uKGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCkge1xuXHRcdFx0dmFyIGl0ZW1zID0gJGZpbHRlcignbWVudXBhcmVudGZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0XHRcdFxuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGl0ZW1zLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdCRzY29wZS5ycml0ZW1zLnB1c2goaXRlbS5pZCk7XG5cdFx0XHRcdCRzY29wZS5yZWN1cnNpdkl0ZW1WYWxpZGl0eShjb250YWluZXJJZCwgaXRlbS5pZCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUl0ZW0gPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YS50b2dnbGVfb3BlbiA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0ZGF0YVsndG9nZ2xlX29wZW4nXSA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkYXRhWyd0b2dnbGVfb3BlbiddID0gIWRhdGEudG9nZ2xlX29wZW47XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3RyZWUtaGlzdG9yeScsIHtkYXRhOiBkYXRhfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblxuXHRcdH07XG5cblx0XHQkc2NvcGUuZ28gPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybChkYXRhLm5hdl9pdGVtX2lkLCAwKTtcblx0XHRcdCRzdGF0ZS5nbygnY3VzdG9tLmNtc2VkaXQnLCB7IG5hdklkIDogZGF0YS5pZCB9KTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5zaG93RHJhZyA9IDA7XG5cblx0ICAgICRzY29wZS5pc0N1cnJlbnRFbGVtZW50ID0gZnVuY3Rpb24oZGF0YSkge1xuXHQgICAgXHRpZiAoZGF0YSAhPT0gbnVsbCAmJiAkc3RhdGUucGFyYW1zLm5hdklkID09IGRhdGEuaWQpIHtcblx0ICAgIFx0XHRyZXR1cm4gdHJ1ZTtcblx0ICAgIFx0fVxuXG5cdCAgICBcdHJldHVybiBmYWxzZTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5oaWRkZW5DYXRzID0gW107XG5cblx0ICAgICRzY29wZS4kd2F0Y2goJ21lbnVEYXRhJywgZnVuY3Rpb24gKG4sIG8pIHtcblx0ICAgIFx0JHNjb3BlLmhpZGRlbkNhdHMgPSBuLmhpZGRlbkNhdHM7XG5cdCAgICB9KTtcblxuXHRcdCRzY29wZS50b2dnbGVDYXQgPSBmdW5jdGlvbihjYXRJZCkge1xuXHRcdFx0aWYgKGNhdElkIGluICRzY29wZS5oaWRkZW5DYXRzKSB7XG5cdFx0XHRcdCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9ICEkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPSAxO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9zYXZlLWNhdC10b2dnbGUnLCB7Y2F0SWQ6IGNhdElkLCBzdGF0ZTogJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdfSwge2lnbm9yZUxvYWRpbmdCYXI6IHRydWV9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUlzSGlkZGVuID0gZnVuY3Rpb24oY2F0SWQpIHtcblxuXHRcdFx0aWYgKCRzY29wZS5oaWRkZW5DYXRzID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjYXRJZCBpbiAkc2NvcGUuaGlkZGVuQ2F0cykge1xuXHRcdFx0XHRpZiAoJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID09IDEpIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fTtcblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNhZG1pbkNyZWF0ZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHEnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRxLCAkaHR0cCkge1xuXG5cdFx0JHNjb3BlLmRhdGEgPSB7fTtcblx0XHQkc2NvcGUuZGF0YS5pc0lubGluZSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1wYWdlJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDIpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtbW9kdWxlJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDMpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcmVkaXJlY3QnLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDbXNhZG1pbkNyZWF0ZUlubGluZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJHEnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRxLCAkaHR0cCkge1xuXG5cdFx0JHNjb3BlLmRhdGEgPSB7XG5cdFx0XHRuYXZfaWQgOiAkc2NvcGUuJHBhcmVudC5OYXZDb250cm9sbGVyLmlkXG5cdFx0fTtcblxuXHRcdCRzY29wZS5kYXRhLmlzSW5saW5lID0gdHJ1ZTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdCRzY29wZS5kYXRhLmxhbmdfaWQgPSAkc2NvcGUubGFuZy5pZDtcblxuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXG5cdFx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1wYWdlLWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMikge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1tb2R1bGUtaXRlbScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAzKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXJlZGlyZWN0LWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJOYXZDb250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJGZpbHRlcicsICckc3RhdGUnLCAnJHN0YXRlUGFyYW1zJywgJyRodHRwJywgJ1BsYWNlaG9sZGVyU2VydmljZScsICdTZXJ2aWNlUHJvcGVydGllc0RhdGEnLCAnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VMYW5ndWFnZXNEYXRhJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnQWRtaW5MYW5nU2VydmljZScsICdIdG1sU3RvcmFnZScsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkZmlsdGVyLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgJGh0dHAsIFBsYWNlaG9sZGVyU2VydmljZSwgU2VydmljZVByb3BlcnRpZXNEYXRhLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMYW5ndWFnZXNEYXRhLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBBZG1pblRvYXN0U2VydmljZSwgQWRtaW5DbGFzc1NlcnZpY2UsIEFkbWluTGFuZ1NlcnZpY2UsIEh0bWxTdG9yYWdlKSB7XG5cblxuXHRcdCRzY29wZS5wYWdlU2V0dGluZ3NPdmVybGF5SGlkZGVuID0gdHJ1ZTtcblx0XHRcblx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheVRhYiA9IDE7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkgPSBmdW5jdGlvbih0KSB7XG5cdFx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheVRhYiA9IHQ7XG5cdFx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbiA9ICEkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbjtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5uYXZDZmcgPSB7XG5cdFx0XHRoZWxwdGFnczogJHJvb3RTY29wZS5sdXlhY2ZnLmhlbHB0YWdzLFxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmRpc3BsYXlMaXZlQ29udGFpbmVyID0gbjtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS51cmwgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmxpdmVVcmwgPSBuO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS5BZG1pbkxhbmdTZXJ2aWNlID0gQWRtaW5MYW5nU2VydmljZTtcblxuXHRcdC8qIHNlcnZpY2UgQWRtaW5Qcm9wZXJ0eVNlcnZpY2UgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5wcm9wZXJ0aWVzRGF0YSA9IFNlcnZpY2VQcm9wZXJ0aWVzRGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpQcm9wZXJ0aWVzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUucHJvcGVydGllc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0Lyogc2VydmljZSBTZXJ2aWNlTWVudURhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZUxhbmdhdWdlc0RhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5sYW5ndWFnZXNEYXRhID0gU2VydmljZUxhbmd1YWdlc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGFuZ3VhZ2VzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IGRhdGE7XG5cdFx0fSk7XG5cblx0XHQvKiBwbGFjZWhvbGRlcnMgdG9nZ2xlciBzZXJ2aWNlICovXG5cblx0XHQkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlID0gUGxhY2Vob2xkZXJTZXJ2aWNlO1xuXG5cdFx0JHNjb3BlLnBsYWNlaG9sZGVyU3RhdGUgPSAkc2NvcGUuUGxhY2Vob2xkZXJTZXJ2aWNlLnN0YXR1cztcblxuXHRcdCRzY29wZS4kd2F0Y2goJ3BsYWNlaG9sZGVyU3RhdGUnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0JHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZS5kZWxlZ2F0ZShuKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8qIEJsb2NraG9sZGVyIHNpemUgdG9nZ2xlciAqL1xuXG4gICAgICAgICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwgPSBIdG1sU3RvcmFnZS5nZXRWYWx1ZSgnYmxvY2tob2xkZXJUb2dnbGVTdGF0ZScsIHRydWUpO1xuXG4gICAgICAgICRzY29wZS50b2dnbGVCbG9ja2hvbGRlclNpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwgPSAhJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbDtcbiAgICAgICAgICAgIEh0bWxTdG9yYWdlLnNldFZhbHVlKCdibG9ja2hvbGRlclRvZ2dsZVN0YXRlJywgJHNjb3BlLmlzQmxvY2tob2xkZXJTbWFsbCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyogc2lkZWJhciBsb2dpYyAqL1xuXG5cdFx0JHNjb3BlLnNpZGViYXIgPSBmYWxzZTtcblxuXHQgICAgJHNjb3BlLmVuYWJsZVNpZGViYXIgPSBmdW5jdGlvbigpIHtcblx0ICAgIFx0JHNjb3BlLnNpZGViYXIgPSB0cnVlO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLnRvZ2dsZVNpZGViYXIgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAkc2NvcGUuc2lkZWJhciA9ICEkc2NvcGUuc2lkZWJhcjtcblx0ICAgIH07XG5cblx0XHQvKiBhcHAgbG9naWMgKi9cblxuXHQgICAgJHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblxuXHRcdCRzY29wZS5pZCA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5uYXZJZCk7XG5cblx0XHQkc2NvcGUuaXNEZWxldGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuQWRtaW5DbGFzc1NlcnZpY2UgPSBBZG1pbkNsYXNzU2VydmljZTtcblxuXHRcdCRzY29wZS5wcm9wVmFsdWVzID0ge307XG5cblx0XHQkc2NvcGUuaGFzVmFsdWVzID0gZmFsc2U7XG5cblx0XHQkc2NvcGUucGFnZVRhZ3MgPSBbXTtcblxuXHRcdCRzY29wZS5idWJibGVQYXJlbnRzID0gZnVuY3Rpb24ocGFyZW50TmF2SWQsIGNvbnRhaW5lcklkKSB7XG5cdCAgICBcdHZhciBpdGVtID0gJGZpbHRlcignbWVudWNoaWxkZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCBjb250YWluZXJJZCwgcGFyZW50TmF2SWQpO1xuXHQgICAgXHRpZiAoaXRlbSkge1xuXHQgICAgXHRcdGl0ZW0udG9nZ2xlX29wZW4gPSAxO1xuXHQgICAgXHRcdCRzY29wZS5idWJibGVQYXJlbnRzKGl0ZW0ucGFyZW50X25hdl9pZCwgaXRlbS5uYXZfY29udGFpbmVyX2lkKTtcblx0ICAgIFx0fVxuXHQgICAgfTtcblxuXHRcdCRzY29wZS5jcmVhdGVEZWVwUGFnZUNvcHkgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2RlZXAtcGFnZS1jb3B5Jywge25hdklkOiAkc2NvcGUuaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfY3JlYXRlX2NvcHlfc3VjY2VzcyddKTtcblx0XHRcdFx0JHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnBhZ2VUYWdzID0gW107XG5cblx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2LycgKyAkc2NvcGUuaWQgKyAnL3RhZ3MnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0JHNjb3BlLnBhZ2VUYWdzLnB1c2godmFsdWUuaWQpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuc2F2ZVBhZ2VUYWdzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi8nICsgJHNjb3BlLmlkICsgJy90YWdzJywgJHNjb3BlLnBhZ2VUYWdzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfY29uZmlnX3VwZGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuY3JlYXRlRGVlcFBhZ2VDb3B5QXNUZW1wbGF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVlcC1wYWdlLWNvcHktYXMtdGVtcGxhdGUnLCB7bmF2SWQ6ICRzY29wZS5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9jcmVhdGVfY29weV9hc190ZW1wbGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHQkc2NvcGUuc2hvd0FjdGlvbnMgPSAxO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY3VzdG9tLmNtc2RyYWZ0Jyk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi9nZXQtcHJvcGVydGllcycsIHsgcGFyYW1zOiB7bmF2SWQ6ICRzY29wZS5pZH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGZvcih2YXIgaSBpbiByZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0dmFyIGQgPSByZXNwb25zZS5kYXRhW2ldO1xuXHRcdFx0XHRcdCRzY29wZS5wcm9wVmFsdWVzW2QuYWRtaW5fcHJvcF9pZF0gPSBkLnZhbHVlO1xuXHRcdFx0XHRcdCRzY29wZS5oYXNWYWx1ZXMgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZVByb3BNYXNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gISRzY29wZS5zaG93UHJvcEZvcm07XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zaG93UHJvcEZvcm0gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zdG9yZVByb3BWYWx1ZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3NhdmUtcHJvcGVydGllcz9uYXZJZD0nKyRzY29wZS5pZCwgJC5wYXJhbSgkc2NvcGUucHJvcFZhbHVlcyksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX3Byb3BlcnR5X3JlZnJlc2gnXSk7XG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXHRcdFx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gZmFsc2U7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRyYXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZGVsZXRlJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLmlkIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0XHQkc2NvcGUuaXNEZWxldGVkID0gdHJ1ZTtcblx0ICAgIFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdCAgICBcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHQgICAgXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHQgICAgXHRcdFx0fSk7XG5cdCAgICBcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRpZiAocmVzcG9uc2Uuc3RhdHVzID09IDQxNykge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuaXNEcmFmdCA9IGZhbHNlO1xuXG5cdCAgICAkc2NvcGUuc3VibWl0TmF2Rm9ybSA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0ICAgIFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvdXBkYXRlP2lkPScgKyAkc2NvcGUubmF2RGF0YS5pZCwgZGF0YSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19wYWdlX3VwZGF0ZV9sYXlvdXRfc2F2ZV9zdWNjZXNzJykpO1xuXHQgICAgXHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdCAgICBcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdCAgICBcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdCAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZS5tZXNzYWdlKTtcblx0ICAgIFx0XHR9KTtcblx0ICAgIFx0fSk7XG5cdCAgICB9O1xuXG5cdCAgICBmdW5jdGlvbiBpbml0aWFsaXplcigpIHtcblx0XHRcdCRzY29wZS5uYXZEYXRhID0gJGZpbHRlcignZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhLml0ZW1zLCB7aWQ6ICRzY29wZS5pZH0sIHRydWUpWzBdO1xuXHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhID09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkc2NvcGUuaXNEcmFmdCA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCRzY29wZS5sb2FkTmF2UHJvcGVydGllcygpO1xuXG5cdFx0XHRcdC8qIHByb3BlcnRpZXMgLS0+ICovXG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfb2ZmbGluZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQgICAgXHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdCAgICBcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtb2ZmbGluZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgb2ZmbGluZVN0YXR1cyA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5uYXZEYXRhLmlzX29mZmxpbmUgPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9vZmZsaW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfb25saW5lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0ICAgIFx0XHR9KTtcblx0XHRcdCAgICBcdH1cblx0XHRcdCAgICB9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaGlkZGVuJywgeyBwYXJhbXMgOiB7IG5hdklkIDogJHNjb3BlLm5hdkRhdGEuaWQgLCBoaWRkZW5TdGF0dXMgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19oaWRkZW4gPT0gMSkge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV9oaWRkZW4nLCB7dGl0bGU6ICRzY29wZS5uYXZEYXRhLnRpdGxlfSkpO1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19zdGF0ZV92aXNpYmxlJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0ICAgICRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUubmF2RGF0YS5pc19ob21lIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCAgICBcdGlmIChuICE9PSBvICYmIG4gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi90b2dnbGUtaG9tZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgaG9tZVN0YXRlIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19ob21lID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19zdGF0ZV9pc19ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3N0YXRlX2lzX25vdF9ob21lJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdCAgICBcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0XHRpbml0aWFsaXplcigpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUubGFuZyBmcm9tIG5nLXJlcGVhdFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJOYXZJdGVtQ29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckcm9vdFNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnJHRpbWVvdXQnLCAnU2VydmljZU1lbnVEYXRhJywgJ0FkbWluTGFuZ1NlcnZpY2UnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUxpdmVFZGl0TW9kZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbicsXG5cdFx0ZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkaHR0cCwgJGZpbHRlciwgJHRpbWVvdXQsIFNlcnZpY2VNZW51RGF0YSwgQWRtaW5MYW5nU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvbikge1xuXG5cdFx0JHNjb3BlLmxvYWRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUub3BlbkxpdmVVcmwgPSBmdW5jdGlvbihpZCwgdmVyc2lvbklkKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybChpZCwgdmVyc2lvbklkKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmxvYWRMaXZlVXJsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlTGl2ZUVkaXRNb2RlLmNoYW5nZVVybCgkc2NvcGUuaXRlbS5pZCwgJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbik7XG5cdFx0fTtcblxuXHRcdC8vIGxheW91dHNEYXRhXG5cblx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICBcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbiAgICBcdH0pO1xuXHRcdFxuXHRcdC8vIHNlcnZpY2VNZW51RGF0YSBpbmhlcml0YW5jZVxuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TG9hZExhbmd1YWdlJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdGlmICghJHNjb3BlLmxvYWRlZCkge1xuXHRcdFx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gcHJvcGVydGllczpcblxuXHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5pdGVtID0gW107XG5cblx0XHQkc2NvcGUuaXRlbUNvcHkgPSBbXTtcblxuXHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IFtdO1xuXG5cdFx0JHNjb3BlLnR5cGVEYXRhID0gW107XG5cblx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cblx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cblx0XHQkc2NvcGUuaG9tZVVybCA9ICRyb290U2NvcGUubHV5YWNmZy5ob21lVXJsO1xuXG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XG5cdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzO1xuXG5cdFx0JHNjb3BlLnRyYXNoSXRlbSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5sYW5nLmlzX2RlZmF1bHQgPT0gMCkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5jb25maXJtKGkxOG5bJ2pzX3BhZ2VfY29uZmlybV9kZWxldGUnXSwgaTE4blsnY21zYWRtaW5fc2V0dGluZ3NfdHJhc2hwYWdlX3RpdGxlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdFx0JGh0dHAuZGVsZXRlKCdhZG1pbi9hcGktY21zLW5hdml0ZW0vZGVsZXRlP25hdkl0ZW1JZD0nICsgJHNjb3BlLml0ZW0uaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW0gPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLml0ZW1Db3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zZXR0aW5ncyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS50eXBlRGF0YSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5lcnJvcnMgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IDA7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS4kYnJvYWRjYXN0KCdkZWxldGVkTmF2SXRlbScpO1xuXHRcdFx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHQgICAgXHRcdFx0fSk7XG5cdFx0ICAgIFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfcGFnZV9kZWxldGVfZXJyb3JfY2F1c2VfcmVkaXJlY3RzJ10pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XSk7XG5cdFx0XHR9XG5cdCAgICB9O1xuXG5cdFx0JHNjb3BlLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuaXRlbUNvcHkgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLml0ZW0pO1xuXHRcdFx0aWYgKCRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGFDb3B5ID0gYW5ndWxhci5jb3B5KHsnbmF2X2l0ZW1fdHlwZV9pZCcgOiAkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlX2lkIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IGFuZ3VsYXIuY29weSgkc2NvcGUudHlwZURhdGEpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUudXBkYXRlTmF2SXRlbURhdGEgPSBmdW5jdGlvbihpdGVtQ29weSwgdHlwZURhdGFDb3B5KSB7XG5cdFx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cdFx0XHR2YXIgbmF2SXRlbUlkID0gaXRlbUNvcHkuaWQ7XG5cblx0XHRcdHR5cGVEYXRhQ29weS50aXRsZSA9IGl0ZW1Db3B5LnRpdGxlO1xuXHRcdFx0dHlwZURhdGFDb3B5LmFsaWFzID0gaXRlbUNvcHkuYWxpYXM7XG5cdFx0XHR0eXBlRGF0YUNvcHkudGl0bGVfdGFnID0gaXRlbUNvcHkudGl0bGVfdGFnO1xuXHRcdFx0dHlwZURhdGFDb3B5LmRlc2NyaXB0aW9uID0gaXRlbUNvcHkuZGVzY3JpcHRpb247XG5cdFx0XHR0eXBlRGF0YUNvcHkua2V5d29yZHMgPSBpdGVtQ29weS5rZXl3b3Jkcztcblx0XHRcdHR5cGVEYXRhQ29weS50aW1lc3RhbXBfY3JlYXRlID0gaXRlbUNvcHkudGltZXN0YW1wX2NyZWF0ZTtcblx0XHRcdHR5cGVEYXRhQ29weS5pbWFnZV9pZCA9IGl0ZW1Db3B5LmltYWdlX2lkO1xuXHRcdFx0dHlwZURhdGFDb3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCA9IGl0ZW1Db3B5LmlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZDtcblx0XHRcdHR5cGVEYXRhQ29weS5pc19jYWNoZWFibGUgPSBpdGVtQ29weS5pc19jYWNoZWFibGU7XG5cdFx0XHQkaHR0cC5wb3N0KFxuXHRcdFx0XHQnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3VwZGF0ZS1wYWdlLWl0ZW0/bmF2SXRlbUlkPScgKyBuYXZJdGVtSWQgKyAnJm5hdkl0ZW1UeXBlPScgKyBpdGVtQ29weS5uYXZfaXRlbV90eXBlLFxuXHRcdFx0XHQkLnBhcmFtKHR5cGVEYXRhQ29weSksXG5cdFx0XHRcdGhlYWRlcnNcblx0XHRcdCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSAhPT0gMSkge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSBmYWxzZTtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHQvKiBzd2l0Y2ggdmVyc2lvbiBpZiB0eXBlIGlzIHBhZ2UgKi9cblx0XHRcdFx0XHRpZiAoaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSA9PSAxICYmIHR5cGVvZiByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRcdFx0LyogY2hvb3NlIGdpdmVuIHZlcnNpb24gb3IgY2hvb3NlIGZpcnN0IGF2YWlsYWJsZSB2ZXJzaW9uICovXG5cdFx0XHRcdFx0XHR2YXIgcGFnZVZlcnNpb25LZXkgPSByZXNwb25zZS5kYXRhWydpdGVtJ10ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdGlmIChwYWdlVmVyc2lvbktleSA9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdHBhZ2VWZXJzaW9uS2V5ID0gT2JqZWN0LmtleXMocmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXSlbMF07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXVtwYWdlVmVyc2lvbktleV1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddW3BhZ2VWZXJzaW9uS2V5XVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHBhZ2VWZXJzaW9uS2V5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9pdGVtX3VwZGF0ZV9vaycsIHsndGl0bGUnOiBpdGVtQ29weS50aXRsZX0pKTtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCk7XG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHR9LCBmdW5jdGlvbiBlcnJvckNhbGxiYWNrKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaXRlbS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnaXRlbUNvcHkuYWxpYXMnLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiE9byAmJiBuIT1udWxsKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtQ29weS5hbGlhcyA9ICRmaWx0ZXIoJ3NsdWdpZnknKShuKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdCRzY29wZS5yZW1vdmVWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm0nLCB7YWxpYXM6IHZlcnNpb24udmVyc2lvbl9hbGlhc30pLCBpMThuWydjbXNhZG1pbl92ZXJzaW9uX3JlbW92ZSddLCBbJyR0b2FzdCcsICckaHR0cCcsIGZ1bmN0aW9uKCR0b2FzdCwgJGh0dHApIHtcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbW92ZS1wYWdlLXZlcnNpb24nLCB7cGFnZUlkIDogdmVyc2lvbi5pZH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3ZlcnNpb25fZGVsZXRlX2NvbmZpcm1fc3VjY2VzcycsIHthbGlhczogdmVyc2lvbi52ZXJzaW9uX2FsaWFzfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXHRcdFxuICAgIFx0JHNjb3BlLmVkaXRWZXJzaW9uSXRlbTtcbiAgICBcdFxuICAgIFx0JHNjb3BlLnRhYiA9IDE7XG4gICAgXHRcbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb25JdGVtKSB7XG4gICAgXHRcdCRzY29wZS5jaGFuZ2VUYWIoNCk7XG4gICAgXHRcdCRzY29wZS5lZGl0VmVyc2lvbkl0ZW0gPSB2ZXJzaW9uSXRlbTtcbiAgICBcdH07XG5cbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvblVwZGF0ZSA9IGZ1bmN0aW9uKGVkaXRWZXJzaW9uSXRlbSkge1xuICAgIFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vY2hhbmdlLXBhZ2UtdmVyc2lvbi1sYXlvdXQnLCB7J3BhZ2VJdGVtSWQnOiBlZGl0VmVyc2lvbkl0ZW0uaWQsICdsYXlvdXRJZCc6IGVkaXRWZXJzaW9uSXRlbS5sYXlvdXRfaWQsICdhbGlhcyc6IGVkaXRWZXJzaW9uSXRlbS52ZXJzaW9uX2FsaWFzfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcbiAgICBcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3ZlcnNpb25fdXBkYXRlX3N1Y2Nlc3MnXSk7XG4gICAgXHRcdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSk7XG4gICAgXHR9O1xuICAgIFx0XG5cdFx0JHNjb3BlLmdldEl0ZW0gPSBmdW5jdGlvbihsYW5nSWQsIG5hdklkKSB7XG5cdFx0XHQkaHR0cCh7XG5cdFx0XHQgICAgdXJsOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL25hdi1sYW5nLWl0ZW0nLFxuXHRcdFx0ICAgIG1ldGhvZDogXCJHRVRcIixcblx0XHRcdCAgICBwYXJhbXM6IHsgbGFuZ0lkIDogbGFuZ0lkLCBuYXZJZCA6IG5hdklkIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLml0ZW0gPSByZXNwb25zZS5kYXRhWydpdGVtJ107XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YSA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ107XG5cdFx0XHRcdCRzY29wZS5pc1RyYW5zbGF0ZWQgPSB0cnVlO1xuXHRcdFx0XHQkc2NvcGUucmVzZXQoKTtcblx0XHRcdFx0XG5cdFx0XHRcdGlmICghcmVzcG9uc2UuZGF0YVsnbmF2J10uaXNfZHJhZnQpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2Q29udHJvbGxlci5idWJibGVQYXJlbnRzKCRzY29wZS5OYXZDb250cm9sbGVyLm5hdkRhdGEucGFyZW50X25hdl9pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIubmF2RGF0YS5uYXZfY29udGFpbmVyX2lkKTtcblx0XHRcdFx0XHRpZiAoJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZSA9PSAxKSB7XG5cblx0XHRcdFx0XHRcdHZhciBsYXN0VmVyc2lvbiA9IFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24uaGFzVmVyc2lvbigkc2NvcGUuaXRlbS5pZCk7XG5cblx0XHRcdFx0XHRcdGlmIChsYXN0VmVyc2lvbikge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3dpdGNoVmVyc2lvbihsYXN0VmVyc2lvbik7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZCBpbiByZXNwb25zZS5kYXRhLnR5cGVEYXRhKSB7XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gJHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdFx0XHRcdFx0XHQkc2NvcGUuY29udGFpbmVyID0gcmVzcG9uc2UuZGF0YS50eXBlRGF0YVskc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gcmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gdHJ1ZVxuXHRcdFx0fSwgZnVuY3Rpb24oZXJyb3IpIHtcblx0XHRcdFx0Ly8gaXRzIGxvYWRlZCwgYnV0IHRoZSBkYXRhIGRvZXMgbm90IGV4aXN0cy5cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IHRydWU7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkgPSBmYWxzZTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlVmVyc2lvbnNEcm9wZG93biA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eSA9ICEkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5O1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnN3aXRjaFZlcnNpb24gPSBmdW5jdGlvbihwYWdlVmVyc2lvbmlkLCB0b2dnbGUpIHtcblx0XHRcdFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24uc3RvcmUoJHNjb3BlLml0ZW0uaWQsIHBhZ2VWZXJzaW9uaWQpO1xuXHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9ICRzY29wZS50eXBlRGF0YVtwYWdlVmVyc2lvbmlkXVsnY29udGVudEFzQXJyYXknXTtcblx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9ICRzY29wZS50eXBlRGF0YVtwYWdlVmVyc2lvbmlkXVsndmVyc2lvbl9hbGlhcyddO1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHBhZ2VWZXJzaW9uaWQ7XG5cdFx0XHQkc2NvcGUubG9hZExpdmVVcmwoKTtcblx0XHRcdGlmICh0b2dnbGUpwqB7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVWZXJzaW9uc0Ryb3Bkb3duKCk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZWZyZXNoRm9yY2UgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5nZXRJdGVtKCRzY29wZS5sYW5nLmlkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5pZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZWZyZXNoID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoQWRtaW5MYW5nU2VydmljZS5pc0luU2VsZWN0aW9uKCRzY29wZS5sYW5nLnNob3J0X2NvZGUpKSB7XG5cdFx0XHRcdCRzY29wZS5nZXRJdGVtKCRzY29wZS5sYW5nLmlkLCAkc2NvcGUuTmF2Q29udHJvbGxlci5pZCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKiBuZXcgc2V0dGluZ3Mgb3ZlcmxheSAqL1xuXHRcdFxuXHRcdCRzY29wZS5zZXR0aW5nc092ZXJsYXlWaXNpYmlsaXR5ID0gdHJ1ZTtcblx0XHRcblx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5ID0gZnVuY3Rpb24odGFiKSB7XG5cdFx0XHQkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSA9ICEkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eTtcblx0XHRcdGlmICh0YWIpIHtcblx0XHRcdFx0JHNjb3BlLnRhYiA9IHRhYjtcblx0XHRcdH1cblx0XHR9XG5cdFx0XG5cdFx0JHNjb3BlLmNoYW5nZVRhYiA9IGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0JHNjb3BlLnRhYiA9IHRhYjtcblx0XHR9XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogUmVmcmVzaCB0aGUgY3VycmVudCBsYXlvdXQgY29udGFpbmVyIGJsb2Nrcy5cblx0XHQgKiBcblx0XHQgKiBBZnRlciBzdWNjZXNzZnVsbCBhcGkgcmVzcG9uc2UgYWxsIGNtcyBsYXlvdXQgYXJlIGZvcmVhY2ggYW5kIHRoZSB2YWx1ZXMgYXJlIHBhc3NlZCB0byByZXZQbGFjZWhvbGRlcnMoKSBtZXRob2QuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQgPSBmdW5jdGlvbihwcmV2SWQsIHBsYWNlaG9sZGVyVmFyKSB7XG5cdFx0XHQkaHR0cCh7XG5cdFx0XHRcdHVybCA6ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vcmVsb2FkLXBsYWNlaG9sZGVyJyxcblx0XHRcdFx0bWV0aG9kIDogJ0dFVCcsXG5cdFx0XHRcdHBhcmFtcyA6IHsgbmF2SXRlbVBhZ2VJZCA6ICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24sIHByZXZJZCA6IHByZXZJZCwgcGxhY2Vob2xkZXJWYXIgOiBwbGFjZWhvbGRlclZhcn1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoJHNjb3BlLml0ZW0uaWQsICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24pO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmNvbnRhaW5lci5fX3BsYWNlaG9sZGVycywgZnVuY3Rpb24ocGxhY2Vob2xkZXIpIHtcblx0XHRcdFx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzKHBsYWNlaG9sZGVyLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSByZXZQbGFjZWhvbGRlcnMgbWV0aG9kIGdvZXMgdHJvdXJnaCB0aGUgbmV3IHJvdy9jb2wgKGdyaWQpIHN5c3RlbSBjb250YWluZXIganNvbiBsYXlvdXQgd2hlcmU6XG5cdFx0ICogXG5cdFx0ICogcm93c1tdWzFdID0gY29sIGxlZnRcblx0XHQgKiByb3dzW11bMl0gPSBjb2wgcmlnaHRcblx0XHQgKiBcblx0XHQgKiBXaGVyZSBhIGxheW91dCBoYXZlIGF0IGxlYXN0IG9uIHJvdyB3aGljaCBjYW4gaGF2ZSBjb2xzIGluc2lkZS4gU28gdGhlcmUgcmV2UGxhY2Vob2xkZXJzIG1ldGhvZCBnb2VzIHRyb3VnaCB0aGUgY29sc1xuXHRcdCAqIGFuZCBjaGVjayBpZiB0aGUgY29sIGlzIGVxdWFsIHRoZSBnaXZlbiBjb2wgdG8gcmVwbGFjZSB0aGUgY29udGVudCB3aXRoICAoZnJvbSByZWZyZXNoTmVzdGVkIG1ldGhvZCkuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyA9IGZ1bmN0aW9uKHBsYWNlaG9sZGVycywgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpIHtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChwbGFjZWhvbGRlcnMsIGZ1bmN0aW9uKHBsYWNlaG9sZGVyUm93LCBwbGFjZWhvbGRlcktleSkge1xuXHRcdFx0XHRpZiAocGFyc2VJbnQocHJldklkKSA9PSBwYXJzZUludChwbGFjZWhvbGRlclJvdy5wcmV2X2lkKSAmJiBwbGFjZWhvbGRlclZhciA9PSBwbGFjZWhvbGRlclJvd1sndmFyJ10pIHtcblx0XHRcdFx0XHRwbGFjZWhvbGRlcnNbcGxhY2Vob2xkZXJLZXldWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXSA9IHJlcGxhY2VDb250ZW50O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCRzY29wZS5yZXZGaW5kKHBsYWNlaG9sZGVyUm93LCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogVGhlIHJldkZpbmQgbWV0aG9kIGRvZXMgdGhlIHJlY3Vyc2l2IGpvYiB3aXRoaW4gYSBibG9jayBhbiBwYXNzZXMgdGhlIHZhbHVlIGJhY2sgdG8gcmV2UGxhY2Vob2xkZXJzKCkuXG5cdFx0ICovXG5cdFx0JHNjb3BlLnJldkZpbmQgPSBmdW5jdGlvbihwbGFjZWhvbGRlciwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpIHtcblx0XHRcdGZvciAodmFyIGkgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddKSB7XG5cdFx0XHRcdGZvciAodmFyIGhvbGRlcktleSBpbiBwbGFjZWhvbGRlclsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ11baV1bJ19fcGxhY2Vob2xkZXJzJ10pIHtcblx0XHRcdFx0XHRmb3IgKHZhciBob2xkZXIgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddW2hvbGRlcktleV0pIHtcblx0XHRcdFx0XHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMocGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddW2hvbGRlcktleV0sIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIGRyb3BzIGl0ZW1zIGluIGFuIGVtcHR5IHBhZ2UgcGxhY2Vob2xkZXIgb2YgQ01TIExBWU9VVCBQTEFDRUhPTERFUlxuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbVBsYWNlaG9sZGVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uKSB7XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7XG5cdFx0XHRcdFx0cHJldl9pZDogZHJvcHBlZC5wcmV2X2lkLCBcblx0XHRcdFx0XHRzb3J0X2luZGV4OjAsIFxuXHRcdFx0XHRcdGJsb2NrX2lkOiBkcmFnZ2VkLmlkLCBcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZChkcm9wcGVkWydwcmV2X2lkJ10sIGRyb3BwZWRbJ3ZhciddKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkKGRyb3BwZWRbJ3ByZXZfaWQnXSwgZHJvcHBlZFsndmFyJ10pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0c29ydF9pbmRleDogMCxcblx0XHRcdFx0XHRwcmV2X2lkOiAgZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWRbJ3ZhciddLCBcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5yZWZyZXNoKCk7XG5cdH1dKTtcblxuXHQvKipcblx0ICogQHBhcmFtICRzY29wZS5ibG9jayBGcm9tIG5nLXJlcGVhdCBzY29wZSBhc3NpZ25tZW50XG5cdCAqL1xuXHR6YWEuY29udHJvbGxlcihcIlBhZ2VCbG9ja0VkaXRDb250cm9sbGVyXCIsIFtcblx0XHQnJHNjb3BlJywgJyRzY2UnLCAnJGh0dHAnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnQWRtaW5Ub2FzdFNlcnZpY2UnLCAnU2VydmljZUJsb2NrQ29weVN0YWNrJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHNjZSwgJGh0dHAsIEFkbWluQ2xhc3NTZXJ2aWNlLCBBZG1pblRvYXN0U2VydmljZSwgU2VydmljZUJsb2NrQ29weVN0YWNrLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlKSB7XG5cblx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0LyoqXG5cdFx0ICogZHJvcHMgYW4gaXRlbSBpbiBhbiBlbXB0eSBwbGFjZWhvbGRlciBvZiBhIEJMT0NLXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtUGxhY2Vob2xkZXIgPSBmdW5jdGlvbihkcmFnZ2VkLGRyb3BwZWQscG9zaXRpb24pIHtcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHtcblx0XHRcdFx0XHRwcmV2X2lkIDogZHJvcHBlZC5wcmV2X2lkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6MCwgXG5cdFx0XHRcdFx0YmxvY2tfaWQgOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhciA6IGRyb3BwZWQudmFyLFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQgOiBkcm9wcGVkLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZC5wcmV2X2lkLCBkcm9wcGVkLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkIDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBEcm9wcyBhIGJsb2NrIGFib3ZlL2JlbG93IGFuIEVYSVNUSU5HIEJMT0NLXG5cdFx0ICovXG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uLGVsZW1lbnQpIHtcblx0XHRcdHZhciBzb3J0SW5kZXggPSAkc2NvcGUuJGluZGV4O1xuXHRcdFx0XG5cdFx0XHRpZiAocG9zaXRpb24gPT0gJ2JvdHRvbScpIHtcblx0XHRcdFx0c29ydEluZGV4ID0gc29ydEluZGV4ICsgMTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywgeyBcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiBzb3J0SW5kZXgsIFxuXHRcdFx0XHRcdGJsb2NrX2lkOiBkcmFnZ2VkLmlkLCBcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKCRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLCAkc2NvcGUucGxhY2Vob2xkZXIudmFyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2UgaWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2NvcHlzdGFjaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIGJsb2NrIGZyb20gY29weSBzdGFja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1ibG9jay9jb3B5LWJsb2NrLWZyb20tc3RhY2snLCB7XG5cdFx0XHRcdFx0Y29weUJsb2NrSWQ6IGRyYWdnZWQuaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4LFxuXHRcdFx0XHRcdHByZXZfaWQ6ICRzY29wZS5wbGFjZWhvbGRlci5wcmV2X2lkLFxuXHRcdFx0XHRcdHBsYWNlaG9sZGVyX3ZhcjogJHNjb3BlLnBsYWNlaG9sZGVyWyd2YXInXSxcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiAkc2NvcGUucGxhY2Vob2xkZXIubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4XG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdCAqIEBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2x1eWFkZXYvbHV5YS9pc3N1ZXMvMTYyOVxuXHRcdFx0XHRcdCAqIFRoZSBtb3ZlZCBibG9jaywgc2hvdWxkIHJlbW92ZWQgZnJvbSB0aGUgcHJldmlvdXMgYXJyYXkuIFRoaXMgaXMgb25seSB0aGUgY2FzZSB3aGVuIGRyYWdnaW5nIGZyb20gYW4gT1VURVIgYmxvY2sgaW50byBhbiBJTk5FUiBibG9ja1xuXHRcdFx0XHRcdCAqIGlzIHRoaXMgd2lsbCBub3QgcmVmcmVzaCB0aGUgT1VURVIgYmxvY2ssIGJ1dCBhbHdheXMgd2lsbCBpbiB0aGUgb3Bwb3NpdGUgd2F5LlxuXHRcdFx0XHRcdCAqL1xuXHRcdFx0XHRcdGFuZ3VsYXIuZWxlbWVudChlbGVtZW50KS5yZW1vdmUoKTtcblx0XHRcdFx0XHQvLyBhcyB0aGUgYmxvY2sgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIGV4aXN0aW5nLCByZWZyZXNoIHRoZSBuZXcgcGxhY2Vob2xkZXIuXG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmNvcHlCbG9jayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUJsb2NrQ29weVN0YWNrLnB1c2goJHNjb3BlLmJsb2NrKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUhpZGRlbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay5pc19oaWRkZW4gPT0gMCkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfaGlkZGVuID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS5ibG9jay5pc19oaWRkZW4gPSAwO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cCh7XG5cdFx0XHQgICAgdXJsOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3RvZ2dsZS1ibG9jay1oaWRkZW4nLFxuXHRcdFx0ICAgIG1ldGhvZDogXCJHRVRcIixcblx0XHRcdCAgICBwYXJhbXM6IHsgYmxvY2tJZCA6ICRzY29wZS5ibG9jay5pZCwgaGlkZGVuU3RhdGU6ICRzY29wZS5ibG9jay5pc19oaWRkZW4gfVxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQvKiBsb2FkIGxpdmUgdXJsIG9uIGhpZGRlbiB0cmlnZ2VyICovXG5cdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLiRwYXJlbnQuJHBhcmVudC5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHQvLyBzdWNjZXNzZnVsbCB0b2dnbGUgaGlkZGVuIHN0YXRlIG9mIGJsb2NrXG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmluZm8oaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX3Zpc2JpbGl0eV9jaGFuZ2UnLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG4gICAgICAgICRzY29wZS5pc0VkaXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICRzY29wZS5ibG9jay52YXJzICE9IFwidW5kZWZpbmVkXCIgJiYgJHNjb3BlLmJsb2NrLnZhcnMubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuaXNDb25maWd1cmFibGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgJHNjb3BlLmJsb2NrLmNmZ3MgIT0gXCJ1bmRlZmluZWRcIiAmJiAkc2NvcGUuYmxvY2suY2Zncy5sZW5ndGggPiAwO1xuICAgICAgICB9O1xuXHRcdFxuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuYmxvY2sudmFsdWVzIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5kYXRhID0gbjtcblx0XHR9KTtcblxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuYmxvY2sudmFyaWF0aW9uIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5KG4pO1xuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS5nZXRJbmZvID0gZnVuY3Rpb24odmFyRmllbGROYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLmZpZWxkX2hlbHAuaGFzT3duUHJvcGVydHkodmFyRmllbGROYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gJHNjb3BlLmJsb2NrLmZpZWxkX2hlbHBbdmFyRmllbGROYW1lXTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdCRzY29wZS5ldmFsVmFyaWF0aW9uVmlzYmlsaXR5ID0gZnVuY3Rpb24odmFyaWF0ZW5OYW1lKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmJsb2NrLnZhcmlhdGlvbnMuaGFzT3duUHJvcGVydHkodmFyaWF0ZW5OYW1lKSkge1xuXHRcdFx0XHR2YXIgdmFyaWF0aW9uID0gJHNjb3BlLmJsb2NrLnZhcmlhdGlvbnNbJHNjb3BlLmJsb2NrLnZhcmlhdGlvbl07XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCh2YXJpYXRpb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRpZiAoYW5ndWxhci5pc09iamVjdCh2YWx1ZSkpIHtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCh2YWx1ZSwgZnVuY3Rpb24odiwgaykge1xuXHRcdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrW2tleV0sIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChrID09IG9iamVjdC52YXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLmNmZ3MsIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2sudmFycywgZnVuY3Rpb24ob2JqZWN0KSB7XG5cdFx0XHRcdFx0b2JqZWN0LmludmlzaWJsZSA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNmZ2RhdGEgPSAkc2NvcGUuYmxvY2suY2ZndmFsdWVzIHx8IHt9O1xuXG5cdFx0JHNjb3BlLmVkaXQgPSBmYWxzZTtcblx0XHRcblx0XHQkc2NvcGUubW9kYWxIaWRkZW4gPSB0cnVlO1xuXG5cdFx0JHNjb3BlLm1vZGFsTW9kZSA9IDE7XG5cblx0XHQkc2NvcGUuaW5pdE1vZGFsTW9kZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay52YXJzLmxlbmd0aCAgPT0gMCkge1xuXHRcdFx0XHQkc2NvcGUubW9kYWxNb2RlID0gMjtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUVkaXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuaXNFZGl0YWJsZSgpIHx8ICRzY29wZS5pc0NvbmZpZ3VyYWJsZSgpKSB7XG5cdFx0XHRcdCRzY29wZS5tb2RhbEhpZGRlbiA9ICEkc2NvcGUubW9kYWxIaWRkZW47XG5cdFx0XHRcdCRzY29wZS5lZGl0ID0gISRzY29wZS5lZGl0O1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUucmVuZGVyVGVtcGxhdGUgPSBmdW5jdGlvbih0ZW1wbGF0ZSwgZGF0YVZhcnMsIGNmZ1ZhcnMsIGJsb2NrLCBleHRyYXMpIHtcblx0XHRcdGlmICh0ZW1wbGF0ZSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuICcnO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHRlbXBsYXRlID0gVHdpZy50d2lnKHtcblx0XHRcdCAgICBkYXRhOiB0ZW1wbGF0ZVxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBjb250ZW50ID0gdGVtcGxhdGUucmVuZGVyKHtcblx0XHRcdFx0dmFycyA6IGRhdGFWYXJzLFxuXHRcdFx0XHRjZmdzIDogY2ZnVmFycyxcblx0XHRcdFx0YmxvY2sgOiBibG9jayxcblx0XHRcdFx0ZXh0cmFzIDogZXh0cmFzXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoY29udGVudCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5yZW1vdmVCbG9jayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfZGVsZXRlX2NvbmZpcm0nLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSwgaTE4blsndmlld191cGRhdGVfYmxvY2tfdG9vbHRpcF9kZWxldGUnXSwgWyckdG9hc3QnLCBmdW5jdGlvbigkdG9hc3QpIHtcblx0XHRcdFx0JGh0dHAuZGVsZXRlKCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2RlbGV0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja19yZW1vdmVfb2snLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuaXNBbnlSZXF1aXJlZEF0dHJpYnV0ZUVtcHR5ID0gIGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgcmVzcG9uc2UgPSBmYWxzZTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2sudmFycywgZnVuY3Rpb24odmFySXRlbSkge1xuXHRcdFx0XHRpZiAodmFySXRlbS5yZXF1aXJlZCAmJiAkc2NvcGUuaXNFbXB0eSgkc2NvcGUuZGF0YSwgdmFySXRlbS52YXIpKSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blBhcmFtKCdqc19ibG9ja19hdHRyaWJ1dGVfZW1wdHknLCB7bGFiZWw6IHZhckl0ZW0ubGFiZWx9KSk7XG5cdFx0XHRcdFx0cmVzcG9uc2UgPSB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay5jZmdzLCBmdW5jdGlvbih2YXJJdGVtKSB7XG5cblx0XHRcdFx0aWYgKHZhckl0ZW0ucmVxdWlyZWQgJiYgJHNjb3BlLmlzRW1wdHkoJHNjb3BlLmNmZ2RhdGEsIHZhckl0ZW0udmFyKSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5QYXJhbSgnanNfYmxvY2tfYXR0cmlidXRlX2VtcHR5Jywge2xhYmVsOiB2YXJJdGVtLmxhYmVsfSkpO1xuXHRcdFx0XHRcdHJlc3BvbnNlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzRW1wdHkgPSBmdW5jdGlvbih2YWx1ZXMsIGtleSkge1xuXHRcdFx0aWYgKHZhbHVlcy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIHZhbHVlc1trZXldKSB7XG5cdFx0XHRcdGlmICh2YWx1ZXNba2V5XS5sZW5ndGggPT0gMCkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0aWYgKCRzY29wZS5pc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkoKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblxuXHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgJHNjb3BlLmJsb2NrLmlkLCB7XG5cdFx0XHRcdGpzb25fY29uZmlnX3ZhbHVlczogJHNjb3BlLmRhdGEsXG5cdFx0XHRcdGpzb25fY29uZmlnX2NmZ192YWx1ZXM6ICRzY29wZS5jZmdkYXRhLFxuXHRcdFx0XHR2YXJpYXRpb246ICRzY29wZS5ibG9jay52YXJpYXRpb25cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfdXBkYXRlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlRWRpdCgpO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfZGlydHkgPSAxO1xuXHRcdFx0XHQkc2NvcGUuYmxvY2sgPSBhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YS5vYmplY3RkZXRhaWwpO1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5sb2FkTGl2ZVVybCgpO1xuXHRcdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSgkc2NvcGUuYmxvY2sudmFyaWF0aW9uKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkRyb3BwYWJsZUJsb2Nrc0NvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnQWRtaW5DbGFzc1NlcnZpY2UnLCAnU2VydmljZUJsb2Nrc0RhdGEnLCAnU2VydmljZUJsb2NrQ29weVN0YWNrJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgQWRtaW5DbGFzc1NlcnZpY2UsIFNlcnZpY2VCbG9ja3NEYXRhLCBTZXJ2aWNlQmxvY2tDb3B5U3RhY2spIHtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZUJsb2Nrc0RhdGEgaW5oZXJpdGFuY2UgKi9cblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhID0gU2VydmljZUJsb2Nrc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYmxvY2tzRGF0YSk7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKHRydWUpO1xuXHRcdH1cblxuXHRcdCRzY29wZS5hZGRUb0ZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG8tZmF2Jywge2Jsb2NrOiBpdGVtIH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGFSZWxvYWQoKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlRnJvbUZhdiA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svcmVtb3ZlLWZhdicsIHtibG9jazogaXRlbSB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnRvZ2dsZUdyb3VwID0gZnVuY3Rpb24oZ3JvdXApIHtcblx0XHRcdGlmIChncm91cC50b2dnbGVfb3BlbiA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Z3JvdXAudG9nZ2xlX29wZW4gPSAhZ3JvdXAudG9nZ2xlX29wZW47XG5cdFx0XHR9XG5cblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtYmxvY2svdG9nZ2xlLWdyb3VwJywge2dyb3VwOiBncm91cH0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc1ByZXZpZXdFbmFibGVkID0gZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0cmV0dXJuIGl0ZW0ucHJldmlld19lbmFibGVkO1xuXHRcdH07XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cblx0XHQkc2NvcGUuY29weVN0YWNrID0gU2VydmljZUJsb2NrQ29weVN0YWNrLnN0YWNrO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpDb3B5U3RhY2snLCBmdW5jdGlvbihldmVudCwgc3RhY2spIHtcblx0XHRcdCRzY29wZS5jb3B5U3RhY2sgPSBzdGFjaztcblx0XHR9KTtcblxuXHRcdCRzY29wZS5jbGVhclN0YWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQmxvY2tDb3B5U3RhY2suY2xlYXIoKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cblx0XHQkc2NvcGUuc2VhcmNoSXNEaXJ0eSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLiR3YXRjaCgnc2VhcmNoUXVlcnknLCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHRpZiAobiAhPT0gJycpIHtcblx0XHRcdFx0JHNjb3BlLnNlYXJjaElzRGlydHkgPSB0cnVlO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2Nrc0RhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUuZ3JvdXAuaXNfZmF2KSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YS5zcGxpY2Uoa2V5LCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFsdWUuZ3JvdXAudG9nZ2xlX29wZW4gPSAxXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmKCRzY29wZS5zZWFyY2hJc0RpcnR5KSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhID0gYW5ndWxhci5jb3B5KCRzY29wZS5ibG9ja3NEYXRhUmVzdG9yZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1dKTtcbn0pKCk7IiwiLyoqXG4gKiBhbGwgZ2xvYmFsIGFkbWluIHNlcnZpY2VzXG4gKiBcbiAqIGNvbnRyb2xsZXIgcmVzb2x2ZTogaHR0cHM6Ly9naXRodWIuY29tL2pvaG5wYXBhL2FuZ3VsYXItc3R5bGVndWlkZSNzdHlsZS15MDgwXG4gKiBcbiAqIFNlcnZpY2UgSW5oZXJpdGFuY2U6XG4gKiBcbiAqIDEuIFNlcnZpY2UgbXVzdCBiZSBwcmVmaXggd2l0aCBTZXJ2aWNlXG4gKiAyLiBTZXJ2aWNlIG11c3QgY29udGFpbiBhIGZvcmNlUmVsb2FkIHN0YXRlXG4gKiAzLiBTZXJ2aWNlIG11c3QgYnJvYWRjYXN0IGFuIGV2ZW50ICdzZXJ2aWNlOkZvbGRlcnNEYXRhJ1xuICogNC4gQ29udHJvbGxlciBpbnRlZ3JhdGlvbiBtdXN0IGxvb2sgbGlrZVxuICogXG4gKiBgYGBcbiAqICRzY29wZS5mb2xkZXJzRGF0YSA9IFNlcnZpY2VGb2xkZXJzRGF0YS5kYXRhO1xuICpcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpGb2xkZXJzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiAgICAgICRzY29wZS5mb2xkZXJzRGF0YSA9IGRhdGE7XG4gKiB9KTtcbiAqXHRcdFx0XHRcbiAqICRzY29wZS5mb2xkZXJzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogICAgIHJldHVybiBTZXJ2aWNlRm9sZGVyc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIGBgYFxuICogXG4gKi9cblx0XG56YWEuY29uZmlnKFsncmVzb2x2ZXJQcm92aWRlcicsIGZ1bmN0aW9uKHJlc29sdmVyUHJvdmlkZXIpIHtcblx0cmVzb2x2ZXJQcm92aWRlci5hZGRDYWxsYmFjayhbJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlQmxvY2tzRGF0YScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgJ0x1eWFMb2FkaW5nJywgZnVuY3Rpb24oU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlQmxvY2tzRGF0YSwgU2VydmljZUxheW91dHNEYXRhLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUsIEx1eWFMb2FkaW5nKSB7XG5cdFx0THV5YUxvYWRpbmcuc3RhcnQoKTtcblx0XHRTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKCk7XG5cdFx0U2VydmljZUxheW91dHNEYXRhLmxvYWQoKTtcblx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCgpLnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRTZXJ2aWNlQ3VycmVudFdlYnNpdGUubG9hZCgpO1xuXHRcdFx0THV5YUxvYWRpbmcuc3RvcCgpO1xuXHRcdH0pO1xuXHR9XSk7XG59XSk7XG5cblxuLyoqXG4gKiBDb3B5IEJsb2NrIFN0YWNrIHNlcnZpY2UuXG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUJsb2NrQ29weVN0YWNrXCIsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uKCRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2Uuc3RhY2sgPSBbXTtcblx0XG5cdHNlcnZpY2UuY2xlYXIgPSBmdW5jdGlvbigpIHtcblx0XHRzZXJ2aWNlLnN0YWNrID0gW107XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkNvcHlTdGFjaycsIHNlcnZpY2Uuc3RhY2spO1xuXHR9O1xuXHRcblx0c2VydmljZS5wdXNoID0gZnVuY3Rpb24oYmxvY2spIHtcblx0XHRpZiAoc2VydmljZS5zdGFjay5sZW5ndGggPiA0KSB7XG5cdFx0XHRzZXJ2aWNlLnN0YWNrLnNoaWZ0KCk7XG5cdFx0fVxuXHRcdHNlcnZpY2Uuc3RhY2sucHVzaCh7YmxvY2tJZDogYmxvY2suYmxvY2tfaWQsIG5hbWU6IGJsb2NrLm5hbWUsIGljb246YmxvY2suaWNvbiwgaWQ6IGJsb2NrLmlkLCBjb3B5c3RhY2s6IDF9KTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q29weVN0YWNrJywgc2VydmljZS5zdGFjayk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBNZW51IFNlcnZpY2UuXG4gKiBcbiAqICRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuICogXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogXHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuICogfSk7XG4gKiBcbiAqICRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogXHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBcdFx0XHRcdFxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VNZW51RGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1tZW51L2RhdGEtbWVudVwiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TWVudURhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBCbG9ja3MgU2VydmljZS5cbiAqIFxuICogXG4gKiAkc2NvcGUuYmxvY2tzRGF0YSA9IFNlcnZpY2VCbG9ja3NEYXRhLmRhdGE7XG4gKiBcdFx0XHRcdFxuICogJHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqIFx0JHNjb3BlLmJsb2Nrc0RhdGEgPSBkYXRhO1xuICogfSk7XG4gKiBcbiAqICRzY29wZS5ibG9ja3NEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gKiBcdHJldHVybiBTZXJ2aWNlQmxvY2tzRGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogXHRcdFx0XHRcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQmxvY2tzRGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXRhLWJsb2Nrc1wiKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0c2VydmljZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6QmxvY2tzRGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIExheW91dHMgU2VydmljZS5cblxuJHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cdFx0XHRcdFxuJHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0JHNjb3BlLmxheW91dHNEYXRhID0gZGF0YTtcbn0pO1xuXG4kc2NvcGUubGF5b3V0c0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIFNlcnZpY2VMYXlvdXRzRGF0YS5sb2FkKHRydWUpO1xufVxuXHRcdFx0XHRcbiovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VMYXlvdXRzRGF0YVwiLCBbJyRodHRwJywgJyRxJywgJyRyb290U2NvcGUnLCBmdW5jdGlvbigkaHR0cCwgJHEsICRyb290U2NvcGUpIHtcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2UuZGF0YSA9IFtdO1xuXHRcblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oZm9yY2VSZWxvYWQpIHtcblx0XHRyZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0XHRpZiAoc2VydmljZS5kYXRhLmxlbmd0aCA+IDAgJiYgZm9yY2VSZWxvYWQgIT09IHRydWUpIHtcblx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JGh0dHAuZ2V0KFwiYWRtaW4vYXBpLWNtcy1hZG1pbi9kYXRhLWxheW91dHNcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkxheW91dHNEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQ01TIExJVkUgRURJVCBTRVJJVkNFXG4gKiBcbiAqICRzY29wZS5saXZlRWRpdE1vZGUgPSBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlXG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUxpdmVFZGl0TW9kZVwiLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG5cdFxuXHR2YXIgc2VydmljZSA9IFtdO1xuXHRcblx0c2VydmljZS5zdGF0ZSA9IDA7XG5cdFxuXHRzZXJ2aWNlLnVybCA9ICRyb290U2NvcGUubHV5YWNmZy5ob21lVXJsO1xuXHRcblx0c2VydmljZS50b2dnbGUgPSBmdW5jdGlvbigpIHtcblx0XHRzZXJ2aWNlLnN0YXRlID0gIXNlcnZpY2Uuc3RhdGU7XG5cdH07XG5cdHNlcnZpY2Uuc2V0VXJsID0gZnVuY3Rpb24oaXRlbUlkLCB2ZXJzaW9uSWQpIHtcblx0XHR2YXIgZCA9IG5ldyBEYXRlKCk7XG5cdFx0dmFyIG4gPSBkLmdldFRpbWUoKTtcblx0XHRzZXJ2aWNlLnVybCA9ICRyb290U2NvcGUuY21zQ29uZmlnLnByZXZpZXdVcmwgKyAnP2l0ZW1JZD0nK2l0ZW1JZCsnJnZlcnNpb249JyArIHZlcnNpb25JZCArICcmZGF0ZT0nICsgbjtcblx0fTtcblx0XG5cdHNlcnZpY2UuY2hhbmdlVXJsID0gZnVuY3Rpb24oaXRlbUlkLCB2ZXJzaW9uSWQpIHtcblx0XHRpZiAodmVyc2lvbklkID09IHVuZGVmaW5lZCkge1xuXHRcdFx0dmVyc2lvbklkID0gMDtcblx0XHR9XG5cdFx0c2VydmljZS5zZXRVcmwoaXRlbUlkLCB2ZXJzaW9uSWQpO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpMaXZlRWRpdE1vZGVVcmxDaGFuZ2UnLCBzZXJ2aWNlLnVybCk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBDTVMgQ3VycmVudCBXZWJzaXRlIFNFUklWQ0VcbiAqXG4gKiAkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGUgXG4gKiBcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqICBcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IGRhdGE7XG4gKiB9KTtcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlQ3VycmVudFdlYnNpdGVcIiwgWyckcm9vdFNjb3BlJywgJ1NlcnZpY2VNZW51RGF0YScsIGZ1bmN0aW9uKCRyb290U2NvcGUsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdGN1cnJlbnRXZWJzaXRlOiBudWxsLFxuXHRcdGRlZmF1bHRXZWJzaXRlOiBudWxsXG5cdH07XG5cblx0c2VydmljZS5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5kZWZhdWx0V2Vic2l0ZSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzLmZpbmQodyA9PiB3LmlzX2RlZmF1bHQpIHx8IFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzWzBdO1xuXHRcdGlmIChzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlKSB7XG5cdFx0XHRzZXJ2aWNlLnRvZ2dsZShzZXJ2aWNlLmRlZmF1bHRXZWJzaXRlLmlkKTtcblx0XHR9XG5cdH1cblxuXHRzZXJ2aWNlLnRvZ2dsZSA9IGZ1bmN0aW9uKHdlYnNpdGVJZCkge1xuXHRcdGlmICh3ZWJzaXRlSWQgJiYgU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMgJiYgKCFzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlIHx8IHNlcnZpY2UuY3VycmVudFdlYnNpdGUuaWQgIT09IHdlYnNpdGVJZCkpIHtcblx0XHRcdHNlcnZpY2UuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcy5maW5kKHcgPT4gdy5pZCA9PT0gd2Vic2l0ZUlkKTtcblx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbnphYS5mYWN0b3J5KFwiU2VydmljZVdvcmtpbmdQYWdlVmVyc2lvblwiLCBbZnVuY3Rpb24oKSB7XG5cdHZhciBzZXJ2aWNlID0ge1xuXHRcdHBhZ2U6IHt9XG5cdH07XG5cblx0c2VydmljZS5zdG9yZSA9IGZ1bmN0aW9uKHBhZ2VJZCwgdmVyc2lvbklkKSB7XG5cdFx0c2VydmljZS5wYWdlW3BhZ2VJZF0gPSB2ZXJzaW9uSWQ7XG5cdH07XG5cblx0c2VydmljZS5oYXNWZXJzaW9uID0gZnVuY3Rpb24ocGFnZUlkKSB7XG5cdFx0aWYgKHNlcnZpY2UucGFnZS5oYXNPd25Qcm9wZXJ0eShwYWdlSWQpKSB7XG5cdFx0XHRyZXR1cm4gc2VydmljZS5wYWdlW3BhZ2VJZF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cdHJldHVybiBzZXJ2aWNlO1xufV0pOyJdfQ==