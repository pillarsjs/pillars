angular.module('Pillars', ['ngRoute'])
//angular.module('crudNg',[])
	.factory('$loader', ['$rootScope', function ($rootScope) {

		var loader = new xhrLoader();

		loader.start = function(){
			$rootScope.loading=true;// Sync
		};
		loader.sending = function(percent){
			$rootScope.sending=percent;
			$rootScope.$digest();
		};
		loader.receiving = function(percent){
			$rootScope.receiving=percent;
			$rootScope.$digest();
		};
		loader.fail = function(){
			console.log("Request error");
		};
		loader.end = function(){
			console.log("Request complete",loader.xhr.status,loader.xhr.statusText);
			console.log(loader.xhr.json);
			$rootScope.msgs=[];
			if($rootScope.lostmsgs){$rootScope.msgs = $rootScope.lostmsgs;$rootScope.lostmsgs=false;}
			$rootScope.msgs = $rootScope.msgs.concat(loader.xhr.json.msgs || []);
			$rootScope.loading=false;
			$rootScope.$apply();
			loader.data(loader.xhr);
		};

		return loader;

	}])
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				controller:'crudList',
				templateUrl:'crud-list.html'
			})
			.when('/edit/:_id', {
				controller:'crudUpdate',
				templateUrl:'crud-update.html'
			})
			.when('/new', {
				controller:'crudInsert',
				templateUrl:'crud-insert.html'
			})
			.otherwise({
				redirectTo:'/'
			});
	})
	.controller('crudList', function($rootScope, $scope,$loader, $location, $routeParams) {
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$loader.send('get','http://localhost:3000/system/api',false,false);
			} else {
				$scope.data = xhr.json.data || false;
				$scope.$apply();
			}
		};

		$loader.send('get','http://localhost:3000/system/api',false,false);

		$scope.removeElement = function(id){
			$loader.send('delete','http://localhost:3000/system/api/'+id,false,false);
		}
	})
	.controller('crudUpdate', function($rootScope, $scope, $loader, $location, $routeParams) {
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$location.path('/');
				$scope.$apply();
			} else {
				$scope.data = xhr.json.data || false;
				$scope.validations = xhr.json.validations || {};
				$scope.$apply();
			}
		};

		$loader.send('get','http://localhost:3000/system/api/'+$routeParams._id,false,false);

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			parent[list].push({});
		};
		$scope.sendForm = function(){
			$loader.send('put','http://localhost:3000/system/api/'+$routeParams._id,crudUpdateForm,false);
		}
		$scope.removeElement = function(){
			$loader.send('delete','http://localhost:3000/system/api/'+$routeParams._id,false,false);
		}
	})
	.controller('crudInsert', function($rootScope, $scope, $loader, $location, $routeParams) {
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data._id){
				$rootScope.lostmsgs = xhr.json.msgs;
				$location.path('/edit/'+xhr.json.data._id);
				$scope.$apply();
			} else {
				$scope.data = xhr.json.data || false;
				$scope.validations = xhr.json.validations || {};
				$scope.$apply();
			}
		};

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			parent[list].push({});
		};
		$scope.sendForm = function(){
			$loader.send('post','http://localhost:3000/system/api',crudInsertForm,false);
		}
	})


function xhrLoader(){
	var loader = this;
	loader.xhr = new XMLHttpRequest();
	loader.xhr.json = false;
	loader.start = false;
	loader.sending = false;
	loader.receiving = false;
	loader.fail = false;
	loader.end = false;
	loader.send = function(method, url, form, files){
		loader.xhr.open(method, url, true);
		//loader.xhr.responseType="json";
		if(form){
			if(files){
				loader.xhr.send(new FormData(form));
			} else {
				loader.xhr.setRequestHeader("Content-Type", "application\/x-www-form-urlencoded");
				loader.xhr.send($(form).serialize());
			}
		} else {
			loader.xhr.send();
		}
		return loader;
	};

	fire = function(e){
		if(typeof loader[e] == 'function'){
			loader[e].apply(loader[e],Array.prototype.slice.call(arguments).slice(1));
		}
	}

	loader.data = function (xhr) {
		fire('data',xhr);
	}

	loader.xhr.addEventListener("loadstart", function(){
		fire('start');
	},false);
	loader.xhr.addEventListener("progress", function(e){
		if(e.lengthComputable) {fire('receiving',Math.round(e.loaded / e.total));}
	},false);
	loader.xhr.addEventListener("load", function(){
		fire('receiving',100);
		if(loader.xhr.getResponseHeader('Content-Type')=='application/json'){
			try {
				loader.xhr.json = JSON.parse(loader.xhr.response);
				fire('end');
			} catch(e) {
				fire('fail','parse:error');
			}
		} else {
			fire('fail','content:error');
		}
	},false);
	loader.xhr.addEventListener("error", function(){
		fire('fail','request:error');
	},false);
	loader.xhr.addEventListener("abort",function(){
		fire('fail','request:aborted');
	},false);
	loader.xhr.upload.addEventListener("progress", function(e){
		if(e.lengthComputable) {fire('sending',Math.round(e.loaded / e.total));}
	},false);
	loader.xhr.upload.addEventListener("load", function(){
		fire('sending',100);
	},false);
	loader.xhr.upload.addEventListener("error", function(){
		fire('fail','upload:error');
	},false);
	loader.xhr.upload.addEventListener("abort", function(){
		fire('fail','upload:aborted');
	},false);
}