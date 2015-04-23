var pillars = require('../../index.js');


var server = pillars.createServer().start(3000)
;

pillars.config.renderReload = true;


var route = new Route({
	id: 'home',
	path: '/'
},function(gw){
	console.log(pillars);
	gw.send("Hello World!!");
});

pillars.routes.add(route);




/*
// Create a new object Route. A route object is created with two parameters: configuration and handler.
route = new Route({
	id: 'home',
	path: '/',
},funtion(gw){
	gw.send("Hello World!!");
});

// Now we add the route object to our Enviroment.
ENV.routes.add(route);




//+++++++++++++++++++++++++++++++++++

require("pillars").start();

var route = new Route({},function(gw){
	gw.send("Hola Mundo");
});

ENV.routes
	.add(route);


//++++++++++++++PLUGINS+++++++++++++++++++++

routeForTestPlugin = new Route(
	{
		myPluginParam: true
	},
	function(gw){
		var a = gw.data.myVar;
		gw.send();
	});




// PluginTestOne - Plugin without restrictions, so this execute code on all routes in our ENV.
pluginTestOne = new Plugin(gw, next){
	gw.data.myVar = 10;
	next();
};



// PluginTestTwo - Plugin with restrictions, so this execute only when condition is passed. 
pluginTestTwo = new Plugin(gw, next){
	gw.routing.options={id:'',path:'',session:'',myPluginParam:true};
	var myPluginParam = gw.rounting.check('myPluginParam',false);
	if (myPluginParam){
		
	}else{
	
	}
	next();
};

ENV.plugins
	.add(pluginTestOne)
	.add(pluginTestTwo);






*/


/*{
	https:{
		key:'localhost.key',
		cert: 'localhost.crt',
		port: '3001'
	}
});*/

/*
ENV.languages = ['es','en'];
ENV.templates.cache = false;
ENV.debug = true;


var route2 = (new Route()).path="hola";


route = new Route(function(gw){
	console.log(ENV.routes);
	gw.send(route2)
});
route.addRoute({});

addRoute(route);

/*
route_a = new Route({path:"a", https:true},function(gw){
	gw.send("Soy a")
});

	route_a1 = new Route({path:"a1", https:false},function(gw){
		gw.send("Soy a1")
	});

	route_a2 = new Route({path:"a2",https:true},function(gw){
		gw.send("Soy a2")
	});

	route_a3 = new Route({path:"a3"},function(gw){
		gw.send("Soy a3")
	});

ENV.addRoute(route_a);
route_a.addRoute(route_a1);
route_a.addRoute(route_a2);
route_a.addRoute(route_a3);

*/