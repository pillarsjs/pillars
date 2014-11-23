var textualization = require('../textualization.js');
var logger = global.logger.pillars.plugins.addGroup('Router');

module.exports = new Plugin({id:'Router',priority:100},function(gw,next){

	// Start 'routing' property.
	gw.routing = {
		options:{},
		check:function(prop,preset){
			if(typeof this.options[prop]!=='undefined'){
				return this.options[prop];
			} else {
				return preset;
			}
		},
		routes:[],
		handlers:[]
	};

	// Search Routes...
	var found = false;
	for(var p in ENV.routes){
		if(routesWalker(gw,ENV.routes[p],gw.path)){
			found = true;
			next();
			break;
		}
	}
	if(!found){
		gw.error(404);
	}
});

// Non inheritable properties.
var noInherit = ['domain','handlers','id','params','pathRegex','path','method','host','priority','active','routes'];

function routesWalker(gw,route,path){
	if(route.active && route.pathRegex.test(path)){
		var match = path.match(route.pathRegex);
		var matches = match.slice(1);
		var routePath = match[0];
		var subPath = path.replace(route.pathRegex,'');
		var isEndPath = (routePath==path && route.handlers.length>0);
		var haveChildren = (!isEndPath && route.routes.length>0);
		if(isEndPath || haveChildren){
			if(isEndPath){
				if((!route.host || route.host==gw.host) && route.method.concat(['OPTIONS']).indexOf(gw.method)>=0){
					gw.routing.handlers = route.handlers;
				} else {
					return false;
				}
			}
			var props = Object.getOwnPropertyNames(route);
			var enumProps = Object.keys(route);
			for(var i in props){
				var prop = props[i];
				if(prop[0]!='_' && noInherit.indexOf(prop)<0 && typeof route[prop] !== 'undefined' && enumProps.indexOf(prop)>=0 && typeof route[prop]!=='function'){
					gw.routing.options[prop]=route[prop];
				}
			}
			gw.routing.routes.push(route);
			
			for(var i in route.params){
				gw.pathParams[route.params[i]] = gw.params[route.params[i]] = decodeURIComponent(matches[i] || '');
			}
			if(isEndPath){
				return true;
			} else {
				for(var c in route.routes){
					if(routesWalker(gw,route.routes[c],subPath)){
						return true;
					}
				}
			}
		}
	} else {
		return false;
	}
}