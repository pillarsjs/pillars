//angular.module('crudNg', ['ngRoute'])
angular.module('crudNg',[])
	/*
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				controller:'crudList',
				templateUrl:'crud-list.html'
			})
			.when('/edit/:projectId', {
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
	*/
	.factory('xhr', ['$rootScope', function ($rootScope) {
		return function($scope,method, url){
			$scope.sending=1;
			var xhr = new XMLHttpRequest();
			xhr.addEventListener("loadstart", function(){
				console.log("Request started");
			},false);
			xhr.addEventListener("progress", function(e){
				if (e.lengthComputable) {
					$scope.$apply(function () {
						$scope.sending = Math.round(e.loaded / e.total);
					});
				}
				console.log("Request progress",$scope.sending+"%");
			},false);
			xhr.addEventListener("load", function(){
				$scope.$apply(function () {
					$scope.sending = 100;
				});
				console.log("Request complete",xhr.status,xhr.statusText);
				if(xhr.status==200){
					if(xhr.response.msgs){
						console.log("msgs:",xhr.response.msgs);
					}
					if(xhr.response.data){
						console.log("data:",xhr.response.data);
						$scope.$apply(function () {
							$scope.system = xhr.response.data;
							$scope.sending=0;
						});
					}
				}

			},false);
			xhr.addEventListener("error", function(){
				console.log("Request error");
			},false);
			xhr.addEventListener("abort",function(){
				console.log("Request aborted");
			},false);
			xhr.upload.addEventListener("progress", function(e){
				if (e.lengthComputable) {
					$scope.sending = Math.round(e.loaded / e.total);
				}
				console.log("Upload progress",$scope.sending+"%");
			}, false);
			xhr.upload.addEventListener("load", function(){
				console.log("Upload complete");
			}, false);
			xhr.upload.addEventListener("error", function(){
				console.log("Upload error");
			}, false);
			xhr.upload.addEventListener("abort", function(){
				console.log("Upload aborted");
			}, false);
			xhr.open(method, url, true)
			return xhr;
		};
	}])
	.service('crudActions', function (xhr) {
		this.list = function () {
		} 
		this.update = function (form,method,url,upload) {
			openedxhr = xhr.open(method, url);
			openedxhr.responseType="json";
			var formData = false;
			if(upload){
				formData = new FormData(form);
			} else {
				formData=$(form).serialize();
				openedxhr.setRequestHeader("Content-Type", "application\/x-www-form-urlencoded");
			}
			openedxhr.send(formData);
		}
		this.insert = function (data) {
		}
		this.get = function ($scope,url) {
			var ohxr = xhr($scope,'get', url, true);
			ohxr.responseType="json";
			ohxr.send();
		}
		this.delete = function (id) {
		}
	})
	.controller('crudUpdate', function($scope,crudActions) {
		$scope.sending=0;
		$scope.system = {};

		crudActions.get($scope,'http://localhost:3000/system/api/get/531769aaefe6c71a34ae3418');
		$scope.addListItem = function(list){
			list.push({});
		};
		$scope.sendForm = function(method,url,upload){
			crudActions.update(crudUpdateForm,method,url,upload);
		}
	})

	

