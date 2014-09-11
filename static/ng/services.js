angular.module('Pillars.services', [])
	.factory('crudListLoader',function($rootScope,$timeout){
		var apiList = new ApiList($rootScope.env.apiurl);
		apiList.loader.progress = function(){
			$timeout(function(){}, 0);
		};
		return apiList;
	})
	.factory('crudEntityLoader',function($rootScope,$timeout){
		var apiEntity = new ApiEntity($rootScope.env.apiurl);
		apiEntity.loader.progress = function(){
			$timeout(function(){}, 0);
		};
		return apiEntity;
	})
;