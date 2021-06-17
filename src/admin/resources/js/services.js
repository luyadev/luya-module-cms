/**
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
	
zaa.config(['resolverProvider', function(resolverProvider) {
	resolverProvider.addCallback(['ServiceMenuData', 'ServiceBlocksData', 'ServiceLayoutsData', 'ServiceCurrentWebsite', 'LuyaLoading', function(ServiceMenuData, ServiceBlocksData, ServiceLayoutsData, ServiceCurrentWebsite, LuyaLoading) {
		LuyaLoading.start();
		ServiceBlocksData.load();
		ServiceLayoutsData.load();
		ServiceMenuData.load().then(function() {
			ServiceCurrentWebsite.load();
			LuyaLoading.stop();
		});
	}]);
}]);


/**
 * Copy Block Stack service.
 */
zaa.factory("ServiceBlockCopyStack", ['$rootScope', function($rootScope) {
	var service = [];
	
	service.stack = [];
	
	service.clear = function() {
		service.stack = [];
		$rootScope.$broadcast('service:CopyStack', service.stack);
	};
	
	service.push = function(block) {
		if (service.stack.length > 4) {
			service.stack.shift();
		}
		service.stack.push({blockId: block.block_id, name: block.name, icon:block.icon, id: block.id, copystack: 1});
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
zaa.factory("ServiceMenuData", ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
	var service = [];
	
	service.data = [];
	
	service.load = function(forceReload) {
		return $q(function(resolve, reject) {
			if (service.data.length > 0 && forceReload !== true) {
				resolve(service.data);
			} else {
				$http.get("admin/api-cms-menu/data-menu").then(function(response) {
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
zaa.factory("ServiceBlocksData", ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
	var service = [];
	
	service.data = [];
	
	service.load = function(forceReload) {
		return $q(function(resolve, reject) {
			if (service.data.length > 0 && forceReload !== true) {
				resolve(service.data);
			} else {
				$http.get("admin/api-cms-admin/data-blocks").then(function(response) {
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
zaa.factory("ServiceLayoutsData", ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
	var service = [];
	
	service.data = [];
	
	service.load = function(forceReload) {
		return $q(function(resolve, reject) {
			if (service.data.length > 0 && forceReload !== true) {
				resolve(service.data);
			} else {
				$http.get("admin/api-cms-admin/data-layouts").then(function(response) {
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
zaa.factory("ServiceLiveEditMode", ['$rootScope', function($rootScope) {
	
	var service = [];
	
	service.state = 0;
	
	service.url = $rootScope.luyacfg.homeUrl;
	
	service.toggle = function() {
		service.state = !service.state;
	};
	service.setUrl = function(itemId, versionId) {
		var d = new Date();
		var n = d.getTime();
		service.url = $rootScope.cmsConfig.previewUrl + '?itemId='+itemId+'&version=' + versionId + '&date=' + n;
	};
	
	service.changeUrl = function(itemId, versionId) {
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
zaa.factory("ServiceCurrentWebsite", ['$rootScope', 'ServiceMenuData', function($rootScope, ServiceMenuData) {

	var service = {
		currentWebsite: null,
		defaultWebsite: null
	};

	service.load = function() {
		service.defaultWebsite = ServiceMenuData.data.websites.find(w => w.is_default) || ServiceMenuData.data.websites[0];
		if (service.defaultWebsite) {
			service.toggle(service.defaultWebsite.id);
		}
	}

	service.toggle = function(websiteId) {
		if (websiteId && ServiceMenuData.data.websites && (!service.currentWebsite || service.currentWebsite.id !== websiteId)) {
			service.currentWebsite = ServiceMenuData.data.websites.find(w => w.id === websiteId);
			$rootScope.$broadcast('service:CurrentWebsiteChanged', service.currentWebsite);
		}
	};

	return service;
}]);

zaa.factory("ServiceWorkingPageVersion", [function() {
	var service = {
		page: {}
	};

	service.store = function(pageId, versionId) {
		service.page[pageId] = versionId;
	};

	service.hasVersion = function(pageId) {
		if (service.page.hasOwnProperty(pageId)) {
			return service.page[pageId];
		}

		return false;
	};

	return service;
}]);