/*
app.controller('crudUpdate', function($scope) {
	$scope.sending=0;
	$scope.system = {
		"field1":"fsdf",
		"field2":"sdfsdf",
		"reverse":"12345",
		"list":[
			{"field2":"a","reverse":"12345"},
			{"field2":"b","reverse":"12345"},
			{"field2":"c","reverse":"12345"},
			{"field2":"d","reverse":"12345"}
		],
		"textarea":{"es":"es","en":"en"},
		"field3":"","_id":"531769aaefe6c71a34ae3418"
	};
	$scope.addListItem = function(list){
		list.push({});
	};
	$scope.sendForm = function(method,url,upload){
		$scope.sending=20;
		var xhr = new XMLHttpRequest();
		xhr.addEventListener("loadstart", function(){
			console.log("Request started");
		},false);
		xhr.addEventListener("progress", function(e){
			if (e.lengthComputable) {
				$scope.$apply(function () {
					$scope.sending = Math.round(e.loaded / e.total);
				});
			}
			console.log("Request progress",$scope.sending+"%");
		},false);
		xhr.addEventListener("load", function(){
			$scope.$apply(function () {
				$scope.sending = 100;
			});
			console.log("Request complete",xhr.status,xhr.statusText);
			if(xhr.status==200){
				if(xhr.response.msgs){
					console.log(xhr.response.msgs);
				}
				if(xhr.response.data){
					$scope.$apply(function () {
						$scope.system = xhr.response.data;
					});
				}
			}
			setTimeout(function(){
					$scope.$apply(function () {
						$scope.sending=0;
					});
			},0);
		},false);
		xhr.addEventListener("error", function(){
			console.log("Request error");
		},false);
		xhr.addEventListener("abort",function(){
			console.log("Request aborted");
		},false);
		xhr.upload.addEventListener("progress", function(e){
			if (e.lengthComputable) {
				$scope.sending = Math.round(e.loaded / e.total);
			}
			console.log("Upload progress",$scope.sending+"%");
		}, false);
		xhr.upload.addEventListener("load", function(){
			console.log("Upload complete");
		}, false);
		xhr.upload.addEventListener("error", function(){
			console.log("Upload error");
		}, false);
		xhr.upload.addEventListener("abort", function(){
			console.log("Upload aborted");
		}, false);
		xhr.open(method, url, true);
		xhr.responseType="json";
		var formData = false;
		if(upload){
			formData = new FormData(crudUpdateForm);
		} else {
			formData=$(crudUpdateForm).serialize();
			xhr.setRequestHeader("Content-Type", "application\/x-www-form-urlencoded");
		}
		xhr.send(formData);
	};
});
*/

/*
var app = angular.module('crudNg',[]);
app.controller('crudUpdate', function($scope, $http) {
	$scope.sending=0;
	$scope.system = {
		"field1":"fsdf",
		"field2":"sdfsdf",
		"reverse":"12345",
		"list":[
			{"field2":"a","reverse":"12345"},
			{"field2":"b","reverse":"12345"},
			{"field2":"c","reverse":"12345"},
			{"field2":"d","reverse":"12345"}
		],
		"textarea":{"es":"es","en":"en"},
		"field3":"","_id":"531769aaefe6c71a34ae3418"
	};
	$scope.addListItem = function(list){
		list.push({});
	};
	$scope.sendForm = function(method,url,upload){
		$scope.sending=20;
		var xhr = new XMLHttpRequest();
		xhr.addEventListener("loadstart", function(){
			console.log("Request started");
		},false);
		xhr.addEventListener("progress", function(e){
			if (e.lengthComputable) {
				$scope.$apply(function () {
					$scope.sending = Math.round(e.loaded / e.total);
				});
			}
			console.log("Request progress",$scope.sending+"%");
		},false);
		xhr.addEventListener("load", function(){
			$scope.$apply(function () {
				$scope.sending = 100;
			});
			console.log("Request complete",xhr.status,xhr.statusText);
			if(xhr.status==200){
				if(xhr.response.msgs){
					console.log(xhr.response.msgs);
				}
				if(xhr.response.data){
					$scope.$apply(function () {
						$scope.system = xhr.response.data;
					});
				}
			}
			setTimeout(function(){
					$scope.$apply(function () {
						$scope.sending=0;
					});
			},0);
		},false);
		xhr.addEventListener("error", function(){
			console.log("Request error");
		},false);
		xhr.addEventListener("abort",function(){
			console.log("Request aborted");
		},false);
		xhr.upload.addEventListener("progress", function(e){
			if (e.lengthComputable) {
				$scope.sending = Math.round(e.loaded / e.total);
			}
			console.log("Upload progress",$scope.sending+"%");
		}, false);
		xhr.upload.addEventListener("load", function(){
			console.log("Upload complete");
		}, false);
		xhr.upload.addEventListener("error", function(){
			console.log("Upload error");
		}, false);
		xhr.upload.addEventListener("abort", function(){
			console.log("Upload aborted");
		}, false);
		xhr.open(method, url, true);
		xhr.responseType="json";
		var formData = false;
		if(upload){
			formData = new FormData(crudUpdateForm);
		} else {
			formData=$(crudUpdateForm).serialize();
			xhr.setRequestHeader("Content-Type", "application\/x-www-form-urlencoded");
		}
		xhr.send(formData);
	};
});
*/