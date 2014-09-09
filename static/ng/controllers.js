angular.module('Pillars.controllers', [])
	.controller('crudListActions', function($scope, $location, crudListLoader) {
		$scope.crudListLoader = crudListLoader;
		$scope.showList = function(){
			if($location.path()!="/"){
				$location.path('/');
			} else {
				crudListLoader.load();
			}
		}
	})
	.controller('crudList', function($scope, crudListLoader) {
		$scope.crudListLoader = crudListLoader;
		crudListLoader.load();
	})
	.controller('crudUpdate', function($scope, $location, $routeParams, crudEntityLoader) {
		$scope.crudEntityLoader = crudEntityLoader.reset();
		crudEntityLoader.id = $routeParams._id;
		crudEntityLoader.form = crudEntityForm;
		$scope.datapath = [];
		$scope.data = {};
		crudEntityLoader.onData = function(){
			$scope.data = crudEntityLoader.data;
		}
		crudEntityLoader.load();


		
		$scope.crudEntityFormInputs = function(){
			return Object.keys($scope.crudEntityForm);
		}
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