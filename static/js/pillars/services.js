angular.module('Pillars.services', [])
	.service('listquery',function(){
		this.filter = "";
		this.sort = "";
		this.order = 1;
	})
	.factory('loader', ['$rootScope', function ($rootScope) {
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
			//console.log("Request error");
		};
		loader.end = function(){
			//console.log("Request complete",loader.xhr.status,loader.xhr.statusText);
			$rootScope.msgs=[];
			if($rootScope.lostmsgs){$rootScope.msgs = $rootScope.lostmsgs;$rootScope.lostmsgs=false;}
			if(loader.xhr.json.error){$rootScope.msgs = $rootScope.msgs.push(loader.xhr.json.error);}
			$rootScope.loading=false;
			loader.data(loader.xhr);
			$rootScope.$digest();
		};

		return loader;

	}])
;