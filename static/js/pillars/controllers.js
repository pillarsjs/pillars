angular.module('Pillars.controllers', [])
	.controller('crudListActions', function($scope, apiList) {
		$scope.apiList = apiList;
	})
	.controller('crudList', function($scope, apiList) {
		$scope.apiList = apiList;
		apiList.load();
	})
	.controller('crudUpdate', function($rootScope, $scope, $location, $routeParams, apiEntity) {
		$scope.apiEntity = apiEntity.reset();
		apiEntity.id = $routeParams._id;
		apiEntity.form = crudEntityForm;
		apiEntity.onData = function(){
			$scope.data = apiEntity.data;
		}
		apiEntity.load();
		/*
		$rootScope.languages = null;
		$rootScope.navsave = true;
		$rootScope.navremove = true;
		$scope.data = {};
		$scope.nstlist = [];
		loader.data = function(xhr){
			$scope.validations = xhr.json.ads || {};
			if(!xhr.json.error) {
				$scope.data = xhr.json.data;
			}
		};

		loader.send('get','api/'+$routeParams._id,false,false);

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			var newid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
			parent[list].push({_id:newid,_order:''+parent[list].length+''});
		};
		$scope.deleteListItem = function(list,k,id){
			$scope.nstlist.push(id);
			list.splice(k,1);
		};
		$scope.orderListItem = function(parent,list){
			var tomove = parent[list];
			var order = parent[list]._order;
			parent.splice(list,1);
			parent.splice(order,0,tomove);
			parent.forEach(function(element,index,array){
				element._order = ''+index+'';
			});
		};
		$scope.sendForm = function(){
			loader.send('put','api/'+$routeParams._id,$form,true);
		}
		$rootScope.removeElement = function(){
			loader.send('delete','api/'+$routeParams._id,false,false);
		}
		*/
	})
	.controller('crudInsert', function($rootScope, $scope, loader, $location, $routeParams) {
		$rootScope.languages = null;
		$rootScope.navsave = true;
		$rootScope.navremove = false;
		$scope.data = {};
		loader.data = function(xhr){
			if(!xhr.json.error){
				//$rootScope.lostmsgs = xhr.json.error;
				$location.path('/edit/'+xhr.json.data._id);
			} else {
				//$scope.data = xhr.json.data || false;
				$scope.validations = xhr.json.ads || {};
			}
		};

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			parent[list].push({});
		};
		$scope.sendForm = function(){
			loader.send('post','api',$form,false);
		}
	})	
;