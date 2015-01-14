require('../../pillars.js').start();

// Informamos a la librería de la ubicación de las traducciones
textualization.load('./languages');

// Agregamos los idiomas de la aplicación. El primero es el predeterminado.
ENV.languages=['es','en'];

// Agregamos un route con el render de example.jade, con sistema de traducciones. 
// Todos los path de los route declarados tendrán su versión disponible en los otros idiomas seteados en ENV.languages,
// añadiendo delante del path del route el idioma (/en/i18n/). Por lo tanto, en la programación del route deberemos utilizar
// el método i18n de gangway para que los nodos se traduzcan al idioma pertinente. 
addRoute({path:'i18n'},function(gw){
	gw.render(
		"example.jade", 
		{
			title: 		gw.i18n("example-004.title"),
			h1: 		gw.i18n("example-004.h1",{name:'María'}),
			contents: 	gw.i18n("example-004.contents")
		}
	); 
});

// Objeto route que envía al template parámetros.
addRoute({path:'variables'},function(gw){
	gw.render(
		"example.jade", 
		{
			title: 		gw.i18n("example-004-var.title"),
			h1: 		gw.i18n("example-004-var.h1",{name:'María'}),
			contents: 	gw.i18n("example-004-var.contents")
		}
	); 
});



