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
			//console.log("Request error");
		};
		loader.end = function(){
			//console.log("Request complete",loader.xhr.status,loader.xhr.statusText);
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
	.controller('crudListFilter', function($rootScope, $scope, $loader, $location, $routeParams, languages) {
		$rootScope.listFilter = "";
		$rootScope.listSort = "";
		$rootScope.listOrder = 1;
		$scope.applyFilter = function(){
			$rootScope.listFilter = $scope.listFilter || "";
			if($location.path()=="/"){
				$loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
			} else {
				$location.path('/');
			}
		}
		$scope.sortBy = function(sort,order){
			$rootScope.listSort = $scope.listSort = sort;
			$rootScope.listOrder = $scope.listOrder = order;
			$loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
		}
	})
	.controller('crudList', function($rootScope, $scope, $loader, $location, $routeParams, languages) {
		$rootScope.languages = languages;
		$rootScope.navsave = false;
		$rootScope.navremove = false;
		$scope.data = {};
		$loader.data = function(xhr){
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
			} else if(xhr.json.data.skip || xhr.json.data.range) {
				if(xhr.json.data.limit>xhr.json.data.list.length){$scope.end = true;}
				var cache = $scope.data.list;
				$scope.data = xhr.json.data || [];
				$scope.data.list = cache.concat(xhr.json.data.list);
			} else {
				if(xhr.json.data.limit>xhr.json.data.list.length){$scope.end = true;}
				$scope.data = xhr.json.data || [];
			}
		};

		$loader.send('get','api?_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);

		$scope.more = function(){
			var skip = parseInt($scope.data.skip || 0);
			var limit = parseInt($scope.data.limit || 0);
			var range = $scope.data.range || false;
			$loader.send('get','api?_skip='+(skip+limit)+'&_filter='+$rootScope.listFilter+'&_sort='+$rootScope.listSort+'&_order='+$rootScope.listOrder,false,false);
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
			$scope.validations = xhr.json.validations || {};
			if(xhr.json.data===true){
				$rootScope.lostmsgs = xhr.json.msgs;
				$loader.send('get','api/'+$routeParams._id,false,false);
			} else if(xhr.json.data===false) {
			} else {
				$scope.data = xhr.json.data;
			}
		};

		$loader.send('get','api/'+$routeParams._id,false,false);

		$scope.addListItem = function(parent,list){
			if(!parent[list]){parent[list]={};}
			var newid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
			parent[list][newid]={};
		};
		$scope.deleteListItem = function(list,k){
			list[k]=false;
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
			if(xhr.json.data!==false){
				$rootScope.lostmsgs = xhr.json.msgs;
				$location.path('/edit/'+xhr.json.data);
			} else {
				//$scope.data = xhr.json.data || false;
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
	.directive('datepicker', function($locale) {
		return {
			require: 'ngModel',
			restrict: 'E',
			scope: {
				value: '=ngModel'
			},
			templateUrl: 'bricks.datepicker.html',
			link: function(scope, element, attr, ngModel) {
				scope.datepickerName = attr['name'];
				scope.localeDateTime = $locale.DATETIME_FORMATS;
				scope.calendar = new dateCalendar(1);

				scope.$watch('value', function() {
					if(typeof scope.value != "undefined" && scope.value!=""){
						scope.calendar.setSelectionTime(scope.value);
					}
				});
				
				scope.selectDate = function(d) {
					scope.calendar.selection = d;
					scope.setDate();
				}
				scope.setDate = function(){
					var validation = scope.calendar.checkSelection();
					ngModel.$setValidity('calendarDate',validation);
					if(validation){
						scope.value = scope.calendar.getSelectionTime();
					} else {
						scope.value = "";
					}
				}
				scope.clearDate = function(){
					scope.calendar.selection = {year:'',month:'',date:''};
					scope.calendar.selection.hours = '';
					scope.calendar.selection.minutes = '';
					scope.setDate();
				}
			}
		};
	})
	.directive('reference', function($locale,$document) {
		return {
			require: 'ngModel',
			restrict: 'E',
			scope: {
				value: '=ngModel'
			},
			templateUrl: 'bricks.referencepicker.html',
			link: function(scope, element, attr, ngModel) {
				scope.search = "";
				scope.referenceName = attr['name'];
				scope.references = {};
				scope.set = [];

				scope.$watch('value', function() {
					if(typeof scope.value != "undefined" && scope.value!=""){
						scope.references = scope.value;
						scope.set = Object.keys(scope.references).join(',');
					}
				});

				var loader = new xhrLoader();

				loader.start = function(){
					scope.loading=true;
					scope.sending=0;
					scope.receiving=0;
				};
				loader.sending = function(percent){
					scope.sending=percent;
					scope.$digest();
				};
				loader.receiving = function(percent){
					scope.receiving=percent;
					scope.$digest();
				};
				loader.fail = function(error){
					//console.log("Request error");
				};
				loader.end = function(){
					//console.log("Request complete",loader.xhr.status,loader.xhr.statusText);
					scope.msgs = loader.xhr.json.msgs || [];
					scope.loading=false;

					if(loader.xhr.json.data.skip || loader.xhr.json.data.range) {
						if(loader.xhr.json.data.limit>loader.xhr.json.data.list.length){scope.end = true;}
						var cache = scope.data.list;
						scope.data = loader.xhr.json.data || [];
						scope.data.list = cache.concat(loader.xhr.json.data.list);
					} else {
						if(loader.xhr.json.data.limit>loader.xhr.json.data.list.length){scope.end = true;}
						scope.data = loader.xhr.json.data || [];
					}

					scope.$digest();
				};

				scope.load = function(reload){
					if(!scope.data || reload){loader.send('get','api?_filter='+scope.search,false,false);}
					scope.opened = true;
				}

				scope.dropdown = function(){
					console.log('hola');
					if(!scope.opened){
						scope.load();
						console.log('a');
					} else {
						scope.opened = false;
						console.log('b');
					}
				}

				scope.more = function(){
					var skip = parseInt(scope.data.skip || 0);
					var limit = parseInt(scope.data.limit || 0);
					var range = scope.data.range || false;
					loader.send('get','api?_filter='+scope.search+'&_skip='+(skip+limit),false,false);
				}

				scope.addReference = function(reference){

					if(scope.references[reference._id]){
						delete scope.references[reference._id];
					} else {
						scope.references[reference._id]=reference;
					}
					scope.set = Object.keys(scope.references).join(',');
					console.log("addReference",scope.references,reference);
				}
					

				element.bind('click', function(e) {
					e.stopPropagation();
				});

				$document.bind('click', function() {
					scope.opened = false;
					scope.$digest();
				})

			}
		};
	})
	.directive('scrollEnd', function() {
		return function(scope, element, attr) {
			var raw = element[0];
			var margin = attr.scrollEndMargin || 0;
			margin = parseInt(margin);
			var lastHeight = 0;
			element.bind('scroll', function(e) {
				if (lastHeight!=raw.scrollHeight && raw.scrollTop + raw.offsetHeight + margin >= raw.scrollHeight) {
					lastHeight = raw.scrollHeight;
					scope.$apply(attr.scrollEnd);
				}
			});
		};
	})
	.directive('imagepicker', function($locale) {
		return {
			require: 'ngModel',
			restrict: 'E',
			scope: {
				value: '=ngModel'
			},
			templateUrl: 'bricks.imagepicker.html',
			link: function(scope, element, attr, ngModel) {
				scope.imagepickerName = attr['name'];
				//scope.readedFiles = [];

				scope.$watch('value', function() {
					if(typeof scope.value != "undefined" && scope.value.path){
						if(scope.value.path.substring(0,5)!="data:"){
							scope.value.path="/"+scope.value.path;
						}
					}
				});

				scope.fileChange = function(input){
					var files = input.files;
					for (var i = 0, f; f = files[i]; i++) {
						if (!f.type.match('image.*')) {continue;}

						var reader = new FileReader();

						reader.onload = (function(rf,rfk) {
							return function(e){
								//scope.readedFiles[rfk]=e.target.result;
								scope.value = {path:e.target.result};
								scope.$digest();
							};
						})(f,i);
						reader.readAsDataURL(f);
					}

				}
			}
		};
	})
	.directive('imagedit', function($locale) {
		return {
			restrict: 'E',
			link: function(scope, element, attr, ngModel) {
				var image = new Image(); // HTML5 Constructor
				
				scope.$watch('imgf', function() {
					if(typeof scope.imgf != "undefined" && scope.imgf!=""){
						image.src = scope.imgf;
						console.log(image);
						var stage = new Kinetic.Stage({
							container: element[0],
							width: image.width,
							height: image.height
						});
						var layer = new Kinetic.Layer();
						stage.add(layer);

						var imagedraw = new Kinetic.Image({
							x: 0,
							y: 0,
							image: image,
							width:image.width,
							height:image.height
						});

						layer.add(imagedraw);
						stage.draw();
						/*
						var ctx = layer.canvas.context;
						var pixels = ctx.getImageData(0,0,parseInt(image.width-1),parseInt(image.height-1));
						var d = pixels.data;
						var colors = [];
						var counters = [];
						for (var i=0; i<d.length; i+=4) {
							var r = d[i];
							var g = d[i+1];
							var b = d[i+2];
							var a = d[i+3];
							var id = r+','+g+','+b;
							var index = colors.indexOf(id);
							if(index<0){
								index = colors.length;
								colors.push(id);
								counters.push({id:id,count:0});
							} else {
								counters[index].count++;
							}
							var v = 0.2126*r + 0.7152*g + 0.0722*b;
							d[i] = d[i+1] = d[i+2] = v;
						}
						
						counters.sort(function(a,b){
							return b.count-a.count;
						});
						var predominats = counters.slice(0,10);
						console.log(predominats);
		
						pixels.data = d;
						ctx.putImageData(pixels, 0, 0);
						*/
					}
				});
			}
		};
	})
	.filter('object_order', function() {
		return function(input) {
			/*
			var order = [];
			var out = {};
			console.log("input",input);
			for(i in input){
				input[i].$$$ = i;
				order.push(input[i]);
			}
			console.log("order",order);
			order.sort(function(a,b){
				var a = a._order || 0;
				var b = b._order || 0;
				return a-b;
			});
			console.log("orderend",order);
			for(i in order){
				var id = order[i].$$$;
				delete order[i].$$$;
				//delete input[id];
				out[id]=order[id];
			}
			console.log("out",out);
			return out;
			*/
			console.log("in",input);
			var sorting = [];
			for(i in input){
				input[i]._id = i;
				sorting.push(input[i]);
			}
			sorting.sort(function(a,b){
				var a = a._order || 0;
				var b = b._order || 0;
				return a-b;
			});
			for(i in sorting){
				var id = sorting[i]._id;
				delete sorting[i]._id;
				delete input[id];
				input[id] = sorting[i];
			}
			console.log("out",input);
			return input;
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

	loader.fire = function(e){
		if(typeof loader[e] == 'function'){
			loader[e].apply(loader[e],Array.prototype.slice.call(arguments).slice(1));
		}
	}

	loader.data = function (xhr) {
		loader.fire('data',xhr);
	}

	loader.xhr.addEventListener("loadstart", function(){
		loader.fire('start');
	},false);
	loader.xhr.addEventListener("progress", function(e){
		if(e.lengthComputable) {loader.fire('receiving',Math.round(e.loaded / e.total * 100));}
	},false);
	loader.xhr.addEventListener("load", function(){
		loader.fire('receiving',100);
		if(loader.xhr.getResponseHeader('Content-Type')=='application/json'){
			try {
				loader.xhr.json = JSON.parse(loader.xhr.response);
				loader.fire('end');
			} catch(e) {
				loader.fire('fail','parse:error');
			}
		} else {
			loader.fire('fail','content:error');
		}
	},false);
	loader.xhr.addEventListener("error", function(){
		loader.fire('fail','request:error');
	},false);
	loader.xhr.addEventListener("abort",function(){
		loader.fire('fail','request:aborted');
	},false);
	loader.xhr.upload.addEventListener("progress", function(e){
		if(e.lengthComputable) {loader.fire('sending',Math.round(e.loaded / e.total * 100));}
	},false);
	loader.xhr.upload.addEventListener("load", function(){
		loader.fire('sending',0);
	},false);
	loader.xhr.upload.addEventListener("error", function(){
		loader.fire('fail','upload:error');
	},false);
	loader.xhr.upload.addEventListener("abort", function(){
		loader.fire('fail','upload:aborted');
	},false);
}

function dateCalendar(weekini){
	var selection = {};
	var weekini = weekini || 0;
	var weekformat = [0,1,2,3,4,5,6].slice(weekini).concat([0,1,2,3,4,5,6].slice(0,weekini));
	Object.defineProperty(this,"weekformat",{
		enumerable : true,
		get : function(){return weekformat;}
	});

	var days = false;
	Object.defineProperty(this,"days",{
		enumerable : true,
		get : function(){return days;}
	});

	var position = new Date();
	position.setDate(1);
	position.setHours(0);
	position.setMinutes(0);
	position.setSeconds(0);
	position.setMilliseconds(0);
	
	Object.defineProperty(this,"year",{
		enumerable : true,
		get : function(){return position.getFullYear();},
		set : function(set){
			position.setFullYear(set);
			this.refresh();
		}
	});
	Object.defineProperty(this,"month",{
		enumerable : true,
		get : function(){return ''+position.getMonth()+'';},
		set : function(set){
			position.setMonth(set);
			this.refresh();
		}
	});
	
	Object.defineProperty(this,"selection",{
		enumerable : true,
		get : function(){return selection;},
		set : function(set){
			selection.year = set.year;
			selection.month = set.month;
			selection.date = set.date;
		}
	});

	Object.defineProperty(this,"tz",{
		enumerable : true,
		get : function(){
			var gmt = position.getTimezoneOffset()/-60;
			return 'GMT'+((gmt>=0)?'+':'-')+gmt;
		}
	});

	this.checkSelection = function(){
		var dparse = new Date(selection.year,selection.month,selection.date,selection.hours || 0,selection.minutes || 0,0,0);
		if(dparse && selection.year==dparse.getFullYear() && selection.month==dparse.getMonth() && selection.date==dparse.getDate()){
			position.setFullYear(dparse.getFullYear());
			position.setMonth(dparse.getMonth());
			this.refresh();
			return true;
		} else if(selection.year=='' && selection.month=='' && selection.date=='' && selection.hours=='' && selection.minutes==''){
			return true;
		} else {
			return false;
		}
	}

	this.getSelectionTime = function(){
		if(selection.year=='' && selection.month=='' && selection.date=='' && selection.hours=='' && selection.minutes==''){return "";}
		return (new Date(selection.year, selection.month, selection.date, selection.hours || 0, selection.minutes || 0, selection.seconds || 0, selection.milliseconds || 0)).getTime();
	}

	this.setSelectionTime = function(value){
		var value = new Date(parseInt(value));

		selection.year=value.getFullYear();
		selection.month=value.getMonth();
		selection.date=value.getDate();
		selection.hours=value.getHours();
		selection.minutes=value.getMinutes();
		selection.seconds=value.getMinutes();
		selection.milliseconds=value.getMinutes();

		position.setFullYear(value.getFullYear());
		position.setMonth(value.getMonth());
		
		this.refresh();
	}

	this.nextMonth = function(){
		this.month++;
	}
	this.prevMonth = function(){
		this.month--;
	}

	this.nextYear = function(){
		this.year++;
	}
	this.prevYear = function(){
		this.year--;
	}

	this.firstDay = function(){
		return (new Date(this.year,this.month,1,0,0,0,0)).getDay();
	}
	this.lastDate = function(){
		return (new Date(this.year,this.month+1,0,0,0,0,0)).getDate();
	}

	this.isToday = function(d){
		var today = new Date();
		return (d.year==today.getFullYear() && d.month==today.getMonth() && d.date==today.getDate());
	}

	this.isSelection = function(d){
		return (d.year==selection.year && d.month==selection.month && d.date==selection.date);
	}

	this.refresh = function(){
		days = [[]];
		var w = 0;
		var d;
		if(this.firstDay()!=weekini){
			for(var di=weekformat.indexOf(this.firstDay());di>0;di--){
				d = new Date(this.year,this.month,1-di,0,0,0,0);
				days[w].push({
					year: d.getFullYear(),
					month: d.getMonth(),
					date: d.getDate()
				});
			}
		}
		d = new Date(this.year,this.month,1,0,0,0,0)
		while(d.getMonth()==this.month){
			if(d.getDay()==weekini && d.getDate()!=1){w++;days[w]=[];}
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				date: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
		while(d.getDay()!=weekini){
			days[w].push({
				year: d.getFullYear(),
				month: d.getMonth(),
				date: d.getDate()
			});
			d.setDate(d.getDate()+1);
		}
	}
	this.refresh();
}