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
}]);//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2pzL2Ntc2FkbWluLmpzIiwiLi4vanMvc2VydmljZXMuanMiXSwibmFtZXMiOlsiemFhIiwiZGlyZWN0aXZlIiwiU2VydmljZU1lbnVEYXRhIiwiU2VydmljZUN1cnJlbnRXZWJzaXRlIiwiJGZpbHRlciIsInJlc3RyaWN0Iiwic2NvcGUiLCJuYXZJZCIsImNvbnRyb2xsZXIiLCIkc2NvcGUiLCJjaGFuZ2VNb2RlbCIsImRhdGEiLCJpZCIsImN1cnJlbnRXZWJzaXRlIiwiJG9uIiwiZXZlbnQiLCJtZW51RGF0YSIsImFuZ3VsYXIiLCJjb3B5IiwibWVudURhdGFPcmlnaW5hbCIsImluaXQiLCJsZW5ndGgiLCJsb2FkIiwidGhlbiIsImNvbnRhaW5lciIsImNvbnRhaW5lcnMiLCJpc0hpZGRlbiIsIiR3YXRjaCIsIm4iLCJpdGVtcyIsInRpdGxlIiwiZm9yRWFjaCIsInZhbHVlIiwiYnViYmxlUGFyZW50cyIsInBhcmVudE5hdklkIiwiY29udGFpbmVySWQiLCJpbmRleCIsIml0ZW0iLCJleGlzdHMiLCJpIiwicHVzaCIsInBhcmVudF9uYXZfaWQiLCJuYXZfY29udGFpbmVyX2lkIiwidG9nZ2xlciIsInRlbXBsYXRlIiwiaTE4biIsIiRodHRwIiwiJHN0YXRlIiwiZ2V0IiwicGFyYW1zIiwicmVzcG9uc2UiLCJwYXRoIiwidGVtcGxhdGVVcmwiLCJTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSIsIkFkbWluVG9hc3RTZXJ2aWNlIiwiZXJyb3IiLCJzdWNjZXNzIiwiJHBhcmVudCIsIm1lbnVEYXRhUmVsb2FkIiwiaW5pdGlhbGl6ZXIiLCJtZW51IiwibmF2Y29udGFpbmVycyIsIm5hdl9pdGVtX3R5cGUiLCJpc19kcmFmdCIsImRlZmF1bHRfY29udGFpbmVyX2lkIiwibGFuZ3VhZ2VzRGF0YSIsImlzRGVmYXVsdEl0ZW0iLCJmaW5kIiwiaXNfZGVmYXVsdCIsImxhbmdfaWQiLCJvIiwidW5kZWZpbmVkIiwiYWxpYXNTdWdnZXN0aW9uIiwiYWxpYXMiLCJleGVjIiwic2F2ZSIsImlzSW5saW5lIiwiZ2V0SXRlbSIsIm5hdl9pZCIsInJlYXNvbiIsImtleSIsIlNlcnZpY2VMYXlvdXRzRGF0YSIsInBhcmVudCIsIm5hdkl0ZW1JZCIsImxheW91dF9pZCIsImxheW91dHNEYXRhIiwiYXJyYXlUb1NlbGVjdCIsImlucHV0IiwidmFsdWVGaWVsZCIsImxhYmVsRmllbGQiLCJvdXRwdXQiLCJ2ZXJzaW9uc0RhdGEiLCJnZXRWZXJzaW9uTGlzdCIsImlzRWRpdEF2YWlsYWJsZSIsInVzZV9kcmFmdCIsImZyb21fZHJhZnRfaWQiLCJkcmFmdHMiLCJsYXlvdXRzIiwibW9kdWxlcyIsImNvbnRyb2xsZXJzIiwiYWN0aW9ucyIsImFkZFBhcmFtIiwiaGFzT3duUHJvcGVydHkiLCJhY3Rpb25fcGFyYW1zIiwibW9kdWxlX25hbWUiLCJjb250cm9sbGVyX25hbWUiLCJmaWx0ZXIiLCJ3ZWJzaXRlSWQiLCJyZXN1bHQiLCJ3ZWJzaXRlX2lkIiwicmV0dXJuVmFsdWUiLCJmYWN0b3J5Iiwic2VydmljZSIsInN0YXR1cyIsImRlbGVnYXRlIiwiY29uZmlnIiwiJHN0YXRlUHJvdmlkZXIiLCJzdGF0ZSIsInVybCIsImdvIiwiZGFzaGJvYXJkIiwicG9zdCIsImhlYWRlcnMiLCJjcmVhdGVOZXdWZXJzaW9uU3VibWl0IiwiY29weUV4aXN0aW5nVmVyc2lvbiIsInZlcnNpb25MYXlvdXRJZCIsIiQiLCJwYXJhbSIsInZlcnNpb25OYW1lIiwiZnJvbVZlcnNpb25QYWdlSWQiLCJyZWZyZXNoRm9yY2UiLCJpc09wZW4iLCJpdGVtU2VsZWN0aW9uIiwic2VsZWN0aW9uIiwiTmF2SXRlbUNvbnRyb2xsZXIiLCJzZWxlY3QiLCJsb2FkSXRlbXMiLCJOYXZDb250cm9sbGVyIiwibmF2RGF0YSIsImxhbmciLCJyZWZyZXNoIiwiZXJyb3JBcnJheSIsIiRyb290U2NvcGUiLCJTZXJ2aWNlTGl2ZUVkaXRNb2RlIiwibGl2ZUVkaXRTdGF0ZSIsImxvYWRDbXNDb25maWciLCJjbXNDb25maWciLCJjdXJyZW50V2Vic2l0ZVRvZ2dsZXIiLCJuZXdWYWx1ZSIsIm9sZFZhbHVlIiwidG9nZ2xlIiwiZHJvcEVtcHR5Q29udGFpbmVyIiwiZHJhZ2dlZCIsImRyb3BwZWQiLCJwb3NpdGlvbiIsImNhdElkIiwibW92ZUl0ZW1JZCIsImRyb3BwZWRPbkNhdElkIiwic3VjY2VzIiwiZHJvcEl0ZW0iLCJkcmFnIiwiZHJvcCIsInBvcyIsImFwaSIsImRyb3BwZWRBZnRlckl0ZW1JZCIsImRyb3BwZWRCZWZvcmVJdGVtSWQiLCJkcm9wcGVkT25JdGVtSWQiLCJ2YWxpZEl0ZW0iLCJob3ZlciIsImRyYWdlZCIsInJyaXRlbXMiLCJyZWN1cnNpdkl0ZW1WYWxpZGl0eSIsImluZGV4T2YiLCJ0b2dnbGVJdGVtIiwidG9nZ2xlX29wZW4iLCJpZ25vcmVMb2FkaW5nQmFyIiwiY2hhbmdlVXJsIiwibmF2X2l0ZW1faWQiLCJzaG93RHJhZyIsImlzQ3VycmVudEVsZW1lbnQiLCJoaWRkZW5DYXRzIiwidG9nZ2xlQ2F0IiwidG9nZ2xlSXNIaWRkZW4iLCIkcSIsInJlc29sdmUiLCJyZWplY3QiLCIkc3RhdGVQYXJhbXMiLCJQbGFjZWhvbGRlclNlcnZpY2UiLCJTZXJ2aWNlUHJvcGVydGllc0RhdGEiLCJBZG1pbkNsYXNzU2VydmljZSIsIkFkbWluTGFuZ1NlcnZpY2UiLCJIdG1sU3RvcmFnZSIsInBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4iLCJwYWdlU2V0dGluZ3NPdmVybGF5VGFiIiwidG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSIsInQiLCJuYXZDZmciLCJoZWxwdGFncyIsImx1eWFjZmciLCJkaXNwbGF5TGl2ZUNvbnRhaW5lciIsImxpdmVVcmwiLCJwcm9wZXJ0aWVzRGF0YSIsInBsYWNlaG9sZGVyU3RhdGUiLCJpc0Jsb2NraG9sZGVyU21hbGwiLCJnZXRWYWx1ZSIsInRvZ2dsZUJsb2NraG9sZGVyU2l6ZSIsInNldFZhbHVlIiwic2lkZWJhciIsImVuYWJsZVNpZGViYXIiLCJ0b2dnbGVTaWRlYmFyIiwic2hvd0FjdGlvbnMiLCJwYXJzZUludCIsImlzRGVsZXRlZCIsInByb3BWYWx1ZXMiLCJoYXNWYWx1ZXMiLCJwYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weSIsInNhdmVQYWdlVGFncyIsImNyZWF0ZURlZXBQYWdlQ29weUFzVGVtcGxhdGUiLCJsb2FkTmF2UHJvcGVydGllcyIsImQiLCJhZG1pbl9wcm9wX2lkIiwidG9nZ2xlUHJvcE1hc2siLCJzaG93UHJvcEZvcm0iLCJzdG9yZVByb3BWYWx1ZXMiLCJ0cmFzaCIsImNvbmZpcm0iLCIkdG9hc3QiLCJjbG9zZSIsImlzRHJhZnQiLCJzdWJtaXROYXZGb3JtIiwiaTE4blBhcmFtIiwibWVzc2FnZSIsImlzX29mZmxpbmUiLCJvZmZsaW5lU3RhdHVzIiwiaW5mbyIsImlzX2hpZGRlbiIsImhpZGRlblN0YXR1cyIsImlzX2hvbWUiLCJob21lU3RhdGUiLCIkdGltZW91dCIsIlNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24iLCJsb2FkZWQiLCJvcGVuTGl2ZVVybCIsInZlcnNpb25JZCIsImxvYWRMaXZlVXJsIiwiY3VycmVudFBhZ2VWZXJzaW9uIiwiaXNUcmFuc2xhdGVkIiwiaXRlbUNvcHkiLCJzZXR0aW5ncyIsInR5cGVEYXRhQ29weSIsInR5cGVEYXRhIiwiZXJyb3JzIiwiaG9tZVVybCIsImN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzIiwidHJhc2hJdGVtIiwiZGVsZXRlIiwiJGJyb2FkY2FzdCIsInJlc2V0IiwibmF2X2l0ZW1fdHlwZV9pZCIsInVwZGF0ZU5hdkl0ZW1EYXRhIiwidGl0bGVfdGFnIiwiZGVzY3JpcHRpb24iLCJrZXl3b3JkcyIsInRpbWVzdGFtcF9jcmVhdGUiLCJpbWFnZV9pZCIsImlzX3VybF9zdHJpY3RfcGFyc2luZ19kaXNhYmxlZCIsImlzX2NhY2hlYWJsZSIsInBhZ2VWZXJzaW9uS2V5IiwiT2JqZWN0Iiwia2V5cyIsInRvZ2dsZVNldHRpbmdzT3ZlcmxheSIsImVycm9yQ2FsbGJhY2siLCJyZW1vdmVWZXJzaW9uIiwidmVyc2lvbiIsInZlcnNpb25fYWxpYXMiLCJwYWdlSWQiLCJlZGl0VmVyc2lvbkl0ZW0iLCJ0YWIiLCJlZGl0VmVyc2lvbiIsInZlcnNpb25JdGVtIiwiY2hhbmdlVGFiIiwiZWRpdFZlcnNpb25VcGRhdGUiLCJsYW5nSWQiLCJtZXRob2QiLCJsYXN0VmVyc2lvbiIsImhhc1ZlcnNpb24iLCJzd2l0Y2hWZXJzaW9uIiwidmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5IiwidG9nZ2xlVmVyc2lvbnNEcm9wZG93biIsInBhZ2VWZXJzaW9uaWQiLCJzdG9yZSIsImlzSW5TZWxlY3Rpb24iLCJzaG9ydF9jb2RlIiwic2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSIsInJlZnJlc2hOZXN0ZWQiLCJwcmV2SWQiLCJwbGFjZWhvbGRlclZhciIsIm5hdkl0ZW1QYWdlSWQiLCJfX3BsYWNlaG9sZGVycyIsInBsYWNlaG9sZGVyIiwicmV2UGxhY2Vob2xkZXJzIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZUNvbnRlbnQiLCJwbGFjZWhvbGRlclJvdyIsInBsYWNlaG9sZGVyS2V5IiwicHJldl9pZCIsInJldkZpbmQiLCJob2xkZXJLZXkiLCJob2xkZXIiLCJkcm9wSXRlbVBsYWNlaG9sZGVyIiwic29ydF9pbmRleCIsImJsb2NrX2lkIiwicGxhY2Vob2xkZXJfdmFyIiwibmF2X2l0ZW1fcGFnZV9pZCIsImNvcHlCbG9ja0lkIiwicHV0IiwiJHNjZSIsIlNlcnZpY2VCbG9ja0NvcHlTdGFjayIsIk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIiLCJ2YXIiLCJlbGVtZW50Iiwic29ydEluZGV4IiwiJGluZGV4IiwicmVtb3ZlIiwiY29weUJsb2NrIiwiYmxvY2siLCJ0b2dnbGVIaWRkZW4iLCJibG9ja0lkIiwiaGlkZGVuU3RhdGUiLCJuYW1lIiwiaXNFZGl0YWJsZSIsInZhcnMiLCJpc0NvbmZpZ3VyYWJsZSIsImNmZ3MiLCJ2YWx1ZXMiLCJ2YXJpYXRpb24iLCJldmFsVmFyaWF0aW9uVmlzYmlsaXR5IiwiZ2V0SW5mbyIsInZhckZpZWxkTmFtZSIsImZpZWxkX2hlbHAiLCJ2YXJpYXRlbk5hbWUiLCJ2YXJpYXRpb25zIiwiaXNPYmplY3QiLCJ2IiwiayIsIm9iamVjdCIsImludmlzaWJsZSIsImNmZ2RhdGEiLCJjZmd2YWx1ZXMiLCJlZGl0IiwibW9kYWxIaWRkZW4iLCJtb2RhbE1vZGUiLCJpbml0TW9kYWxNb2RlIiwidG9nZ2xlRWRpdCIsInJlbmRlclRlbXBsYXRlIiwiZGF0YVZhcnMiLCJjZmdWYXJzIiwiZXh0cmFzIiwiVHdpZyIsInR3aWciLCJjb250ZW50IiwicmVuZGVyIiwidHJ1c3RBc0h0bWwiLCJyZW1vdmVCbG9jayIsImlzQW55UmVxdWlyZWRBdHRyaWJ1dGVFbXB0eSIsInZhckl0ZW0iLCJyZXF1aXJlZCIsImlzRW1wdHkiLCJsYWJlbCIsImpzb25fY29uZmlnX3ZhbHVlcyIsImpzb25fY29uZmlnX2NmZ192YWx1ZXMiLCJpc19kaXJ0eSIsIm9iamVjdGRldGFpbCIsIlNlcnZpY2VCbG9ja3NEYXRhIiwiYmxvY2tzRGF0YSIsImJsb2Nrc0RhdGFSZXN0b3JlIiwiYmxvY2tzRGF0YVJlbG9hZCIsImFkZFRvRmF2IiwicmVtb3ZlRnJvbUZhdiIsInRvZ2dsZUdyb3VwIiwiZ3JvdXAiLCJpc1ByZXZpZXdFbmFibGVkIiwicHJldmlld19lbmFibGVkIiwiY29weVN0YWNrIiwic3RhY2siLCJjbGVhclN0YWNrIiwiY2xlYXIiLCJzZWFyY2hRdWVyeSIsInNlYXJjaElzRGlydHkiLCJpc19mYXYiLCJzcGxpY2UiLCJyZXNvbHZlclByb3ZpZGVyIiwiYWRkQ2FsbGJhY2siLCJMdXlhTG9hZGluZyIsInN0YXJ0Iiwic3RvcCIsInNoaWZ0IiwiaWNvbiIsImNvcHlzdGFjayIsImZvcmNlUmVsb2FkIiwic2V0VXJsIiwiaXRlbUlkIiwiRGF0ZSIsImdldFRpbWUiLCJwcmV2aWV3VXJsIiwiZGVmYXVsdFdlYnNpdGUiLCJ3ZWJzaXRlcyIsInciLCJwYWdlIl0sIm1hcHBpbmdzIjoiOztBQUFBLENBQUMsWUFBVztBQUNYLGVB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WixFQUF5QyxDQUFDLFlBQVc7QUFDcEQsTUFBSUMsT0FBTyxHQUFHO0FBQ2J5UyxJQUFBQSxJQUFJLEVBQUU7QUFETyxHQUFkOztBQUlBelMsRUFBQUEsT0FBTyxDQUFDbUwsS0FBUixHQUFnQixVQUFTZixNQUFULEVBQWlCaEMsU0FBakIsRUFBNEI7QUFDM0NwSSxJQUFBQSxPQUFPLENBQUN5UyxJQUFSLENBQWFySSxNQUFiLElBQXVCaEMsU0FBdkI7QUFDQSxHQUZEOztBQUlBcEksRUFBQUEsT0FBTyxDQUFDOEssVUFBUixHQUFxQixVQUFTVixNQUFULEVBQWlCO0FBQ3JDLFFBQUlwSyxPQUFPLENBQUN5UyxJQUFSLENBQWFuVCxjQUFiLENBQTRCOEssTUFBNUIsQ0FBSixFQUF5QztBQUN4QyxhQUFPcEssT0FBTyxDQUFDeVMsSUFBUixDQUFhckksTUFBYixDQUFQO0FBQ0E7O0FBRUQsV0FBTyxLQUFQO0FBQ0EsR0FORDs7QUFRQSxTQUFPcEssT0FBUDtBQUNBLENBbEJ3QyxDQUF6QyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0XG5cdC8vIGRpcmVjdGl2ZS5qc1xuXG4gICAgemFhLmRpcmVjdGl2ZShcIm1lbnVEcm9wZG93blwiLCBbJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlQ3VycmVudFdlYnNpdGUnLCAnJGZpbHRlcicsIGZ1bmN0aW9uKFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUN1cnJlbnRXZWJzaXRlLCAkZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdCA6ICdFJyxcbiAgICAgICAgICAgIHNjb3BlIDoge1xuICAgICAgICAgICAgICAgIG5hdklkIDogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29udHJvbGxlciA6IFsnJHNjb3BlJywgZnVuY3Rpb24oJHNjb3BlKSB7XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuY2hhbmdlTW9kZWwgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5uYXZJZCA9IGRhdGEuaWQ7XG4gICAgICAgICAgICAgICAgfVxuXG5cdFx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpDdXJyZW50V2Vic2l0ZUNoYW5nZWQnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gYW5ndWxhci5jb3B5KFNlcnZpY2VNZW51RGF0YS5kYXRhKTtcblx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwgPSBhbmd1bGFyLmNvcHkoU2VydmljZU1lbnVEYXRhLmRhdGEpO1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YU9yaWdpbmFsID0gYW5ndWxhci5jb3B5KGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzY29wZS5tZW51RGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZU1lbnVEYXRhLmxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRTZXJ2aWNlQ3VycmVudFdlYnNpdGUubG9hZCgpO1xuXHRcdFx0XHRcdFx0fSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGNvbnRhaW5lciBpbiAkc2NvcGUubWVudURhdGEuY29udGFpbmVycykge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubWVudURhdGEuY29udGFpbmVyc1tjb250YWluZXJdLmlzSGlkZGVuID0gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdFx0XG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goJ3NlYXJjaFF1ZXJ5JywgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuID09IG51bGwgfHwgbiA9PSAnJykge1xuXHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhLml0ZW1zID0gYW5ndWxhci5jb3B5KCRzY29wZS5tZW51RGF0YU9yaWdpbmFsLml0ZW1zKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIGl0ZW1zID0gJGZpbHRlcignZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMsIHt0aXRsZTogbn0pO1xuXG5cdFx0XHRcdFx0Ly8gZmluZCBhbGwgcGFyZW50IGVsZW1lbnRzIG9mIHRoZSBmb3VuZCBlbGVtZW50cyBhbmQgcmUgYWRkIHRoZW0gdG8gdGhlIG1hcCBpbiBvcmRlciB0byBcblx0XHRcdFx0XHQvLyBlbnN1cmUgYSBjb3JyZWN0IG1lbnUgdHJlZS5cblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaXRlbXMsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRpZiAodmFsdWVbJ3BhcmVudF9uYXZfaWQnXSA+IDApIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmJ1YmJsZVBhcmVudHModmFsdWVbJ3BhcmVudF9uYXZfaWQnXSwgdmFsdWVbJ25hdl9jb250YWluZXJfaWQnXSwgaXRlbXMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhLml0ZW1zID0gaXRlbXM7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5idWJibGVQYXJlbnRzID0gZnVuY3Rpb24ocGFyZW50TmF2SWQsIGNvbnRhaW5lcklkLCBpbmRleCkge1xuXHRcdFx0XHRcdHZhciBpdGVtID0gJGZpbHRlcignbWVudWNoaWxkZmlsdGVyJykoJHNjb3BlLm1lbnVEYXRhT3JpZ2luYWwuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdFx0XHRcdFx0aWYgKGl0ZW0pIHtcblx0XHRcdFx0XHRcdHZhciBleGlzdHMgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbmRleCwgZnVuY3Rpb24oaSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoaS5pZCA9PSBpdGVtLmlkKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZXhpc3RzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdGlmICghZXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRcdGluZGV4LnB1c2goaXRlbSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyhpdGVtLnBhcmVudF9uYXZfaWQsIGl0ZW0ubmF2X2NvbnRhaW5lcl9pZCwgaW5kZXgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuICAgICAgICAgICAgICAgICRzY29wZS50b2dnbGVyID0gdHJ1ZTtcblxuXHRcdFx0XHRpbml0KCk7XG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHRlbXBsYXRlIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAnPGRpdj4nK1xuXHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAgbWItMlwiPicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImlucHV0LWdyb3VwLXByZXBlbmRcIiBuZy1oaWRlPVwic2VhcmNoUXVlcnlcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5zZWFyY2g8L2k+PC9kaXY+PC9kaXY+Jytcblx0XHRcdFx0XHRcdCc8ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtcHJlcGVuZFwiIG5nLXNob3c9XCJzZWFyY2hRdWVyeVwiIG5nLWNsaWNrPVwic2VhcmNoUXVlcnkgPSBcXCdcXCdcIj48ZGl2IGNsYXNzPVwiaW5wdXQtZ3JvdXAtdGV4dFwiPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5jbGVhcjwvaT48L2Rpdj48L2Rpdj4nK1xuXHRcdFx0XHRcdFx0JzxpbnB1dCBjbGFzcz1cImZvcm0tY29udHJvbFwiIG5nLW1vZGVsPVwic2VhcmNoUXVlcnlcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiJytpMThuWyduZ3Jlc3RfY3J1ZF9zZWFyY2hfdGV4dCddKydcIj4nK1xuXHRcdFx0XHRcdCc8L2Rpdj4nICsgXG5cdFx0XHRcdFx0JzxkaXYgbmctcmVwZWF0PVwiKGtleSwgY29udGFpbmVyKSBpbiBtZW51RGF0YS5jb250YWluZXJzIHwgbWVudXdlYnNpdGVmaWx0ZXI6Y3VycmVudFdlYnNpdGUuaWRcIiBuZy1pZj1cIihtZW51RGF0YS5pdGVtcyB8IG1lbnVwYXJlbnRmaWx0ZXI6Y29udGFpbmVyLmlkOjApLmxlbmd0aCA+IDBcIiBjbGFzcz1cImNhcmQgbWItMlwiIG5nLWNsYXNzPVwie1xcJ2NhcmQtY2xvc2VkXFwnOiAhY29udGFpbmVyLmlzSGlkZGVufVwiPicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImNhcmQtaGVhZGVyXCIgbmctY2xpY2s9XCJjb250YWluZXIuaXNIaWRkZW49IWNvbnRhaW5lci5pc0hpZGRlblwiPicrXG5cdFx0XHRcdFx0XHRcdCc8c3BhbiBjbGFzcz1cIm1hdGVyaWFsLWljb25zIGNhcmQtdG9nZ2xlLWluZGljYXRvclwiPmtleWJvYXJkX2Fycm93X2Rvd248L3NwYW4+Jytcblx0XHRcdFx0XHRcdFx0JzxzcGFuPnt7Y29udGFpbmVyLm5hbWV9fTwvc3Bhbj4nK1xuXHRcdFx0XHRcdFx0JzwvZGl2PicrXG5cdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cImNhcmQtYm9keVwiPicrIFxuXHRcdFx0XHRcdFx0XHQnPGRpdiBjbGFzcz1cInRyZWV2aWV3IHRyZWV2aWV3LWNob29zZXJcIj4nICtcblx0XHRcdFx0XHRcdFx0XHQnPHVsIGNsYXNzPVwidHJlZXZpZXctaXRlbXMgdHJlZXZpZXctaXRlbXMtbHZsMVwiPicgK1xuXHRcdFx0XHRcdFx0XHRcdFx0JzxsaSBjbGFzcz1cInRyZWV2aWV3LWl0ZW0gdHJlZXZpZXctaXRlbS1sdmwxXCIgbmctY2xhc3M9XCJ7XFwndHJlZXZpZXctaXRlbS1oYXMtY2hpbGRyZW5cXCcgOiAobWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDowKS5sZW5ndGh9XCIgbmctcmVwZWF0PVwiKGtleSwgZGF0YSkgaW4gbWVudURhdGEuaXRlbXMgfCBtZW51cGFyZW50ZmlsdGVyOmNvbnRhaW5lci5pZDowIHRyYWNrIGJ5IGRhdGEuaWRcIiBuZy1pbmNsdWRlPVwiXFwnbWVudURyb3Bkb3duUmV2ZXJzZVxcJ1wiPjwvbGk+JyArXG5cdFx0XHRcdFx0XHRcdFx0JzwvdWw+JyArXG5cdFx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcblx0XHRcdFx0XHRcdCc8L2Rpdj4nICtcblx0XHRcdFx0XHQnPC9kaXY+Jytcblx0XHRcdFx0JzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cblx0emFhLmRpcmVjdGl2ZShcInphYUNtc1BhZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogXCJFXCIsXG4gICAgICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgICAgIFwibW9kZWxcIjogXCI9XCIsXG4gICAgICAgICAgICAgICAgXCJvcHRpb25zXCI6IFwiPVwiLFxuICAgICAgICAgICAgICAgIFwibGFiZWxcIjogXCJAbGFiZWxcIixcbiAgICAgICAgICAgICAgICBcImkxOG5cIjogXCJAaTE4blwiLFxuICAgICAgICAgICAgICAgIFwiaWRcIjogXCJAZmllbGRpZFwiLFxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcIkBmaWVsZG5hbWVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlbXBsYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFx0cmV0dXJuICAnPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXAgZm9ybS1zaWRlLWJ5LXNpZGVcIiBuZy1jbGFzcz1cIntcXCdpbnB1dC0taGlkZS1sYWJlbFxcJzogaTE4bn1cIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZvcm0tc2lkZSBmb3JtLXNpZGUtbGFiZWxcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbD57e2xhYmVsfX08L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImZvcm0tc2lkZVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPG1lbnUtZHJvcGRvd24gY2xhc3M9XCJtZW51LWRyb3Bkb3duXCIgbmF2LWlkPVwibW9kZWxcIj48L21lbnUtZHJvcGRvd24+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuXHR6YWEuZGlyZWN0aXZlKFwic2hvd0ludGVybmFsUmVkaXJlY3Rpb25cIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlc3RyaWN0IDogJ0UnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdG5hdklkIDogJz0nXG5cdFx0XHR9LFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgJyRzdGF0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRzdGF0ZSkge1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goJ25hdklkJywgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9nZXQtbmF2LWl0ZW0tcGF0aCcsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZJZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUucGF0aCA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2dldC1uYXYtY29udGFpbmVyLW5hbWUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0sXG5cdFx0XHR0ZW1wbGF0ZSA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJzxhIGNsYXNzPVwiYnRuIGJ0bi1zZWNvbmRhcnkgYnRuLXNtXCIgdWktc3JlZj1cImN1c3RvbS5jbXNlZGl0KHsgbmF2SWQgOiBuYXZJZCwgdGVtcGxhdGVJZDogXFwnY21zYWRtaW4vZGVmYXVsdC9pbmRleFxcJ30pXCI+e3twYXRofX08L2E+IGluIHt7Y29udGFpbmVyfX0nO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdFxuXHR6YWEuZGlyZWN0aXZlKFwiY3JlYXRlRm9ybVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjcmVhdGVmb3JtLmh0bWwnLFxuXHRcdFx0Y29udHJvbGxlciA6IFsnJHNjb3BlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VMYW5ndWFnZXNEYXRhJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRmaWx0ZXIsIFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUxhbmd1YWdlc0RhdGEsIEFkbWluVG9hc3RTZXJ2aWNlLCBTZXJ2aWNlQ3VycmVudFdlYnNpdGUpIHtcblxuXHRcdFx0XHQkc2NvcGUuZXJyb3IgPSBbXTtcblx0XHRcdFx0JHNjb3BlLnN1Y2Nlc3MgPSBmYWxzZTtcblxuXHRcdFx0XHQkc2NvcGUuY29udHJvbGxlciA9ICRzY29wZS4kcGFyZW50O1xuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IFNlcnZpY2VNZW51RGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YSA9IGRhdGE7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiBTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZ1bmN0aW9uIGluaXRpYWxpemVyKCkge1xuXHRcdFx0XHRcdCRzY29wZS5tZW51ID0gJHNjb3BlLm1lbnVEYXRhLml0ZW1zO1xuXHRcdFx0XHRcdCRzY29wZS5uYXZjb250YWluZXJzID0gJHNjb3BlLm1lbnVEYXRhLmNvbnRhaW5lcnM7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpbml0aWFsaXplcigpO1xuXG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9IDE7XG5cdFx0XHRcdCRzY29wZS5kYXRhLnBhcmVudF9uYXZfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUuZGF0YS5pc19kcmFmdCA9IDA7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubmF2X2NvbnRhaW5lcl9pZCA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZS5kZWZhdWx0X2NvbnRhaW5lcl9pZDtcblxuXHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHRpZiAoU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBTZXJ2aWNlQ3VycmVudFdlYnNpdGUuY3VycmVudFdlYnNpdGU7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlLmRlZmF1bHRfY29udGFpbmVyX2lkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YS5kYXRhO1xuXG5cdFx0XHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TGFuZ3VhZ2VzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBkYXRhO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQkc2NvcGUuaXNEZWZhdWx0SXRlbSA9ICRzY29wZS5sYW5ndWFnZXNEYXRhLmZpbmQoaXRlbSA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW0uaXNfZGVmYXVsdDtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmRhdGEubGFuZ19pZCA9ICRzY29wZS5pc0RlZmF1bHRJdGVtLmlkO1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiAkc2NvcGUuZGF0YS5uYXZfY29udGFpbmVyX2lkIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiAhPT0gdW5kZWZpbmVkICYmIG4gIT09IG8pIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLnBhcmVudF9uYXZfaWQgPSAwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKCRzY29wZS5kYXRhLnRpdGxlKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJHdhdGNoKCdkYXRhLmFsaWFzJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0XHRcdGlmIChuIT1vICYmIG4hPW51bGwpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5kYXRhLmFsaWFzID0gJGZpbHRlcignc2x1Z2lmeScpKG4pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmV4ZWMgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXIuc2F2ZSgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnN1Y2Nlc3MgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmVycm9yID0gW107XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS50aXRsZSA9IG51bGw7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hbGlhcyA9IG51bGw7XG5cdFx0XHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEuaXNJbmxpbmUpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLiRwYXJlbnQuJHBhcmVudC5nZXRJdGVtKCRzY29wZS5kYXRhLmxhbmdfaWQsICRzY29wZS5kYXRhLm5hdl9pZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ3ZpZXdfaW5kZXhfcGFnZV9zdWNjZXNzJ10pO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlYXNvbikge1xuXHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlYXNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcih2YWx1ZVswXSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdCRzY29wZS5lcnJvciA9IHJlYXNvbjtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XVxuXHRcdH1cblx0fSk7XG5cblx0LyoqIFBBR0UgQ1JFQVRFICYgVVBEQVRFICovXG4gICAgemFhLmRpcmVjdGl2ZShcInVwZGF0ZUZvcm1QYWdlXCIsIFsnU2VydmljZUxheW91dHNEYXRhJywgZnVuY3Rpb24oU2VydmljZUxheW91dHNEYXRhKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdCA6ICdFQScsXG4gICAgICAgICAgICBzY29wZSA6IHtcbiAgICAgICAgICAgICAgICBkYXRhIDogJz0nXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmwgOiAndXBkYXRlZm9ybXBhZ2UuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLnBhcmVudCA9ICRzY29wZS4kcGFyZW50LiRwYXJlbnQ7XG5cdFx0XHRcdCRzY29wZS5uYXZJdGVtSWQgPSAkc2NvcGUucGFyZW50Lml0ZW0uaWQ7XG5cblxuXHRcdFx0XHQkc2NvcGUuZGF0YS5sYXlvdXRfaWQgPSAwO1xuXHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuXHRcdFx0XHQkc2NvcGUuYXJyYXlUb1NlbGVjdCA9IGZ1bmN0aW9uKGlucHV0LCB2YWx1ZUZpZWxkLCBsYWJlbEZpZWxkKSB7XG5cdFx0XHRcdFx0dmFyIG91dHB1dCA9IFtdO1xuXHRcdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUpIHtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKHtcImxhYmVsXCI6IHZhbHVlW2xhYmVsRmllbGRdLCBcInZhbHVlXCI6IHZhbHVlW3ZhbHVlRmllbGRdfSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxheW91dHNEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBbXTsgLy8gJHNjb3BlLmFycmF5VG9TZWxlY3QoZGF0YSk7IC8vIEBUT0RPIFJFTU9WRSBJRiBWRVJJRklFRFxuXHRcdFx0XHR9KTtcblxuXG5cdFx0XHRcdCRzY29wZS52ZXJzaW9uc0RhdGEgPSBbXTtcblxuXHRcdFx0XHQkc2NvcGUuZ2V0VmVyc2lvbkxpc3QgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2UvdmVyc2lvbnMnLCB7IHBhcmFtcyA6IHsgbmF2SXRlbUlkIDogJHNjb3BlLm5hdkl0ZW1JZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0JHNjb3BlLnZlcnNpb25zRGF0YSA9ICRzY29wZS5hcnJheVRvU2VsZWN0KHJlc3BvbnNlLmRhdGEsICdpZCcsICd2ZXJzaW9uX2FsaWFzJyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLmlzRWRpdEF2YWlsYWJsZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdHJldHVybiAkc2NvcGUudmVyc2lvbnNEYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIFx0fTtcblxuXHRcdFx0XHRmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0XHRcdCRzY29wZS5nZXRWZXJzaW9uTGlzdCgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuXHR9XSk7XG5cdHphYS5kaXJlY3RpdmUoXCJjcmVhdGVGb3JtUGFnZVwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdHJpY3QgOiAnRUEnLFxuXHRcdFx0c2NvcGUgOiB7XG5cdFx0XHRcdGRhdGEgOiAnPSdcblx0XHRcdH0sXG5cdFx0XHR0ZW1wbGF0ZVVybCA6ICdjcmVhdGVmb3JtcGFnZS5odG1sJyxcblx0XHRcdGNvbnRyb2xsZXIgOiBbJyRzY29wZScsICdTZXJ2aWNlTGF5b3V0c0RhdGEnLCAnU2VydmljZU1lbnVEYXRhJywgZnVuY3Rpb24oJHNjb3BlLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VNZW51RGF0YSkge1xuXG5cdFx0XHRcdCRzY29wZS5kYXRhLnVzZV9kcmFmdCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmxheW91dF9pZCA9IDA7XG5cdFx0XHRcdCRzY29wZS5kYXRhLmZyb21fZHJhZnRfaWQgPSAwO1xuXG5cdFx0XHRcdC8qIGxheW91dHNEYXRhICovXG5cblx0XHRcdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICAgICAgICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBkYXRhO1xuICAgICAgICAgICAgXHR9KTtcblxuICAgICAgICAgICAgXHQvKiBtZW51RGF0YSAqL1xuXG4gICAgXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cblx0XHRcdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmFycmF5VG9TZWxlY3QgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWVGaWVsZCwgbGFiZWxGaWVsZCkge1xuXHRcdFx0XHRcdHZhciBvdXRwdXQgPSBbXTtcblx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0XHRvdXRwdXQucHVzaCh7XCJsYWJlbFwiOiB2YWx1ZVtsYWJlbEZpZWxkXSwgXCJ2YWx1ZVwiOiB2YWx1ZVt2YWx1ZUZpZWxkXX0pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0XHRcdH07XG5cbiAgICAgICAgICAgIFx0ZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUuZHJhZnRzID0gJHNjb3BlLmFycmF5VG9TZWxlY3QoJHNjb3BlLm1lbnVEYXRhLmRyYWZ0cywgJ2lkJywgJ3RpdGxlJyk7XG5cdFx0XHRcdFx0JHNjb3BlLmxheW91dHMgPSAkc2NvcGUuYXJyYXlUb1NlbGVjdCgkc2NvcGUubGF5b3V0c0RhdGEsICdpZCcsICduYW1lJyk7XG4gICAgICAgICAgICBcdH1cblxuICAgICAgICAgICAgXHRpbml0KCk7XG5cblx0XHRcdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkc2NvcGUuJHBhcmVudC5leGVjKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1dXG5cdFx0fVxuXHR9KTtcblxuXHQvKiBQYWdlIE1PRFVMRSAqL1xuXG5cdHphYS5kaXJlY3RpdmUoXCJmb3JtTW9kdWxlXCIsIGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZXN0cmljdCA6ICdFQScsXG5cdFx0XHRzY29wZSA6IHtcblx0XHRcdFx0ZGF0YSA6ICc9J1xuXHRcdFx0fSxcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2Zvcm1tb2R1bGUuaHRtbCcsXG5cdFx0XHRjb250cm9sbGVyIDogWyckc2NvcGUnLCAnJGh0dHAnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwKSB7XG5cblx0XHRcdFx0JHNjb3BlLm1vZHVsZXMgPSBbXTtcblx0XHRcdFx0JHNjb3BlLmNvbnRyb2xsZXJzID0gW107XG5cdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gW107XG5cdFx0XHRcdCRzY29wZS5wYXJhbXMgPSB7fTtcblxuXHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1hZG1pbi1jb21tb24vZGF0YS1tb2R1bGVzJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5tb2R1bGVzID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0JHNjb3BlLmFkZFBhcmFtID0gZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdFx0aWYgKCEkc2NvcGUuZGF0YS5oYXNPd25Qcm9wZXJ0eSgnYWN0aW9uX3BhcmFtcycpKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF0YS5hY3Rpb25fcGFyYW1zID0ge307XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdCRzY29wZS5kYXRhLmFjdGlvbl9wYXJhbXNba2V5XSA9ICcnO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5kYXRhLm1vZHVsZV9uYW1lO1xuXHRcdFx0XHR9LCBmdW5jdGlvbihuKSB7XG5cdFx0XHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1hZG1pbi9tb2R1bGUtY29udHJvbGxlcnM/bW9kdWxlPScgKyBuKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jb250cm9sbGVycyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5hY3Rpb25zID0gW107XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0cmV0dXJuICRzY29wZS5kYXRhLmNvbnRyb2xsZXJfbmFtZTtcblx0XHRcdFx0fSwgZnVuY3Rpb24obikge1xuXHRcdFx0XHRcdGlmIChuKSB7XG5cdFx0XHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtYWRtaW4vY29udHJvbGxlci1hY3Rpb25zP21vZHVsZT0nKyRzY29wZS5kYXRhLm1vZHVsZV9uYW1lKycmY29udHJvbGxlcj0nICsgbikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuYWN0aW9ucyA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV1cblx0XHR9XG5cdH0pO1xuXG5cdC8qIGZpbHRlcnMgKi9cblxuXHR6YWEuZmlsdGVyKFwibWVudXdlYnNpdGVmaWx0ZXJcIiwgZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGlucHV0LCB3ZWJzaXRlSWQpIHtcblx0XHRcdHZhciByZXN1bHQgPSBbXTtcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpbnB1dCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuXHRcdFx0XHRpZiAodmFsdWUud2Vic2l0ZV9pZCA9PSB3ZWJzaXRlSWQpIHtcblx0XHRcdFx0XHRyZXN1bHQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9O1xuXHR9KTtcblxuXHR6YWEuZmlsdGVyKFwibWVudXBhcmVudGZpbHRlclwiLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCkge1xuXHRcdFx0dmFyIHJlc3VsdCA9IFtdO1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKGlucHV0LCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdGlmICh2YWx1ZS5wYXJlbnRfbmF2X2lkID09IHBhcmVudE5hdklkICYmIHZhbHVlLm5hdl9jb250YWluZXJfaWQgPT0gY29udGFpbmVySWQpIHtcblx0XHRcdFx0XHRyZXN1bHQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9O1xuXHR9KTtcblxuXHR6YWEuZmlsdGVyKCdtZW51Y2hpbGRmaWx0ZXInLCBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCkge1xuXHRcdFx0dmFyIHJldHVyblZhbHVlID0gZmFsc2U7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goaW5wdXQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcblx0XHRcdFx0aWYgKCFyZXR1cm5WYWx1ZSkge1xuXHRcdFx0XHRcdGlmICh2YWx1ZS5pZCA9PSBwYXJlbnROYXZJZCAmJiB2YWx1ZS5uYXZfY29udGFpbmVyX2lkID09IGNvbnRhaW5lcklkKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiByZXR1cm5WYWx1ZTtcblx0XHR9O1xuXHR9KTtcblxuXHQvKiBmYWN0b3J5LmpzICovXG5cblx0emFhLmZhY3RvcnkoJ1BsYWNlaG9sZGVyU2VydmljZScsIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZXJ2aWNlID0gW107XG5cblx0XHRzZXJ2aWNlLnN0YXR1cyA9IDE7IC8qIDEgPSBzaG93cGxhY2Vob2xkZXJzOyAwID0gaGlkZSBwbGFjZWhvbGRlcnMgKi9cblxuXHRcdHNlcnZpY2UuZGVsZWdhdGUgPSBmdW5jdGlvbihzdGF0dXMpIHtcblx0XHRcdHNlcnZpY2Uuc3RhdHVzID0gc3RhdHVzO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gc2VydmljZTtcblx0fSk7XG5cblx0LyogbGF5b3V0LmpzICovXG5cblx0emFhLmNvbmZpZyhbJyRzdGF0ZVByb3ZpZGVyJywgZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcblx0XHQkc3RhdGVQcm92aWRlclxuXHRcdC5zdGF0ZShcImN1c3RvbS5jbXNlZGl0XCIsIHtcblx0XHRcdHVybCA6IFwiL3VwZGF0ZS86bmF2SWRcIixcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2Ntc2FkbWluL3BhZ2UvdXBkYXRlJ1xuXHRcdH0pXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2FkZFwiLCB7XG5cdFx0XHR1cmwgOiBcIi9jcmVhdGVcIixcblx0XHRcdHRlbXBsYXRlVXJsIDogJ2Ntc2FkbWluL3BhZ2UvY3JlYXRlJ1xuXHRcdH0pXG5cdFx0LnN0YXRlKFwiY3VzdG9tLmNtc2RyYWZ0XCIsIHtcblx0XHRcdHVybDogJy9kcmFmdHMnLFxuXHRcdFx0dGVtcGxhdGVVcmw6ICdjbXNhZG1pbi9wYWdlL2RyYWZ0cydcblx0XHR9KTtcblx0fV0pO1xuXG5cdC8qIGNvbnRyb2xsZXJzICovXG5cblx0emFhLmNvbnRyb2xsZXIoXCJEcmFmdHNDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRzdGF0ZScsICdTZXJ2aWNlTWVudURhdGEnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgU2VydmljZU1lbnVEYXRhKSB7XG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5nbyA9IGZ1bmN0aW9uKG5hdklkKSB7XG5cdFx0XHQkc3RhdGUuZ28oJ2N1c3RvbS5jbXNlZGl0JywgeyBuYXZJZCA6IG5hdklkIH0pO1xuXHRcdH07XG5cdH1dKTtcblxuXHR6YWEuY29udHJvbGxlcihcIkNtc0Rhc2hib2FyZFwiLCBbJyRzY29wZScsICckaHR0cCcsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHApIHtcblx0XHQkc2NvcGUuZGFzaGJvYXJkID0gW107XG5cdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL2Rhc2hib2FyZC1sb2cnKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHQkc2NvcGUuZGFzaGJvYXJkID0gcmVzcG9uc2UuZGF0YTtcblx0XHR9KTtcblx0fV0pO1xuXHRcblx0emFhLmNvbnRyb2xsZXIoXCJDb25maWdDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgZnVuY3Rpb24oJHNjb3BlLCAkaHR0cCwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblx0XHQkc2NvcGUuZGF0YSA9IHt9O1xuXG5cdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL2NvbmZpZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdCRzY29wZS5kYXRhID0gcmVzcG9uc2UuZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWFkbWluL2NvbmZpZycsICRzY29wZS5kYXRhKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfY29uZmlnX3VwZGF0ZV9zdWNjZXNzJ10pO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJQYWdlVmVyc2lvbnNDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJ1NlcnZpY2VMYXlvdXRzRGF0YScsICdBZG1pblRvYXN0U2VydmljZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIFNlcnZpY2VMYXlvdXRzRGF0YSwgQWRtaW5Ub2FzdFNlcnZpY2UpIHtcblx0XHQvKipcblx0XHQgKiBAdmFyIG9iamVjdCAkdHlwZURhdGEgRnJvbSBwYXJlbnQgc2NvcGUgY29udHJvbGxlciBOYXZJdGVtQ29udHJvbGxlclxuXHRcdCAqIEB2YXIgb2JqZWN0ICRpdGVtIEZyb20gcGFyZW50IHNjb3BlIGNvbnRyb2xsZXIgTmF2SXRlbUNvbnRyb2xsZXJcblx0XHQgKiBAdmFyIHN0cmluZyAkdmVyc2lvbk5hbWUgRnJvbSBuZy1tb2RlbFxuXHRcdCAqIEB2YXIgaW50ZWdlciAkZnJvbVZlcnNpb25QYWdlSWQgRnJvbSBuZy1tb2RlbCB0aGUgdmVyc2lvbiBjb3B5IGZyb20gb3IgMCA9IG5ldyBlbXB0eS9ibGFuayB2ZXJzaW9uXG5cdFx0ICogQHZhciBpbnRlZ2VyICR2ZXJzaW9uTGF5b3V0SWQgRnJvbSBuZy1tb2RlbCwgb25seSBpZiBmcm9tVmVyc2lvblBhZ2VJZCBpcyAwXG4gXHRcdCAqL1xuXHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdC8qIGxheW91dHNEYXRhICovXG5cblx0XHQkc2NvcGUubGF5b3V0c0RhdGEgPSBTZXJ2aWNlTGF5b3V0c0RhdGEuZGF0YTtcblxuICAgIFx0JHNjb3BlLiRvbignc2VydmljZTpMYXlvdXRzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG4gICAgXHR9KTtcblxuICAgIFx0LyogY29udHJvbGxlciBsb2dpYyAqL1xuXG5cdFx0JHNjb3BlLmNyZWF0ZU5ld1ZlcnNpb25TdWJtaXQgPSBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfdmVyc2lvbl9lcnJvcl9lbXB0eV9maWVsZHMnXSk7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRhdGEuY29weUV4aXN0aW5nVmVyc2lvbikge1xuXHRcdFx0XHRkYXRhLnZlcnNpb25MYXlvdXRJZCA9IDA7XG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vY3JlYXRlLXBhZ2UtdmVyc2lvbicsICQucGFyYW0oeydsYXlvdXRJZCc6IGRhdGEudmVyc2lvbkxheW91dElkLCAnbmF2SXRlbUlkJzogJHNjb3BlLml0ZW0uaWQsICduYW1lJzogZGF0YS52ZXJzaW9uTmFtZSwgJ2Zyb21QYWdlSWQnOiBkYXRhLmZyb21WZXJzaW9uUGFnZUlkfSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuWydqc192ZXJzaW9uX2Vycm9yX2VtcHR5X2ZpZWxkcyddKTtcblx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdCRzY29wZS5yZWZyZXNoRm9yY2UoKTtcblxuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3ZlcnNpb25fY3JlYXRlX3N1Y2Nlc3MnXSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJDb3B5UGFnZUNvbnRyb2xsZXJcIiwgWyckc2NvcGUnLCAnJGh0dHAnLCAnJGZpbHRlcicsICdBZG1pblRvYXN0U2VydmljZScsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsICRmaWx0ZXIsIEFkbWluVG9hc3RTZXJ2aWNlKSB7XG5cblx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cblx0XHQkc2NvcGUuJG9uKCdkZWxldGVkTmF2SXRlbScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLmlzT3BlbiA9IGZhbHNlO1xuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24gPSBmYWxzZTtcblx0XHRcdCRzY29wZS5zZWxlY3Rpb24gPSAwO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHQkc2NvcGUubmF2SWQgPSAwO1xuXG5cdFx0JHNjb3BlLml0ZW1zID0gbnVsbDtcblxuXHRcdCRzY29wZS5pc09wZW4gPSBmYWxzZTtcblxuXHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc2VsZWN0aW9uID0gMDtcblxuXHRcdCRzY29wZS5zZWxlY3QgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW9uID0gaXRlbS5pZDtcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uID0gYW5ndWxhci5jb3B5KGl0ZW0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdpdGVtU2VsZWN0aW9uLnRpdGxlJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4pIHtcblx0XHRcdFx0JHNjb3BlLmFsaWFzU3VnZ2VzdGlvbigpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFxuXHRcdCRzY29wZS5hbGlhc1N1Z2dlc3Rpb24gPSBmdW5jdGlvbigpIHtcblx0XHRcdFxuXHRcdFx0JHNjb3BlLml0ZW1TZWxlY3Rpb24uYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5JykoJHNjb3BlLml0ZW1TZWxlY3Rpb24udGl0bGUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUubG9hZEl0ZW1zID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUubmF2SWQgPSAkc2NvcGUuTmF2SXRlbUNvbnRyb2xsZXIuTmF2Q29udHJvbGxlci5uYXZEYXRhLmlkO1xuXG5cdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L2ZpbmQtbmF2LWl0ZW1zJywgeyBwYXJhbXM6IHsgbmF2SWQgOiAkc2NvcGUubmF2SWQgfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHNjb3BlLml0ZW1zID0gcmVzcG9uc2UuZGF0YTtcblx0XHRcdFx0JHNjb3BlLmlzT3BlbiA9IHRydWU7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS5pdGVtU2VsZWN0aW9uWyd0b0xhbmdJZCddID0gJHNjb3BlLk5hdkl0ZW1Db250cm9sbGVyLmxhbmcuaWQ7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtZnJvbS1wYWdlJywgJC5wYXJhbSgkc2NvcGUuaXRlbVNlbGVjdGlvbiksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX2FkZGVkX3RyYW5zbGF0aW9uX29rJ10pO1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtQ29udHJvbGxlci5yZWZyZXNoKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IoaTE4blsnanNfYWRkZWRfdHJhbnNsYXRpb25fZXJyb3InXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zTWVudVRyZWVDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRyb290U2NvcGUnLCAnJHN0YXRlJywgJyRodHRwJywgJyRmaWx0ZXInLCAnU2VydmljZU1lbnVEYXRhJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLCAnU2VydmljZUN1cnJlbnRXZWJzaXRlJywgZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkc3RhdGUsICRodHRwLCAkZmlsdGVyLCBTZXJ2aWNlTWVudURhdGEsIFNlcnZpY2VMaXZlRWRpdE1vZGUsIFNlcnZpY2VDdXJyZW50V2Vic2l0ZSkge1xuXG5cdFx0Ly8gbGl2ZSBlZGl0IHNlcnZpY2VcblxuXHRcdCRzY29wZS5saXZlRWRpdFN0YXRlID0gMDtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2xpdmVFZGl0U3RhdGVUb2dnbGVyJywgZnVuY3Rpb24obikge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUubG9hZENtc0NvbmZpZyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLWFkbWluL2NvbmZpZycpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0JHJvb3RTY29wZS5jbXNDb25maWcgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUubG9hZENtc0NvbmZpZygpO1xuXHRcdFxuXHRcdC8vIG1lbnUgRGF0YVxuXG5cdFx0JHNjb3BlLm1lbnVEYXRhID0gU2VydmljZU1lbnVEYXRhLmRhdGE7XG5cdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpNZW51RGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHQkc2NvcGUubWVudURhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0fTtcblxuXHRcdC8vIENvbnRhaW5zIHRoZSBjdXJyZW50IHdlYnNpdGUgaWQsIGlzIGluaXRpYWxpemVkIHdpdGggZmFsc2UgYXMgdmFsdWVcblx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGVUb2dnbGVyID0gZmFsc2VcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2N1cnJlbnRXZWJzaXRlVG9nZ2xlcicsIGZ1bmN0aW9uKG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuXHRcdFx0aWYgKG5ld1ZhbHVlICYmIG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkge1xuXHRcdFx0XHRTZXJ2aWNlQ3VycmVudFdlYnNpdGUudG9nZ2xlKG5ld1ZhbHVlKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIGluaXRpYWxpemUgdGhlIHN0YXRlIG9mIHRoZSBjdXJyZW50IG1lbnUgc2VydmljZVxuXHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IFNlcnZpY2VDdXJyZW50V2Vic2l0ZS5jdXJyZW50V2Vic2l0ZVxuXG5cdFx0Ly8gaWYgdGhlIHN0YXRlIGhhcyByZWNpdmVkIGEgdmFsdWUsIGFmdGVyIHRoZSBzZXJ2aWNlIGV2ZW50IGhhcyBiZWVuIHRyaWdnZXJlZCwgdGhpcyBlbnN1cmVzXG5cdFx0Ly8gdGhlIGN1cnJlbnQgd2Vic2l0ZSBpcyBkaXNwbGF5ZWQuIExpa2UgYSBsYXp5IGxvYWQgZW5zdXJhbmNlXG5cdFx0aWYgKCRzY29wZS5jdXJyZW50V2Vic2l0ZSkge1xuXHRcdFx0JHNjb3BlLmN1cnJlbnRXZWJzaXRlVG9nZ2xlciA9ICRzY29wZS5jdXJyZW50V2Vic2l0ZS5pZFxuXHRcdH1cblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5jdXJyZW50V2Vic2l0ZSA9IGRhdGE7XG5cdFx0XHQkc2NvcGUuY3VycmVudFdlYnNpdGVUb2dnbGVyID0gZGF0YS5pZDtcblx0XHRcdFNlcnZpY2VNZW51RGF0YS5sb2FkKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBjb250cm9sbGVyIGxvZ2ljXG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BFbXB0eUNvbnRhaW5lciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixjYXRJZCkge1xuXHRcdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS10by1jb250YWluZXInLCB7IHBhcmFtczoge21vdmVJdGVtSWQ6IGRyYWdnZWQuaWQsIGRyb3BwZWRPbkNhdElkOiBjYXRJZH19KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlcykge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLmRyb3BJdGVtID0gZnVuY3Rpb24oZHJhZyxkcm9wLHBvcykge1xuXHRcdFx0aWYgKHBvcyA9PSAnYm90dG9tJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLWFmdGVyJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkQWZ0ZXJJdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fSBlbHNlIGlmIChwb3MgPT0gJ3RvcCcpIHtcblx0XHRcdFx0dmFyIGFwaSA9ICdhZG1pbi9hcGktY21zLW5hdml0ZW0vbW92ZS1iZWZvcmUnO1xuXHRcdFx0XHR2YXIgcGFyYW1zID0ge21vdmVJdGVtSWQ6IGRyYWcuaWQsIGRyb3BwZWRCZWZvcmVJdGVtSWQ6IGRyb3AuaWR9O1xuXG5cdFx0XHR9IGVsc2UgaWYgKHBvcyA9PSAnbWlkZGxlJykge1xuXHRcdFx0XHR2YXIgYXBpID0gJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9tb3ZlLXRvLWNoaWxkJztcblx0XHRcdFx0dmFyIHBhcmFtcyA9IHttb3ZlSXRlbUlkOiBkcmFnLmlkLCBkcm9wcGVkT25JdGVtSWQ6IGRyb3AuaWR9O1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQkaHR0cC5nZXQoYXBpLCB7IHBhcmFtcyA6IHBhcmFtcyB9KS50aGVuKGZ1bmN0aW9uKHN1Y2Nlc3MpIHtcblx0XHRcdFx0U2VydmljZU1lbnVEYXRhLmxvYWQodHJ1ZSk7XG5cdFx0XHR9LCBmdW5jdGlvbihlcnJvcikge1xuXHRcdFx0XHRTZXJ2aWNlTWVudURhdGEubG9hZCh0cnVlKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnZhbGlkSXRlbSA9IGZ1bmN0aW9uKGhvdmVyLCBkcmFnZWQpIHtcblx0XHRcdFxuXHRcdFx0aWYgKGhvdmVyLmlkID09IGRyYWdlZC5pZCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdCRzY29wZS5ycml0ZW1zID0gW107XG5cdFx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkoZHJhZ2VkLm5hdl9jb250YWluZXJfaWQsIGRyYWdlZC5pZCk7XG5cdFx0XHRcblx0XHRcdGlmICgkc2NvcGUucnJpdGVtcy5pbmRleE9mKGhvdmVyLmlkKSA9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cdFx0XG5cdFx0JHNjb3BlLnJyaXRlbXMgPSBbXTtcblx0XHRcblx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkgPSBmdW5jdGlvbihjb250YWluZXJJZCwgcGFyZW50TmF2SWQpIHtcblx0XHRcdHZhciBpdGVtcyA9ICRmaWx0ZXIoJ21lbnVwYXJlbnRmaWx0ZXInKSgkc2NvcGUubWVudURhdGEuaXRlbXMsIGNvbnRhaW5lcklkLCBwYXJlbnROYXZJZCk7XG5cdFx0XHRcblx0XHRcdGFuZ3VsYXIuZm9yRWFjaChpdGVtcywgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHQkc2NvcGUucnJpdGVtcy5wdXNoKGl0ZW0uaWQpO1xuXHRcdFx0XHQkc2NvcGUucmVjdXJzaXZJdGVtVmFsaWRpdHkoY29udGFpbmVySWQsIGl0ZW0uaWQpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVJdGVtID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEudG9nZ2xlX29wZW4gPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGRhdGFbJ3RvZ2dsZV9vcGVuJ10gPSAxO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZGF0YVsndG9nZ2xlX29wZW4nXSA9ICFkYXRhLnRvZ2dsZV9vcGVuO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi90cmVlLWhpc3RvcnknLCB7ZGF0YTogZGF0YX0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cblx0XHR9O1xuXG5cdFx0JHNjb3BlLmdvID0gZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoZGF0YS5uYXZfaXRlbV9pZCwgMCk7XG5cdFx0XHQkc3RhdGUuZ28oJ2N1c3RvbS5jbXNlZGl0JywgeyBuYXZJZCA6IGRhdGEuaWQgfSk7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuc2hvd0RyYWcgPSAwO1xuXG5cdCAgICAkc2NvcGUuaXNDdXJyZW50RWxlbWVudCA9IGZ1bmN0aW9uKGRhdGEpIHtcblx0ICAgIFx0aWYgKGRhdGEgIT09IG51bGwgJiYgJHN0YXRlLnBhcmFtcy5uYXZJZCA9PSBkYXRhLmlkKSB7XG5cdCAgICBcdFx0cmV0dXJuIHRydWU7XG5cdCAgICBcdH1cblxuXHQgICAgXHRyZXR1cm4gZmFsc2U7XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuaGlkZGVuQ2F0cyA9IFtdO1xuXG5cdCAgICAkc2NvcGUuJHdhdGNoKCdtZW51RGF0YScsIGZ1bmN0aW9uIChuLCBvKSB7XG5cdCAgICBcdCRzY29wZS5oaWRkZW5DYXRzID0gbi5oaWRkZW5DYXRzO1xuXHQgICAgfSk7XG5cblx0XHQkc2NvcGUudG9nZ2xlQ2F0ID0gZnVuY3Rpb24oY2F0SWQpIHtcblx0XHRcdGlmIChjYXRJZCBpbiAkc2NvcGUuaGlkZGVuQ2F0cykge1xuXHRcdFx0XHQkc2NvcGUuaGlkZGVuQ2F0c1tjYXRJZF0gPSAhJHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JHNjb3BlLmhpZGRlbkNhdHNbY2F0SWRdID0gMTtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvc2F2ZS1jYXQtdG9nZ2xlJywge2NhdElkOiBjYXRJZCwgc3RhdGU6ICRzY29wZS5oaWRkZW5DYXRzW2NhdElkXX0sIHtpZ25vcmVMb2FkaW5nQmFyOiB0cnVlfSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVJc0hpZGRlbiA9IGZ1bmN0aW9uKGNhdElkKSB7XG5cblx0XHRcdGlmICgkc2NvcGUuaGlkZGVuQ2F0cyA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY2F0SWQgaW4gJHNjb3BlLmhpZGRlbkNhdHMpIHtcblx0XHRcdFx0aWYgKCRzY29wZS5oaWRkZW5DYXRzW2NhdElkXSA9PSAxKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zYWRtaW5DcmVhdGVDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRxJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkcSwgJGh0dHApIHtcblxuXHRcdCRzY29wZS5kYXRhID0ge307XG5cdFx0JHNjb3BlLmRhdGEuaXNJbmxpbmUgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcGFnZScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAyKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLW1vZHVsZScsICQucGFyYW0oJHNjb3BlLmRhdGEpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRyZWplY3QocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoJHNjb3BlLmRhdGEubmF2X2l0ZW1fdHlwZSA9PSAzKSB7XG5cdFx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvY3JlYXRlLXJlZGlyZWN0JywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiQ21zYWRtaW5DcmVhdGVJbmxpbmVDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRxJywgJyRodHRwJywgZnVuY3Rpb24oJHNjb3BlLCAkcSwgJGh0dHApIHtcblxuXHRcdCRzY29wZS5kYXRhID0ge1xuXHRcdFx0bmF2X2lkIDogJHNjb3BlLiRwYXJlbnQuTmF2Q29udHJvbGxlci5pZFxuXHRcdH07XG5cblx0XHQkc2NvcGUuZGF0YS5pc0lubGluZSA9IHRydWU7XG5cblx0XHQkc2NvcGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQkc2NvcGUuZGF0YS5sYW5nX2lkID0gJHNjb3BlLmxhbmcuaWQ7XG5cblx0XHRcdHZhciBoZWFkZXJzID0ge1wiaGVhZGVyc1wiIDogeyBcIkNvbnRlbnQtVHlwZVwiIDogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7IGNoYXJzZXQ9VVRGLThcIiB9fTtcblxuXHRcdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtcGFnZS1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICgkc2NvcGUuZGF0YS5uYXZfaXRlbV90eXBlID09IDIpIHtcblx0XHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9jcmVhdGUtbW9kdWxlLWl0ZW0nLCAkLnBhcmFtKCRzY29wZS5kYXRhKSwgaGVhZGVycykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0cmVqZWN0KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCRzY29wZS5kYXRhLm5hdl9pdGVtX3R5cGUgPT0gMykge1xuXHRcdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2NyZWF0ZS1yZWRpcmVjdC1pdGVtJywgJC5wYXJhbSgkc2NvcGUuZGF0YSksIGhlYWRlcnMpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdHJlamVjdChyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cblx0fV0pO1xuXG5cdHphYS5jb250cm9sbGVyKFwiTmF2Q29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckcm9vdFNjb3BlJywgJyRmaWx0ZXInLCAnJHN0YXRlJywgJyRzdGF0ZVBhcmFtcycsICckaHR0cCcsICdQbGFjZWhvbGRlclNlcnZpY2UnLCAnU2VydmljZVByb3BlcnRpZXNEYXRhJywgJ1NlcnZpY2VNZW51RGF0YScsICdTZXJ2aWNlTGFuZ3VhZ2VzRGF0YScsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ0FkbWluTGFuZ1NlcnZpY2UnLCAnSHRtbFN0b3JhZ2UnLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGZpbHRlciwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsICRodHRwLCBQbGFjZWhvbGRlclNlcnZpY2UsIFNlcnZpY2VQcm9wZXJ0aWVzRGF0YSwgU2VydmljZU1lbnVEYXRhLCBTZXJ2aWNlTGFuZ3VhZ2VzRGF0YSwgU2VydmljZUxpdmVFZGl0TW9kZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIEFkbWluQ2xhc3NTZXJ2aWNlLCBBZG1pbkxhbmdTZXJ2aWNlLCBIdG1sU3RvcmFnZSkge1xuXG5cblx0XHQkc2NvcGUucGFnZVNldHRpbmdzT3ZlcmxheUhpZGRlbiA9IHRydWU7XG5cdFx0XG5cdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlUYWIgPSAxO1xuXHRcdFxuXHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5ID0gZnVuY3Rpb24odCkge1xuXHRcdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlUYWIgPSB0O1xuXHRcdFx0JHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW4gPSAhJHNjb3BlLnBhZ2VTZXR0aW5nc092ZXJsYXlIaWRkZW47XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUubmF2Q2ZnID0ge1xuXHRcdFx0aGVscHRhZ3M6ICRyb290U2NvcGUubHV5YWNmZy5oZWxwdGFncyxcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKSB7IHJldHVybiBTZXJ2aWNlTGl2ZUVkaXRNb2RlLnN0YXRlIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5kaXNwbGF5TGl2ZUNvbnRhaW5lciA9IG47XG5cdFx0fSk7XG5cdFx0XG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUudXJsIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdCRzY29wZS5saXZlVXJsID0gbjtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuQWRtaW5MYW5nU2VydmljZSA9IEFkbWluTGFuZ1NlcnZpY2U7XG5cblx0XHQvKiBzZXJ2aWNlIEFkbWluUHJvcGVydHlTZXJ2aWNlIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUucHJvcGVydGllc0RhdGEgPSBTZXJ2aWNlUHJvcGVydGllc0RhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6UHJvcGVydGllc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLnByb3BlcnRpZXNEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdC8qIHNlcnZpY2UgU2VydmljZU1lbnVEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6TWVudURhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VMYW5nYXVnZXNEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUubGFuZ3VhZ2VzRGF0YSA9IFNlcnZpY2VMYW5ndWFnZXNEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxhbmd1YWdlc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuXHRcdFx0JHNjb3BlLmxhbmd1YWdlc0RhdGEgPSBkYXRhO1xuXHRcdH0pO1xuXG5cdFx0LyogcGxhY2Vob2xkZXJzIHRvZ2dsZXIgc2VydmljZSAqL1xuXG5cdFx0JHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZSA9IFBsYWNlaG9sZGVyU2VydmljZTtcblxuXHRcdCRzY29wZS5wbGFjZWhvbGRlclN0YXRlID0gJHNjb3BlLlBsYWNlaG9sZGVyU2VydmljZS5zdGF0dXM7XG5cblx0XHQkc2NvcGUuJHdhdGNoKCdwbGFjZWhvbGRlclN0YXRlJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdCRzY29wZS5QbGFjZWhvbGRlclNlcnZpY2UuZGVsZWdhdGUobik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvKiBCbG9ja2hvbGRlciBzaXplIHRvZ2dsZXIgKi9cblxuICAgICAgICAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsID0gSHRtbFN0b3JhZ2UuZ2V0VmFsdWUoJ2Jsb2NraG9sZGVyVG9nZ2xlU3RhdGUnLCB0cnVlKTtcblxuICAgICAgICAkc2NvcGUudG9nZ2xlQmxvY2tob2xkZXJTaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkc2NvcGUuaXNCbG9ja2hvbGRlclNtYWxsID0gISRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGw7XG4gICAgICAgICAgICBIdG1sU3RvcmFnZS5zZXRWYWx1ZSgnYmxvY2tob2xkZXJUb2dnbGVTdGF0ZScsICRzY29wZS5pc0Jsb2NraG9sZGVyU21hbGwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8qIHNpZGViYXIgbG9naWMgKi9cblxuXHRcdCRzY29wZS5zaWRlYmFyID0gZmFsc2U7XG5cblx0ICAgICRzY29wZS5lbmFibGVTaWRlYmFyID0gZnVuY3Rpb24oKSB7XG5cdCAgICBcdCRzY29wZS5zaWRlYmFyID0gdHJ1ZTtcblx0ICAgIH07XG5cblx0ICAgICRzY29wZS50b2dnbGVTaWRlYmFyID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgJHNjb3BlLnNpZGViYXIgPSAhJHNjb3BlLnNpZGViYXI7XG5cdCAgICB9O1xuXG5cdFx0LyogYXBwIGxvZ2ljICovXG5cblx0ICAgICRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cblx0XHQkc2NvcGUuaWQgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMubmF2SWQpO1xuXG5cdFx0JHNjb3BlLmlzRGVsZXRlZCA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLkFkbWluQ2xhc3NTZXJ2aWNlID0gQWRtaW5DbGFzc1NlcnZpY2U7XG5cblx0XHQkc2NvcGUucHJvcFZhbHVlcyA9IHt9O1xuXG5cdFx0JHNjb3BlLmhhc1ZhbHVlcyA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLnBhZ2VUYWdzID0gW107XG5cblx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyA9IGZ1bmN0aW9uKHBhcmVudE5hdklkLCBjb250YWluZXJJZCkge1xuXHQgICAgXHR2YXIgaXRlbSA9ICRmaWx0ZXIoJ21lbnVjaGlsZGZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywgY29udGFpbmVySWQsIHBhcmVudE5hdklkKTtcblx0ICAgIFx0aWYgKGl0ZW0pIHtcblx0ICAgIFx0XHRpdGVtLnRvZ2dsZV9vcGVuID0gMTtcblx0ICAgIFx0XHQkc2NvcGUuYnViYmxlUGFyZW50cyhpdGVtLnBhcmVudF9uYXZfaWQsIGl0ZW0ubmF2X2NvbnRhaW5lcl9pZCk7XG5cdCAgICBcdH1cblx0ICAgIH07XG5cblx0XHQkc2NvcGUuY3JlYXRlRGVlcFBhZ2VDb3B5ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9kZWVwLXBhZ2UtY29weScsIHtuYXZJZDogJHNjb3BlLmlkfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKTtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc19wYWdlX2NyZWF0ZV9jb3B5X3N1Y2Nlc3MnXSk7XG5cdFx0XHRcdCRzY29wZS5zaG93QWN0aW9ucyA9IDE7XG5cdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvckFycmF5KHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5wYWdlVGFncyA9IFtdO1xuXG5cdFx0JGh0dHAuZ2V0KCdhZG1pbi9hcGktY21zLW5hdi8nICsgJHNjb3BlLmlkICsgJy90YWdzJykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLmRhdGEsIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdCRzY29wZS5wYWdlVGFncy5wdXNoKHZhbHVlLmlkKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLnNhdmVQYWdlVGFncyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXYvJyArICRzY29wZS5pZCArICcvdGFncycsICRzY29wZS5wYWdlVGFncykudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX2NvbmZpZ191cGRhdGVfc3VjY2VzcyddKTtcblx0XHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yQXJyYXkocmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmNyZWF0ZURlZXBQYWdlQ29weUFzVGVtcGxhdGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L2RlZXAtcGFnZS1jb3B5LWFzLXRlbXBsYXRlJywge25hdklkOiAkc2NvcGUuaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5bJ2pzX3BhZ2VfY3JlYXRlX2NvcHlfYXNfdGVtcGxhdGVfc3VjY2VzcyddKTtcblx0XHRcdFx0JHNjb3BlLnNob3dBY3Rpb25zID0gMTtcblx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2N1c3RvbS5jbXNkcmFmdCcpO1xuXHRcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMgPSBmdW5jdGlvbigpIHtcblx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvZ2V0LXByb3BlcnRpZXMnLCB7IHBhcmFtczoge25hdklkOiAkc2NvcGUuaWR9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRmb3IodmFyIGkgaW4gcmVzcG9uc2UuZGF0YSkge1xuXHRcdFx0XHRcdHZhciBkID0gcmVzcG9uc2UuZGF0YVtpXTtcblx0XHRcdFx0XHQkc2NvcGUucHJvcFZhbHVlc1tkLmFkbWluX3Byb3BfaWRdID0gZC52YWx1ZTtcblx0XHRcdFx0XHQkc2NvcGUuaGFzVmFsdWVzID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVQcm9wTWFzayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9ICEkc2NvcGUuc2hvd1Byb3BGb3JtO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuc2hvd1Byb3BGb3JtID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuc3RvcmVQcm9wVmFsdWVzID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaGVhZGVycyA9IHtcImhlYWRlcnNcIiA6IHsgXCJDb250ZW50LVR5cGVcIiA6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PVVURi04XCIgfX07XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdi9zYXZlLXByb3BlcnRpZXM/bmF2SWQ9Jyskc2NvcGUuaWQsICQucGFyYW0oJHNjb3BlLnByb3BWYWx1ZXMpLCBoZWFkZXJzKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blsnanNfcGFnZV9wcm9wZXJ0eV9yZWZyZXNoJ10pO1xuXHRcdFx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMoKTtcblx0XHRcdFx0JHNjb3BlLnNob3dQcm9wRm9ybSA9IGZhbHNlO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50cmFzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuWydqc19wYWdlX2NvbmZpcm1fZGVsZXRlJ10sIGkxOG5bJ2Ntc2FkbWluX3NldHRpbmdzX3RyYXNocGFnZV90aXRsZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHQkaHR0cC5nZXQoJ2FkbWluL2FwaS1jbXMtbmF2L2RlbGV0ZScsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5pZCB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdFx0JHNjb3BlLmlzRGVsZXRlZCA9IHRydWU7XG5cdCAgICBcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHQgICAgXHRcdFx0XHQkdG9hc3QuY2xvc2UoKTtcblx0ICAgIFx0XHRcdFx0JHNjb3BlLnRvZ2dsZVBhZ2VTZXR0aW5nc092ZXJsYXkoKTtcblx0ICAgIFx0XHRcdH0pO1xuXHQgICAgXHRcdH0sIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlLnN0YXR1cyA9PSA0MTcpIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3BhZ2VfZGVsZXRlX2Vycm9yX2NhdXNlX3JlZGlyZWN0cyddKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3JBcnJheShyZXNwb25zZS5kYXRhKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fV0pO1xuXHQgICAgfTtcblxuXHQgICAgJHNjb3BlLmlzRHJhZnQgPSBmYWxzZTtcblxuXHQgICAgJHNjb3BlLnN1Ym1pdE5hdkZvcm0gPSBmdW5jdGlvbihkYXRhKSB7XG5cdCAgICBcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2L3VwZGF0ZT9pZD0nICsgJHNjb3BlLm5hdkRhdGEuaWQsIGRhdGEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0ICAgIFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV91cGRhdGVfbGF5b3V0X3NhdmVfc3VjY2VzcycpKTtcblx0ICAgIFx0XHQkc2NvcGUudG9nZ2xlUGFnZVNldHRpbmdzT3ZlcmxheSgpO1xuXHQgICAgXHR9LCBmdW5jdGlvbihyZXNwb25zZSkge1xuXHQgICAgXHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5kYXRhLCBmdW5jdGlvbih2YWx1ZSkge1xuXHQgICAgXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuZXJyb3IodmFsdWUubWVzc2FnZSk7XG5cdCAgICBcdFx0fSk7XG5cdCAgICBcdH0pO1xuXHQgICAgfTtcblxuXHQgICAgZnVuY3Rpb24gaW5pdGlhbGl6ZXIoKSB7XG5cdFx0XHQkc2NvcGUubmF2RGF0YSA9ICRmaWx0ZXIoJ2ZpbHRlcicpKCRzY29wZS5tZW51RGF0YS5pdGVtcywge2lkOiAkc2NvcGUuaWR9LCB0cnVlKVswXTtcblx0XHRcdGlmICgkc2NvcGUubmF2RGF0YSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0JHNjb3BlLmlzRHJhZnQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQkc2NvcGUubG9hZE5hdlByb3BlcnRpZXMoKTtcblxuXHRcdFx0XHQvKiBwcm9wZXJ0aWVzIC0tPiAqL1xuXG5cdFx0XHQgICAgJHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuICRzY29wZS5uYXZEYXRhLmlzX29mZmxpbmUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0ICAgIFx0aWYgKG4gIT09IG8gJiYgbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHQgICAgXHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLW9mZmxpbmUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIG9mZmxpbmVTdGF0dXMgOiBuIH19KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHRcdGlmICgkc2NvcGUubmF2RGF0YS5pc19vZmZsaW5lID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfb2ZmbGluZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuaW5mbyhpMThuUGFyYW0oJ2pzX3N0YXRlX29ubGluZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdCAgICBcdFx0fSk7XG5cdFx0XHQgICAgXHR9XG5cdFx0XHQgICAgfSk7XG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfaGlkZGVuIH0sIGZ1bmN0aW9uKG4sIG8pIHtcblx0XHRcdFx0XHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLWhpZGRlbicsIHsgcGFyYW1zIDogeyBuYXZJZCA6ICRzY29wZS5uYXZEYXRhLmlkICwgaGlkZGVuU3RhdHVzIDogbiB9fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfaGlkZGVuID09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfaGlkZGVuJywge3RpdGxlOiAkc2NvcGUubmF2RGF0YS50aXRsZX0pKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfc3RhdGVfdmlzaWJsZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdCAgICAkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLm5hdkRhdGEuaXNfaG9tZSB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQgICAgXHRpZiAobiAhPT0gbyAmJiBuICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdCRodHRwLmdldCgnYWRtaW4vYXBpLWNtcy1uYXYvdG9nZ2xlLWhvbWUnLCB7IHBhcmFtcyA6IHsgbmF2SWQgOiAkc2NvcGUubmF2RGF0YS5pZCAsIGhvbWVTdGF0ZSA6IG4gfX0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLm1lbnVEYXRhUmVsb2FkKCkudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoJHNjb3BlLm5hdkRhdGEuaXNfaG9tZSA9PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfc3RhdGVfaXNfaG9tZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc19zdGF0ZV9pc19ub3RfaG9tZScsIHt0aXRsZTogJHNjb3BlLm5hdkRhdGEudGl0bGV9KSk7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS50b2dnbGVQYWdlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHQgICAgXHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdFx0aW5pdGlhbGl6ZXIoKTtcblx0fV0pO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0gJHNjb3BlLmxhbmcgZnJvbSBuZy1yZXBlYXRcblx0ICovXG5cdHphYS5jb250cm9sbGVyKFwiTmF2SXRlbUNvbnRyb2xsZXJcIiwgW1xuXHRcdCckc2NvcGUnLCAnJHJvb3RTY29wZScsICckaHR0cCcsICckZmlsdGVyJywgJyR0aW1lb3V0JywgJ1NlcnZpY2VNZW51RGF0YScsICdBZG1pbkxhbmdTZXJ2aWNlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VMaXZlRWRpdE1vZGUnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24nLFxuXHRcdGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGh0dHAsICRmaWx0ZXIsICR0aW1lb3V0LCBTZXJ2aWNlTWVudURhdGEsIEFkbWluTGFuZ1NlcnZpY2UsIEFkbWluVG9hc3RTZXJ2aWNlLCBTZXJ2aWNlTGl2ZUVkaXRNb2RlLCBTZXJ2aWNlTGF5b3V0c0RhdGEsIFNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb24pIHtcblxuXHRcdCRzY29wZS5sb2FkZWQgPSBmYWxzZTtcblxuXHRcdCRzY29wZS5OYXZDb250cm9sbGVyID0gJHNjb3BlLiRwYXJlbnQ7XG5cblx0XHQkc2NvcGUubGl2ZUVkaXRTdGF0ZSA9IGZhbHNlO1xuXG5cdFx0JHNjb3BlLiR3YXRjaChmdW5jdGlvbigpIHsgcmV0dXJuIFNlcnZpY2VMaXZlRWRpdE1vZGUuc3RhdGUgfSwgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0JHNjb3BlLmxpdmVFZGl0U3RhdGUgPSBuO1xuXHRcdH0pO1xuXG5cdFx0JHNjb3BlLm9wZW5MaXZlVXJsID0gZnVuY3Rpb24oaWQsIHZlcnNpb25JZCkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoaWQsIHZlcnNpb25JZCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5sb2FkTGl2ZVVybCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUxpdmVFZGl0TW9kZS5jaGFuZ2VVcmwoJHNjb3BlLml0ZW0uaWQsICRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24pO1xuXHRcdH07XG5cblx0XHQvLyBsYXlvdXRzRGF0YVxuXG5cdFx0JHNjb3BlLmxheW91dHNEYXRhID0gU2VydmljZUxheW91dHNEYXRhLmRhdGE7XG5cbiAgICBcdCRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgXHRcdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG4gICAgXHR9KTtcblx0XHRcblx0XHQvLyBzZXJ2aWNlTWVudURhdGEgaW5oZXJpdGFuY2VcblxuXHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuJG9uKCdzZXJ2aWNlOkxvYWRMYW5ndWFnZScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdFx0XHRpZiAoISRzY29wZS5sb2FkZWQpIHtcblx0XHRcdFx0JHNjb3BlLnJlZnJlc2goKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIHByb3BlcnRpZXM6XG5cblx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gZmFsc2U7XG5cblx0XHQkc2NvcGUuaXRlbSA9IFtdO1xuXG5cdFx0JHNjb3BlLml0ZW1Db3B5ID0gW107XG5cblx0XHQkc2NvcGUuc2V0dGluZ3MgPSBmYWxzZTtcblxuXHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBbXTtcblxuXHRcdCRzY29wZS50eXBlRGF0YSA9IFtdO1xuXG5cdFx0JHNjb3BlLmNvbnRhaW5lciA9IFtdO1xuXG5cdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXG5cdFx0JHNjb3BlLmhvbWVVcmwgPSAkcm9vdFNjb3BlLmx1eWFjZmcuaG9tZVVybDtcblxuXHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFxuXHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcztcblxuXHRcdCRzY29wZS50cmFzaEl0ZW0gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUubGFuZy5pc19kZWZhdWx0ID09IDApIHtcblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2UuY29uZmlybShpMThuWydqc19wYWdlX2NvbmZpcm1fZGVsZXRlJ10sIGkxOG5bJ2Ntc2FkbWluX3NldHRpbmdzX3RyYXNocGFnZV90aXRsZSddLCBbJyR0b2FzdCcsIGZ1bmN0aW9uKCR0b2FzdCkge1xuXHRcdFx0XHRcdCRodHRwLmRlbGV0ZSgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2RlbGV0ZT9uYXZJdGVtSWQ9JyArICRzY29wZS5pdGVtLmlkKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUubWVudURhdGFSZWxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pdGVtID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5pdGVtQ29weSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc2V0dGluZ3MgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUudHlwZURhdGEgPSBbXTtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IFtdO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuZXJyb3JzID0gW107XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSAwO1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUuJGJyb2FkY2FzdCgnZGVsZXRlZE5hdkl0ZW0nKTtcblx0XHRcdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0ICAgIFx0XHRcdH0pO1xuXHRcdCAgICBcdFx0fSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5bJ2pzX3BhZ2VfZGVsZXRlX2Vycm9yX2NhdXNlX3JlZGlyZWN0cyddKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fV0pO1xuXHRcdFx0fVxuXHQgICAgfTtcblxuXHRcdCRzY29wZS5yZXNldCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0JHNjb3BlLml0ZW1Db3B5ID0gYW5ndWxhci5jb3B5KCRzY29wZS5pdGVtKTtcblx0XHRcdGlmICgkc2NvcGUuaXRlbS5uYXZfaXRlbV90eXBlID09IDEpIHtcblx0XHRcdFx0JHNjb3BlLnR5cGVEYXRhQ29weSA9IGFuZ3VsYXIuY29weSh7J25hdl9pdGVtX3R5cGVfaWQnIDogJHNjb3BlLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZCB9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRzY29wZS50eXBlRGF0YUNvcHkgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLnR5cGVEYXRhKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnVwZGF0ZU5hdkl0ZW1EYXRhID0gZnVuY3Rpb24oaXRlbUNvcHksIHR5cGVEYXRhQ29weSkge1xuXHRcdFx0JHNjb3BlLmVycm9ycyA9IFtdO1xuXHRcdFx0dmFyIGhlYWRlcnMgPSB7XCJoZWFkZXJzXCIgOiB7IFwiQ29udGVudC1UeXBlXCIgOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDsgY2hhcnNldD1VVEYtOFwiIH19O1xuXHRcdFx0dmFyIG5hdkl0ZW1JZCA9IGl0ZW1Db3B5LmlkO1xuXG5cdFx0XHR0eXBlRGF0YUNvcHkudGl0bGUgPSBpdGVtQ29weS50aXRsZTtcblx0XHRcdHR5cGVEYXRhQ29weS5hbGlhcyA9IGl0ZW1Db3B5LmFsaWFzO1xuXHRcdFx0dHlwZURhdGFDb3B5LnRpdGxlX3RhZyA9IGl0ZW1Db3B5LnRpdGxlX3RhZztcblx0XHRcdHR5cGVEYXRhQ29weS5kZXNjcmlwdGlvbiA9IGl0ZW1Db3B5LmRlc2NyaXB0aW9uO1xuXHRcdFx0dHlwZURhdGFDb3B5LmtleXdvcmRzID0gaXRlbUNvcHkua2V5d29yZHM7XG5cdFx0XHR0eXBlRGF0YUNvcHkudGltZXN0YW1wX2NyZWF0ZSA9IGl0ZW1Db3B5LnRpbWVzdGFtcF9jcmVhdGU7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaW1hZ2VfaWQgPSBpdGVtQ29weS5pbWFnZV9pZDtcblx0XHRcdHR5cGVEYXRhQ29weS5pc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQgPSBpdGVtQ29weS5pc191cmxfc3RyaWN0X3BhcnNpbmdfZGlzYWJsZWQ7XG5cdFx0XHR0eXBlRGF0YUNvcHkuaXNfY2FjaGVhYmxlID0gaXRlbUNvcHkuaXNfY2FjaGVhYmxlO1xuXHRcdFx0JGh0dHAucG9zdChcblx0XHRcdFx0J2FkbWluL2FwaS1jbXMtbmF2aXRlbS91cGRhdGUtcGFnZS1pdGVtP25hdkl0ZW1JZD0nICsgbmF2SXRlbUlkICsgJyZuYXZJdGVtVHlwZT0nICsgaXRlbUNvcHkubmF2X2l0ZW1fdHlwZSxcblx0XHRcdFx0JC5wYXJhbSh0eXBlRGF0YUNvcHkpLFxuXHRcdFx0XHRoZWFkZXJzXG5cdFx0XHQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0aWYgKGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUgIT09IDEpIHtcblx0XHRcdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHQkc2NvcGUubG9hZGVkID0gZmFsc2U7XG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRcdFx0Lyogc3dpdGNoIHZlcnNpb24gaWYgdHlwZSBpcyBwYWdlICovXG5cdFx0XHRcdFx0aWYgKGl0ZW1Db3B5Lm5hdl9pdGVtX3R5cGUgPT0gMSAmJiB0eXBlb2YgcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdFx0XHRcdC8qIGNob29zZSBnaXZlbiB2ZXJzaW9uIG9yIGNob29zZSBmaXJzdCBhdmFpbGFibGUgdmVyc2lvbiAqL1xuXHRcdFx0XHRcdFx0dmFyIHBhZ2VWZXJzaW9uS2V5ID0gcmVzcG9uc2UuZGF0YVsnaXRlbSddLm5hdl9pdGVtX3R5cGVfaWQ7XG5cdFx0XHRcdFx0XHRpZiAocGFnZVZlcnNpb25LZXkgPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRwYWdlVmVyc2lvbktleSA9IE9iamVjdC5rZXlzKHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ10pWzBdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGFbJ3R5cGVEYXRhJ11bcGFnZVZlcnNpb25LZXldWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbkFsaWFzID0gcmVzcG9uc2UuZGF0YVsndHlwZURhdGEnXVtwYWdlVmVyc2lvbktleV1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSBwYWdlVmVyc2lvbktleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfaXRlbV91cGRhdGVfb2snLCB7J3RpdGxlJzogaXRlbUNvcHkudGl0bGV9KSk7XG5cdFx0XHRcdCRzY29wZS5tZW51RGF0YVJlbG9hZCgpO1xuXHRcdFx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlU2V0dGluZ3NPdmVybGF5KCk7XG5cdFx0XHRcdCRzY29wZS5yZXNldCgpO1xuXHRcdFx0fSwgZnVuY3Rpb24gZXJyb3JDYWxsYmFjayhyZXNwb25zZSkge1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UuZGF0YSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGl0ZW0ubWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ2l0ZW1Db3B5LmFsaWFzJywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4hPW8gJiYgbiE9bnVsbCkge1xuXHRcdFx0XHQkc2NvcGUuaXRlbUNvcHkuYWxpYXMgPSAkZmlsdGVyKCdzbHVnaWZ5Jykobik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUucmVtb3ZlVmVyc2lvbiA9IGZ1bmN0aW9uKHZlcnNpb24pIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blBhcmFtKCdqc192ZXJzaW9uX2RlbGV0ZV9jb25maXJtJywge2FsaWFzOiB2ZXJzaW9uLnZlcnNpb25fYWxpYXN9KSwgaTE4blsnY21zYWRtaW5fdmVyc2lvbl9yZW1vdmUnXSwgWyckdG9hc3QnLCAnJGh0dHAnLCBmdW5jdGlvbigkdG9hc3QsICRodHRwKSB7XG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9yZW1vdmUtcGFnZS12ZXJzaW9uJywge3BhZ2VJZCA6IHZlcnNpb24uaWR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hGb3JjZSgpO1xuXHRcdFx0XHRcdCR0b2FzdC5jbG9zZSgpO1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLnN1Y2Nlc3MoaTE4blBhcmFtKCdqc192ZXJzaW9uX2RlbGV0ZV9jb25maXJtX3N1Y2Nlc3MnLCB7YWxpYXM6IHZlcnNpb24udmVyc2lvbl9hbGlhc30pKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XSk7XG5cdFx0fTtcblx0XHRcbiAgICBcdCRzY29wZS5lZGl0VmVyc2lvbkl0ZW07XG4gICAgXHRcbiAgICBcdCRzY29wZS50YWIgPSAxO1xuICAgIFx0XG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb24gPSBmdW5jdGlvbih2ZXJzaW9uSXRlbSkge1xuICAgIFx0XHQkc2NvcGUuY2hhbmdlVGFiKDQpO1xuICAgIFx0XHQkc2NvcGUuZWRpdFZlcnNpb25JdGVtID0gdmVyc2lvbkl0ZW07XG4gICAgXHR9O1xuXG4gICAgXHQkc2NvcGUuZWRpdFZlcnNpb25VcGRhdGUgPSBmdW5jdGlvbihlZGl0VmVyc2lvbkl0ZW0pIHtcbiAgICBcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL2NoYW5nZS1wYWdlLXZlcnNpb24tbGF5b3V0JywgeydwYWdlSXRlbUlkJzogZWRpdFZlcnNpb25JdGVtLmlkLCAnbGF5b3V0SWQnOiBlZGl0VmVyc2lvbkl0ZW0ubGF5b3V0X2lkLCAnYWxpYXMnOiBlZGl0VmVyc2lvbkl0ZW0udmVyc2lvbl9hbGlhc30pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICBcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG4gICAgXHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuWydqc192ZXJzaW9uX3VwZGF0ZV9zdWNjZXNzJ10pO1xuICAgIFx0XHRcdCRzY29wZS50b2dnbGVTZXR0aW5nc092ZXJsYXkoKTtcblx0XHRcdH0pO1xuICAgIFx0fTtcbiAgICBcdFxuXHRcdCRzY29wZS5nZXRJdGVtID0gZnVuY3Rpb24obGFuZ0lkLCBuYXZJZCkge1xuXHRcdFx0JGh0dHAoe1xuXHRcdFx0ICAgIHVybDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS9uYXYtbGFuZy1pdGVtJyxcblx0XHRcdCAgICBtZXRob2Q6IFwiR0VUXCIsXG5cdFx0XHQgICAgcGFyYW1zOiB7IGxhbmdJZCA6IGxhbmdJZCwgbmF2SWQgOiBuYXZJZCB9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5pdGVtID0gcmVzcG9uc2UuZGF0YVsnaXRlbSddO1xuXHRcdFx0XHQkc2NvcGUudHlwZURhdGEgPSByZXNwb25zZS5kYXRhWyd0eXBlRGF0YSddO1xuXHRcdFx0XHQkc2NvcGUuaXNUcmFuc2xhdGVkID0gdHJ1ZTtcblx0XHRcdFx0JHNjb3BlLnJlc2V0KCk7XG5cdFx0XHRcdFxuXHRcdFx0XHRpZiAoIXJlc3BvbnNlLmRhdGFbJ25hdiddLmlzX2RyYWZ0KSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkNvbnRyb2xsZXIuYnViYmxlUGFyZW50cygkc2NvcGUuTmF2Q29udHJvbGxlci5uYXZEYXRhLnBhcmVudF9uYXZfaWQsICRzY29wZS5OYXZDb250cm9sbGVyLm5hdkRhdGEubmF2X2NvbnRhaW5lcl9pZCk7XG5cdFx0XHRcdFx0aWYgKCRzY29wZS5pdGVtLm5hdl9pdGVtX3R5cGUgPT0gMSkge1xuXG5cdFx0XHRcdFx0XHR2YXIgbGFzdFZlcnNpb24gPSBTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uLmhhc1ZlcnNpb24oJHNjb3BlLml0ZW0uaWQpO1xuXG5cdFx0XHRcdFx0XHRpZiAobGFzdFZlcnNpb24pIHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN3aXRjaFZlcnNpb24obGFzdFZlcnNpb24pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0aWYgKCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSByZXNwb25zZS5kYXRhLml0ZW0ubmF2X2l0ZW1fdHlwZV9pZDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAocmVzcG9uc2UuZGF0YS5pdGVtLm5hdl9pdGVtX3R5cGVfaWQgaW4gcmVzcG9uc2UuZGF0YS50eXBlRGF0YSkge1xuXHRcdFx0XHRcdFx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25BbGlhcyA9ICRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWyd2ZXJzaW9uX2FsaWFzJ107XG5cdFx0XHRcdFx0XHRcdFx0JHNjb3BlLmNvbnRhaW5lciA9IHJlc3BvbnNlLmRhdGEudHlwZURhdGFbJHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbl1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JHNjb3BlLmN1cnJlbnRQYWdlVmVyc2lvbiA9IHJlc3BvbnNlLmRhdGEuaXRlbS5uYXZfaXRlbV90eXBlX2lkO1xuXHRcdFx0XHRcdCRzY29wZS5jb250YWluZXIgPSByZXNwb25zZS5kYXRhLnR5cGVEYXRhWyRzY29wZS5jdXJyZW50UGFnZVZlcnNpb25dWydjb250ZW50QXNBcnJheSddO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0JHNjb3BlLmxvYWRlZCA9IHRydWVcblx0XHRcdH0sIGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0XHRcdC8vIGl0cyBsb2FkZWQsIGJ1dCB0aGUgZGF0YSBkb2VzIG5vdCBleGlzdHMuXG5cdFx0XHRcdCRzY29wZS5sb2FkZWQgPSB0cnVlO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUudmVyc2lvbkRyb3BEb3duVmlzYmlsaXR5ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVZlcnNpb25zRHJvcGRvd24gPSBmdW5jdGlvbigpIHtcblx0XHRcdCRzY29wZS52ZXJzaW9uRHJvcERvd25WaXNiaWxpdHkgPSAhJHNjb3BlLnZlcnNpb25Ecm9wRG93blZpc2JpbGl0eTtcblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5zd2l0Y2hWZXJzaW9uID0gZnVuY3Rpb24ocGFnZVZlcnNpb25pZCwgdG9nZ2xlKSB7XG5cdFx0XHRTZXJ2aWNlV29ya2luZ1BhZ2VWZXJzaW9uLnN0b3JlKCRzY29wZS5pdGVtLmlkLCBwYWdlVmVyc2lvbmlkKTtcblx0XHRcdCRzY29wZS5jb250YWluZXIgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ2NvbnRlbnRBc0FycmF5J107XG5cdFx0XHQkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uQWxpYXMgPSAkc2NvcGUudHlwZURhdGFbcGFnZVZlcnNpb25pZF1bJ3ZlcnNpb25fYWxpYXMnXTtcblx0XHRcdCRzY29wZS5jdXJyZW50UGFnZVZlcnNpb24gPSBwYWdlVmVyc2lvbmlkO1xuXHRcdFx0JHNjb3BlLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRpZiAodG9nZ2xlKcKge1xuXHRcdFx0XHQkc2NvcGUudG9nZ2xlVmVyc2lvbnNEcm9wZG93bigpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaEZvcmNlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKEFkbWluTGFuZ1NlcnZpY2UuaXNJblNlbGVjdGlvbigkc2NvcGUubGFuZy5zaG9ydF9jb2RlKSkge1xuXHRcdFx0XHQkc2NvcGUuZ2V0SXRlbSgkc2NvcGUubGFuZy5pZCwgJHNjb3BlLk5hdkNvbnRyb2xsZXIuaWQpO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyogbmV3IHNldHRpbmdzIG92ZXJsYXkgKi9cblx0XHRcblx0XHQkc2NvcGUuc2V0dGluZ3NPdmVybGF5VmlzaWJpbGl0eSA9IHRydWU7XG5cdFx0XG5cdFx0JHNjb3BlLnRvZ2dsZVNldHRpbmdzT3ZlcmxheSA9IGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0JHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHkgPSAhJHNjb3BlLnNldHRpbmdzT3ZlcmxheVZpc2liaWxpdHk7XG5cdFx0XHRpZiAodGFiKSB7XG5cdFx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFxuXHRcdCRzY29wZS5jaGFuZ2VUYWIgPSBmdW5jdGlvbih0YWIpIHtcblx0XHRcdCRzY29wZS50YWIgPSB0YWI7XG5cdFx0fVxuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFJlZnJlc2ggdGhlIGN1cnJlbnQgbGF5b3V0IGNvbnRhaW5lciBibG9ja3MuXG5cdFx0ICogXG5cdFx0ICogQWZ0ZXIgc3VjY2Vzc2Z1bGwgYXBpIHJlc3BvbnNlIGFsbCBjbXMgbGF5b3V0IGFyZSBmb3JlYWNoIGFuZCB0aGUgdmFsdWVzIGFyZSBwYXNzZWQgdG8gcmV2UGxhY2Vob2xkZXJzKCkgbWV0aG9kLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZWZyZXNoTmVzdGVkID0gZnVuY3Rpb24ocHJldklkLCBwbGFjZWhvbGRlclZhcikge1xuXHRcdFx0JGh0dHAoe1xuXHRcdFx0XHR1cmwgOiAnYWRtaW4vYXBpLWNtcy1uYXZpdGVtL3JlbG9hZC1wbGFjZWhvbGRlcicsXG5cdFx0XHRcdG1ldGhvZCA6ICdHRVQnLFxuXHRcdFx0XHRwYXJhbXMgOiB7IG5hdkl0ZW1QYWdlSWQgOiAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uLCBwcmV2SWQgOiBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyIDogcGxhY2Vob2xkZXJWYXJ9XG5cdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFNlcnZpY2VMaXZlRWRpdE1vZGUuY2hhbmdlVXJsKCRzY29wZS5pdGVtLmlkLCAkc2NvcGUuY3VycmVudFBhZ2VWZXJzaW9uKTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5jb250YWluZXIuX19wbGFjZWhvbGRlcnMsIGZ1bmN0aW9uKHBsYWNlaG9sZGVyKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJldlBsYWNlaG9sZGVycyhwbGFjZWhvbGRlciwgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVzcG9uc2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgcmV2UGxhY2Vob2xkZXJzIG1ldGhvZCBnb2VzIHRyb3VyZ2ggdGhlIG5ldyByb3cvY29sIChncmlkKSBzeXN0ZW0gY29udGFpbmVyIGpzb24gbGF5b3V0IHdoZXJlOlxuXHRcdCAqIFxuXHRcdCAqIHJvd3NbXVsxXSA9IGNvbCBsZWZ0XG5cdFx0ICogcm93c1tdWzJdID0gY29sIHJpZ2h0XG5cdFx0ICogXG5cdFx0ICogV2hlcmUgYSBsYXlvdXQgaGF2ZSBhdCBsZWFzdCBvbiByb3cgd2hpY2ggY2FuIGhhdmUgY29scyBpbnNpZGUuIFNvIHRoZXJlIHJldlBsYWNlaG9sZGVycyBtZXRob2QgZ29lcyB0cm91Z2ggdGhlIGNvbHNcblx0XHQgKiBhbmQgY2hlY2sgaWYgdGhlIGNvbCBpcyBlcXVhbCB0aGUgZ2l2ZW4gY29sIHRvIHJlcGxhY2UgdGhlIGNvbnRlbnQgd2l0aCAgKGZyb20gcmVmcmVzaE5lc3RlZCBtZXRob2QpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZQbGFjZWhvbGRlcnMgPSBmdW5jdGlvbihwbGFjZWhvbGRlcnMsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2gocGxhY2Vob2xkZXJzLCBmdW5jdGlvbihwbGFjZWhvbGRlclJvdywgcGxhY2Vob2xkZXJLZXkpIHtcblx0XHRcdFx0aWYgKHBhcnNlSW50KHByZXZJZCkgPT0gcGFyc2VJbnQocGxhY2Vob2xkZXJSb3cucHJldl9pZCkgJiYgcGxhY2Vob2xkZXJWYXIgPT0gcGxhY2Vob2xkZXJSb3dbJ3ZhciddKSB7XG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJzW3BsYWNlaG9sZGVyS2V5XVsnX19uYXZfaXRlbV9wYWdlX2Jsb2NrX2l0ZW1zJ10gPSByZXBsYWNlQ29udGVudDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQkc2NvcGUucmV2RmluZChwbGFjZWhvbGRlclJvdywgcHJldklkLCBwbGFjZWhvbGRlclZhciwgcmVwbGFjZUNvbnRlbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSByZXZGaW5kIG1ldGhvZCBkb2VzIHRoZSByZWN1cnNpdiBqb2Igd2l0aGluIGEgYmxvY2sgYW4gcGFzc2VzIHRoZSB2YWx1ZSBiYWNrIHRvIHJldlBsYWNlaG9sZGVycygpLlxuXHRcdCAqL1xuXHRcdCRzY29wZS5yZXZGaW5kID0gZnVuY3Rpb24ocGxhY2Vob2xkZXIsIHByZXZJZCwgcGxhY2Vob2xkZXJWYXIsIHJlcGxhY2VDb250ZW50KSB7XG5cdFx0XHRmb3IgKHZhciBpIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXSkge1xuXHRcdFx0XHRmb3IgKHZhciBob2xkZXJLZXkgaW4gcGxhY2Vob2xkZXJbJ19fbmF2X2l0ZW1fcGFnZV9ibG9ja19pdGVtcyddW2ldWydfX3BsYWNlaG9sZGVycyddKSB7XG5cdFx0XHRcdFx0Zm9yICh2YXIgaG9sZGVyIGluIHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldKSB7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmV2UGxhY2Vob2xkZXJzKHBsYWNlaG9sZGVyWydfX25hdl9pdGVtX3BhZ2VfYmxvY2tfaXRlbXMnXVtpXVsnX19wbGFjZWhvbGRlcnMnXVtob2xkZXJLZXldLCBwcmV2SWQsIHBsYWNlaG9sZGVyVmFyLCByZXBsYWNlQ29udGVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRcblx0XHQvKipcblx0XHQgKiBkcm9wcyBpdGVtcyBpbiBhbiBlbXB0eSBwYWdlIHBsYWNlaG9sZGVyIG9mIENNUyBMQVlPVVQgUExBQ0VIT0xERVJcblx0XHQgKi9cblx0XHQkc2NvcGUuZHJvcEl0ZW1QbGFjZWhvbGRlciA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbikge1xuXHRcdFx0aWYgKGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ2Zhdm9yaXplZCcpIHx8IGRyYWdnZWQuaGFzT3duUHJvcGVydHkoJ25ld2Jsb2NrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgbmV3IGJsb2NrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vY3JlYXRlJywge1xuXHRcdFx0XHRcdHByZXZfaWQ6IGRyb3BwZWQucHJldl9pZCwgXG5cdFx0XHRcdFx0c29ydF9pbmRleDowLCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZFsndmFyJ10sIFxuXHRcdFx0XHRcdG5hdl9pdGVtX3BhZ2VfaWQ6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hOZXN0ZWQoZHJvcHBlZFsncHJldl9pZCddLCBkcm9wcGVkWyd2YXInXSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaE5lc3RlZChkcm9wcGVkWydwcmV2X2lkJ10sIGRyb3BwZWRbJ3ZhciddKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBtb3ZpbmcgYW4gZXhpc3RpbmcgYmxvY2tcblx0XHRcdFx0JGh0dHAucHV0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL3VwZGF0ZT9pZD0nICsgZHJhZ2dlZC5pZCwge1xuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IDAsXG5cdFx0XHRcdFx0cHJldl9pZDogIGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkWyd2YXInXSwgXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0fTtcblx0XHRcblx0XHQkc2NvcGUucmVmcmVzaCgpO1xuXHR9XSk7XG5cblx0LyoqXG5cdCAqIEBwYXJhbSAkc2NvcGUuYmxvY2sgRnJvbSBuZy1yZXBlYXQgc2NvcGUgYXNzaWdubWVudFxuXHQgKi9cblx0emFhLmNvbnRyb2xsZXIoXCJQYWdlQmxvY2tFZGl0Q29udHJvbGxlclwiLCBbXG5cdFx0JyRzY29wZScsICckc2NlJywgJyRodHRwJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ0FkbWluVG9hc3RTZXJ2aWNlJywgJ1NlcnZpY2VCbG9ja0NvcHlTdGFjaycsICdTZXJ2aWNlTGl2ZUVkaXRNb2RlJyxcblx0XHRmdW5jdGlvbigkc2NvcGUsICRzY2UsICRodHRwLCBBZG1pbkNsYXNzU2VydmljZSwgQWRtaW5Ub2FzdFNlcnZpY2UsIFNlcnZpY2VCbG9ja0NvcHlTdGFjaywgU2VydmljZUxpdmVFZGl0TW9kZSkge1xuXG5cdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIgPSAkc2NvcGUuJHBhcmVudDtcblxuXHRcdC8qKlxuXHRcdCAqIGRyb3BzIGFuIGl0ZW0gaW4gYW4gZW1wdHkgcGxhY2Vob2xkZXIgb2YgYSBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbVBsYWNlaG9sZGVyID0gZnVuY3Rpb24oZHJhZ2dlZCxkcm9wcGVkLHBvc2l0aW9uKSB7XG5cdFx0XHRpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnZmF2b3JpemVkJykgfHwgZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnbmV3YmxvY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBuZXcgYmxvY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9jcmVhdGUnLCB7XG5cdFx0XHRcdFx0cHJldl9pZCA6IGRyb3BwZWQucHJldl9pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OjAsIFxuXHRcdFx0XHRcdGJsb2NrX2lkIDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXIgOiBkcm9wcGVkLnZhcixcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkIDogZHJvcHBlZC5uYXZfaXRlbV9wYWdlX2lkXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci5yZWZyZXNoTmVzdGVkKGRyb3BwZWQucHJldl9pZCwgZHJvcHBlZC52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZiAoZHJhZ2dlZC5oYXNPd25Qcm9wZXJ0eSgnY29weXN0YWNrJykpIHtcblx0XHRcdFx0Ly8gaXRzIGEgYmxvY2sgZnJvbSBjb3B5IHN0YWNrXG5cdFx0XHRcdCRodHRwLnBvc3QoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbWJsb2NrL2NvcHktYmxvY2stZnJvbS1zdGFjaycsIHtcblx0XHRcdFx0XHRjb3B5QmxvY2tJZDogZHJhZ2dlZC5pZCxcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZCA6IGRyb3BwZWQubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gbW92aW5nIGFuIGV4aXN0aW5nIGJsb2NrXG5cdFx0XHRcdCRodHRwLnB1dCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS91cGRhdGU/aWQ9JyArIGRyYWdnZWQuaWQsIHtcblx0XHRcdFx0XHRzb3J0X2luZGV4OiAwLFxuXHRcdFx0XHRcdHByZXZfaWQ6ICBkcm9wcGVkLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyIDogZHJvcHBlZC52YXIsXG5cdFx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHQkc2NvcGUucmVmcmVzaEZvcmNlKCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogRHJvcHMgYSBibG9jayBhYm92ZS9iZWxvdyBhbiBFWElTVElORyBCTE9DS1xuXHRcdCAqL1xuXHRcdCRzY29wZS5kcm9wSXRlbSA9IGZ1bmN0aW9uKGRyYWdnZWQsZHJvcHBlZCxwb3NpdGlvbixlbGVtZW50KSB7XG5cdFx0XHR2YXIgc29ydEluZGV4ID0gJHNjb3BlLiRpbmRleDtcblx0XHRcdFxuXHRcdFx0aWYgKHBvc2l0aW9uID09ICdib3R0b20nKSB7XG5cdFx0XHRcdHNvcnRJbmRleCA9IHNvcnRJbmRleCArIDE7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdmYXZvcml6ZWQnKSB8fCBkcmFnZ2VkLmhhc093blByb3BlcnR5KCduZXdibG9jaycpKSB7XG5cdFx0XHRcdC8vIGl0cyBhIG5ldyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLW5hdml0ZW1wYWdlYmxvY2tpdGVtL2NyZWF0ZScsIHsgXG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0c29ydF9pbmRleDogc29ydEluZGV4LCBcblx0XHRcdFx0XHRibG9ja19pZDogZHJhZ2dlZC5pZCwgXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLCBcblx0XHRcdFx0XHRuYXZfaXRlbV9wYWdlX2lkOiAkc2NvcGUucGxhY2Vob2xkZXIubmF2X2l0ZW1fcGFnZV9pZFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIucmVmcmVzaE5lc3RlZCgkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCwgJHNjb3BlLnBsYWNlaG9sZGVyLnZhcik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIGlmIChkcmFnZ2VkLmhhc093blByb3BlcnR5KCdjb3B5c3RhY2snKSkge1xuXHRcdFx0XHQvLyBpdHMgYSBibG9jayBmcm9tIGNvcHkgc3RhY2tcblx0XHRcdFx0JGh0dHAucG9zdCgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtYmxvY2svY29weS1ibG9jay1mcm9tLXN0YWNrJywge1xuXHRcdFx0XHRcdGNvcHlCbG9ja0lkOiBkcmFnZ2VkLmlkLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleCxcblx0XHRcdFx0XHRwcmV2X2lkOiAkc2NvcGUucGxhY2Vob2xkZXIucHJldl9pZCxcblx0XHRcdFx0XHRwbGFjZWhvbGRlcl92YXI6ICRzY29wZS5wbGFjZWhvbGRlclsndmFyJ10sXG5cdFx0XHRcdFx0bmF2X2l0ZW1fcGFnZV9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLm5hdl9pdGVtX3BhZ2VfaWRcblx0XHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIG1vdmluZyBhbiBleGlzdGluZyBibG9ja1xuXHRcdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyBkcmFnZ2VkLmlkLCB7XG5cdFx0XHRcdFx0cHJldl9pZDogJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsXG5cdFx0XHRcdFx0cGxhY2Vob2xkZXJfdmFyOiAkc2NvcGUucGxhY2Vob2xkZXJbJ3ZhciddLFxuXHRcdFx0XHRcdHNvcnRfaW5kZXg6IHNvcnRJbmRleFxuXHRcdFx0XHR9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdFx0Lypcblx0XHRcdFx0XHQgKiBAaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9sdXlhZGV2L2x1eWEvaXNzdWVzLzE2Mjlcblx0XHRcdFx0XHQgKiBUaGUgbW92ZWQgYmxvY2ssIHNob3VsZCByZW1vdmVkIGZyb20gdGhlIHByZXZpb3VzIGFycmF5LiBUaGlzIGlzIG9ubHkgdGhlIGNhc2Ugd2hlbiBkcmFnZ2luZyBmcm9tIGFuIE9VVEVSIGJsb2NrIGludG8gYW4gSU5ORVIgYmxvY2tcblx0XHRcdFx0XHQgKiBpcyB0aGlzIHdpbGwgbm90IHJlZnJlc2ggdGhlIE9VVEVSIGJsb2NrLCBidXQgYWx3YXlzIHdpbGwgaW4gdGhlIG9wcG9zaXRlIHdheS5cblx0XHRcdFx0XHQgKi9cblx0XHRcdFx0XHRhbmd1bGFyLmVsZW1lbnQoZWxlbWVudCkucmVtb3ZlKCk7XG5cdFx0XHRcdFx0Ly8gYXMgdGhlIGJsb2NrIGhhcyBiZWVuIHJlbW92ZWQgZnJvbSBleGlzdGluZywgcmVmcmVzaCB0aGUgbmV3IHBsYWNlaG9sZGVyLlxuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdFxuXHRcdCRzY29wZS5jb3B5QmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFNlcnZpY2VCbG9ja0NvcHlTdGFjay5wdXNoKCRzY29wZS5ibG9jayk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVIaWRkZW4gPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2suaXNfaGlkZGVuID09IDApIHtcblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2hpZGRlbiA9IDE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2suaXNfaGlkZGVuID0gMDtcblx0XHRcdH1cblxuXHRcdFx0JGh0dHAoe1xuXHRcdFx0ICAgIHVybDogJ2FkbWluL2FwaS1jbXMtbmF2aXRlbS90b2dnbGUtYmxvY2staGlkZGVuJyxcblx0XHRcdCAgICBtZXRob2Q6IFwiR0VUXCIsXG5cdFx0XHQgICAgcGFyYW1zOiB7IGJsb2NrSWQgOiAkc2NvcGUuYmxvY2suaWQsIGhpZGRlblN0YXRlOiAkc2NvcGUuYmxvY2suaXNfaGlkZGVuIH1cblx0XHRcdH0pLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0LyogbG9hZCBsaXZlIHVybCBvbiBoaWRkZW4gdHJpZ2dlciAqL1xuXHRcdFx0XHQkc2NvcGUuTmF2SXRlbVR5cGVQYWdlQ29udHJvbGxlci4kcGFyZW50LiRwYXJlbnQubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0Ly8gc3VjY2Vzc2Z1bGwgdG9nZ2xlIGhpZGRlbiBzdGF0ZSBvZiBibG9ja1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5pbmZvKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja192aXNiaWxpdHlfY2hhbmdlJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuICAgICAgICAkc2NvcGUuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiAkc2NvcGUuYmxvY2sudmFycyAhPSBcInVuZGVmaW5lZFwiICYmICRzY29wZS5ibG9jay52YXJzLmxlbmd0aCA+IDA7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmlzQ29uZmlndXJhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mICRzY29wZS5ibG9jay5jZmdzICE9IFwidW5kZWZpbmVkXCIgJiYgJHNjb3BlLmJsb2NrLmNmZ3MubGVuZ3RoID4gMDtcbiAgICAgICAgfTtcblx0XHRcblx0XHRcblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhbHVlcyB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZGF0YSA9IG47XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCkgeyByZXR1cm4gJHNjb3BlLmJsb2NrLnZhcmlhdGlvbiB9LCBmdW5jdGlvbihuLCBvKSB7XG5cdFx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eShuKTtcblx0XHR9KTtcblx0XHRcblx0XHQkc2NvcGUuZ2V0SW5mbyA9IGZ1bmN0aW9uKHZhckZpZWxkTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay5maWVsZF9oZWxwLmhhc093blByb3BlcnR5KHZhckZpZWxkTmFtZSkpIHtcblx0XHRcdFx0cmV0dXJuICRzY29wZS5ibG9jay5maWVsZF9oZWxwW3ZhckZpZWxkTmFtZV07XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQkc2NvcGUuZXZhbFZhcmlhdGlvblZpc2JpbGl0eSA9IGZ1bmN0aW9uKHZhcmlhdGVuTmFtZSkge1xuXHRcdFx0aWYgKCRzY29wZS5ibG9jay52YXJpYXRpb25zLmhhc093blByb3BlcnR5KHZhcmlhdGVuTmFtZSkpIHtcblx0XHRcdFx0dmFyIHZhcmlhdGlvbiA9ICRzY29wZS5ibG9jay52YXJpYXRpb25zWyRzY29wZS5ibG9jay52YXJpYXRpb25dO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFyaWF0aW9uLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0aWYgKGFuZ3VsYXIuaXNPYmplY3QodmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRhbmd1bGFyLmZvckVhY2godmFsdWUsIGZ1bmN0aW9uKHYsIGspIHtcblx0XHRcdFx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9ja1trZXldLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoayA9PSBvYmplY3QudmFyKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9jay5jZmdzLCBmdW5jdGlvbihvYmplY3QpIHtcblx0XHRcdFx0XHRvYmplY3QuaW52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLnZhcnMsIGZ1bmN0aW9uKG9iamVjdCkge1xuXHRcdFx0XHRcdG9iamVjdC5pbnZpc2libGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS5jZmdkYXRhID0gJHNjb3BlLmJsb2NrLmNmZ3ZhbHVlcyB8fCB7fTtcblxuXHRcdCRzY29wZS5lZGl0ID0gZmFsc2U7XG5cdFx0XG5cdFx0JHNjb3BlLm1vZGFsSGlkZGVuID0gdHJ1ZTtcblxuXHRcdCRzY29wZS5tb2RhbE1vZGUgPSAxO1xuXG5cdFx0JHNjb3BlLmluaXRNb2RhbE1vZGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdGlmICgkc2NvcGUuYmxvY2sudmFycy5sZW5ndGggID09IDApIHtcblx0XHRcdFx0JHNjb3BlLm1vZGFsTW9kZSA9IDI7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVFZGl0ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoJHNjb3BlLmlzRWRpdGFibGUoKSB8fCAkc2NvcGUuaXNDb25maWd1cmFibGUoKSkge1xuXHRcdFx0XHQkc2NvcGUubW9kYWxIaWRkZW4gPSAhJHNjb3BlLm1vZGFsSGlkZGVuO1xuXHRcdFx0XHQkc2NvcGUuZWRpdCA9ICEkc2NvcGUuZWRpdDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbmRlclRlbXBsYXRlID0gZnVuY3Rpb24odGVtcGxhdGUsIGRhdGFWYXJzLCBjZmdWYXJzLCBibG9jaywgZXh0cmFzKSB7XG5cdFx0XHRpZiAodGVtcGxhdGUgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH1cblx0XHRcdHZhciB0ZW1wbGF0ZSA9IFR3aWcudHdpZyh7XG5cdFx0XHQgICAgZGF0YTogdGVtcGxhdGVcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgY29udGVudCA9IHRlbXBsYXRlLnJlbmRlcih7XG5cdFx0XHRcdHZhcnMgOiBkYXRhVmFycyxcblx0XHRcdFx0Y2ZncyA6IGNmZ1ZhcnMsXG5cdFx0XHRcdGJsb2NrIDogYmxvY2ssXG5cdFx0XHRcdGV4dHJhcyA6IGV4dHJhc1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiAkc2NlLnRydXN0QXNIdG1sKGNvbnRlbnQpO1xuXHRcdH07XG5cblx0XHQkc2NvcGUucmVtb3ZlQmxvY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmNvbmZpcm0oaTE4blBhcmFtKCdqc19wYWdlX2Jsb2NrX2RlbGV0ZV9jb25maXJtJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSksIGkxOG5bJ3ZpZXdfdXBkYXRlX2Jsb2NrX3Rvb2x0aXBfZGVsZXRlJ10sIFsnJHRvYXN0JywgZnVuY3Rpb24oJHRvYXN0KSB7XG5cdFx0XHRcdCRodHRwLmRlbGV0ZSgnYWRtaW4vYXBpLWNtcy1uYXZpdGVtcGFnZWJsb2NraXRlbS9kZWxldGU/aWQ9JyArICRzY29wZS5ibG9jay5pZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLnJlZnJlc2hOZXN0ZWQoJHNjb3BlLnBsYWNlaG9sZGVyLnByZXZfaWQsICRzY29wZS5wbGFjZWhvbGRlci52YXIpO1xuXHRcdFx0XHRcdCRzY29wZS5OYXZJdGVtVHlwZVBhZ2VDb250cm9sbGVyLmxvYWRMaXZlVXJsKCk7XG5cdFx0XHRcdFx0JHRvYXN0LmNsb3NlKCk7XG5cdFx0XHRcdFx0QWRtaW5Ub2FzdFNlcnZpY2Uuc3VjY2VzcyhpMThuUGFyYW0oJ2pzX3BhZ2VfYmxvY2tfcmVtb3ZlX29rJywge25hbWU6ICRzY29wZS5ibG9jay5uYW1lfSkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1dKTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLmlzQW55UmVxdWlyZWRBdHRyaWJ1dGVFbXB0eSA9ICBmdW5jdGlvbigpIHtcblxuXHRcdFx0dmFyIHJlc3BvbnNlID0gZmFsc2U7XG5cdFx0XHRhbmd1bGFyLmZvckVhY2goJHNjb3BlLmJsb2NrLnZhcnMsIGZ1bmN0aW9uKHZhckl0ZW0pIHtcblx0XHRcdFx0aWYgKHZhckl0ZW0ucmVxdWlyZWQgJiYgJHNjb3BlLmlzRW1wdHkoJHNjb3BlLmRhdGEsIHZhckl0ZW0udmFyKSkge1xuXHRcdFx0XHRcdEFkbWluVG9hc3RTZXJ2aWNlLmVycm9yKGkxOG5QYXJhbSgnanNfYmxvY2tfYXR0cmlidXRlX2VtcHR5Jywge2xhYmVsOiB2YXJJdGVtLmxhYmVsfSkpO1xuXHRcdFx0XHRcdHJlc3BvbnNlID0gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGFuZ3VsYXIuZm9yRWFjaCgkc2NvcGUuYmxvY2suY2ZncywgZnVuY3Rpb24odmFySXRlbSkge1xuXG5cdFx0XHRcdGlmICh2YXJJdGVtLnJlcXVpcmVkICYmICRzY29wZS5pc0VtcHR5KCRzY29wZS5jZmdkYXRhLCB2YXJJdGVtLnZhcikpIHtcblx0XHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5lcnJvcihpMThuUGFyYW0oJ2pzX2Jsb2NrX2F0dHJpYnV0ZV9lbXB0eScsIHtsYWJlbDogdmFySXRlbS5sYWJlbH0pKTtcblx0XHRcdFx0XHRyZXNwb25zZSA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5pc0VtcHR5ID0gZnVuY3Rpb24odmFsdWVzLCBrZXkpIHtcblx0XHRcdGlmICh2YWx1ZXMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiB2YWx1ZXNba2V5XSkge1xuXHRcdFx0XHRpZiAodmFsdWVzW2tleV0ubGVuZ3RoID09IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnNhdmUgPSBmdW5jdGlvbihjbG9zZSkge1xuXHRcdFx0aWYgKCRzY29wZS5pc0FueVJlcXVpcmVkQXR0cmlidXRlRW1wdHkoKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5wdXQoJ2FkbWluL2FwaS1jbXMtbmF2aXRlbXBhZ2VibG9ja2l0ZW0vdXBkYXRlP2lkPScgKyAkc2NvcGUuYmxvY2suaWQsIHtcblx0XHRcdFx0anNvbl9jb25maWdfdmFsdWVzOiAkc2NvcGUuZGF0YSxcblx0XHRcdFx0anNvbl9jb25maWdfY2ZnX3ZhbHVlczogJHNjb3BlLmNmZ2RhdGEsXG5cdFx0XHRcdHZhcmlhdGlvbjogJHNjb3BlLmJsb2NrLnZhcmlhdGlvblxuXHRcdFx0fSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRBZG1pblRvYXN0U2VydmljZS5zdWNjZXNzKGkxOG5QYXJhbSgnanNfcGFnZV9ibG9ja191cGRhdGVfb2snLCB7bmFtZTogJHNjb3BlLmJsb2NrLm5hbWV9KSk7XG5cdFx0XHRcdGlmIChjbG9zZSkge1xuXHRcdFx0XHRcdCRzY29wZS50b2dnbGVFZGl0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0JHNjb3BlLmJsb2NrLmlzX2RpcnR5ID0gMTtcblx0XHRcdFx0JHNjb3BlLmJsb2NrID0gYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEub2JqZWN0ZGV0YWlsKTtcblx0XHRcdFx0JHNjb3BlLk5hdkl0ZW1UeXBlUGFnZUNvbnRyb2xsZXIubG9hZExpdmVVcmwoKTtcblx0XHRcdFx0JHNjb3BlLmV2YWxWYXJpYXRpb25WaXNiaWxpdHkoJHNjb3BlLmJsb2NrLnZhcmlhdGlvbik7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XSk7XG5cblx0emFhLmNvbnRyb2xsZXIoXCJEcm9wcGFibGVCbG9ja3NDb250cm9sbGVyXCIsIFsnJHNjb3BlJywgJyRodHRwJywgJ0FkbWluQ2xhc3NTZXJ2aWNlJywgJ1NlcnZpY2VCbG9ja3NEYXRhJywgJ1NlcnZpY2VCbG9ja0NvcHlTdGFjaycsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIEFkbWluQ2xhc3NTZXJ2aWNlLCBTZXJ2aWNlQmxvY2tzRGF0YSwgU2VydmljZUJsb2NrQ29weVN0YWNrKSB7XG5cblx0XHQvKiBzZXJ2aWNlIFNlcnZpY2VCbG9ja3NEYXRhIGluaGVyaXRhbmNlICovXG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IFNlcnZpY2VCbG9ja3NEYXRhLmRhdGE7XG5cblx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlc3RvcmUgPSBhbmd1bGFyLmNvcHkoJHNjb3BlLmJsb2Nrc0RhdGEpO1xuXG5cdFx0JHNjb3BlLiRvbignc2VydmljZTpCbG9ja3NEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcblx0XHRcdCRzY29wZS5ibG9ja3NEYXRhID0gZGF0YTtcblx0XHR9KTtcblxuXHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gU2VydmljZUJsb2Nrc0RhdGEubG9hZCh0cnVlKTtcblx0XHR9XG5cblx0XHQkc2NvcGUuYWRkVG9GYXYgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3RvLWZhdicsIHtibG9jazogaXRlbSB9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG5cdFx0XHRcdCRzY29wZS5ibG9ja3NEYXRhUmVsb2FkKCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0JHNjb3BlLnJlbW92ZUZyb21GYXYgPSBmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3JlbW92ZS1mYXYnLCB7YmxvY2s6IGl0ZW0gfSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCgpO1xuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS50b2dnbGVHcm91cCA9IGZ1bmN0aW9uKGdyb3VwKSB7XG5cdFx0XHRpZiAoZ3JvdXAudG9nZ2xlX29wZW4gPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGdyb3VwLnRvZ2dsZV9vcGVuID0gMTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGdyb3VwLnRvZ2dsZV9vcGVuID0gIWdyb3VwLnRvZ2dsZV9vcGVuO1xuXHRcdFx0fVxuXG5cdFx0XHQkaHR0cC5wb3N0KCdhZG1pbi9hcGktY21zLWJsb2NrL3RvZ2dsZS1ncm91cCcsIHtncm91cDogZ3JvdXB9LCB7aWdub3JlTG9hZGluZ0JhcjogdHJ1ZX0pO1xuXHRcdH07XG5cblx0XHQkc2NvcGUuaXNQcmV2aWV3RW5hYmxlZCA9IGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdHJldHVybiBpdGVtLnByZXZpZXdfZW5hYmxlZDtcblx0XHR9O1xuXG5cdFx0Ly8gY29udHJvbGxlciBsb2dpY1xuXG5cdFx0JHNjb3BlLmNvcHlTdGFjayA9IFNlcnZpY2VCbG9ja0NvcHlTdGFjay5zdGFjaztcblxuXHRcdCRzY29wZS4kb24oJ3NlcnZpY2U6Q29weVN0YWNrJywgZnVuY3Rpb24oZXZlbnQsIHN0YWNrKSB7XG5cdFx0XHQkc2NvcGUuY29weVN0YWNrID0gc3RhY2s7XG5cdFx0fSk7XG5cblx0XHQkc2NvcGUuY2xlYXJTdGFjayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUJsb2NrQ29weVN0YWNrLmNsZWFyKCk7XG5cdFx0fTtcblxuXHRcdCRzY29wZS5zZWFyY2hRdWVyeSA9ICcnO1xuXG5cdFx0JHNjb3BlLnNlYXJjaElzRGlydHkgPSBmYWxzZTtcblxuXHRcdCRzY29wZS4kd2F0Y2goJ3NlYXJjaFF1ZXJ5JywgZnVuY3Rpb24obiwgbykge1xuXHRcdFx0aWYgKG4gIT09ICcnKSB7XG5cdFx0XHRcdCRzY29wZS5zZWFyY2hJc0RpcnR5ID0gdHJ1ZTtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKCRzY29wZS5ibG9ja3NEYXRhLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLmdyb3VwLmlzX2Zhdikge1xuXHRcdFx0XHRcdFx0JHNjb3BlLmJsb2Nrc0RhdGEuc3BsaWNlKGtleSwgMSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhbHVlLmdyb3VwLnRvZ2dsZV9vcGVuID0gMVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSBpZigkc2NvcGUuc2VhcmNoSXNEaXJ0eSkge1xuXHRcdFx0XHQkc2NvcGUuYmxvY2tzRGF0YSA9IGFuZ3VsYXIuY29weSgkc2NvcGUuYmxvY2tzRGF0YVJlc3RvcmUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XSk7XG59KSgpOyIsIi8qKlxuICogYWxsIGdsb2JhbCBhZG1pbiBzZXJ2aWNlc1xuICogXG4gKiBjb250cm9sbGVyIHJlc29sdmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb2hucGFwYS9hbmd1bGFyLXN0eWxlZ3VpZGUjc3R5bGUteTA4MFxuICogXG4gKiBTZXJ2aWNlIEluaGVyaXRhbmNlOlxuICogXG4gKiAxLiBTZXJ2aWNlIG11c3QgYmUgcHJlZml4IHdpdGggU2VydmljZVxuICogMi4gU2VydmljZSBtdXN0IGNvbnRhaW4gYSBmb3JjZVJlbG9hZCBzdGF0ZVxuICogMy4gU2VydmljZSBtdXN0IGJyb2FkY2FzdCBhbiBldmVudCAnc2VydmljZTpGb2xkZXJzRGF0YSdcbiAqIDQuIENvbnRyb2xsZXIgaW50ZWdyYXRpb24gbXVzdCBsb29rIGxpa2VcbiAqIFxuICogYGBgXG4gKiAkc2NvcGUuZm9sZGVyc0RhdGEgPSBTZXJ2aWNlRm9sZGVyc0RhdGEuZGF0YTtcbiAqXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6Rm9sZGVyc0RhdGEnLCBmdW5jdGlvbihldmVudCwgZGF0YSkge1xuICogICAgICAkc2NvcGUuZm9sZGVyc0RhdGEgPSBkYXRhO1xuICogfSk7XG4gKlx0XHRcdFx0XG4gKiAkc2NvcGUuZm9sZGVyc0RhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqICAgICByZXR1cm4gU2VydmljZUZvbGRlcnNEYXRhLmxvYWQodHJ1ZSk7XG4gKiB9XG4gKiBgYGBcbiAqIFxuICovXG5cdFxuemFhLmNvbmZpZyhbJ3Jlc29sdmVyUHJvdmlkZXInLCBmdW5jdGlvbihyZXNvbHZlclByb3ZpZGVyKSB7XG5cdHJlc29sdmVyUHJvdmlkZXIuYWRkQ2FsbGJhY2soWydTZXJ2aWNlTWVudURhdGEnLCAnU2VydmljZUJsb2Nrc0RhdGEnLCAnU2VydmljZUxheW91dHNEYXRhJywgJ1NlcnZpY2VDdXJyZW50V2Vic2l0ZScsICdMdXlhTG9hZGluZycsIGZ1bmN0aW9uKFNlcnZpY2VNZW51RGF0YSwgU2VydmljZUJsb2Nrc0RhdGEsIFNlcnZpY2VMYXlvdXRzRGF0YSwgU2VydmljZUN1cnJlbnRXZWJzaXRlLCBMdXlhTG9hZGluZykge1xuXHRcdEx1eWFMb2FkaW5nLnN0YXJ0KCk7XG5cdFx0U2VydmljZUJsb2Nrc0RhdGEubG9hZCgpO1xuXHRcdFNlcnZpY2VMYXlvdXRzRGF0YS5sb2FkKCk7XG5cdFx0U2VydmljZU1lbnVEYXRhLmxvYWQoKS50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0U2VydmljZUN1cnJlbnRXZWJzaXRlLmxvYWQoKTtcblx0XHRcdEx1eWFMb2FkaW5nLnN0b3AoKTtcblx0XHR9KTtcblx0fV0pO1xufV0pO1xuXG5cbi8qKlxuICogQ29weSBCbG9jayBTdGFjayBzZXJ2aWNlLlxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VCbG9ja0NvcHlTdGFja1wiLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLnN0YWNrID0gW107XG5cdFxuXHRzZXJ2aWNlLmNsZWFyID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGFjayA9IFtdO1xuXHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpDb3B5U3RhY2snLCBzZXJ2aWNlLnN0YWNrKTtcblx0fTtcblx0XG5cdHNlcnZpY2UucHVzaCA9IGZ1bmN0aW9uKGJsb2NrKSB7XG5cdFx0aWYgKHNlcnZpY2Uuc3RhY2subGVuZ3RoID4gNCkge1xuXHRcdFx0c2VydmljZS5zdGFjay5zaGlmdCgpO1xuXHRcdH1cblx0XHRzZXJ2aWNlLnN0YWNrLnB1c2goe2Jsb2NrSWQ6IGJsb2NrLmJsb2NrX2lkLCBuYW1lOiBibG9jay5uYW1lLCBpY29uOmJsb2NrLmljb24sIGlkOiBibG9jay5pZCwgY29weXN0YWNrOiAxfSk7XG5cdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkNvcHlTdGFjaycsIHNlcnZpY2Uuc3RhY2spO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogTWVudSBTZXJ2aWNlLlxuICogXG4gKiAkc2NvcGUubWVudURhdGEgPSBTZXJ2aWNlTWVudURhdGEuZGF0YTtcbiAqIFx0XHRcdFx0XG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOk1lbnVEYXRhJywgZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAqIFx0JHNjb3BlLm1lbnVEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUubWVudURhdGFSZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAqIFx0cmV0dXJuIFNlcnZpY2VNZW51RGF0YS5sb2FkKHRydWUpO1xuICogfVxuICogXHRcdFx0XHRcbiAqL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTWVudURhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtbWVudS9kYXRhLW1lbnVcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOk1lbnVEYXRhJywgc2VydmljZS5kYXRhKTtcblx0XHRcdFx0XHRyZXNvbHZlKHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQmxvY2tzIFNlcnZpY2UuXG4gKiBcbiAqIFxuICogJHNjb3BlLmJsb2Nrc0RhdGEgPSBTZXJ2aWNlQmxvY2tzRGF0YS5kYXRhO1xuICogXHRcdFx0XHRcbiAqICRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiBcdCRzY29wZS5ibG9ja3NEYXRhID0gZGF0YTtcbiAqIH0pO1xuICogXG4gKiAkc2NvcGUuYmxvY2tzRGF0YVJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICogXHRyZXR1cm4gU2VydmljZUJsb2Nrc0RhdGEubG9hZCh0cnVlKTtcbiAqIH1cbiAqIFx0XHRcdFx0XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUJsb2Nrc0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1ibG9ja3NcIikudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXHRcdFx0XHRcdHNlcnZpY2UuZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS4kYnJvYWRjYXN0KCdzZXJ2aWNlOkJsb2Nrc0RhdGEnLCBzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdFxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTtcblxuLyoqXG4gKiBMYXlvdXRzIFNlcnZpY2UuXG5cbiRzY29wZS5sYXlvdXRzRGF0YSA9IFNlcnZpY2VMYXlvdXRzRGF0YS5kYXRhO1xuXHRcdFx0XHRcbiRzY29wZS4kb24oJ3NlcnZpY2U6QmxvY2tzRGF0YScsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG5cdCRzY29wZS5sYXlvdXRzRGF0YSA9IGRhdGE7XG59KTtcblxuJHNjb3BlLmxheW91dHNEYXRhUmVsb2FkID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiBTZXJ2aWNlTGF5b3V0c0RhdGEubG9hZCh0cnVlKTtcbn1cblx0XHRcdFx0XG4qL1xuemFhLmZhY3RvcnkoXCJTZXJ2aWNlTGF5b3V0c0RhdGFcIiwgWyckaHR0cCcsICckcScsICckcm9vdFNjb3BlJywgZnVuY3Rpb24oJGh0dHAsICRxLCAkcm9vdFNjb3BlKSB7XG5cdHZhciBzZXJ2aWNlID0gW107XG5cdFxuXHRzZXJ2aWNlLmRhdGEgPSBbXTtcblx0XG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKGZvcmNlUmVsb2FkKSB7XG5cdFx0cmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0aWYgKHNlcnZpY2UuZGF0YS5sZW5ndGggPiAwICYmIGZvcmNlUmVsb2FkICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJlc29sdmUoc2VydmljZS5kYXRhKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCRodHRwLmdldChcImFkbWluL2FwaS1jbXMtYWRtaW4vZGF0YS1sYXlvdXRzXCIpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblx0XHRcdFx0XHRzZXJ2aWNlLmRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdFx0XHRcdCRyb290U2NvcGUuJGJyb2FkY2FzdCgnc2VydmljZTpMYXlvdXRzRGF0YScsIHNlcnZpY2UuZGF0YSk7XG5cdFx0XHRcdFx0cmVzb2x2ZShzZXJ2aWNlLmRhdGEpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0XG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG4vKipcbiAqIENNUyBMSVZFIEVESVQgU0VSSVZDRVxuICogXG4gKiAkc2NvcGUubGl2ZUVkaXRNb2RlID0gU2VydmljZUxpdmVFZGl0TW9kZS5zdGF0ZVxuICovXG56YWEuZmFjdG9yeShcIlNlcnZpY2VMaXZlRWRpdE1vZGVcIiwgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xuXHRcblx0dmFyIHNlcnZpY2UgPSBbXTtcblx0XG5cdHNlcnZpY2Uuc3RhdGUgPSAwO1xuXHRcblx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmx1eWFjZmcuaG9tZVVybDtcblx0XG5cdHNlcnZpY2UudG9nZ2xlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VydmljZS5zdGF0ZSA9ICFzZXJ2aWNlLnN0YXRlO1xuXHR9O1xuXHRzZXJ2aWNlLnNldFVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0dmFyIGQgPSBuZXcgRGF0ZSgpO1xuXHRcdHZhciBuID0gZC5nZXRUaW1lKCk7XG5cdFx0c2VydmljZS51cmwgPSAkcm9vdFNjb3BlLmNtc0NvbmZpZy5wcmV2aWV3VXJsICsgJz9pdGVtSWQ9JytpdGVtSWQrJyZ2ZXJzaW9uPScgKyB2ZXJzaW9uSWQgKyAnJmRhdGU9JyArIG47XG5cdH07XG5cdFxuXHRzZXJ2aWNlLmNoYW5nZVVybCA9IGZ1bmN0aW9uKGl0ZW1JZCwgdmVyc2lvbklkKSB7XG5cdFx0aWYgKHZlcnNpb25JZCA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHZlcnNpb25JZCA9IDA7XG5cdFx0fVxuXHRcdHNlcnZpY2Uuc2V0VXJsKGl0ZW1JZCwgdmVyc2lvbklkKTtcblx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6TGl2ZUVkaXRNb2RlVXJsQ2hhbmdlJywgc2VydmljZS51cmwpO1xuXHR9O1xuXHRcblx0cmV0dXJuIHNlcnZpY2U7XG59XSk7XG5cbi8qKlxuICogQ01TIEN1cnJlbnQgV2Vic2l0ZSBTRVJJVkNFXG4gKlxuICogJHNjb3BlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZUN1cnJlbnRXZWJzaXRlLmN1cnJlbnRXZWJzaXRlIFxuICogXG4gKiAkc2NvcGUuJG9uKCdzZXJ2aWNlOkN1cnJlbnRXZWJzaXRlQ2hhbmdlZCcsIGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gKiAgXHQkc2NvcGUuY3VycmVudFdlYnNpdGUgPSBkYXRhO1xuICogfSk7XG4gKi9cbnphYS5mYWN0b3J5KFwiU2VydmljZUN1cnJlbnRXZWJzaXRlXCIsIFsnJHJvb3RTY29wZScsICdTZXJ2aWNlTWVudURhdGEnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCBTZXJ2aWNlTWVudURhdGEpIHtcblxuXHR2YXIgc2VydmljZSA9IHtcblx0XHRjdXJyZW50V2Vic2l0ZTogbnVsbCxcblx0XHRkZWZhdWx0V2Vic2l0ZTogbnVsbFxuXHR9O1xuXG5cdHNlcnZpY2UubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlcnZpY2UuZGVmYXVsdFdlYnNpdGUgPSBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlcy5maW5kKHcgPT4gdy5pc19kZWZhdWx0KSB8fCBTZXJ2aWNlTWVudURhdGEuZGF0YS53ZWJzaXRlc1swXTtcblx0XHRpZiAoc2VydmljZS5kZWZhdWx0V2Vic2l0ZSkge1xuXHRcdFx0c2VydmljZS50b2dnbGUoc2VydmljZS5kZWZhdWx0V2Vic2l0ZS5pZCk7XG5cdFx0fVxuXHR9XG5cblx0c2VydmljZS50b2dnbGUgPSBmdW5jdGlvbih3ZWJzaXRlSWQpIHtcblx0XHRpZiAod2Vic2l0ZUlkICYmIFNlcnZpY2VNZW51RGF0YS5kYXRhLndlYnNpdGVzICYmICghc2VydmljZS5jdXJyZW50V2Vic2l0ZSB8fCBzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlLmlkICE9PSB3ZWJzaXRlSWQpKSB7XG5cdFx0XHRzZXJ2aWNlLmN1cnJlbnRXZWJzaXRlID0gU2VydmljZU1lbnVEYXRhLmRhdGEud2Vic2l0ZXMuZmluZCh3ID0+IHcuaWQgPT09IHdlYnNpdGVJZCk7XG5cdFx0XHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ3NlcnZpY2U6Q3VycmVudFdlYnNpdGVDaGFuZ2VkJywgc2VydmljZS5jdXJyZW50V2Vic2l0ZSk7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBzZXJ2aWNlO1xufV0pO1xuXG56YWEuZmFjdG9yeShcIlNlcnZpY2VXb3JraW5nUGFnZVZlcnNpb25cIiwgW2Z1bmN0aW9uKCkge1xuXHR2YXIgc2VydmljZSA9IHtcblx0XHRwYWdlOiB7fVxuXHR9O1xuXG5cdHNlcnZpY2Uuc3RvcmUgPSBmdW5jdGlvbihwYWdlSWQsIHZlcnNpb25JZCkge1xuXHRcdHNlcnZpY2UucGFnZVtwYWdlSWRdID0gdmVyc2lvbklkO1xuXHR9O1xuXG5cdHNlcnZpY2UuaGFzVmVyc2lvbiA9IGZ1bmN0aW9uKHBhZ2VJZCkge1xuXHRcdGlmIChzZXJ2aWNlLnBhZ2UuaGFzT3duUHJvcGVydHkocGFnZUlkKSkge1xuXHRcdFx0cmV0dXJuIHNlcnZpY2UucGFnZVtwYWdlSWRdO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXHRyZXR1cm4gc2VydmljZTtcbn1dKTsiXX0=