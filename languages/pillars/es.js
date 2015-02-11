'pillars':{
	'statusCodes':function(){
		switch(code){
			case 400:
				return 'Solicitud erronea';
			case 403:
				return 'No tienes las credenciales necesarias para acceder a este recurso';
			case 404:
				return 'La página no existe';
			case 406:
				return 'Codificación incompatible';
			case 408:
				return 'Tiempo de solicitud agotado';
			case 413:
				return 'El tamaño de la solicitud supera el limite establecido';
			case 500:
				return 'Error interno del servidor';
			default:
				return 'Error desconocido';
		}
	},
	'server':{
		'error':"Error en el servidor ".red+"%(params.hostname)s:%(params.port)s".yellow,
		'listening':"Servidor escuchando en ".green+"%(params.hostname)s:%(params.port)s".yellow,
		'closed':"Servidor detenido ".red+"%(params.hostname)s:%(params.port)s".yellow+" %(timer)sm".grey
	},
	'https':{
		'error':"Error en el servidor (SSL) ".red+"%(params.hostname)s:%(params.https.port)s".yellow,
		'listening':"Servidor (SSL) escuchando en ".green+"%(params.hostname)s:%(params.https.port)s".yellow,
		'closed':"Servidor (SSL) detenido ".red+"%(params.hostname)s:%(params.https.port)s".yellow+" %(timer)sm".grey
	},
	'db':{
		'connect-ok':"Base de datos conectada en ".green+"%(url)s".yellow,
		'connect-error':"Error en la base de datos ".red+"%(url)s".yellow,
		'disconnect-ok':"Base de datos desconectada".yellow,
		'disconnect-error':"Error al desconectar la base de datos".red

	},
	'textualization':{
		'langs':function(){
			if(langs && langs.length>0){
				return "Lenguajes de textualización habilitados: ".cyan+langs.join(',').yellow;
			} else {
				return "No existen lenguajes habilitados para textualización".cyan;
			}
		},
		'load-ok':"Hoja de textualización cargada ".cyan+"(%(count)s nodos)".yellow+": ".cyan+"'%(path)s'".yellow+", lenguaje: ".cyan+"%(lang)s".yellow,
		'load-error':"Error al carga la hoja de textualización: ".red+"'%(path)s'".yellow+", lenguaje: ".red+"%(lang)s".yellow,
		'heap-rewrite':"Nodo de textualización sobrescrito ".red+"'%(element)s'".yellow+": ".red+"'%(path)s'".yellow+", lenguaje: ".red+"%(lang)s".yellow,
		'i18n-error':function(){return "Error en i18n, nodo: "+node+", parametros:["+Object.keys(params).join(',')+"]";}
	},
	'renderer':{
		'ok':"Plantilla ".cyan+"'%(path)s'".yellow+" cargada".cyan,
		'compile-error':"Error al cargar la plantilla ".red+"'%(path)s'".yellow,
		'unknow-engine':"Template engine desconocida".red+" '%(path)s'".yellow,
		'render':{
			'compile-error':"Error al cargar la plantilla",
			'unknow-engine':"Template engine desconocida",
		}
	},
	'plugins':{
		'loaded':function(){return "Plugins cargados: ".cyan+("["+list.map(function(e){return e.id;}).join(',')+"]").yellow;},
		'Sessions':{
			'store-error':"No es posible acceder al almacén de sesiones",
			'insert-error':"No ha sido posible crear la sesión",
			'update-error':"No ha sido posible actualizar los datos de sesión"
		},
		'BodyReader':{
			'unlink-ok':"Archivo temporal %(file)s' borrado".green.inverse.white,
			'unlink-error':"Error al borrar el archivo temporal '%(file)s'".red.inverse.white,
			'directories':{
				'uploads':{
					'ok':"Directorio 'uploads' hubicado correctamente en ".cyan+"'%(path)s'".yellow,
					'error':"Error al hubicar el directorio 'uploads' en ".cyan+"'%(path)s'".yellow
				},
				'temp':{
					'ok':"Directorio 'temp' hubicado correctamente en ".cyan+"'%(path)s'".yellow,
					'error':"Error al hubicar el directorio 'temp' en ".cyan+"'%(path)s'".yellow
				}
			}
		}
	},
	'gangway':{
		'open':"<- %(method)s:".magenta+" %(host)s:%(port)s%(req.url)s".white,
		'close':"-> %(method)s:".green+" %(host)s:%(port)s%(req.url)s".white+" [%(statusCode)s]".cyan+"  %(size)sbytes %(responseTime)sms".grey,
		'error':"Gangway error",
		'error.h1':"Error %(code)s %(explain)s, disculpe las molestias"
	},
	'login':{
		'title':"Acceder",
		'h1':"Introduce tu nombre de usuario y contraseña",
		'ok':"Todo correcto, estas dentro",
		'fail':"Usuario y/o contraseña erroneos, prueba de nuevo",
		'user':{
			'label':"Usuario",
			'placeholder':"Nombre de usuario"
		},
		'password':{
			'label':"Contraseña",
			'placeholder':"Tu tremendisimamente segura contraseña"
		},
		'redirect':{
			'label':"Redirección",
			'placeholder':"URL para redirigir en caso de exito, si en serio"
		},
		'submit':"Enviar",
	},
	'static':{
		'title': "Listando directorio %(path)s",
		'h1': "%(path)s"
	},
	'directories':{
		'uploads':{
			'alert':'Directorio de subida de archivos sin definir'.yellow.reverse,
			'error':'No existe el directorio para subida de archivos: '.red+'%(path)s'.magenta,
			'ok':'Directorio de subida de archivos correcto en: '.green+'%(path)s'.yellow
		},
		'temp':{
			'alert':'Directorio temporal sin definir'.yellow.reverse,
			'error':'No existe el directorio temporal: '.red+'%(path)s'.magenta,
			'ok':'Directorio temporal correcto en '.green+'%(path)s'.yellow
		}
	},
	'mail':{
		'no-transport':"Servicio para envio de mails desconocido, es necesario especificar estos valores en Pillars.smtp"
	}
}




