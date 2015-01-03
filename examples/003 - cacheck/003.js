require('../../pillars.js').start();

route = new Route(function(gw){
	date = new Date("2015-01-02");

	if (!gw.cacheck(date)){
		gw.render("example.jade", 
			{
				title:"Título de la página",
				h1: "h1 de la página",
				contents: "Contenidos de la página"
			}
		); 
	}
});

addRoute(route);


/*
Peticiones al servidor y mensajes por consola: 

	Primera petición, se envían datos: 

		INFO pillars.gangway.close
		GET: localhost:3000/ [200]  417bytes 36ms 

	Segunda petición, no se envían datos, el cliente ya descargó la página, 
	y con un código de estado 304, le decimos al cliente que recargue lo que ya tiene. 
	Se reducen tiempos de proceso y peso de la respuesta, reduciendo el tiempo de carga:

		INFO pillars.gangway.close
		GET: localhost:3000/ [304]  0bytes 4ms 

*/