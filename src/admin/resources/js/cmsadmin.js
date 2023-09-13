(function() {
	"use strict";
	
	// directive.js

    zaa.directive("menuDropdown", ['ServiceMenuData', 'ServiceCurrentWebsite', '$filter', function(ServiceMenuData, ServiceCurrentWebsite, $filter) {
        return {
            restrict : 'E',
            scope : {
                navId : '='
            },
            controller : ['$scope', function($scope) {

                $scope.changeModel = function(data) {
                    $scope.navId = data.id;
                }

				$scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
				$scope.$on('service:CurrentWebsiteChanged', function(event, data) {
					$scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
				});

				$scope.menuData = angular.copy(ServiceMenuData.data);
				$scope.menuDataOriginal = angular.copy(ServiceMenuData.data);

                $scope.$on('service:MenuData', function(event, data) {
					$scope.menuData = angular.copy(data);
					$scope.menuDataOriginal = angular.copy(data);
                });

                function init() {
                    if ($scope.menuData.length == 0) {
                        ServiceMenuData.load().then(function() {
							ServiceCurrentWebsite.load();
						})
                    }
                }

                for (var container in $scope.menuData.containers) {
                    $scope.menuData.containers[container].isHidden = false;
				}
				
				$scope.$watch('searchQuery', function(n) {
					if (n == null || n == '') {
						$scope.menuData.items = angular.copy($scope.menuDataOriginal.items);
						return;
					}
					var items = $filter('filter')($scope.menuDataOriginal.items, {title: n});

					// find all parent elements of the found elements and re add them to the map in order to 
					// ensure a correct menu tree.
					angular.forEach(items, function(value) {
						if (value['parent_nav_id'] > 0) {
							$scope.bubbleParents(value['parent_nav_id'], value['nav_container_id'], items);
						}
					});

					$scope.menuData.items = items;
				});

				$scope.bubbleParents = function(parentNavId, containerId, index) {
					var item = $filter('menuchildfilter')($scope.menuDataOriginal.items, containerId, parentNavId);
					if (item) {
						var exists = false;
						angular.forEach(index, function(i) {
							if (i.id == item.id) {
								exists = true;
							}
						})
						if (!exists) {
							index.push(item);
						}
						$scope.bubbleParents(item.parent_nav_id, item.nav_container_id, index);
					}
				};

                $scope.toggler = true;

				init();
            }],
            template : function() {
				return '<div>'+
					'<div class="input-group mb-2">'+
						'<div class="input-group-prepend" ng-hide="searchQuery"><div class="input-group-text"><i class="material-icons">search</i></div></div>'+
						'<div class="input-group-prepend" ng-show="searchQuery" ng-click="searchQuery = \'\'"><div class="input-group-text"><i class="material-icons">clear</i></div></div>'+
						'<input class="form-control" ng-model="searchQuery" type="text" placeholder="'+i18n['ngrest_crud_search_text']+'">'+
					'</div>' + 
					'<div ng-repeat="(key, container) in menuData.containers | menuwebsitefilter:currentWebsite.id" ng-if="(menuData.items | menuparentfilter:container.id:0).length > 0" class="card mb-2" ng-class="{\'card-closed\': !container.isHidden}">'+
						'<div class="card-header" ng-click="container.isHidden=!container.isHidden">'+
							'<span class="material-icons card-toggle-indicator">keyboard_arrow_down</span>'+
							'<span>{{container.name}}</span>'+
						'</div>'+
						'<div class="card-body">'+ 
							'<div class="treeview treeview-chooser">' +
								'<ul class="treeview-items treeview-items-lvl1">' +
									'<li class="treeview-item treeview-item-lvl1" ng-class="{\'treeview-item-has-children\' : (menuData.items | menuparentfilter:container.id:0).length}" ng-repeat="(key, data) in menuData.items | menuparentfilter:container.id:0 track by data.id" ng-include="\'menuDropdownReverse\'"></li>' +
								'</ul>' +
							'</div>' +
						'</div>' +
					'</div>'+
				'</div>';
            }
        }
    }]);

	zaa.directive("zaaCmsPage", function() {
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
			controller : ['$scope', function($scope) {
				$scope.resetValue = function() {
					$scope.model = null
				}
			}],
            template: function() {
            	return  '<div class="form-group form-side-by-side" ng-class="{\'input--hide-label\': i18n}">' +
                            '<div class="form-side form-side-label">' +
                                '<label>{{label}}</label>' +
                            '</div>' +
                            '<div class="form-side">' +
                                '<menu-dropdown class="menu-dropdown" nav-id="model"></menu-dropdown>' +
								'<button ng-if="clearable && model" ng-click="resetValue()" type="button" class="btn btn-sm btn-secondary"><i class="material-icons">clear</i></button>' + 
                            '</div>' +
                        '</div>';
            }
        }
    });

	zaa.directive("showInternalRedirection", function() {
		return {
			restrict : 'E',
			scope : {
				navId : '='
			},
			controller : ['$scope', '$http', '$state', function($scope, $http, $state) {

				$scope.$watch('navId', function(n) {
					if (n) {
						$http.get('admin/api-cms-navitem/get-nav-item-path', { params : { navId : $scope.navId }}).then(function(response) {
							$scope.path = response.data;
						});
						$http.get('admin/api-cms-navitem/get-nav-container-name', { params : { navId : $scope.navId }}).then(function(response) {
							$scope.container = response.data;
						});
					}
				});
			}],
			template : function() {
				return '<a class="btn btn-secondary btn-sm" ui-sref="custom.cmsedit({ navId : navId, templateId: \'cmsadmin/default/index\'})">{{path}}</a> in {{container}}';
			}
		}
	});
	
	zaa.directive("createForm", function() {
		return {
			restrict : 'EA',
			scope : {
				data : '='
			},
			templateUrl : 'createform.html',
			controller : ['$scope', '$http', '$filter', 'ServiceMenuData', 'ServiceLanguagesData', 'AdminToastService', 'ServiceCurrentWebsite', function($scope, $http, $filter, ServiceMenuData, ServiceLanguagesData, AdminToastService, ServiceCurrentWebsite) {

				$scope.error = [];
				$scope.success = false;

				$scope.controller = $scope.$parent;

				$scope.menuData = ServiceMenuData.data;

				$scope.$on('service:MenuData', function(event, data) {
					$scope.menuData = data;
				});

				$scope.menuDataReload = function() {
					return ServiceMenuData.load(true);
				}

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
				$scope.$on('service:CurrentWebsiteChanged', function(event, data) {
					if (ServiceCurrentWebsite.currentWebsite) {
						$scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;
						$scope.data.nav_container_id = ServiceCurrentWebsite.currentWebsite.default_container_id;
					}
				});

				$scope.languagesData = ServiceLanguagesData.data;

				$scope.$on('service:LanguagesData', function(event, data) {
					$scope.languagesData = data;
				});

				$scope.isDefaultItem = $scope.languagesData.find(item => {
					return item.is_default;
				});

				$scope.data.lang_id = $scope.isDefaultItem.id;

				$scope.$watch(function() { return $scope.data.nav_container_id }, function(n, o) {
					if (n !== undefined && n !== o) {
						$scope.data.parent_nav_id = 0;
					}
				});

				$scope.aliasSuggestion = function() {
					$scope.data.alias = $filter('slugify')($scope.data.title);
				};

				$scope.$watch('data.alias', function(n, o) {
					if (n!=o && n!=null) {
						$scope.data.alias = $filter('slugify')(n);
					}
				});

				$scope.exec = function () {
					$scope.controller.save().then(function(response) {
						$scope.menuDataReload();
						$scope.success = true;
						$scope.error = [];
						$scope.data.title = null;
						$scope.data.alias = null;
						if ($scope.data.isInline) {
							$scope.$parent.$parent.getItem($scope.data.lang_id, $scope.data.nav_id);
						}
						AdminToastService.success(i18n['view_index_page_success']);
					}, function(reason) {
						angular.forEach(reason, function(value, key) {
							AdminToastService.error(value[0]);
						});
						$scope.error = reason;
					});
				}

			}]
		}
	});

	/** PAGE CREATE & UPDATE */
    zaa.directive("updateFormPage", ['ServiceLayoutsData', function(ServiceLayoutsData) {
        return {
            restrict : 'EA',
            scope : {
                data : '='
            },
            templateUrl : 'updateformpage.html',
            controller : ['$scope', '$http', function($scope, $http) {

            	$scope.parent = $scope.$parent.$parent;
				$scope.navItemId = $scope.parent.item.id;


				$scope.data.layout_id = 0;
				$scope.layoutsData = ServiceLayoutsData.data;

				$scope.arrayToSelect = function(input, valueField, labelField) {
					var output = [];
					angular.forEach(input, function(value) {
						output.push({"label": value[labelField], "value": value[valueField]});
					});
					return output;
				};

				$scope.$on('service:LayoutsData', function(event, data) {
					$scope.layoutsData = []; // $scope.arrayToSelect(data); // @TODO REMOVE IF VERIFIED
				});


				$scope.versionsData = [];

				$scope.getVersionList = function() {
					$http.get('admin/api-cms-navitempage/versions', { params : { navItemId : $scope.navItemId }}).then(function(response) {
						$scope.versionsData = $scope.arrayToSelect(response.data, 'id', 'version_alias');
					});
				};

            	$scope.isEditAvailable = function() {
					return $scope.versionsData.length;
            	};

				function init() {
					$scope.getVersionList();
				}

				init();
            }]
        }
	}]);
	zaa.directive("createFormPage", function() {
		return {
			restrict : 'EA',
			scope : {
				data : '='
			},
			templateUrl : 'createformpage.html',
			controller : ['$scope', 'ServiceLayoutsData', 'ServiceMenuData', function($scope, ServiceLayoutsData, ServiceMenuData) {

				$scope.data.use_draft = 0;
				$scope.data.layout_id = 0;
				$scope.data.from_draft_id = 0;

				/* layoutsData */

				$scope.layoutsData = ServiceLayoutsData.data;

            	$scope.$on('service:BlocksData', function(event, data) {
            		$scope.layoutsData = data;
            	});

            	/* menuData */

    			$scope.menuData = ServiceMenuData.data;

				$scope.$on('service:MenuData', function(event, data) {
					$scope.menuData = data;
				});

				$scope.arrayToSelect = function(input, valueField, labelField) {
					var output = [];
					angular.forEach(input, function(value) {
						output.push({"label": value[labelField], "value": value[valueField]});
					});
					return output;
				};

            	function init() {
            		$scope.drafts = $scope.arrayToSelect($scope.menuData.drafts, 'id', 'title');
					$scope.layouts = $scope.arrayToSelect($scope.layoutsData, 'id', 'name');
            	}

            	init();

				$scope.save = function() {
					$scope.$parent.exec();
				}
			}]
		}
	});

	/* Page MODULE */

	zaa.directive("formModule", function() {
		return {
			restrict : 'EA',
			scope : {
				data : '='
			},
			templateUrl : 'formmodule.html',
			controller : ['$scope', '$http', function($scope, $http) {

				$scope.modules = [];
				$scope.controllers = [];
				$scope.actions = [];
				$scope.params = {};

				$http.get('admin/api-admin-common/data-modules').then(function(response) {
					$scope.modules = response.data;
				});

				$scope.addParam = function(key) {
					if (!$scope.data.hasOwnProperty('action_params')) {
						$scope.data.action_params = {};
					}
					$scope.data.action_params[key] = '';
				};

				$scope.$watch(function() {
					return $scope.data.module_name;
				}, function(n) {
					if (n) {
						$http.get('admin/api-cms-admin/module-controllers?module=' + n).then(function(response) {
							$scope.controllers = response.data;
							$scope.actions = [];
						});
					}
				});

				$scope.$watch(function() {
					return $scope.data.controller_name;
				}, function(n) {
					if (n) {
						$http.get('admin/api-cms-admin/controller-actions?module='+$scope.data.module_name+'&controller=' + n).then(function(response) {
							$scope.actions = response.data;
						});
					}
				});
			}]
		}
	});

	/* filters */

	zaa.filter("menuwebsitefilter", function() {
		return function(input, websiteId) {
			var result = [];
			angular.forEach(input, function(value, key) {
				if (value.website_id == websiteId) {
					result.push(value);
				}
			});
			return result;
		};
	});

	zaa.filter("menuparentfilter", function() {
		return function(input, containerId, parentNavId) {
			var result = [];
			angular.forEach(input, function(value, key) {
				if (value.parent_nav_id == parentNavId && value.nav_container_id == containerId) {
					result.push(value);
				}
			});
			return result;
		};
	});

	zaa.filter('menuchildfilter', function() {
		return function(input, containerId, parentNavId) {
			var returnValue = false;
			angular.forEach(input, function(value, key) {
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

	zaa.factory('PlaceholderService', function() {
		var service = [];

		service.status = 1; /* 1 = showplaceholders; 0 = hide placeholders */

		service.delegate = function(status) {
			service.status = status;
		};

		return service;
	});

	/* layout.js */

	zaa.config(['$stateProvider', function($stateProvider) {
		$stateProvider
		.state("custom.cmsedit", {
			url : "/update/:navId",
			templateUrl : 'cmsadmin/page/update'
		})
		.state("custom.cmsadd", {
			url : "/create",
			templateUrl : 'cmsadmin/page/create'
		})
		.state("custom.cmsdraft", {
			url: '/drafts',
			templateUrl: 'cmsadmin/page/drafts'
		});
	}]);

	/* controllers */

	zaa.controller("DraftsController", ['$scope', '$state', 'ServiceMenuData', function($scope, $state, ServiceMenuData) {

		$scope.menuData = ServiceMenuData.data;

		$scope.$on('service:MenuData', function(event, data) {
			$scope.menuData = data;
		});

		$scope.go = function(navId) {
			$state.go('custom.cmsedit', { navId : navId });
		};
	}]);

	zaa.controller("CmsDashboard", ['$scope', '$http', function($scope, $http) {
		$scope.dashboard = [];
		$http.get('admin/api-cms-admin/dashboard-log').then(function(response) {
			$scope.dashboard = response.data;
		});
	}]);
	
	zaa.controller("ConfigController", ['$scope', '$http', 'AdminToastService', function($scope, $http, AdminToastService) {
		$scope.data = {};

		$http.get('admin/api-cms-admin/config').then(function(response) {
			$scope.data = response.data;
		});

		$scope.save = function() {
			$http.post('admin/api-cms-admin/config', $scope.data).then(function(response) {
				AdminToastService.success(i18n['js_config_update_success']);
			});
		}
	}]);

	zaa.controller("PageVersionsController", ['$scope', '$http', 'ServiceLayoutsData', 'AdminToastService', function($scope, $http, ServiceLayoutsData, AdminToastService) {
		/**
		 * @var object $typeData From parent scope controller NavItemController
		 * @var object $item From parent scope controller NavItemController
		 * @var string $versionName From ng-model
		 * @var integer $fromVersionPageId From ng-model the version copy from or 0 = new empty/blank version
		 * @var integer $versionLayoutId From ng-model, only if fromVersionPageId is 0
 		 */
		var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};

		/* layoutsData */

		$scope.layoutsData = ServiceLayoutsData.data;

    	$scope.$on('service:LayoutsData', function(event, data) {
    		$scope.layoutsData = data;
    	});

    	/* controller logic */

		$scope.createNewVersionSubmit = function(data) {
			if (data == undefined) {
				AdminToastService.error(i18n['js_version_error_empty_fields']);
				return null;
			}
			if (data.copyExistingVersion) {
				data.versionLayoutId = 0;
			}
			$http.post('admin/api-cms-navitem/create-page-version', $.param({'layoutId': data.versionLayoutId, 'navItemId': $scope.item.id, 'name': data.versionName, 'fromPageId': data.fromVersionPageId}), headers).then(function(response) {
				if (response.data.error) {
					AdminToastService.error(i18n['js_version_error_empty_fields']);
					return null;
				}

				$scope.refreshForce();

				AdminToastService.success(i18n['js_version_create_success']);
			});
		};
	}]);

	zaa.controller("CopyPageController", ['$scope', '$http', '$filter', 'AdminToastService', function($scope, $http, $filter, AdminToastService) {

		var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};

		$scope.$on('deletedNavItem', function() {
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

		$scope.select = function(item) {
			$scope.selection = item.id;
			$scope.itemSelection = angular.copy(item);
		};

		$scope.$watch('itemSelection.title', function(n, o) {
			if (n) {
				$scope.aliasSuggestion();
			}
		});
		
		$scope.aliasSuggestion = function() {
			
			$scope.itemSelection.alias = $filter('slugify')($scope.itemSelection.title);
		};

		$scope.loadItems = function() {
			$scope.navId = $scope.NavItemController.NavController.navData.id;

			$http.get('admin/api-cms-nav/find-nav-items', { params: { navId : $scope.navId }}).then(function(response) {
				$scope.items = response.data;
				$scope.isOpen = true;
			});
		};

		$scope.save = function() {
			$scope.itemSelection['toLangId'] = $scope.NavItemController.lang.id;
			$http.post('admin/api-cms-nav/create-from-page', $.param($scope.itemSelection), headers).then(function(response) {
				if (response.data) {
					AdminToastService.success(i18n['js_added_translation_ok']);
					$scope.NavItemController.refresh();
				} else {
					AdminToastService.error(i18n['js_added_translation_error']);
				}
			}, function(response) {
				AdminToastService.errorArray(response.data);
			});
		}

	}]);

	zaa.controller("CmsMenuTreeController", ['$scope', '$rootScope', '$state', '$http', '$filter', 'ServiceMenuData', 'ServiceLiveEditMode', 'ServiceCurrentWebsite', function($scope, $rootScope, $state, $http, $filter, ServiceMenuData, ServiceLiveEditMode, ServiceCurrentWebsite) {

		// live edit service

		$scope.liveEditState = 0;

		$scope.$watch('liveEditStateToggler', function(n) {
			ServiceLiveEditMode.state = n;
		});

		$scope.loadCmsConfig = function() {
			$http.get('admin/api-cms-admin/config').then(function(response) {
				$rootScope.cmsConfig = response.data;
			});
		};
		
		$scope.loadCmsConfig();
		
		// menu Data

		$scope.menuData = ServiceMenuData.data;
		$scope.currentWebsite = ServiceCurrentWebsite.currentWebsite;

		$scope.$on('service:MenuData', function(event, data) {
			$scope.menuData = data;
		});

		$scope.menuDataReload = function() {
			return ServiceMenuData.load(true);
		};

		// Contains the current website id, is initialized with false as value
		$scope.currentWebsiteToggler = false

		$scope.$watch('currentWebsiteToggler', function(newValue, oldValue) {
			if (newValue && newValue !== oldValue) {
				ServiceCurrentWebsite.toggle(newValue);
			}
		});

		// initialize the state of the current menu service
		$scope.currentWebsite = ServiceCurrentWebsite.currentWebsite

		// if the state has recived a value, after the service event has been triggered, this ensures
		// the current website is displayed. Like a lazy load ensurance
		if ($scope.currentWebsite) {
			$scope.currentWebsiteToggler = $scope.currentWebsite.id
		}

		$scope.$on('service:CurrentWebsiteChanged', function(event, data) {
			$scope.currentWebsite = data;
			$scope.currentWebsiteToggler = data.id;
			ServiceMenuData.load();
		});

		// controller logic
		
		$scope.dropEmptyContainer = function(dragged,dropped,position,catId) {
			$http.get('admin/api-cms-navitem/move-to-container', { params: {moveItemId: dragged.id, droppedOnCatId: catId}}).then(function(succes) {
				ServiceMenuData.load(true);
			});
		};
		
		$scope.dropItem = function(drag,drop,pos) {
			if (pos == 'bottom') {
				var api = 'admin/api-cms-navitem/move-after';
				var params = {moveItemId: drag.id, droppedAfterItemId: drop.id};
			} else if (pos == 'top') {
				var api = 'admin/api-cms-navitem/move-before';
				var params = {moveItemId: drag.id, droppedBeforeItemId: drop.id};

			} else if (pos == 'middle') {
				var api = 'admin/api-cms-navitem/move-to-child';
				var params = {moveItemId: drag.id, droppedOnItemId: drop.id};
			}
			
			$http.get(api, { params : params }).then(function(success) {
				ServiceMenuData.load(true);
			}, function(error) {
				ServiceMenuData.load(true);
			});
		};
		
		$scope.validItem = function(hover, draged) {
			
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
		
		$scope.recursivItemValidity = function(containerId, parentNavId) {
			var items = $filter('menuparentfilter')($scope.menuData.items, containerId, parentNavId);
			
			angular.forEach(items, function(item) {
				$scope.rritems.push(item.id);
				$scope.recursivItemValidity(containerId, item.id);
			});
		};

		$scope.toggleItem = function(data) {
			if (data.toggle_open == undefined) {
				data['toggle_open'] = 1;
			} else {
				data['toggle_open'] = !data.toggle_open;
			}

			$http.post('admin/api-cms-nav/tree-history', {data: data}, {ignoreLoadingBar: true});

		};

		$scope.go = function(data) {
			ServiceLiveEditMode.changeUrl(data.nav_item_id, 0);
			$state.go('custom.cmsedit', { navId : data.id });
	    };

	    $scope.showDrag = 0;

	    $scope.isCurrentElement = function(data) {
	    	if (data !== null && $state.params.navId == data.id) {
	    		return true;
	    	}

	    	return false;
	    };

	    $scope.hiddenCats = [];

	    $scope.$watch('menuData', function (n, o) {
	    	$scope.hiddenCats = n.hiddenCats;
	    });

		$scope.toggleCat = function(catId) {
			if (catId in $scope.hiddenCats) {
				$scope.hiddenCats[catId] = !$scope.hiddenCats[catId];
			} else {
				$scope.hiddenCats[catId] = 1;
			}

			$http.post('admin/api-cms-nav/save-cat-toggle', {catId: catId, state: $scope.hiddenCats[catId]}, {ignoreLoadingBar: true});
		};

		$scope.toggleIsHidden = function(catId) {

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

	zaa.controller("CmsadminCreateController", ['$scope', '$q', '$http', function($scope, $q, $http) {

		$scope.data = {};
		$scope.data.isInline = false;

		$scope.save = function() {

			var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};

			return $q(function(resolve, reject) {

				if ($scope.data.nav_item_type == 1) {
					$http.post('admin/api-cms-nav/create-page', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}

				if ($scope.data.nav_item_type == 2) {
					$http.post('admin/api-cms-nav/create-module', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}

				if ($scope.data.nav_item_type == 3) {
					$http.post('admin/api-cms-nav/create-redirect', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}
			});
		};
	}]);

	zaa.controller("CmsadminCreateInlineController", ['$scope', '$q', '$http', function($scope, $q, $http) {

		$scope.data = {
			nav_id : $scope.$parent.NavController.id
		};

		$scope.data.isInline = true;

		$scope.save = function() {

			$scope.data.lang_id = $scope.lang.id;

			var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};

			return $q(function(resolve, reject) {

				if ($scope.data.nav_item_type == 1) {
					$http.post('admin/api-cms-nav/create-page-item', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}

				if ($scope.data.nav_item_type == 2) {
					$http.post('admin/api-cms-nav/create-module-item', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}

				if ($scope.data.nav_item_type == 3) {
					$http.post('admin/api-cms-nav/create-redirect-item', $.param($scope.data), headers).then(function(response) {
						resolve(response.data);
					}, function(response) {
						reject(response.data);
					});
				}
			})
		}

	}]);

	zaa.controller("NavController", [
		'$scope', '$rootScope', '$filter', '$state', '$stateParams', '$http', 'PlaceholderService', 'ServicePropertiesData', 'ServiceMenuData', 'ServiceLanguagesData', 'ServiceLiveEditMode', 'AdminToastService', 'AdminClassService', 'AdminLangService', 'HtmlStorage',
		function($scope, $rootScope, $filter, $state, $stateParams, $http, PlaceholderService, ServicePropertiesData, ServiceMenuData, ServiceLanguagesData, ServiceLiveEditMode, AdminToastService, AdminClassService, AdminLangService, HtmlStorage) {


		$scope.pageSettingsOverlayHidden = true;
		
		$scope.pageSettingsOverlayTab = 1;
		
		$scope.togglePageSettingsOverlay = function(t) {
			$scope.pageSettingsOverlayTab = t;
			$scope.pageSettingsOverlayHidden = !$scope.pageSettingsOverlayHidden;
		};
		
		$scope.navCfg = {
			helptags: $rootScope.luyacfg.helptags,
		};
		
		$scope.$watch(function() { return ServiceLiveEditMode.state }, function(n, o) {
			$scope.displayLiveContainer = n;
		});
		
		$scope.$watch(function() { return ServiceLiveEditMode.url }, function(n, o) {
			$scope.liveUrl = n;
		});
		
		$scope.AdminLangService = AdminLangService;

		/* service AdminPropertyService inheritance */

		$scope.propertiesData = ServicePropertiesData.data;

		$scope.$on('service:PropertiesData', function(event, data) {
			$scope.propertiesData = data;
		});

		/* service ServiceMenuData inheritance */

		$scope.menuData = ServiceMenuData.data;

		$scope.$on('service:MenuData', function(event, data) {
			$scope.menuData = data;
		});

		$scope.menuDataReload = function() {
			return ServiceMenuData.load(true);
		};

		/* service ServiceLangaugesData inheritance */

		$scope.languagesData = ServiceLanguagesData.data;

		$scope.$on('service:LanguagesData', function(event, data) {
			$scope.languagesData = data;
		});

		/* placeholders toggler service */

		$scope.PlaceholderService = PlaceholderService;

		$scope.placeholderState = $scope.PlaceholderService.status;

		$scope.$watch('placeholderState', function(n, o) {
			if (n !== o && n !== undefined) {
				$scope.PlaceholderService.delegate(n);
			}
		});

		/* Blockholder size toggler */

        $scope.isBlockholderSmall = HtmlStorage.getValue('blockholderToggleState', true);

        $scope.toggleBlockholderSize = function() {
            $scope.isBlockholderSmall = !$scope.isBlockholderSmall;
            HtmlStorage.setValue('blockholderToggleState', $scope.isBlockholderSmall);
        };

        /* sidebar logic */

		$scope.sidebar = false;

	    $scope.enableSidebar = function() {
	    	$scope.sidebar = true;
	    };

	    $scope.toggleSidebar = function() {
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

		$scope.bubbleParents = function(parentNavId, containerId) {
	    	var item = $filter('menuchildfilter')($scope.menuData.items, containerId, parentNavId);
	    	if (item) {
	    		item.toggle_open = 1;
	    		$scope.bubbleParents(item.parent_nav_id, item.nav_container_id);
	    	}
	    };

		$scope.createDeepPageCopy = function() {
			$http.post('admin/api-cms-nav/deep-page-copy', {navId: $scope.id}).then(function(response) {
				$scope.menuDataReload();
				AdminToastService.success(i18n['js_page_create_copy_success']);
				$scope.showActions = 1;
				$scope.togglePageSettingsOverlay();
			}, function(response) {
				AdminToastService.errorArray(response.data);
			});
		};

		$scope.pageTags = [];

		$http.get('admin/api-cms-nav/' + $scope.id + '/tags').then(function(response) {
			angular.forEach(response.data, function(value) {
				$scope.pageTags.push(value.id);
			});
		});

		$scope.savePageTags = function() {
			$http.post('admin/api-cms-nav/' + $scope.id + '/tags', $scope.pageTags).then(function(response) {
				$scope.togglePageSettingsOverlay();
				AdminToastService.success(i18n['js_config_update_success']);
			}, function(response) {
				AdminToastService.errorArray(response.data);
			});
		};

		$scope.createDeepPageCopyAsTemplate = function() {
			$http.post('admin/api-cms-nav/deep-page-copy-as-template', {navId: $scope.id}).then(function(response) {
				$scope.menuDataReload();
				AdminToastService.success(i18n['js_page_create_copy_as_template_success']);
				$scope.showActions = 1;
				$scope.togglePageSettingsOverlay();
                $state.go('custom.cmsdraft');
			}, function(response) {
				AdminToastService.errorArray(response.data);
			});
		};

		$scope.loadNavProperties = function() {
			$http.get('admin/api-cms-nav/get-properties', { params: {navId: $scope.id}}).then(function(response) {
				for(var i in response.data) {
					var d = response.data[i];
					$scope.propValues[d.admin_prop_id] = d.value;
					$scope.hasValues = true;
				}
			});
		};

		$scope.togglePropMask = function() {
			$scope.showPropForm = !$scope.showPropForm;
		};

		$scope.showPropForm = false;

		$scope.storePropValues = function() {
			var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};
			$http.post('admin/api-cms-nav/save-properties?navId='+$scope.id, $.param($scope.propValues), headers).then(function(response) {
				AdminToastService.success(i18n['js_page_property_refresh']);
				$scope.loadNavProperties();
				$scope.showPropForm = false;
				$scope.togglePageSettingsOverlay();
			});
		};

		$scope.trash = function() {
			AdminToastService.confirm(i18n['js_page_confirm_delete'], i18n['cmsadmin_settings_trashpage_title'], ['$toast', function($toast) {
				$http.get('admin/api-cms-nav/delete', { params : { navId : $scope.id }}).then(function(response) {
	    			$scope.isDeleted = true;
	    			$scope.menuDataReload().then(function() {
	    				$toast.close();
	    				$scope.togglePageSettingsOverlay();
	    			});
	    		}, function(response) {
					if (response.status == 417) {
						AdminToastService.error(i18n['js_page_delete_error_cause_redirects']);
					} else {
						AdminToastService.errorArray(response.data);
					}
				});
			}]);
	    };

	    $scope.isDraft = false;

	    $scope.submitNavForm = function(data) {
	    	$http.post('admin/api-cms-nav/update?id=' + $scope.navData.id, data).then(function(response) {
	    		AdminToastService.success(i18nParam('js_page_update_layout_save_success'));
	    		$scope.togglePageSettingsOverlay();
	    	}, function(response) {
	    		angular.forEach(response.data, function(value) {
	    			AdminToastService.error(value.message);
	    		});
	    	});
	    };

	    function initializer() {
			$scope.navData = $filter('filter')($scope.menuData.items, {id: $scope.id}, true)[0];
			if ($scope.navData == undefined) {
				$scope.isDraft = true;
			} else {

				$scope.loadNavProperties();

				/* properties --> */

			    $scope.$watch(function() { return $scope.navData.is_offline }, function(n, o) {
			    	if (n !== o && n !== undefined) {
			    		$http.get('admin/api-cms-nav/toggle-offline', { params : { navId : $scope.navData.id , offlineStatus : n }}).then(function(response) {
							if ($scope.navData.is_offline == 1) {
								AdminToastService.info(i18nParam('js_state_offline', {title: $scope.navData.title}));
							} else {
								AdminToastService.info(i18nParam('js_state_online', {title: $scope.navData.title}));
							}
			    		});
			    	}
			    });

			    $scope.$watch(function() { return $scope.navData.is_hidden }, function(n, o) {
					if (n !== o && n !== undefined) {
						$http.get('admin/api-cms-nav/toggle-hidden', { params : { navId : $scope.navData.id , hiddenStatus : n }}).then(function(response) {
							if ($scope.navData.is_hidden == 1) {
								AdminToastService.info(i18nParam('js_state_hidden', {title: $scope.navData.title}));
							} else {
								AdminToastService.info(i18nParam('js_state_visible', {title: $scope.navData.title}));
							}
						});
					}
				});

			    $scope.$watch(function() { return $scope.navData.is_home }, function(n, o) {
			    	if (n !== o && n !== undefined) {
						$http.get('admin/api-cms-nav/toggle-home', { params : { navId : $scope.navData.id , homeState : n }}).then(function(response) {
							$scope.menuDataReload().then(function() {
								if ($scope.navData.is_home == 1) {
									AdminToastService.success(i18nParam('js_state_is_home', {title: $scope.navData.title}));
								} else {
									AdminToastService.success(i18nParam('js_state_is_not_home', {title: $scope.navData.title}));
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
	zaa.controller("NavItemController", [
		'$scope', '$rootScope', '$http', '$filter', '$timeout', 'ServiceMenuData', 'AdminLangService', 'AdminToastService', 'ServiceLiveEditMode', 'ServiceLayoutsData', 'ServiceWorkingPageVersion',
		function($scope, $rootScope, $http, $filter, $timeout, ServiceMenuData, AdminLangService, AdminToastService, ServiceLiveEditMode, ServiceLayoutsData, ServiceWorkingPageVersion) {

		$scope.loaded = false;

		$scope.NavController = $scope.$parent;

		$scope.liveEditState = false;

		$scope.$watch(function() { return ServiceLiveEditMode.state }, function(n, o) {
			$scope.liveEditState = n;
		});

		$scope.openLiveUrl = function(id, versionId) {
			ServiceLiveEditMode.changeUrl(id, versionId);
		};

		$scope.loadLiveUrl = function() {
			ServiceLiveEditMode.changeUrl($scope.item.id, $scope.currentPageVersion);
		};

		// layoutsData

		$scope.layoutsData = ServiceLayoutsData.data;

    	$scope.$on('service:BlocksData', function(event, data) {
    		$scope.layoutsData = data;
    	});
		
		// serviceMenuData inheritance

		$scope.menuDataReload = function() {
			return ServiceMenuData.load(true);
		};

		$scope.$on('service:LoadLanguage', function(event, data) {
			if (!$scope.loaded) {
				$scope.refresh();
			}
		});

		// properties:

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

		$scope.trashItem = function() {
			if ($scope.lang.is_default == 0) {
				AdminToastService.confirm(i18n['js_page_confirm_delete'], i18n['cmsadmin_settings_trashpage_title'], ['$toast', function($toast) {
					$http.delete('admin/api-cms-navitem/delete?navItemId=' + $scope.item.id).then(function(response) {
						$scope.menuDataReload().then(function() {
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
		    		}, function(response) {
						AdminToastService.error(i18n['js_page_delete_error_cause_redirects']);
					});
				}]);
			}
	    };

		$scope.reset = function() {
			$scope.itemCopy = angular.copy($scope.item);
			if ($scope.item.nav_item_type == 1) {
				$scope.typeDataCopy = angular.copy({'nav_item_type_id' : $scope.item.nav_item_type_id });
			} else {
				$scope.typeDataCopy = angular.copy($scope.typeData);
			}
		};

		$scope.updateNavItemData = function(itemCopy, typeDataCopy) {
			$scope.errors = [];
			var headers = {"headers" : { "Content-Type" : "application/x-www-form-urlencoded; charset=UTF-8" }};
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
			$http.post(
				'admin/api-cms-navitem/update-page-item?navItemId=' + navItemId + '&navItemType=' + itemCopy.nav_item_type,
				$.param(typeDataCopy),
				headers
			).then(function(response) {
				if (itemCopy.nav_item_type !== 1) {
					$scope.currentPageVersion = 0;
				}
				$scope.loaded = false;
				if (response.data) {
					/* switch version if type is page */
					if (itemCopy.nav_item_type == 1 && typeof response.data['typeData'] === 'object') {
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
				AdminToastService.success(i18nParam('js_page_item_update_ok', {'title': itemCopy.title}));
				$scope.menuDataReload();
				$scope.refresh();
				$scope.toggleSettingsOverlay();
				$scope.reset();
			}, function errorCallback(response) {
				angular.forEach(response.data, function(item) {
					AdminToastService.error(item.message);
				});
			});
		};

		$scope.$watch('itemCopy.alias', function(n, o) {
			if (n!=o && n!=null) {
				$scope.itemCopy.alias = $filter('slugify')(n);
			}
		});

		$scope.removeVersion = function(version) {
			AdminToastService.confirm(i18nParam('js_version_delete_confirm', {alias: version.version_alias}), i18n['cmsadmin_version_remove'], ['$toast', '$http', function($toast, $http) {
				$http.post('admin/api-cms-navitem/remove-page-version', {pageId : version.id}).then(function(response) {
					$scope.refreshForce();
					$toast.close();
					AdminToastService.success(i18nParam('js_version_delete_confirm_success', {alias: version.version_alias}));
				});
			}]);
		};
		
    	$scope.editVersionItem;
    	
    	$scope.tab = 1;
    	
    	$scope.editVersion = function(versionItem) {
    		$scope.changeTab(4);
    		$scope.editVersionItem = versionItem;
    	};

    	$scope.editVersionUpdate = function(editVersionItem) {
    		$http.post('admin/api-cms-navitem/change-page-version-layout', {'pageItemId': editVersionItem.id, 'layoutId': editVersionItem.layout_id, 'alias': editVersionItem.version_alias}).then(function(response) {
    			$scope.refreshForce();
    			AdminToastService.success(i18n['js_version_update_success']);
    			$scope.toggleSettingsOverlay();
			});
    	};
    	
		$scope.getItem = function(langId, navId) {
			$http({
			    url: 'admin/api-cms-navitem/nav-lang-item',
			    method: "GET",
			    params: { langId : langId, navId : navId }
			}).then(function(response) {
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

				$scope.loaded = true
			}, function(error) {
				// its loaded, but the data does not exists.
				$scope.loaded = true;
			});
		};
		
		$scope.versionDropDownVisbility = false;
		
		$scope.toggleVersionsDropdown = function() {
			$scope.versionDropDownVisbility = !$scope.versionDropDownVisbility;
		};
		
		$scope.switchVersion = function(pageVersionid, toggle) {
			ServiceWorkingPageVersion.store($scope.item.id, pageVersionid);
			$scope.container = $scope.typeData[pageVersionid]['contentAsArray'];
			$scope.currentPageVersionAlias = $scope.typeData[pageVersionid]['version_alias'];
			$scope.currentPageVersion = pageVersionid;
			$scope.loadLiveUrl();
			if (toggle) {
				$scope.toggleVersionsDropdown();
			}
		};

		$scope.refreshForce = function() {
			$scope.getItem($scope.lang.id, $scope.NavController.id);
		};

		$scope.refresh = function() {
			if (AdminLangService.isInSelection($scope.lang.short_code)) {
				$scope.getItem($scope.lang.id, $scope.NavController.id);
			}
		};
		
		/* new settings overlay */
		
		$scope.settingsOverlayVisibility = true;
		
		$scope.toggleSettingsOverlay = function(tab) {
			$scope.settingsOverlayVisibility = !$scope.settingsOverlayVisibility;
			if (tab) {
				$scope.tab = tab;
			}
		}
		
		$scope.changeTab = function(tab) {
			$scope.tab = tab;
		}
		
		/**
		 * Refresh the current layout container blocks.
		 * 
		 * After successfull api response all cms layout are foreach and the values are passed to revPlaceholders() method.
		 */
		$scope.refreshNested = function(prevId, placeholderVar) {
			$http({
				url : 'admin/api-cms-navitem/reload-placeholder',
				method : 'GET',
				params : { navItemPageId : $scope.currentPageVersion, prevId : prevId, placeholderVar : placeholderVar}
			}).then(function(response) {
				ServiceLiveEditMode.changeUrl($scope.item.id, $scope.currentPageVersion);
				angular.forEach($scope.container.__placeholders, function(placeholder) {
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
		$scope.revPlaceholders = function(placeholders, prevId, placeholderVar, replaceContent) {
			angular.forEach(placeholders, function(placeholderRow, placeholderKey) {
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
		$scope.revFind = function(placeholder, prevId, placeholderVar, replaceContent) {
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
		$scope.dropItemPlaceholder = function(dragged,dropped,position) {
			if (dragged.hasOwnProperty('favorized') || dragged.hasOwnProperty('newblock')) {
				// its a new block
				$http.post('admin/api-cms-navitempageblockitem/create', {
					prev_id: dropped.prev_id, 
					sort_index:0, 
					block_id: dragged.id, 
					placeholder_var : dropped['var'], 
					nav_item_page_id: dropped.nav_item_page_id
				}).then(function(response) {
					$scope.refreshNested(dropped['prev_id'], dropped['var']);
				});
			} else if (dragged.hasOwnProperty('copystack')) {
				// its a block from copy stack
				$http.post('admin/api-cms-navitemblock/copy-block-from-stack', {
					copyBlockId: dragged.id,
					sort_index: 0,
					prev_id:  dropped.prev_id,
					placeholder_var : dropped['var'], 
					nav_item_page_id: dropped.nav_item_page_id
				}).then(function(response) {
					$scope.refreshNested(dropped['prev_id'], dropped['var']);
				});
			} else {
				// moving an existing block
				$http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
					sort_index: 0,
					prev_id:  dropped.prev_id,
					placeholder_var : dropped['var'], 
				}).then(function(response) {
					$scope.refreshForce();
				});
			}
			
		};
		
		$scope.refresh();
	}]);

	/**
	 * @param $scope.block From ng-repeat scope assignment
	 */
	zaa.controller("PageBlockEditController", [
		'$scope', '$sce', '$http', 'AdminClassService', 'AdminToastService', 'ServiceBlockCopyStack', 'ServiceLiveEditMode',
		function($scope, $sce, $http, AdminClassService, AdminToastService, ServiceBlockCopyStack, ServiceLiveEditMode) {

		$scope.NavItemTypePageController = $scope.$parent;

		/**
		 * drops an item in an empty placeholder of a BLOCK
		 */
		$scope.dropItemPlaceholder = function(dragged,dropped,position) {
			if (dragged.hasOwnProperty('favorized') || dragged.hasOwnProperty('newblock')) {
				// its a new block
				$http.post('admin/api-cms-navitempageblockitem/create', {
					prev_id : dropped.prev_id,
					sort_index:0, 
					block_id : dragged.id,
					placeholder_var : dropped.var,
					nav_item_page_id : dropped.nav_item_page_id
				}).then(function(response) {
					$scope.NavItemTypePageController.refreshNested(dropped.prev_id, dropped.var);
				});
			} else if (dragged.hasOwnProperty('copystack')) {
				// its a block from copy stack
				$http.post('admin/api-cms-navitemblock/copy-block-from-stack', {
					copyBlockId: dragged.id,
					sort_index: 0,
					prev_id:  dropped.prev_id,
					placeholder_var : dropped.var,
					nav_item_page_id : dropped.nav_item_page_id
				}).then(function(response) {
					$scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
				});
			} else {
				// moving an existing block
				$http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
					sort_index: 0,
					prev_id:  dropped.prev_id,
					placeholder_var : dropped.var,
				}).then(function(response) {
					$scope.refreshForce();
				});
			}
		};
		
		/**
		 * Drops a block above/below an EXISTING BLOCK
		 */
		$scope.dropItem = function(dragged,dropped,position,element) {
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
				}).then(function(response) {
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
				}).then(function(response) {
					$scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
				});
			} else {
				// moving an existing block
				$http.put('admin/api-cms-navitempageblockitem/update?id=' + dragged.id, {
					prev_id: $scope.placeholder.prev_id,
					placeholder_var: $scope.placeholder['var'],
					sort_index: sortIndex
				}).then(function(response) {
					/*
					 * @issue: https://github.com/luyadev/luya/issues/1629
					 * The moved block, should removed from the previous array. This is only the case when dragging from an OUTER block into an INNER block
					 * is this will not refresh the OUTER block, but always will in the opposite way.
					 */
					angular.element(element).remove();
					// as the block has been removed from existing, refresh the new placeholder.
					$scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
				});
			}
		};
		
		$scope.copyBlock = function() {
			ServiceBlockCopyStack.push($scope.block);
		};

		$scope.toggleHidden = function() {
			if ($scope.block.is_hidden == 0) {
				$scope.block.is_hidden = 1;
			} else {
				$scope.block.is_hidden = 0;
			}

			$http({
			    url: 'admin/api-cms-navitem/toggle-block-hidden',
			    method: "GET",
			    params: { blockId : $scope.block.id, hiddenState: $scope.block.is_hidden }
			}).then(function(response) {
				/* load live url on hidden trigger */
				$scope.NavItemTypePageController.$parent.$parent.loadLiveUrl();
				// successfull toggle hidden state of block
				AdminToastService.info(i18nParam('js_page_block_visbility_change', {name: $scope.block.name}));
			});
		};

        $scope.isEditable = function() {
            return typeof $scope.block.vars != "undefined" && $scope.block.vars.length > 0;
        };

        $scope.isConfigurable = function() {
            return typeof $scope.block.cfgs != "undefined" && $scope.block.cfgs.length > 0;
        };
		
		
		$scope.$watch(function() { return $scope.block.values }, function(n, o) {
			$scope.data = n;
		});

		$scope.$watch(function() { return $scope.block.variation }, function(n, o) {
			$scope.evalVariationVisbility(n);
		});
		
		$scope.getInfo = function(varFieldName) {
			if ($scope.block.field_help.hasOwnProperty(varFieldName)) {
				return $scope.block.field_help[varFieldName];
			}
			
			return false;
		}

		$scope.evalVariationVisbility = function(variatenName) {
			if ($scope.block.variations.hasOwnProperty(variatenName)) {
				var variation = $scope.block.variations[$scope.block.variation];
				angular.forEach(variation, function(value, key) {
					if (angular.isObject(value)) {
						angular.forEach(value, function(v, k) {
							angular.forEach($scope.block[key], function(object) {
								if (k == object.var) {
									object.invisible = true;
								}
							});
						})
					}
				});
			} else {
				angular.forEach($scope.block.cfgs, function(object) {
					object.invisible = false;
				});
				angular.forEach($scope.block.vars, function(object) {
					object.invisible = false;
				});
			}
		};

		$scope.cfgdata = $scope.block.cfgvalues || {};

		$scope.edit = false;
		
		$scope.modalHidden = true;

		$scope.modalMode = 1;

		$scope.initModalMode = function() {
			if ($scope.block.vars.length  == 0) {
				$scope.modalMode = 2;
			}
		};

		$scope.toggleEdit = function() {
			if ($scope.isEditable() || $scope.isConfigurable()) {
				$scope.modalHidden = !$scope.modalHidden;
				$scope.edit = !$scope.edit;
			}
		};

		$scope.renderTemplate = function(template, dataVars, cfgVars, block, extras) {
			if (template == undefined) {
				return '';
			}
			var template = Twig.twig({
			    data: template
			});

			var content = template.render({
				vars : dataVars,
				cfgs : cfgVars,
				block : block,
				extras : extras
			});

			return $sce.trustAsHtml(content);
		};

		$scope.removeBlock = function() {
			AdminToastService.confirm(i18nParam('js_page_block_delete_confirm', {name: $scope.block.name}), i18n['view_update_block_tooltip_delete'], ['$toast', function($toast) {
				$http.delete('admin/api-cms-navitempageblockitem/delete?id=' + $scope.block.id).then(function(response) {
					$scope.NavItemTypePageController.refreshNested($scope.placeholder.prev_id, $scope.placeholder.var);
					$scope.NavItemTypePageController.loadLiveUrl();
					$toast.close();
					AdminToastService.success(i18nParam('js_page_block_remove_ok', {name: $scope.block.name}));
				});
			}]);
		};

		$scope.isAnyRequiredAttributeEmpty =  function() {

			var response = false;
			angular.forEach($scope.block.vars, function(varItem) {
				if (varItem.required && $scope.isEmpty($scope.data, varItem.var)) {
					AdminToastService.error(i18nParam('js_block_attribute_empty', {label: varItem.label}));
					response = true;
				}
			});

			angular.forEach($scope.block.cfgs, function(varItem) {

				if (varItem.required && $scope.isEmpty($scope.cfgdata, varItem.var)) {
					AdminToastService.error(i18nParam('js_block_attribute_empty', {label: varItem.label}));
					response = true;
				}
			});

			return response;
		};

		$scope.isEmpty = function(values, key) {
			if (values.hasOwnProperty(key) && values[key]) {
				if (values[key].length == 0) {
					return true;
				}
				
				return false;
			}

			return true;
		};

		$scope.save = function(close) {
			if ($scope.isAnyRequiredAttributeEmpty()) {
				return;
			}
			$http.put('admin/api-cms-navitempageblockitem/update?id=' + $scope.block.id, {
				json_config_values: $scope.data,
				json_config_cfg_values: $scope.cfgdata,
				variation: $scope.block.variation
			}).then(function(response) {
				AdminToastService.success(i18nParam('js_page_block_update_ok', {name: $scope.block.name}));
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

	zaa.controller("DroppableBlocksController", ['$scope', '$http', 'AdminClassService', 'ServiceBlocksData', 'ServiceBlockCopyStack', function($scope, $http, AdminClassService, ServiceBlocksData, ServiceBlockCopyStack) {

		/* service ServiceBlocksData inheritance */

		$scope.blocksData = ServiceBlocksData.data;

		$scope.blocksDataRestore = angular.copy($scope.blocksData);

		$scope.$on('service:BlocksData', function(event, data) {
			$scope.blocksData = data;
		});

		$scope.blocksDataReload = function() {
			return ServiceBlocksData.load(true);
		}

		$scope.addToFav = function(item) {
			$http.post('admin/api-cms-block/to-fav', {block: item }).then(function(response) {
				$scope.blocksDataReload();
			});
		};

		$scope.removeFromFav = function(item) {
			$http.post('admin/api-cms-block/remove-fav', {block: item }).then(function(response) {
				$scope.blocksDataReload();
			});
		};

		$scope.toggleGroup = function(group) {
			if (group.toggle_open == undefined) {
				group.toggle_open = 1;
			} else {
				group.toggle_open = !group.toggle_open;
			}

			$http.post('admin/api-cms-block/toggle-group', {group: group}, {ignoreLoadingBar: true});
		};

		$scope.isPreviewEnabled = function(item) {
			return item.preview_enabled;
		};

		// controller logic

		$scope.copyStack = ServiceBlockCopyStack.stack;

		$scope.$on('service:CopyStack', function(event, stack) {
			$scope.copyStack = stack;
		});

		$scope.clearStack = function() {
			ServiceBlockCopyStack.clear();
		};

		$scope.searchQuery = '';

		$scope.searchIsDirty = false;

		$scope.$watch('searchQuery', function(n, o) {
			if (n !== '') {
				$scope.searchIsDirty = true;
				angular.forEach($scope.blocksData, function(value, key) {
					if (value.group.is_fav) {
						$scope.blocksData.splice(key, 1);
					}
					value.group.toggle_open = 1
				});
			} else if($scope.searchIsDirty) {
				$scope.blocksData = angular.copy($scope.blocksDataRestore);
			}
		});
	}]);
})();