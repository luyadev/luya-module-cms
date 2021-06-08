<?php
use luya\cms\admin\Module;

?>
<script>
zaa.bootstrap.register('PermissionController', ['$scope', '$http', 'ServiceMenuData', function($scope, $http, ServiceMenuData) {

	$scope.$on('service:MenuData', function(event, data) {
		$scope.loadPermissions();
	});

    $scope.data = null;
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
<div ng-controller="PermissionController">
    <collapse-container title="{{website.websiteInfo.name}}" ng-repeat="website in data.websites" class="mb-3">
    <div class="table-responsive">
        <table class="table table-borderless">
            <tr>
                <td>
                    
                </td>
                <td ng-repeat="group in data.groups">
                    <a class="btn btn-outline-success" ng-if="group.fullPermission"><i class="material-icons">check_circle</i> {{ group.name }}</a>
                    <a class="btn btn-outline-secondary" ng-click="grantFullPermission(group.id)" ng-if="!group.fullPermission"><i class="material-icons">check_circle</i> {{ group.name }}</a>
                </td>
            </tr>
            <tbody ng-repeat="container in website.containers">
                <tr class="permissions__container-row bg-light">
                    <th colspan="{{data.groups.length + 1}}">{{ container.containerInfo.name }}</th>
                </tr>
                <tr ng-repeat="item in container.items" class="permissions__item-row">
                    <td  class="align-middle" style="padding-left: {{item.nav_level * 20}}px; font-weight:normal">{{ item.title }}</td>
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
    </collapse-container>
</div>
