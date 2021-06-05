<?php
use luya\cms\admin\Module;

?>
<script>
zaa.bootstrap.register('PermissionController', ['$scope', '$http', 'ServiceMenuData', function($scope, $http, ServiceMenuData) {

	$scope.$on('service:MenuData', function(event, data) {
		$scope.loadPermissions();
	});

    $scope.data = null;
    $scope.hiddenWebsites = [];
    $scope.groupInjection = null;

	$scope.loadPermissions = function() {
		$http.get('admin/api-cms-menu/data-permission-tree').then(function(response) {
            $scope.data = response.data;
            $scope.groupInjection = response.data.groups;
		});
	};

	$scope.reloadMenuData = function() {
		ServiceMenuData.load(true);
	};

    $scope.toggleWebsite = function(websiteId) {
        if (websiteId in $scope.hiddenWebsites) {
            $scope.hiddenWebsites[websiteId] = !$scope.hiddenWebsites[websiteId];
        } else {
            $scope.hiddenWebsites[websiteId] = 1;
        }
    };

    $scope.isWebsiteHidden = function(websiteId) {

        if ($scope.hiddenWebsites == undefined) {
            return false;
        }

        if (websiteId in $scope.hiddenWebsites) {
            if ($scope.hiddenWebsites[websiteId] == 1) {
                return true;
            }
        }

        return false;
    };

    $scope.deletePermission = function(navId, groupId) {
    	// delete request
        $http.post('admin/api-cms-menu/data-permission-delete', {navId: navId, groupId: groupId}).then(function() {
            $scope.reloadMenuData();
        });
    };

    $scope.insertPermission = function(navId, groupId) {
    	$http.post('admin/api-cms-menu/data-permission-insert', {navId: navId, groupId: groupId}).then(function() {
    	    $scope.reloadMenuData();
    	});
    };

    $scope.deleteInheritance = function(navId, groupId) {
    	$http.post('admin/api-cms-menu/data-permission-delete-inheritance', {navId: navId, groupId: groupId}).then(function() {
    		$scope.reloadMenuData();
        });
    };

    $scope.insertInheritance = function(navId, groupId) {
    	$http.post('admin/api-cms-menu/data-permission-insert-inheritance', {navId: navId, groupId: groupId}).then(function() {
    		$scope.reloadMenuData();
        });
    };

    $scope.grantFullPermission = function(groupId) {
        $http.post('admin/api-cms-menu/data-permission-grant-group', {groupId: groupId}).then(function() {
            $scope.reloadMenuData();
        });
    }

    $scope.init = function() {
        $scope.reloadMenuData();
    };

    $scope.init();
}]);
</script>
<h1 class="crud-title mb-4"><?= Module::t('menu_group_item_env_permission'); ?></h1>
<div ng-controller="PermissionController" class="card">
    <div class="card-body" ng-repeat="website in data.websites">

        <div class="treeview-label treeview-label-container" ng-click="toggleWebsite(website.websiteInfo.id)">
            <span class="treeview-icon treeview-icon-collapse">
                <i class="material-icons" ng-show="!isWebsiteHidden(website.websiteInfo.id)">keyboard_arrow_down</i>
                <i class="material-icons" ng-show="isWebsiteHidden(website.websiteInfo.id)">keyboard_arrow_right</i>
            </span>
            <span class="treeview-link"><span class="google-chrome-font-offset-fix">{{website.websiteInfo.name}}</span></span>
        </div>
        
        <table class="table table-hover table-sm" ng-show="!isWebsiteHidden(website.websiteInfo.id)">
            <thead>
                <tr>
                    <th>
                        
                    </th>
                    <th ng-repeat="group in data.groups">
                        <a class="btn btn-outline-success" ng-if="group.fullPermission"><i class="material-icons">check_circle</i></a>
                        <a class="btn btn-outline-secondary" ng-click="grantFullPermission(group.id)" ng-if="!group.fullPermission"><i class="material-icons">check_circle</i></a>
                        {{ group.name }}
                    </th>
                </tr>
            </thead>
            <tbody ng-repeat="container in website.containers">
                <tr class="permissions__container-row">
                    <th colspan="{{data.groups.length + 1}}">{{ container.containerInfo.name }}</th>
                </tr>
                <tr ng-repeat="item in container.items" class="permissions__item-row">
                    <th scope="row" style="padding-left: {{item.nav_level * 20}}px">{{ item.title }}</th>
                    <td ng-repeat="group in item.groups">
                        <!-- {{ group.name }} -->
                        <div ng-if="group.groupFullPermission">
                            <a class="btn btn-outline-secondary" ng-click="insertPermission(item.id, group.id)"><i class="material-icons">check</i></a>
                            <a class="btn btn-outline-secondary" ng-click="insertInheritance(item.id, group.id)"><i class="material-icons">playlist_add_check</i></a>
                        </div>
                        <div ng-if="group.isInheritedFromParent && !group.groupFullPermission">
                            <a class="btn btn-outline-success disabled"><i class="material-icons">check</i></a>
                            <a class="btn btn-outline-success disabled"><i class="material-icons">playlist_add_check</i></a>
                        </div>
                        <div ng-if="!group.isInheritedFromParent && !group.groupFullPermission">
                            <a class="btn btn-success" ng-if="group.permissionCheckbox" ng-click="deletePermission(item.id, group.id)"><i class="material-icons">check</i></a>
                            <a class="btn btn-danger" ng-if="!group.permissionCheckbox" ng-click="insertPermission(item.id, group.id)"><i class="material-icons">check</i></a>
    
                            <a class="btn btn-success" ng-if="group.isGroupPermissionInheritNode" ng-click="deleteInheritance(item.id, group.id)"><i class="material-icons">playlist_add_check</i></a>
                            <a class="btn btn-danger" ng-if="!group.isGroupPermissionInheritNode" ng-click="insertInheritance(item.id, group.id)"><i class="material-icons">playlist_add_check</i></a>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
