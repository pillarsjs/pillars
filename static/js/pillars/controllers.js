angular.module('Pillars.controllers', [])
	.controller('crudListFilter', function($rootScope, $scope, loader, $location, $routeParams) {
		$rootScope.listFilter = "";
		$rootScope.listSort = "";
		$rootScope.listOrder = 1;
		$scope.applyFilter = function(){
			$rootScope.listFilter = $scope.listFilter || "";
			if($location.path()=="/"){
				loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
			} else {
				$location.path('/');
			}
		}
		$scope.sortBy = function(sort,order){
			$rootScope.listSort = $scope.listSort = sort;
			$rootScope.listOrder = $scope.listOrder = order;
			loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
		}
	})
	.controller('crudList', function($scope, loader, listquery) {
		$scope.data = {};
		$scope.isend = false;
		loader.data = function(xhr){
			$scope.isend = false;
			if(xhr.json.data===true){ // remove case
				//$rootScope.lostmsgs = xhr.json.msgs;
				loader.send('get','api?_filter='+listquery.filter+'&_sort='+listquery.sort+'&_order='+listquery.order,false,false);
			} else if(xhr.json.data.skip || xhr.json.data.range) {
				if(xhr.json.data.limit>xhr.json.data.list.length){$scope.isend = true;}
				var cache = $scope.data.list;
				$scope.data = xhr.json.data || [];
				$scope.data.list = cache.concat(xhr.json.data.list);
			} else {
				if(xhr.json.data.limit>xhr.json.data.list.length){$scope.isend = true;}
				$scope.data = xhr.json.data || [];
			}
		};

		loader.send('get','api?_filter='+listquery.filter+'&_sort='+listquery.sort+'&_order='+listquery.order,false,false);

		$scope.more = function(){
			var skip = parseInt($scope.data.skip || 0);
			var limit = parseInt($scope.data.limit || 0);
			var range = $scope.data.range || false;
			loader.send('get','api?_skip='+(skip+limit)+'&_filter='+listquery.filter+'&_sort='+listquery.sort+'&_order='+listquery.order,false,false);
		}

		$scope.removeElement = function(id){
			loader.send('delete','api/'+id,false,false);
		}
	})
	.controller('crudUpdate', function($rootScope, $scope, loader, $location, $routeParams) {
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