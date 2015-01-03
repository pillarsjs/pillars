require('../../pillars.js').start();

route = new Route(function(gw){
	if(gw.auth && gw.auth.user=='javi' && gw.auth.pass=='1234'){
		gw.send('secret!');
	} else {
		gw.authenticate("Escribe tu nombre y contraseña");
	}
});

addRoute(route);