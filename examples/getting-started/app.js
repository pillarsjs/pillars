require('../../pillars').configure({
  database:{db:'pillarsExample'},
  debug:true,
  languages:['es','en']
}).start();

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
addRoute(Utilities); // o ENV.addRoute(Utilities) indistintamente.

Utilities.addRoute(new Route({
  id:'Status',
  path:'/status'
},function(gw){
  // Enviamos el estado de nuestro entorno como datos JSON
  gw.json(ENV.status); // El metodo .json envia un objeto JS como application/json. .send(Object) tiene el mismo funcionamiento.
}));

Utilities.addRoute(new Route({
  id:'Source',
  path:'/source'
},function(gw){
  // Mediante .file() podemos enviar un archivo al cliente, en este caso enviamos el propio fuente de nuestra aplicación.
  gw.file('./app.js','Código fuente de mi aplicación');
  // El segundo parametro fuerza un nuevo nombre para el archivo y con el tercer parametro a 'true' podriamos forzar la descarga.
}));

Utilities.addRoute(new Route({
  id:'ErrorControl',
  path:'/errorhandler'
},function(gw){
  // Cualquier error dentro de un manejador de ruta sera gestionado por el framework enviando el correspondiente codigo 500.
  var a = b + c;
  // En caso de establcer el modo 'debug' obtendremos el stack del error.
}));

