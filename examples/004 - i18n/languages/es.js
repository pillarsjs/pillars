'example-004':{
	'title':"Título de la página",
	'h1':"h1 de la página",
	'contents': "Contenidos de la página"
},
'example-004-var':{
	'title':"Título de la página",
	'h1': function(){
		return 'Hola '+name+', tu nombre tiene '+name.length+' letras :P.';
	},
	//'h1': "Hola %(name)s que tal?",
	'contents': "Contenidos de la página"
}