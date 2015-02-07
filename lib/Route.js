
var util = require("util");
var EventEmitter = require("events").EventEmitter;

util.inherits(Route, EventEmitter);
module.exports = Route;
function Route(_config){
	EventEmitter.call(this);
	var route = this;
	var config = (_config && typeof _config!=='function')?_config:{};

	route.configure = function(config){
		for(var i in config){route[i]=config[i];}
		return route;
	};
	route.configure(config);

	var handlers = [];
	Array.prototype.slice.call(arguments).forEach(function(e,i){
		if(typeof e === 'function'){
			handlers.push(e);
		}
	});
	Object.defineProperty(route,"handlers",{
		enumerable : true,
		get : function(){return handlers;},
		set : function(set){
			if(Array.isArray(set)){
				handlers = set;
			} else {
				handlers = [set];
			}
		}
	});

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(route,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(set && set!==id){
				route.emit("idUpdate",id,set);
				id = set;
			}
		}
	});

	var params = [];
	Object.defineProperty(route,"params",{
		enumerable : true,
		get : function(){return params.slice();}
	});

	var pathRegex;
	Object.defineProperty(route,"pathRegex",{
		enumerable : true,
		get : function(){return pathRegex;}
	});

	var path;
	Object.defineProperty(route,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = set.replace(/\/+/gi,'/').replace(/^\/|\/$/gi,'');
			var parts = path.split('/');
			var compose = [];
			var newparams = [];
			var arg;
			for(var i in parts){
				if(/^:/.test(parts[i])){
					arg = parts[i].replace(/^:/,'');
					newparams.push(arg);
					compose.push("\\/([^\\/]+)");
				} else if(/^\*:/.test(parts[i])){
					arg = parts[i].replace(/^\*:/,'');
					newparams.push(arg);
					compose.push("(?:\\/(.*))?");
				} else if(parts[i]!=='') {
					compose.push("\\/"+parts[i]);
				}
			}
			params = newparams;
			pathRegex = new RegExp('^'+compose.join(''),'i');
		}
	});
	route.path = config.path || '/';

	var method;
	Object.defineProperty(route,"method",{
		enumerable : true,
		get : function(){return method;},
		set : function(set){
			if(!Array.isArray(set)){set = [set];}
			set = set.map(function(e,i){return e.toUpperCase();});
			method = set;
		}
	});
	route.method = config.method || ['GET'];

	var https = config.https;
	Object.defineProperty(route,"https",{
		enumerable : true,
		get : function(){return https;},
		set : function(set){
			if(set===undefined){
				https = undefined;
			} else {
				https = set?true:false;
			}
		}
	});

	var host = config.host;
	Object.defineProperty(route,"host",{
		enumerable : true,
		get : function(){return host;},
		set : function(set){
			host = set;
		}
	});

	var priority = (typeof config.priority !=='undefined')?config.priority:1000;
	Object.defineProperty(route,"priority",{
		enumerable : true,
		get : function(){return priority;},
		set : function(set){
			set = parseInt(set,10) || 1000;
			if(set!==priority){
				route.emit("priorityUpdate",priority,set);
				priority = set;
			}
		}
	});

	var active = (typeof config.active !=='undefined')?config.active:true;
	Object.defineProperty(route,"active",{
		enumerable : true,
		get : function(){return active;},
		set : function(set){
			if(set){active=true;}
		}
	});

	var routes = {};
	Object.defineProperty(route,"routes",{
		enumerable : true,
		get : function(){return routesOrdered;}
	});

	var routesOrdered = [];
	function routesOrder(){
		var list = [];
		for(var i in routes){list.push(routes[i]);}
		routesOrdered = list.sort(function(a,b){
			return a.priority - b.priority || 0;
		});
	}
	function routesIdChange(oldid,newid){
		if(routes[oldid] && oldid != newid){
			route.removeRoute(newid);
			routes[newid] = routes[oldid];
			delete routes[oldid];
		}
	}

	route.addRoute = function(child){
		var Dummy = function(){};
		if(child.constructor !== Route){
			Dummy.prototype = Route.prototype;
			var d = new Dummy();
			Route.apply(d, arguments);
			child = d;
		}
		route.removeRoute(child.id);
		child.on('priorityUpdate',routesOrder);
		child.on('idUpdate',routesIdChange);
		routes[child.id] = child;
		routesOrder();
		return route;
	};

	route.add = function(child){
		if(child.constructor === Route){
			return route.addRoute(child);
		} else {
			// Incompatible item to add
		}
		return route;
	};

	route.getRoute = function(childId){
		return routes[childId] || false;
	};

	route.removeRoute = function(childId){
		if(routes[childId]){
			routes[childId].removeListener('priorityUpdate', routesOrder);
			routes[childId].removeListener('idUpdate', routesIdChange);
			delete routes[childId];
			routesOrder();
		}
		return route;
	};
}
