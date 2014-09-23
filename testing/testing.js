var util = require('util'); // Incluimos la libreria 'util' de NodeJS.
var pillars = require('../pillars.js').global().configure({
	uploadsDirectory : './uploads',
	tempDirectory : './temp'
});

var app = new App();
app.languages = ['es','en'];
app.database = 'primera';
app.start();
app
	.add(new Pillar({
		id: 'tools',
		path: '/'
	})
		.add(new Beam({
			id: 'status',
			path: '/status'
		},function(gw){
			// Mostramos la información de estado actual de nuestra app.
			gw.send("<pre>"+util.inspect(app.routes,{depth:4})+"</pre>"); // util inspect da formato a un objeto JS para poder mostrarlo como String.
		}))
		.add(new Beam({
			id: 'console.log',
			path: '/console/log/:varName' // Podremos capturar cualquier ruta con el formato "/console/log/xxx" y recibir como parametro 'xxx'.
		},function(gw){
			console.log(global[gw.params.varName]);
			gw.send('<strong>Ok</strong>');
		}))
		.add(new Beam({
			id: 'removeTools',
			path: '/tools-off'
		},function(gw){
			// Vamos a desmontar el pillar 'tools', para poder volver a trabajar con el lo guardamos en global.
			global.toolsCopy = app.get('tools');
			// Pasamos a retirarlo de la App.
			app.remove('tools');
			console.log('Se ha desmontado el Pillar "Tools"');
			gw.send('<strong>Tools desmontado.</strong>');
		}))
	)
	.add(new Pillar({
		id: 'examples',
		path: '/'
	})
		.add(new Beam({
			id: 'file',
			path: '/source'
		},function(gw){
			// Envimaos el archivo app.js de la aplicación al cliente.
			gw.file('../app.js','Mi primera aplicación Pillars.js');
		}))
		.add(new Beam({
			id: 'redirection',
			path: '/redirect'
		},function(gw){
			gw.redirect('http://www.google.es');
		}))
	)





/*

var systemModel = new modelator.Schema('system',{
	app : app,
	collection : 'system',
	limit : 5,
	filter : ['_id','field1','field2'], 
	headers : ['_id','_img','field1','field2','reverse']
})
	.addField('Text','field1')
	.addField('Checkbox','fieldCheck')
	.addField('Checkboxes','fieldCheckboxes',{
		values : ['A','B','C','D']
	})
	.addField('Radios','fieldRadios',{
		values : ['A','B','C','D']
	})
	.addField('Select','field2',{
		values : ['A','B','C','D'],
		keys : {
			//see : 'manager',
			//edit : 'manager'
		}
	})
	.addField('Time','fieldTime')
	.addField('Reference','fieldRef',{
		collection : 'system',
		headers : ['_id','_img','field1','field2','reverse']
	})
	.addField('Img','_img')
	.addField('Reverse','reverse')
	.addField(new modelator.List('listFiles')
		.addField('Img','file')
		.addField('Text','text')
	)
	.addField(new modelator.List('list')
		.addField('File','file')
		.addField('Text','field2')
		.addField('Reverse','reverse')
	)
	.addField('Editor','texti18n',{i18n : true})
	.addField('Text','field3')
	.addField(new modelator.Subset('thesubset')
		.addField('Text','subset1')
		.addField('Text','subset2')
		.addField('Text','subset3')
	)
;

var systemPillar = new Pillar({
	id:'sample-pillar',
	path:'/system'
});
precasts.crudBeams(systemPillar,systemModel);
app.add(systemPillar);



textualization.load('schemas.system',{
	en:{
		title: "System",
		details: "Example CRUD administration",
		h1: "System administration",
		headers: {
			'_id': "Id",
			'field1': "Field 1",
			'field2': "Field 2",
			'reverse': "Reverse"
		},
		fields: {
			'field1': {label: "Field 1",details: "Field 1 details"},
			'fieldCheck': {},
			'fieldCheckboxes': {},
			'fieldRadios': {},
			'field2': {},
			'fieldTime': {},
			'fieldRef': {},
			'_img': {},
			'reverse': {},
			'listFiles': {label: "Images",details: "Image list"},
			'listFiles.file': {},
			'listFiles.text': {},
			'list': {label: "List",details: "Example list"},
			'list.file': {},
			'list.field2': {},
			'list.reverse': {},
			'texti18n': {},
			'field3': {},
			'thesubset': {label: "Group",details: "Example group fields"},
			'thesubset.subset1': {},
			'thesubset.subset2': {},
			'thesubset.subset3': {}
		}
	},
	es:{
		title: "System",
		details: "Administracion CRUD de ejemplo",
		h1: "Administrando el schema system 2",
		headers: {
			'_id': "Identificador",
			'field1': "Campo 1",
			'field2': "Campo 2",
			'reverse': "Invertido"
		},
		fields: {
			'field1': {label: "Campo 1",details: "Detalles del campo 1"},
			'fieldCheck': {label: "Campo 2",details: "Detalles del campo 1"},
			'fieldCheckboxes': {},
			'fieldRadios': {},
			'field2': {},
			'fieldTime': {},
			'fieldRef': {},
			'_img': {},
			'reverse': {},
			'listFiles': {label: "Imágenes",details: "Listado de imágenes"},
			'listFiles.file': {},
			'listFiles.text': {},
			'list': {label: "Listado",details: "Listado de ejemplo"},
			'list.file': {},
			'list.field2': {},
			'list.reverse': {},
			'texti18n': {},
			'field3': {},
			'thesubset': {label: "Grupo",details: "Grupo de campos de ejemplo"},
			'thesubset.subset1': {},
			'thesubset.subset2': {},
			'thesubset.subset3': {}
		}
	}
});

*/

