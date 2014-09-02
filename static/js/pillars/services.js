angular.module('Pillars.services', [])
	.service('apiList',function($rootScope,$location){
		var apiList = this;
		var loader = new xhrLoader();
		apiList.loader = loader;
		loader.success = function(){
			var response = loader.response;
			if(response && !response.error){
				apiList.end = response.data.limit>response.data.list.length;
				if(response.data.skip || response.data.range) {
					apiList.list = apiList.list.concat(response.data.list || []);
				} else {
					apiList.list = response.data.list || [];
				}
				apiList.skip = response.data.skip;
				apiList.limit = response.data.limit;
				apiList.range = response.data.range;
			} else {
				apiList.error = true;
			}
		};
		loader.fail = function(){
			apiList.error = true;
		}
		loader.progress = function(){
			$rootScope.$digest();
		}
		apiList.reset = function(){
			apiList.filter = "";
			apiList.sort = false;
			apiList.order = false;
			apiList.skip = false;
			apiList.limit = false;
			apiList.range = false;
			apiList.list = false;
			apiList.end = false;
			apiList.error = false;
			return apiList;
		}
		apiList.query = function(){
			var params = [];
			if(apiList.filter){params.push("_"+"filter="+apiList.filter);}
			if(apiList.sort){params.push("_"+"sort="+apiList.sort);}
			if(apiList.order){params.push("_"+"order="+apiList.order);}
			if(apiList.skip){params.push("_"+"skip="+apiList.skip);}
			if(apiList.limit){params.push("_"+"limit="+apiList.limit);}
			if(apiList.range){params.push("_"+"range="+apiList.range);}
			var url = $rootScope.env.apiurl;
			if(params.length>0){url += "?"+params.join('&');}
			return url;
		};
		apiList.load = function(){
			if($location.path()!="/"){$location.path('/');}
			apiList.skip = 0;
			apiList.error = false;
			loader.send('get',apiList.query(),false,false);
			return apiList;
		}
		apiList.loadnext = function(){
			apiList.skip = parseInt(apiList.skip)+parseInt(apiList.limit);
			apiList.error = false;
			loader.send('get',apiList.query(),false,false);
			return apiList;
		}
		apiList.reset();
	})
	.service('apiEntity',function($rootScope,$location){
		var apiEntity = this;
		var loader = new xhrLoader();
		apiEntity.loader = loader;
		loader.success = function(){
			var response = loader.response;
			if(response && !response.error){
				apiEntity.data = response.data;
				apiEntity.onData();
			} else {
				apiEntity.error = true;
			}
		};
		loader.fail = function(){
			apiEntity.error = true;
		}
		loader.progress = function(){
			$rootScope.$digest();
		}
		apiEntity.reset = function(){
			apiEntity.id = false;
			apiEntity.form = false;
			apiEntity.data = false;
			apiEntity.onData();
			apiEntity.error = false;
			return apiEntity;
		}
		apiEntity.load = function(){
			if($location.path()!="/edit/"+apiEntity.id){$location.path("/edit/"+apiEntity.id);}
			var url = $rootScope.env.apiurl;
			loader.send('get',url+"/"+apiEntity.id,false,false);
			return apiEntity;
		}
		apiEntity.onData = function(){}
		apiEntity.update = function(){
			if($location.path()!="/edit/"+apiEntity.id){$location.path("/edit/"+apiEntity.id);}
			var url = $rootScope.env.apiurl;
			loader.send('put',url+"/"+apiEntity.id,apiEntity.form,false);
			return apiEntity;
		}
		apiEntity.reset();
	})
;