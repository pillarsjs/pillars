var project = require('../../index').configure({
  renderReload: true
});

project.services.get('http').configure({port:3000}).start();

var fs = require('fs');
project.services.insert((new HttpService({
	id:'https',
	key: fs.readFileSync('./localhost.key'),
	cert: fs.readFileSync('./localhost.crt'),
  port: 3001
})).start());

var i18n = require('textualization');
i18n.languages = ['es','en'];

var crier = require('crier').addGroup('overview');
crier.constructor.console.language = 'es';






/*


// Setup Templated .jade support.
var templated = require('templated');
var jade = require('jade');
var marked = require('marked');
var hljs = require('highlight.js');
function hljsFix(str,lang){
  var result;
  if(lang){
    result = hljs.highlight(lang,str,true).value;
  } else {
    result = hljs.highlightAuto(str).value;
  }
  result = result.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
    return r.replace(/\s{4}|\t/g, '  ');
  });
  result = result.replace(/\n/g, '<br>');
  return '<pre class="highlight"><code>'+result+'</pre></code>';
}
jade.filters.highlight = function(str,opts){
  return hljsFix(str,opts.lang);
};
jade.filters.codesyntax = function(str,opts){
  str = str.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
    return r.replace(/\s{4}|\t/g, '  ');
  });
  return '<pre class="codesyntax"><code>'+str+'</pre></code>';
};
marked.setOptions({
  highlight: function (code,lang) {
    return hljsFix(code,lang);
  }
});
templated.addEngine('jade',function compiler(source,path){
  return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
});


*/


/*



// Static service
var pillarsStatic = new Route({
  id:'pillarsStatic',
  path:'/pillars/*:path',
  directory:{
    path:pillars.resolve('./static'),
    listing:true
  }
});
pillars.routes.add(pillarsStatic);


*/






/*

var mongoConn = pillars.createMongoConnection().start({
  database: 'pillars'
});

pillars.plugins.get('Sessions').mongo = mongoConn;
pillars.plugins.get('Accounts').mongo = mongoConn;

*/


//crier.log("pillars.server.close",{fgr:'hola',error: new Error('ups!')});







project.routes.add(new Route({id:'Root'},function(gw){gw.html('Hola mundo!');}));

var Utilities = new Route({
  id:'Tools',
  path:'/tools'
},function(gw){
  // Podemos enviar HTML directamente por medio del metodo .html(), .send(String) tiene el mismo funcionamiento.
  // Utilizaremos este metodo para crear una pagina de inicio básica para nuestros ejemplos.
  gw.html(
    '<h1>Utilidades</h1>'
    +'<ul>'
      +'<li><a href="/tools/status">Estado del entorno</li>'
      +'<li><a href="/tools/source">C&oacute;digo fuente</li>'
      +'<li><a href="/tools/errorhandler">Test de error interno</li>'
      +'<li><a href="/tools/template">Test de platilla HTML</li>'
      +'<li><a href="/tools/queryparams?a=1&b=2&c=3">Test de parametros query</li>'
      +'<li><a href="/tools/pathparams/a/b/c">Test de parametros de ruta</li>'
      +'<li><a href="/tools/session">Test de sesi&oacute;n</li>'
      +'<li><a href="/tools/cache">Control de cach&eacute;</li>'
      +'<li><a href="/tools/edit-routes">A&ntilde;adir Route</li>'
    +'</ul>'
  );
});
project.routes.add(Utilities); // o ENV.addRoute(Utilities) indistintamente.

Utilities.routes.add(new Route({
  id:'Status',
  path:'/status',
  // https:true
},function(gw){
  // Enviamos el estado de nuestro entorno como datos JSON
  gw.json(JSON.decycler(project,false,2)); // El metodo .json envia un objeto JS como application/json. .send(Object) tiene el mismo funcionamiento.
}));

Utilities.routes.add(new Route({
  id:'Source',
  path:'/source'
},function(gw){
  // Mediante .file() podemos enviar un archivo al cliente, en este caso enviamos el propio fuente de nuestra aplicación.
  gw.file('./app.js','Código fuente de mi aplicación');
  // El segundo parametro fuerza un nuevo nombre para el archivo y con el tercer parametro a 'true' podriamos forzar la descarga.
}));

Utilities.routes.add(new Route({
  id:'ErrorControl',
  path:'/errorhandler'
},function(gw){
  // Cualquier error dentro de un manejador de ruta sera gestionado por el framework enviando el correspondiente codigo 500.
  var a = b + c;
  // En caso de establcer el modo 'debug' obtendremos el stack del error.
}));

Utilities.routes.add(new Route({
  id:'Template',
  path:'/template'
},function(gw){
  // El metodo .render() nos permite utilizar plantillas.
  // Establecemos la ruta del template y las variables locales que tendra disponibles.
  gw.render('./example.jade',{
    title: 'Mi primer template en Pillars',
    h1: 'Ejemplo de template básico',
    contents: '<strong>Hola mundo!</strong>'
  });
  // El código del template puedes encontrar tras el código de este ejemplo.
  // Por defecto Pillars.js utiliza JADE aunque pueden añadirse facilmente otros motores al sistema.
}));

Utilities.routes.add(new Route({
  id:'Query',
  path:'queryparams'
},function(gw){
  // Enviamos los parametros recibidos por query como objeto JSON
  gw.json(gw.query);
}));

Utilities.routes.add(new Route({
  id:'PathParams',
  path:'/pathparams/:parametro1/*:restoDeRuta'
},function(gw){
  // Al establcer la propiedad 'path' podremos usar capturas de parametros en la ruta
  // utilizando /: capturaremos un solo parametro mientras que con /*: capturaremos cualquier subruta.
  gw.json(gw.pathParams);
}));

