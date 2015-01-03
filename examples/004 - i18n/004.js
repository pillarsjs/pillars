require('../../pillars.js').start();

// Informamos a la librería de la ubicación de las traducciones
textualization.load('./languages');

// Agregamos los idiomas de la aplicación. El primero es el predeterminado.
ENV.languages=['es','en'];

// Agregamos un route con un sencillo menú
route = new Route(function(gw){
	gw.render("menu.jade");

});

// Agregamos un route con el render de example.jade, sin traducciones.
route.addRoute({path:'no-i18n'},function(gw){
	gw.render(
		"example.jade", 
		{
			title: 		"Título de la Página",
			h1: 		"h1 de la página",
			contents: 	"Contenidos de la página"
		}
	); 
});


// Agregamos un route con el render de example.jade, con sistema de traducciones. 
// Todos los path de los route declarados tendrán su versión disponible en los otros idiomas seteados en ENV.languages,
// añadiendo delante del path del route el idioma (/en/i18n/). Por lo tanto, en la programación del route deberemos utilizar
// el método i18n de gangway para que los nodos se traduzcan al idioma pertinente. 
route.addRoute({path:'i18n'},function(gw){
	gw.render(
		"example.jade", 
		{
			title: 		gw.i18n("example-004.title"),
			h1: 		gw.i18n("example-004.h1"),
			contents: 	gw.i18n("example-004.contents")
		}
	); 
});

//Agregamos el route a ENV.
addRoute(route);

