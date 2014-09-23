angular.module('Pillars.directives', [])
	.directive('datapath', function() {
		return {
			scope : true,
			compile : function(){
				return {
					pre: function (scope, element, atts){
						scope.form = scope.form || element.closest('form').controller('form');
						scope.lastform = scope.lastform || scope.form;

						scope.datapath = (scope.datapath || []).concat([atts.datapath]);
						scope.datapathId = 'set_'+scope.datapath.join('_');
						scope.datapathName = 'set['+scope.datapath.join('][')+']';
						scope.status = scope.lastform[scope.datapathName];
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
	.directive("ngForm",function(){
		return {
			restrict:"A",
			require: 'form',
			compile : function(){
				return {
					pre:function(scope,element,attrs,ctrl){
						scope.lastform = ctrl;
						scope.status = scope.lastform;
					},
					post:function(scope,element,attrs,ctrl){
						scope.form.$removeControl(scope.lastform);
						scope.lastform.$name = scope.datapathName;
						scope.form.hiddenCtrls = (scope.form.hiddenCtrls || {});
						scope.form.hiddenCtrls[scope.datapathName]=scope.lastform;
					}
				};
			}
		};
	})
	.directive("fieldForm",function(){
		return {
			restrict:"A",
			require: 'form',
			compile : function(){
				return {
					pre:function(scope,element,attrs,ctrl){
						scope.fieldForm = ctrl;
					},
					post:function(scope,element,attrs,ctrl){
						ctrl.getScope = function(){
							return scope;
						}
						scope.form.$addControl(ctrl);
					}
				};
			}
		};
	})
	.directive("datapathId",function(){
		return {
			restrict:"A",
			link:function(scope,element,attrs){
				element.removeAttr('datapath-id');
				element.attr('id', scope.datapathId);
			}
		};
	})
	.directive("datapathName",function(){
		return {
			restrict:"A",
			require: 'ngModel',
			link:function(scope,element,attrs,ctrl){
				element.removeAttr('datapath-name');
				element.attr('name', scope.datapathName);
				ctrl.$name = scope.datapathName;
				scope.status = ctrl;
				if(scope.fieldForm){
					scope.fieldForm.$addControl(ctrl);
				} else {
					ctrl.getScope = function(){
						return scope;
					}
					scope.form.$addControl(ctrl);
					if(scope.lastform!=scope.form){
						scope.lastform.$addControl(ctrl);
					}
				}
			}
		};
	})
	.directive('idfield',function(){
		return {
			compile : function(){
				return {
					pre:function(scope,element,attrs,ctrl){
						console.log('id include');
						scope.$parent.haveId = (scope.$parent.haveId || []).slice().concat([scope.datapathName]);
					}
				};
			}
		}
	})
	.directive('subsetlist', function() {
		return {
			scope : true,
			compile : function(){
				return {
					pre:function(scope,element,attrs,ctrl){
					},
					post:function (scope, element, atts){
						var currentSubset = 0;
						Object.defineProperty(scope,"currentSubset",{
							enumerable : true,
							get : function(){return currentSubset;}
						});

						scope.gotoSubset = function(i){
							if(i>0 && i<(scope.datapathValue.length || 0)){
								currentSubset = k;
							}
						}
						scope.prevSubset = function(){
							if(currentSubset==0){
								currentSubset=scope.datapathValue.length || 0;
							} else {
								currentSubset--;
							}
						}
						scope.nextSubset = function(){
							if(currentSubset==(scope.datapathValue.length-1 || 0)){
								currentSubset=0;
							} else {
								currentSubset++;
							}
						}

						scope.insertSubset = function(){
							scope.datapathValue = scope.datapathValue || [];
							scope.datapathValue.push({_order:scope.datapathValue.length});
						}
						scope.removeSubset = function(i){
							scope.datapathValue.splice(i,1);
						}
						scope.moveSubset = function(i){
							var datapathName = scope.datapathName;
							var dataset = scope.datapathValue;
							var hashKeys = dataset.map(function(e,i){return e.$$hashKey;});
							var subset = dataset[i];
							
							var copyParams = ['$untouched','$touched','$pristine','$dirty','$valid','$invalid','$error'];
							var pattern = new RegExp('^'+datapathName.replace('[','\\[').replace(']','\\]')+'\\[','i');
							var ctrls = {};
							for(var c in scope.form){
								if(pattern.test(c)){
									ctrls[c]={};
									for(var p in copyParams){
										ctrls[c][copyParams[p]]=scope.form[c][copyParams[p]];
									}
								}
							}

							dataset.splice(i,1);
							dataset.splice(subset._order,0,subset);
							dataset.forEach(function(e,ei){
								var originalOrder = hashKeys.indexOf(e.$$hashKey);
								e.$$hashKey = hashKeys[ei];
								if(e._order != ei){
									e._order = ei;
									var orderCtrl = ctrls[datapathName+'['+originalOrder+'][_order]'];
									if(orderCtrl){
										orderCtrl.$untouched = false;
										orderCtrl.$touched = true;
										orderCtrl.$pristine = false;
										orderCtrl.$dirty = true;
										scope.form[datapathName+'['+originalOrder+'][_order]'].getScope().lastform.$setDirty();
									}
								}
								
								var subpattern = new RegExp('^'+datapathName.replace('[','\\[').replace(']','\\]')+'\\['+originalOrder+'\\]','i');
								for(var c in ctrls){
									if(subpattern.test(c)){
										var c2 = c.replace(subpattern,datapathName+'['+ei+']');
										for(var p in copyParams){
											scope.form[c2][copyParams[p]]=ctrls[c][copyParams[p]];
										}
									}
								}
							});
						}
					}
				};
			}
		}
	})
	.directive('datepicker', function($locale) {
		return {
			restrict: 'E',
			templateUrl: '/pillars/ng/templates/datepicker.html',
			require: 'ngModel',
			replace: true,
			link: function(scope, element, atts, ctrl) {
				var weekini = 1;
				var linkElement = atts.linkid?angular.element('#'+atts.linkid):false;
				var linkCtrl = linkElement?linkElement.controller('ngModel'):false;
				var dayInput = element.find('.date-day');
				if(linkCtrl){
					linkElement.on('focus',function(){
						dayInput.focus();
					});
				}
				var localeDateTime = $locale.DATETIME_FORMATS;
				scope.months = localeDateTime.MONTH.map(function(element,index,array){return {key:index,name:element};});
				scope.weekdays = localeDateTime.SHORTDAY.map(function(element,index,array){return {key:index,name:element};});

				var calendar = new Calendar(weekini);
				scope.calendar = calendar;

				scope.$watchCollection('calendar.selection', function() {
					if(calendar.selection.touched){
						ctrl.$setViewValue(calendar.selection.value);
						ctrl.$setValidity('date',calendar.selection.valid);
						if(linkCtrl){
							linkCtrl.$dirty = true;
							linkCtrl.$pristine = false;
							linkCtrl.$setTouched();
							linkCtrl.$setValidity('date',calendar.selection.valid);
						}
					}
				});

				ctrl.$render = function() {
					calendar.setSelectionValue(ctrl.$viewValue);
				};

				scope.selectDate = calendar.setSelectionDay;
				scope.clearDate = calendar.clearSelection;
			}
		};
	})
	.directive('reference', function($rootScope,$timeout,$document) {
		return {
			restrict: 'E',
			templateUrl: '/pillars/ng/templates/reference.html',
			require: 'ngModel',
			replace: true,
			link: function(scope, element, atts, ctrl) {
				var linkElement = atts.linkid?angular.element('#'+atts.linkid):false;
				var linkCtrl = linkElement?linkElement.controller('ngModel'):false;
				var searchInput = element.find('.search');
				if(linkCtrl){
					linkElement.on('focus',function(){
						searchInput.focus();
					});
				}
				var touched = false;
				scope.loaded = false;
				scope.opened = false;

				var limit = 0;
				Object.defineProperty(scope,"limit",{
					enumerable : true,
					get : function(){return limit;}
				});

				var apiList = new ApiList($rootScope.env.apiurl);
				apiList.loader.progress = function(){
					scope.opened = true;
					$timeout(function(){}, 0);
				};
				scope.apiList = apiList;

				var ids = [];
				Object.defineProperty(scope,"ids",{
					enumerable : true,
					get : function(){return ids;}
				});
				var selection = [];
				Object.defineProperty(scope,"selection",{
					enumerable : true,
					get : function(){return selection;}
				});

				scope.sortValues = [];
				function refreshIds(){
					ids = selection.map(function(e,i){
						return e._id;
					});
					scope.sortValues = Object.keys(ids);
					if(touched){
						ctrl.$setViewValue(ids.join(','));
						if(linkCtrl){
							linkCtrl.$dirty = true;
							linkCtrl.$pristine = false;
							linkCtrl.$setTouched();
							linkCtrl.$setValidity('reference',true);
						}
					}
				}

				ctrl.$render = function() {
					selection = ctrl.$viewValue;
					if(selection){refreshIds();}
				};

				scope.asignReference = function(reference){
					touched = true;
					if(limit==1){
						ids=reference;
						selection = [reference];
					} else {
						var index = ids.indexOf(reference._id);
						if(index>=0){
							ids.splice(index,1);
							selection.splice(index,1);
						} else {
							ids.push(reference._id);
							selection.push(reference);
						}
					}
					refreshIds();
				}

				scope.moveReference = function(k){
					touched = true;
					var reference = selection[k];
					var newIndex = scope.sortValues[k];
					selection.splice(k,1);
					selection.splice(newIndex,0,reference);
					refreshIds();
				}

				scope.dropdownToggle = function(){
					if(!scope.opened){
						scope.dropdownOpen();
					} else {
						scope.dropdownClose();
					}
				}

				scope.dropdownOpen = function(){
					if(!scope.loaded){
						scope.loaded = true;
						apiList.load();
					}
					scope.opened = true;
				}

				scope.dropdownClose = function(){
					scope.opened = false;
				}

				scope.escape = function(){
					var currentFocus = element.find('.search:focus');
					if(currentFocus.length==0){
						searchInput.focus();
					} else {
						scope.dropdownClose();
					}
				}

				var list = element.find('ul.references');
				var tabControl = element.find('ul.references, .search');
				tabControl.on('keydown', function(event) {
					var currentFocus = list.find('>li:focus');
					if(event.keyCode==38 || event.keyCode==40){
						scope.$apply(function() {
							scope.dropdownOpen();
						});
						var newFocus;
						if(event.keyCode=="38"){
							if(currentFocus.length==0){
								newFocus = list.find('>li:last');
							} else {
								newFocus = currentFocus.prev();
								if(newFocus.length==0){
									newFocus = list.find('>li:last');
								}
							}
						} else {
							if(currentFocus.length==0){
								newFocus = list.find('>li:first');
							} else {
								newFocus = currentFocus.next();
								if(newFocus.length==0){
									newFocus = list.find('>li:first');
								}
							}
						}
						newFocus.focus();
					}
				});

				element.on('click', function(event) {
					event.stopPropagation();
				});

				$document.on('click', function() {
					scope.$apply(function() {
						scope.opened = false;
					});
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
			element.on('scroll', function(event) {
				if (lastHeight!=raw.scrollHeight && raw.scrollTop + raw.offsetHeight + margin >= raw.scrollHeight) {
					lastHeight = raw.scrollHeight;
					scope.$apply(attr.scrollEnd);
				}
			});
		};
	})
	.directive('tabSelection', function($parse) {
		return {
			restrict: 'A',
			compile: function(element, atts) {
				var fn = $parse(atts.tabSelection);
				return function eventHandler(scope, element) {
					element.on('keydown', function(event) {
						if(event.keyCode==32 || event.keyCode==13){
							scope.$apply(function() {
								fn(scope, {$event:event});
							});
						}
					});
				};
			}
		};
	})
	.directive('keyEscape', function($parse) {
		return {
			restrict: 'A',
			compile: function(element, atts) {
				var fn = $parse(atts.keyEscape);
				return function eventHandler(scope, element) {
					element.on('keydown', function(event) {
						if(event.keyCode==27){
							scope.$apply(function() {
								fn(scope, {$event:event});
							});
						}
					});
				};
			}
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
			templateUrl: '/pillars/ng/templates/imagepicker.html',
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