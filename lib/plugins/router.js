var textualization = require('../textualization.js');
var logger = Logger.pillars.plugins.addGroup('Router');

module.exports = new Plugin({id:'Router'},function(gw,next){

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
// var noInherit = ['domain','handlers','id','pathParams','pathRegexp','path','method','host','priority','active','routes'];

function routesWalker(gw,route,path){ // path = /dos/
	if(route.active && route.pathRegexp.test(path)){ // es activo! & el path (en parte) coincide "/:param2/" "/uno/dos/tres"
		var match = path.match(route.pathRegexp); // coincidencias varias
		var matches = match.slice(1); // lo que nos srive de las coincidencias
		var routePath = match[0]; // En este caso: /dos/
		var subPath = path.replace(route.pathRegexp,''); // : "" 
		var isEndPath = (routePath==path); // && route.handlers.length>0 // si somos
		var haveChildren = (!isEndPath && route.routes.length>0); // nop

		// comprobamos si puede optar a ser comprobado y si es asi, comporbamos si cumple lo que debe
		if((isEndPath || haveChildren) && (!route.host || route.host==gw.host) && (!route.method || route.method.indexOf(gw.method)>=0) && (route.https===undefined || route.https===gw.https)){
			
			// herencia
			var noInherit = []; // k ['id','path'...]
			for(var i=0,k=Object.key(route),l=k.length;i<l;i++){
				var prop = k[i];
				gw.routing.options[prop]=route[prop];
			}

			// lista de routes
			gw.routing.routes.push(route);
			
			// parseo de pathParams
			for(var i in route.pathParams){ // setea gw.pathParams & gw.params con lo que se pilla de la ruta /:param1/:param2/
				gw.pathParams[route.pathParams[i]] = gw.params[route.pathParams[i]] = decodeURIComponent(matches[i] || '');
			}

			// final o walker
			if(isEndPath){ // si es el ultimo (si la ruta coincide por completo) y el que atendera la petición
				gw.routing.handlers = route.handlers;
				return true;
			} else {
				for(var c in route.routes){
					if(routesWalker(gw,route.routes[c],subPath)){
						return true;
					}
				}
			}

		} else {
			return false;
		}
	} else {
		return false;
	}
}