Utilities.routes.add(new Route({
  id:'Session',
  path:'/session',
  session: true // Algunos Plugins hacen uso de propiedades de ruta, en este caso la propiedad session activa el Plugin Sessions.
},function(gw){
  // El Plugin Sessions nos aporta la propiedad .session de Gangway que nos permitira guardar datos entre diferentes solicitudes.
  gw.session.contador = gw.session.contador || 0; // Inciamos la variable contador.
  gw.session.contador++;
  gw.html('Contador:<strong>'+gw.session.contador+'</strong>');
}));

Utilities.routes.add(new Route({
  id:'CacheControl',
  path:'/cache'
},function(gw){
  var lastmod = new Date(0); // Establecemos una fecha antigua
  if(!gw.cacheck(lastmod)){
    gw.send('Este contenido no ha sido modificado desde '+lastmod.toUTCString());
  }
  // Podras comprobar en la consola o con herramientas de desarrollo en el nevegador como se responde con un código 200 o 304 dependiendo de la caché.
}));

// Creamos un nuevo Route que usaremos más adelante, simplemente responde con un 'Ok'.
Extra = new Route({
  id:'Extra',
  path:'/new-route'
},function(gw){
  gw.send('Ok');
});

Utilities.routes.add(new Route({
  id:'editRoutes',
  path:'/edit-routes'
},function(gw){
  // Eliminamos el Route 'CacheControl' del entorno.
  Utilities.removeRoute('CacheControl');
  // Loclaizamos el Route 'ErrorControl' y modificamos su propiedad '.path' y la prioridad
  Utilities.getRoute('ErrorControl').configure({path:'geterror',priority:900});
  // Comprobamos si ya hemos añadido el Route adicional o no.
  if(!Utilities.getRoute('Extra')){
    // Añadidmos un nuevo Route.
    Utilities.routes.add(Extra);
  }
  gw.html('Se ha añadido una nueva ruta, puedes visitarla <a href="/tools/new-route">aqui</a>');
}));










/*

var usersSchema = new modelator.Schema({
	collection : 'users',
	filter : ['_id','user','firstname','lastname'],
	indexes : [],
	uniques : [],
	headers : ['_id','user','firstname','lastname','password'],
	keys: {
		get    : '',
		insert : '',
		update : '',
		remove : ''
	}
})
	.addField(new modelator.Text({id:'user'}))
	.addField(new modelator.Text({id:'firstname'}))
	.addField(new modelator.Text({id:'lastname'}))
	.addField(new modelator.Text({id:'password'}))
	.addField(new modelator.Text({id:'keys'}))
;

var usersBackend = modelator.schemaAPI(new Route({id:'usersBackend',path:'/users'}),usersSchema);
ENV.add(usersBackend);





var usersLogin = new Route({id:'pillarsLogin'})
	.addRoute(new Route({id:'login',path:'/login',method:['get','post'],session:true},function(gw){
		var redirect = gw.params.redirect;
		if(typeof gw.params.redirect === 'undefined' && gw.referer){
			redirect = gw.referer;
		}
		if(typeof gw.params.user === "string" && typeof gw.params.password === "string"){
			var login = {
				user : gw.params.user,
				password : gw.params.password
			};
			var users = DB.collection('users');
			users.findOne({user:login.user,password:login.password},function(error, result) {
				if(!error && result){
					gw.session.user = result._id.toString();
					//gw.redirect(redirect);
					gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect,msg:'login.ok'});
				} else {
					gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect,msg:'login.fail'});
				}
			});
		} else {
			gw.render(paths.resolve(__dirname,'../templates/login.jade'),{redirect:redirect});
		}
	}));

ENV.add(usersLogin);
















var sampleSchema = new modelator.Schema({
	collection : 'sample',
	limit : 10,
	filter : ['_id','nombre','apellidos'],
	headers : ['_id','nombre','apellidos']
})
	.addField(new modelator.Text({id:'nombre'}))
	.addField(new modelator.Text({id:'apellidos'}))
	.addField(new modelator.Fieldset({id:'horario'})
		.addField(new modelator.Int({id:'horas'}))
		.addField(new modelator.Int({id:'minutos'}))
	)
;


var sampleSchemaApi = modelator.schemaAPI(new Route({id:'sampleAPI',path:'/sample'}),sampleSchema);

ENV.add(sampleSchemaApi);


/* Modelator example (on progress) */

/*
var systemModel = new modelator.Schema('system',{
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

var systemPillar = new Route({
	id:'sample-pillar',
	path:'/system'
});
precasts.CRUD(systemPillar,systemModel);
ENV.add(systemPillar);



// Translations/Textualizations for system schema (es,en).

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


/*

// Mailer
var nodemailer = require('nodemailer');

var mailTransport;
Object.defineProperty(ENV,"smtp",{
  enumerable : true,
  get : function(){return mailTransport;},
  set : function(set){
    mailTransport = nodemailer.createTransport(set);
  }
});

var mailer = global.mailer = {};

mailer.send = function(mail,callback){
  if(!mail.from && ENV.administrator && ENV.administrator.mail){
    mail.from = ENV.administrator.mail;
    if(ENV.administrator.firstname){
      var fromName = (ENV.administrator.lastname)?ENV.administrator.firstname+' '+ENV.administrator.lastname:ENV.administrator.firstname;
      mail.from = fromName+' <'+mail.from+'>';
    }
  }
  if(mailTransport){
    ENV.emit('mail',mail);
    mailTransport.sendMail(mail, function(error,info){
      if(callback){callback(error,info);}
    });
  } else {
    if(callback){callback(new Error(i18n('pillars.mail.no-transport')));}
  }
};



*/

