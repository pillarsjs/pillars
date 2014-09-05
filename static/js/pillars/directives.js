angular.module('Pillars.directives', [])
	.directive('datapath', function() {
		return {
			scope : true,
			compile : function(){
				return {
					pre: function (scope, element, atts){
						scope.datapath = (scope.datapath || []).concat([atts.datapath]);
						scope.datapathId = 'entity_'+scope.datapath.join('_');
						scope.datapathName = 'entity['+scope.datapath.join('][')+']';
						Object.defineProperty(scope,"datapathValue",{
							enumerable : true,
							get : function(){
								return scope.$eval("data['"+scope.datapath.join("']['")+"']");
							},
							set : function(set){
								if(angular.isDefined(set)){
									scope.$eval("data['"+scope.datapath.join("']['")+"']=__set",{__set:set});
								}
							}
						});
					}
				}
			}
		}
	})
	.directive("datapathId",function(){
		return {
			restrict:"A",
			link:function(scope,element,attrs){
				var id = scope.datapathId;
				element.removeAttr('datapathId');
				element.attr('id', id);
			}
		};
	})
	.directive("datapathName",function(){
		return {
			restrict:"A",
			require: ['ngModel', '^form'],
			link:function(scope,element,attrs,ctrls){
				ctrls[0].$name = scope.datapathName;
				ctrls[1].$addControl(ctrls[0]);
			}
		};
	})
	.directive('datepicker', function($locale) {
		return {
			restrict: 'E',
			templateUrl: '/js/pillars/partials/datepicker.html',
			require: 'ngModel',
			replace: true,
			link: function(scope, element, atts, ctrl) {
				
				var localeDateTime = $locale.DATETIME_FORMATS;
				scope.months = localeDateTime.MONTH.map(function(element,index,array){return {key:index,name:element};});
				scope.weekdays = localeDateTime.SHORTDAY.map(function(element,index,array){return {key:index,name:element};});

				var linkCtrl = atts.linkid?angular.element('#'+atts.linkid).controller('ngModel'):false;
				var calendar = new dateCalendar(1);
				scope.calendar = calendar;

				scope.$watchCollection('calendar.selection', function() {
					ctrl.$setValidity('date',calendar.selection.valid);
					if(linkCtrl){
						if(calendar.selection.touched){
							linkCtrl.$dirty = true;
							linkCtrl.$pristine = false;
							linkCtrl.$setTouched();
						}
						linkCtrl.$setValidity('date',calendar.selection.valid);
					}
					ctrl.$setViewValue(calendar.selection.value);
				});

				ctrl.$render = function() {
					calendar.setSelectionValue(ctrl.$viewValue);
				};

				scope.selectDate = calendar.setSelectionDay;
				scope.clearDate = calendar.clearSelection;
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
			templateUrl: '/js/pillars/partials/reference.html',
			link: function(scope, element, attr, ngModel) {
				scope.search = "";
				scope.referenceName = attr['name'];
				scope.references = [];
				scope.set = [];

				scope.$watch('value', function() {
					if(typeof scope.value != "undefined" && scope.value!=""){
						scope.references = scope.value;
						scope.setOrders();
						scope.set = scope.references.map(function(element,index,array){
							return element._id;
						}).join(',');
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
					if(!scope.opened){
						scope.load();
					} else {
						scope.opened = false;
					}
				}

				scope.more = function(){
					var skip = parseInt(scope.data.skip || 0);
					var limit = parseInt(scope.data.limit || 0);
					var range = scope.data.range || false;
					loader.send('get','api?_filter='+scope.search+'&_skip='+(skip+limit),false,false);
				}

				scope.addReference = function(reference){
					var set = scope.references.map(function(element,index,array){
						return element._id;
					});
					var index = set.indexOf(reference._id);
					if(index>=0){
						set.splice(index,1);
						scope.references.splice(index,1);
					} else {
						set.push(reference._id);
						scope.references.push(reference);
					}
					scope.setOrders();
					scope.set = set.join(',');
				}

				scope.setOrders = function(){
					scope.sorts = scope.references.map(function(element,index,array){
						return ''+index+'';
					});
				}

				scope.moveReference = function(i){
					var tomove = scope.references[i];
					var order = scope.sorts[i];
					scope.references.splice(i,1);
					scope.references.splice(order,0,tomove);
					scope.setOrders();
					var set = scope.references.map(function(element,index,array){
						return element._id;
					});
					scope.set = set.join(',');
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
	.directive('htmlEditor', function() {
		return function(scope, element, attr) {
			var raw = element[0];
			var id = attr.id;
			var editor = new wysihtml5.Editor(raw, {
				toolbar: $(raw).prev('.editor_toolbar').get(0) || false,
				parserRules:  wysihtml5ParserRules,
				stylesheets: "/css/wysihtml5.css"
			});
		};
	})
	.directive('focusOn', function() {
		return function(scope, elem, attr) {
			scope.$on('focusOn', function(e, name) {
				if(name === attr.focusOn) {
					elem[0].focus();
					console.log('focused');
				}
			});
		};
	})
	.factory('focus', function ($rootScope, $timeout) {
		return function(name) {
			$timeout(function (){
				console.log('dofocus');
				$rootScope.$broadcast('focusOn', name);
			});
		}
	})
	.directive('imagepicker', function($locale) {
		return {
			require: 'ngModel',
			restrict: 'E',
			scope: {
				value: '=ngModel'
			},
			templateUrl: '/js/pillars/partials/imagepicker.html',
			link: function(scope, element, attr, ngModel) {
				scope.imagepickerName = attr['name'];
				//scope.readedFiles = [];

				scope.$watch('value', function() {
					if(typeof scope.value != "undefined" && scope.value.path){
						if(scope.value.path.substring(0,5)!="data:"){
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
;