Utilities.addRoute(new Route({
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

Utilities.addRoute(new Route({
  id:'Query',
  path:'queryparams'
},function(gw){
  // Enviamos los parametros recibidos por query como objeto JSON
  gw.json(gw.query);
}));

Utilities.addRoute(new Route({
  id:'PathParams',
  path:'/pathparams/:parametro1/*:restoDeRuta'
},function(gw){
  // Al establcer la propiedad 'path' podremos usar capturas de parametros en la ruta
  // utilizando /: capturaremos un solo parametro mientras que con /*: capturaremos cualquier subruta.
  gw.json(gw.pathParams);
}));

Utilities.addRoute(new Route({
  id:'Session',
  path:'/session',
  session: true // Algunos Plugins hacen uso de propiedades de ruta, en este caso la propiedad session activa el Plugin Sessions.
},function(gw){
  // El Plugin Sessions nos aporta la propiedad .session de Gangway que nos permitira guardar datos entre diferentes solicitudes.
  gw.session.contador = gw.session.contador || 0; // Inciamos la vriable contador.
  gw.session.contador++;
  gw.html('Contador:<strong>'+gw.session.contador+'</strong>');
}));

Utilities.addRoute(new Route({
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

Utilities.addRoute(new Route({
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
    Utilities.addRoute(Extra);
  }
  gw.html('Se ha añadido una nueva ruta, puedes visitarla <a href="/tools/new-route">aqui</a>');
}));

/* *

# Bienvenido a **Pillars.js**, un framework de desarrollo web modular y escalable en NodeJS.

Pillars.js se encarga de gestionar la capa de **negociación HTTP** y te ofrece un entorno de **enrutado organizado** junto con una completa **preparación de las solicitudes**.

De forma integrada en el sistema dispondras de modulos como:
- **Textualization (i18n):** Te permite trabajar con multiples idiomas de forma transparente.
- **Modelator:** Sistema para modelado de objetos en MongoDB pensado desde la perspectiva CRUD.
- **Mailer:** Envio de mails
- **Logger:** Sistema de logs por entornos, podras organizar y almacenar los logs del sistema de forma sencilla y versatil.
- **Cron:** Programación de tareas automatizadas.
- **Precasts:** Funciones 'prefabricadas' para integrar en tus controladores, por ejemplo podras crear un API-REST indicando simplemente el esquema de datos que deseas seguir.

Pillars.js trabaja con una base de datos MongoDB que le permite tener persistencia desde el primer momento. El sistema de sessiones o cualquier otro Plugin puede contar de esta forma con un entorno de persistencia conocido, esto no implica que puedas trabajar con bases de datos adicionales si es necesario para tu desarrollo.


## Preparando el entorno

Para empezar a utilizar Pillars.js necesitas tener instalado **NodeJS**, **NPM** y **MongoDB**, en los siguientes enlaces puedes encontrar como instalar tanto [NodeJS como NPM](http://nodejs.org/) y [MongoDB](https://www.mongodb.org/downloads).

Creamos un nuevo directorio para nuestro primer proyecto Pillars.js y añadimos los dos archivos básicos para comenzar a trabajar: *package.json* (un descriptor de nuestra aplicación) y *app.js* (el archivo principal de nuestro proyecto).

El archivo *package.json* puede funcionar con una información mínima. Es suficiente con indicar que utilizaremos Pillars en la lista de dependencias:

```JSON
{
  "dependencies": {
    "pillars": "*"
  }
}
```

> Puedes encontrar más información sobre cómo funciona este archivo en el sitio web de [npmjs](https://www.npmjs.org/doc/files/package.json.html).

Ahora utilizaremos *npm* para cargar nuestras dependencias, utilizando el comando `npm install` por consola en el directorio del proyecto. Esto creará un directorio /node_modules* en el que se colocarán las dependencias descritas en nuestro archivo *package.json*.

Ya podemos empezar a utilizar Pillars.js, en el archivo *app.js* escribiremos un ejemplo básico:

```javascript
require('pillars').start();

addRoute(new Route(function(gw){
  gw.send("Hola Mundo");
}));
```

> Podemos arrancar nuestra aplicación ejecutando el comando `node app.js` en el directorio de nuestro proyecto.
> Para detener la aplicación utilizaremos la combinación de teclas `ctrl+c`.

Los conceptos principales en los que se apolla Pillars.js son:

- **ENV (Entorno):** La variable global ´ENV´ nos permite administrar el entorno Pillars.js, es un EventEmitter que sirve de punto central de configuración.
Algunas de las propiedades y metodos de `ENV`:
 - `.debug`: boolean; Indicador de modo debug, permite recibir errores mas detallados entre otras opciones. Por defecto `false`.
 - `.languages`: Array; Permite indicar un array de idiomas que estaran disponibles en el sistema, siendo el primero el idioma por defecto. El valor incial es ['ES'].
 - `.server`: Permite definir las propiedades del servidor HTTP:
  - `.port`: Int; Puerto del servidor, por defecto 3000.
  - `.hostname`: String; Nombre de host, por defecto cualquiera.
  - `.timeout`: Int; Tiempo maximo de inactividad en la respuesta al cliente.
  - `.maxUploadSize`: Int; Numero maximo de bytes que seran aceptados como cuerpo de la solicitud.
  - `.maxZipSize`: Int; Tamaño maximo de archivo en bytes para ser comprimido antes de su envio.
 - `.database`: Datos de acceso a la base de datos MongoDB, con las siguientes propiedades:
  - `.hostname`: Nombre de host MongoDB, por defecto 'localhost'.
  - `.port`: Puerto del servidor MongoDB, por defecto 27017.
  - `.db`: Nombre de la base de datos.
  - `.user`: Opcional, nombre de usuario.
  - `.password`: Opcional, clave de acceso.
 - `.administrator`: Información sobre el administrador de la aplicación, tiene las siguientes propiedades:
  - `.mail`: Mail del administrador.
  - `.firstname`: Nombre del administrador.
  - `.lastname`: Apellidos del administrador.
 - `.directories`: Rutas a directorios utilizados por diversas partes del entorno, entre ellos:
  - `.temp`: Directorio temporal para subida de archivos.
  - `.uploads`: Directorio donde situar los archivos subidos.
 - `.templates`: Opciones del sistema de templating y rutas a templates genericos:
  - `.cache`: Boolean, Activa o descativa la cache de templates, por defecto `true`.
  - `.error`: Ruta al template generico de error.
  - `.static`: Ruta al template generico de listado de directorios.
- `.start()`: Inicia el servicio HTTP, puede utlizarse para modificar la configuración de la propiedad `.server` antes de iniciar el servicio añadiendo como primer parametro dicha configuración. Tambien admite pasar como parametro una función callback.
- `.stop()`: Detiene el servicio HTTP, puede pasarse una función callback como parametro.
- `.connect()´: Conecta con la base de datos, puede modificar la configuración de la propiedad `.database` antes de conectar añadiendo como primer parametro dicha configuración. Admite tambien una función callback como parametro.
- `.disconnect`: Desconecta la base de datos. Admite una función callback como parametro.
- `.addRoute(route)`: Añade un objeto Route al entorno.
- `.removeRoute()`:



Route: Es una clase que te permite asociar un controlador/manejador para una ruta y configuración concretas, un objeto Route consiste en una función manejador y una serie de propiedades que serviran para controlar cuando y como ejecutar dicho manejador, la forma mas basica de crear un objeto Route es declarando solo su manejador dejando las opciones por defecto:

```javascript
myRoute = new Route(function(gw){
  gw.send('¡Hola Mundo!');
});
```

Aunque en general necesitaremos configurar nuestro Route de la siguiente forma:
```javascript
myRoute = new Route({ // Configuración
  id:'Status',
  path:'admin/status',
  method:'get'
},function(gw){ // Manejador
  gw.send('¡Hola Mundo!');
});
```


Gangway(gw): Es un objeto generado por el sistema para cada solicitud HTTP, con tiene a los objetos propios de Node.js request y response. Un objeto Gangway contiene toda la información de la solicitud ya parseada y preparada para su uso, por otro lado ofrece metodos para gestionar la respuesta al cliente.

Plugin: Es una clase que nos da control sobre las solicitudes a un nivel distinto a Route, los Plugins no funcionan sobre rutas sino que se ejecutan en cadena para cada solicitud. Los Plugins permiten extender el funcionamiento de Pillars.js ampliando sus posibilidades.





/* */

/* *
// PILLARS

var app = require('pillars');




app.configure();
app.dbConnect();
app.start();



app === pillars && unico && global (PILLARS).

PILLARS === app.

package
version
path
resolve('/static/css/pillars.less') => /Applications/XAMPP/xamppfiles/htdocs/www/node/pillars/static/css/pillars.less

-maxUploadSize
-maxZipSize
-debug
-templatesCache
-timeout

-adminMail
-adminName
-smtp

-languages

-errorsTemplate
-staticTemplate

-uploadsDirectory
-tempDirectory

db
dbConnect({
	hostname: '',
	port: 27017,
	name: 'primera',
	user: '',
	password: ''
},function(error){})
dbDisconnect(function(error){})

db.connect()

db.

server
start({port:3000,hostname:''},function(error){})
stop(function(error){})

children
addPillar(Pillar) || addPillar({},function(gw){})
getPillar('id')
removePillar('id')
add() -> addPillar(Pillar) => .add(new Pillar()) .addPillar({},function(gw){})



configure() => app.debug = 'hola' || app.configure({debug:'hola'})


app.languges = [];
app.debug = false;
app.start();
app.configure({languages:[],debug:true}).start();

routes

/* */

/* *

//var app = require('pillars').start().addPillar(function(gw){gw.send('Hello World!');});
//var app = require('pillars').start().add(new Pillar(function(gw){gw.send('Hello World!');}));
//var app = require('pillars').start().add(new Pillar({path:'/'},function(gw){gw.send('Hello World!');}));

var app = require('../../pillars.js')
	.configure({
		debug:true,
		languages:['es','en']
	})
	.dbConnect('primera')
	.start();

var Pillar = app.Pillar;

app
	.addPillar(
		new Pillar({
			id:'samplePillar',
			path:'/category/:cat',
			session:true
		},function(gw){
			//console.log('#### se ejecuta el primer handler');
			gw.send(gw.params);
		})
			.addPillar({
				path:'/file/:file'
			},function(gw){
				//console.log('#### se ejecuta el segundo handler');
				gw.send(gw.params);
			})
	)
;

/* */

/* *
//PILAR 


pillar.path = '';
pillar.method = ['post'];
pillar.configure({path:'',method:['post']});

new Pillar({id:'myPillar',path:'/',session:true},function(gw){});

configure()
handlers
id
params
pathRegex
path
method


?host

priority

active

children


addPillar
add 
getPillar
removePillar



/* */

/* *

app.db.connect({name:'primera'});

var Pillar = pillars.Pillar;
var mailer = pillars.mailer;

var logger = pillars.Logger;
var tasker = pillars.Tasker;

Mailer.send({},function(error,result){});

PILLARS.db.colletion('sessions').find();
PILLARS.mailer({},function(){});

PILLARD.db.config();
PILLARS.db.connect();
PILLARS.db.colletion().find()

Mailer.config();
Mailer.send();

app.server.timeout
app.server.maxUploadSize




var app = require('pillars');

app.configure({
	debug:true,
	languages: ['es','en'],

	timeout:1000,
	maxUploadSize:1000,
	maxZipSize:1000,

	templateCache:true,
	errorTemplate:'',
	staticTemplate:''
});

app.start({
	port: 80,
	host: 'www.hola.es'
});


app.dbConnect({
	hostname:'',
	port:'',
	name:'',
	user:'',
	password:''
});


app.db.collection('session').find();

app.db.connect({
	hostname:'',
	port:'',
	name:'',
	user:'',
	password:''
});



app.mailer.configure({}); .send()

app.cron.configure({}); .add(), remove(), get()

app.logger.configure({}); .error(), log(), alert()

app.logger === Logger
Logger.log('Un error');

// -----

var app = require('pillars').server.start();

app.db.configure({name:primera}).start();
app.add(new Pillar(function(gw){gw.send('Hello World!');}));



var app = require('pillars').add(new Pillar(function(gw){gw.send('Hello World!');}));

/* */

/* *


PILLARS.debug;





var app = require('pillars').configure({
	debug:true,
	languages:[],
	administrator:{
		mail:'',
		firstname:'',
		lastname:''
	},
	server:{
		hostname:'',
		port:3000,
		timeout:1000,
		maxUploadSize:1000,
		maxZipSize:1000
	},
	database:{
		store:'',
		hostname:'',
		port:'',
		user:'',
		password:''
	},
	directories:{
		uploads:'',
		temp:''
	},
	templates:{
		cache:false,
		static:'',
		error:''
	},
	smtp:{
		hostname:'',
		port:'',
		user:'',
		password:''
	}
}).start().connect();

PILLARS properties:
	todo lo configuradopor configure
	package
	version
	path
	resolve
	status

PILLARS methods:
	addPlugin, removePlugin, getPlugin, plugins
	addPillar, removePillar, getPillar, routes
	add
	start, stop
	connect, disconnect


Globals:
	PILLARS
	SERVER
	DB
	Plugin
	Route (aka:Pillar)
	renderer
	modelator
	textualization
	i18n
	mailer
	cron
	logger
	addPlugin, removePlugin, getPlugin
	addPillar, removePillar, getPillar

Uso bajo este enfoque:

require('pillars').configure({...});
addRoute(new Route({...},function(gw){...}));
addPlugin(new Plugin({...},function(gw,next){...}));


// Ó:

require('pillars').configure({...});
PILLARS.add(new Pillar({...},function(gw){...}));
PILLARS.add(new Plugin({...},function(gw,next){...}));

// Ó:

var app = require('pillars').configure({...});
app.addPillar(new Pillar({...},function(gw){...}));
app.addPlugin(new Plugin({...},function(gw,next){...}));
// este ultimo enfoque tiene el problema que desde un modulo independiente no podrias usarlo, debiando usar entonces PILLARS o directamente .addPlugin() o .addPillar().

addPillar(new Pillar({id:'test'},function(gw){

	// Acceso a una propiedad de Pillars:
	var version = PILLARS.version;
	var dbName = PILLARS.database.store;

	var package = APP.package;
	var version = APP.version;

	var routes = APP.routes;

	APP.add(new Pillar({...}));


	var package = PILLARS.package;
	var version = PILLARS.version;

	var routes = PILLARS.routes;

	PILLARS.add(new Pillar({...}));

	// Envio de un mail:
	mailer.send({...},callback);

	// Acceso a la base de datos:
	DB.collection('sessions').find({...});

	// Usos de renderer:
	renderer.preload('./template.jade');
	renderer.addEngine('.haml',function(source,path){});

	// Uso de textualization y i18n:
	i18n('pillar.hello-world',{...},'ES');
	textualization.load('./myLanguages');

	textualization.load('shoper',{
		'en':{
			'hello-world':'Hello World! :D'
		'es':{
			'hello-world':'Hola Mundo! :D'
		});
	i18n('shoper.hello-world',{},'ES')

	// Ejemplo de reiniciar el servidor y la conexion a la BDD:
	PILLARS.start({port:80},callback);
	PILLARS.stop([callback]);
	PILLARS.connect({store:'myDB'}[,callback]);
	PILLARS.disconnect([callback]);

}));

/* *

var LoggerRules = {
	all : function(groups,lvl,msg,meta){
		return ['console'];
	}
};
var LoogerStores = {
	console:function(lvl,msg,meta,callback){
		console.log(lvl,msg,meta);
		callback();
	}
};

function Logger(parent,group){
	var logger = this;

	if(parent){
		function _log(groups,lvl,msg,meta,callback){
			var groups = groups || [];
			groups.push(group);
			parent._log(groups,lvl,msg,meta,callback);
		}
	} else {
		function _log(groups,lvl,msg,meta,callback){
			var groups = groups || [];
			var msg = msg || '';
			var meta = meta || {};
			var to = [];
			for(var i in LoggerRules){
				var result = LoggerRules[i](groups,lvl,msg,meta) || [];
				for(var ii in result){
					if(to.indexOf(result[ii])<0){
						to.push(result[ii]);
					}
				}
			}
			var storesChain = new Chain();
			for(var i in to){
				var store = to[i];
				if(LoogerStores[store]){
					storesChain.add(LoogerStores[store],lvl,msg,meta,storesChain.next);
				}
			}
			if(callback){
				storesChain.add(callback,storesChain);
			}
			storesChain.pull();
		}
	}

	logger.addLvl = function(lvl){
		Logger.prototype[lvl] = function(msg,meta,callback){
			var logger = this;
			logger.log(group,lvl,msg,meta.callbak);
		};
	}
	logger.addGroup = function(group){
		looger[group] = new Looger();
	}

	logger.log = function(lvl,msg,meta,callback){
		_log([],lvl,msg,meta,callback);
		return logger;
	}
}

Logger.prototype.

logger.error('Unknow ERROR!',{error:error}[,callback]);

logger.info()

logger.alert()

logger.warn()

logger.error(['system'])

/* *

var util = require('util'); // Incluimos la libreria 'util' de NodeJS.
var pillars = require('../../pillars.js').configure({
	debug : true,
	directories:{
		uploads:'./uploads',
		temp:'./temp'
	},
	templates:{
		cache:false
	},
	languages : ['es','en'],
	administrator:{
		mail:'',
		firstname:'',
		lastname:''
	},
	server:{
		//port:3000,
		timeout:10*1000
	},
	database:{
		store:'primera'
	},
	smtp: {
		service: 'gmail',
		auth: {
			user: '',
			pass: ''
		}
	}
});

addRoute(new Route({id: 'examples',path: '/'})
	.add(new Route({id: 'file',path: '/source'},function(gw){
		// Envimaos el archivo app.js de la aplicación al cliente.
		gw.file('./app.js','Mi primera aplicación Pillars.js');
	}))
	.add(new Route({id: 'eMail',path: '/mail/:to/:subject/:msg'},function(gw){
		mailer({
			from: 'PILLARS <hello@pillars.com>',
			to: gw.params.to,
			subject: gw.params.subject,
			html: gw.params.msg
		},function(error,info){
			if(!error){
				gw.send(info);
			} else {
				gw.error(500,error);
			}
		});
	}))
	.add(new Route({id: 'redirection',path: '/redirect'},function(gw){
		gw.redirect('http://www.google.es');
	}))
	.add(new Route({id: 'json-content',path: '/json'},function(gw){
		// Enviamos una respuesta aplication/json, para verla correctamente comprueba que tu navegador es capaz de interpretar este tipo de contenido.
		gw.send({a:'A',b:'B',c:'C'});
	}))
	.add(new Route({id: 'cache-control',path: '/cache'},function(gw){
		// Comprobamos el funcionamiento de cacheck, creamos una fecha antigua:
		var lastmod = new Date(0);
		if(!gw.cacheck(lastmod)){
			gw.send('Este contenido no ha sido modificado desde '+lastmod.toUTCString());
		}
		// No es necesario contemplar el 'else' ya que cacheck emitira un '304' automaticamente si es necesario.
		// Puedes comprobar en la consola la respuesta '304' y probar sucesivamente cmd+R para recargar y cmd+shift+R para recargar obviando la cache.
	}))
	.add(new Route({id: 'template',path: '/mypage'},function(gw){
		// Comprobamos el funcionamiento de render con el template de ejemplo.
		// El template espera las variables {title,h1 y contents}
		gw.render('./example.jade',{
			title: 'Mi primer template en Pillars',
			h1: 'Ejemplo de template básico',
			contents: '<strong>Hola mundo!</strong>'
		})
	}))
	.add(new Route({id: 'custom-error',path: '/error/:error'},function(gw){
		// Utilizaremos los parametros en la ruta para probar cualquier codigo de error, los más comunes tienen una traducción predeterminada.
		if(['400','403','404','406','408','413','500'].indexOf(gw.params.error)>=0){
			gw.error(parseInt(gw.params.error),new Error('Probando página de error de forma manual.'));
		} else {
			gw.error(404,new Error('El codigo de error no está en la lista.'));
		}
	}))
	.add(new Route({id: 'timeout',path: '/wait'},function(gw){
		// Si no respondemos a la solicitud se devolvera un '408', tiempo de la solicitud agotado.
		// El tiempo de espera puede configurarse mediante pillars.configure({timeout:milisegundos});
	}))
	.add(new Route({id: 'auto-handled-erros',path: '/hups'},function(gw){
		// Si se genera algun error no manejado en el código de nuestro Route se emitira un Error500 con el trazado del error y se cerrara la conexión.
		var c = a + b; // Cometemos un error intencionado.
		// Los errores 500 son tambien trazados por consola.
	}))
	.add(new Route({id: 'authenticate',path: '/secret'},function(gw){
		// Este contenido solo sera visible bajo autenticación.
		// comprobamos si exite autenticación y es correcta, en caso contrario utilizamos .authenticate(msg):
		if(gw.auth && gw.auth.user=='admin' && gw.auth.pass=='1234'){
			gw.render('./example.jade',{
				title: 'El sentido de la vida, el universo y todo lo demás',
				h1: 'El sentido de la vida, el universo y todo lo demás',
				contents: '<h2>42</h2><blockquote><p>The Hitchhiker´s Guide to the Galaxy</p></blockquote>'
			})
		} else {
			gw.authenticate('Es necesario usuario y clave para ver este contenido');
		}
	}))
	.add(new Route({id: 'proxy',path: '/proxy/*:path'},function(gw){
		// Transparent proxy redirection.
		gw.proxy({port:80,path:(gw.params.path || '')});
	}))		
	.add(new Route({id: 'maintenance',path: '/cerrado'},function(gw){
		// Esto servira de página "En mantenimiento".
		gw.send("closed for maintenance");
	}))
	.add(new Route({id: 'maintenance-close',path: '/cerrar'},function(gw){
		// Moveremos la pagina de mantenimiento a una proridad mayor y configuraremos su ruta para que capture cualquier ruta posible.
		// Con esto mantendremos el sitio inaccesible.
		var maintenance = getRoute('examples').getRoute('maintenance');
		maintenance.path = '/*:path';
		maintenance.priority = 2;
		gw.send("closed!");
		// Mediante este ejemplo podemos comprobar como el router aplica cualquier cambio en las rutas de forma automatica.
		// Tambien comprobamos como modificar nuestro entorno de trabajo en tiempo de ejecución.
	}))
	.add(new Route({id: 'maintenance-open',path: '/abrir',priority:1},function(gw){
		// Esta ruta prevalecera al 'maintenance', permitiendonos volver a 'abrir' el sitio.
		var maintenance = getRoute('examples').getRoute('maintenance');
		maintenance.path = '/cerrado';
		maintenance.priority = 1000;
		gw.send("open!");
	}))
)
// Creamos un nuevo Route con funciones adicionales, un home con nuestro codigo fuente y una utilidad para trazar variables globales.
.add(new Route({id: 'tools',path: '/',priority:1})
	.add(new Route({id: 'status',path: '/'},function(gw){
		// Mostramos la información de estado actual de nuestra app.
		gw.send(ENV.status); // util inspect da formato a un objeto JS para poder mostrarlo como String.
	}))
	.add(new Route({id: 'gangway',path: '/request'},function(gw){
		// Mostramos algunas de las propiedades de gw vistas anteriormente:
		gw.send("<pre>"+util.inspect({
			cookie:gw.cookie,
			ua:gw.ua,
			ip:gw.ip,
			host:gw.host,
			port:gw.port,
			method:gw.method,
			path:gw.path,
			query:gw.query,
			params:gw.params,
			files:gw.files,
			session:gw.session,
			referer:gw.referer
		},{depth:4})+"</pre>");
	}))
	.add(new Route({id: 'console.log',path: '/console/log/:varName'},function(gw){
		// Podremos capturar cualquier ruta con el formato "/console/log/xxx" y recibir como parametro 'xxx' utilizando el prefijo ':'.
		// Tambien podemos usar el prefijo '*:' para capturar cualquier sucesión de directorios en vez de uno solo.
		// En este caso permitimos elegir una variable global para mostrar:
		gw.send("<pre>"+util.inspect(global[gw.params.varName],{depth:4})+"</pre>");
	}))
);


addRoute(new Route({id: 'static',path: '/static'})
	.add(new Route({id: 'main',path: '/*:path'},precasts.static({directory:'./static',listing:true})))
);


/* */

/* The Pillars Hello world */
/*
Routing on two steps:
You can organize your controllers (Beam) on logic groups (Pillar).
Pillar describe the first common part of the path, priority and maybe the hostname {path:'/examples',host:'sub.hostname.ext',priority:10},
Beam describe the rest of the path, the method and prority {method:['get','post'],path:'/case1',priority:42} and set the handler/midleware.
The App router check the Pillar list, and only check Beams if necesary.
The router is dinamic, you can add, remove, change priority, id or path, method... any change is aplied by the router in running App.
Gangway is abstraction of request+response, it's have all you need, width easy names and methods.
*
var pillars = require('pillars').global();

var app = new App().start()
	.add(new Pillar({id:'examples1', path:'/examples1'})
		.add(new Beam({id:'sendFile', path:'/source'},function(gw){
			gw.file('./app.js','source.js'); // support cache, http streaming, compression, forced download, file name...
		}))
		.add(new Beam({id:'sendJSON', path:'/json'},function(gw){
			// gw is a request+response abstraction with all you need and dream in one object.
			gw.send(
				session : gw.session,
				params:  gw.params,
				ip: gw.ip, 
				routes: app.routes
			);
		}))
		.add(new Beam({id:'params', path:'/params/:param1', method:['get','post']},function(gw){
			gw.send({
				query: gw.query, // only query params.
				path: gw.pathParams, // only path params, in this case 'param1'.
				content: gw.content.params, // only content params, forms POST, multipart...
				files: gw.files, // only files received.
				all: gw.params // all params mixed, preference: path>content>query
			});
		}))
		.add(new Beam({id: 'sendHTML',path: '/html'},function(gw){
			gw.send('<h1>Hello world!</h1>');
		}))
		.add(new Beam({id: 'sendHTMLtemplate',path: '/template'},function(gw){
			gw.render('./template.ext',{title:'Hello world'}); // Multi engine based on extensions, and cache control.
		}))
		.add(new Beam({id: 'cacheControl',path: '/cache'},function(gw){
			var oldDate = new Date(0); // This content modification time, very old content.
			if(!gw.cachek(oldDate)){ // If client haven't this content cached...
				gw.send('Vey old content!');
			}
			// .cacheck(Date) send 304 if content is cached and return true, if not return false. In both cases set the last modification date for the response.
		}))
		.add(new Beam({id: 'static',path: '/static/*:path',directory:'./',directoryListing:true},precasts.directory))
	)
	.add(new Pillar({id: 'examples2',path: '/examples2'})
		.add(app.get('examples1').get('sendFile')) // Use the same Beam.
		.add(new Beam({id: 'removeExamples',path: '/remove'},function(gw){
			global.examples1 = app.get('examples1'); // Dirty save before remove Pillar.
			app.remove('examples1');
		}))
		.add(new Beam({id: 'mountExamples',path: '/mount'},function(gw){
			// remount Examples1 if removed.
			if(global.examples1){app.add(global.examples1);}
		}))
		.add(new Beam({id: 'changePriority',path: '/priority'},function(gw){
			var oldRoutes = app.routes;
			app.get('examples2').priority = 10; // this change the sort in routes.
			var newRoutes = app.routes;
			console.log({oldRoutes:oldRoutes,newRoutes:newRoutes});
		}))
		.add(new Beam({id: 'middleWare',path: '/check/:name/:password'},
			function(gw,next){
				if(gw.params.name=='Walter'){
					next();
				} else {
					gw.send('Incorrect name!');
				}
			},
			function(gw){
				if(gw.params.password=='White'){
					gw.send('Ok, ok... follow me.');
				} else {
					gw.send('Say my name!');
				}
			}
		))
	)
;

/* */










/* Modelator example (on progress) *


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

/* */

