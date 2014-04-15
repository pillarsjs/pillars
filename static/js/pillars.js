angular.module('Pillars', ['ngRoute'])
//angular.module('crudNg',[])
	.service('languages', function() {
		this.active = 'en';
		this.list = ['es','en'];
	})
	.factory('$loader', ['$rootScope', function ($rootScope) {

		var loader = new xhrLoader();

		loader.start = function(){
			$rootScope.loading=true;
			$rootScope.sending=0;
			$rootScope.receiving=0;
		};
		loader.sending = function(percent){
			$rootScope.sending=percent;
			$rootScope.$digest();
		};
		loader.receiving = function(percent){
			$rootScope.receiving=percent;
			$rootScope.$digest();
		};
		loader.fail = function(error){
			console.log("Request error");
		};
		loader.end = function(){
			console.log("Request complete",loader.xhr.status,loader.xhr.statusText);
			$rootScope.msgs=[];
			if($rootScope.lostmsgs){$rootScope.msgs = $rootScope.lostmsgs;$rootScope.lostmsgs=false;}
			$rootScope.msgs = $rootScope.msgs.concat(loader.xhr.json.msgs || []);
			$rootScope.loading=false;
			loader.data(loader.xhr);
			$rootScope.$digest();
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
				templateUrl:'crud-editor.html'
			})
			.when('/new', {
				controller:'crudInsert',
				templateUrl:'crud-editor.html'
			})
			.otherwise({
				redirectTo:'/'
			});
	})
	.controller('crudList', function($rootScope, $scope, $loader, $location, $routeParams, languages) {
		$rootScope.languages = languages;
		$rootScope.navsave = false;
		$rootScope.navremove = false;
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$loader.send('get','api',false,false);
			} else if(xhr.json.data.skip || xhr.json.data.range) {
				var cache = $scope.data.list;
				$scope.data = xhr.json.data || false;
				$scope.data.list = cache.concat(xhr.json.data.list);
			} else {
				$scope.data = xhr.json.data || false;
			}
		};

		$loader.send('get','api',false,false);

		$scope.more = function(){
			var skip = parseInt($scope.data.skip || 0);
			var limit = parseInt($scope.data.limit || 0);
			var range = $scope.data.range || false;
			$loader.send('get','api?_skip='+(skip+limit),false,false);
		}

		$scope.removeElement = function(id){
			$loader.send('delete','api/'+id,false,false);
		}
	})
	.controller('crudUpdate', function($rootScope, $scope, $loader, $location, $routeParams, languages) {
		$rootScope.languages = languages;
		$rootScope.navsave = true;
		$rootScope.navremove = true;
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$location.path('/');
			} else {
				$scope.data = xhr.json.data || false;
				$scope.validations = xhr.json.validations || {};
			}
		};

		$loader.send('get','api/'+$routeParams._id,false,false);

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			parent[list].push({});
		};
		$scope.sendForm = function(){
			$loader.send('put','api/'+$routeParams._id,$form,true);
		}
		$scope.removeElement = function(){
			$loader.send('delete','api/'+$routeParams._id,false,false);
		}
	})
	.controller('crudInsert', function($rootScope, $scope, $loader, $location, $routeParams, languages) {
		$rootScope.languages = languages;
		$rootScope.navsave = true;
		$rootScope.navremove = false;
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data._id){
				$rootScope.lostmsgs = xhr.json.msgs;
				$location.path('/edit/'+xhr.json.data._id);
			} else {
				$scope.data = xhr.json.data || false;
				$scope.validations = xhr.json.validations || {};
			}
		};

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]=[];}
			parent[list].push({});
		};
		$scope.sendForm = function(){
			$loader.send('post','api',$form,false);
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
		if(e.lengthComputable) {fire('receiving',Math.round(e.loaded / e.total * 100));}
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
		if(e.lengthComputable) {fire('sending',Math.round(e.loaded / e.total * 100));}
	},false);
	loader.xhr.upload.addEventListener("load", function(){
		fire('sending',0);
	},false);
	loader.xhr.upload.addEventListener("error", function(){
		fire('fail','upload:error');
	},false);
	loader.xhr.upload.addEventListener("abort", function(){
		fire('fail','upload:aborted');
	},false);
}