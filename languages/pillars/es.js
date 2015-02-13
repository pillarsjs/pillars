textualization.pillars = {
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
		'error':"Error en el servidor ".red+"{params.hostname}:{params.port}".yellow+"\n\n{error}\n".bgRed,
		'listening':"Servidor escuchando en ".green+"{params.hostname}:{params.port}".yellow,
		'closed':"Servidor detenido ".red+"{params.hostname}:{params.port}".yellow+" {timer}m".grey
	},
	'https':{
		'error':"Error en el servidor (SSL) ".red+"{params.hostname}:{params.https.port}".yellow+"\n\n{error}\n".bgRed,
		'listening':"Servidor (SSL) escuchando en ".green+"{params.hostname}:{params.https.port}".yellow,
		'closed':"Servidor (SSL) detenido ".red+"{params.hostname}:{params.https.port}".yellow+" {timer}m".grey
	},
	'db':{
		'connect-ok':"Base de datos conectada en ".green+"{url}".yellow,
		'connect-error':"Error en la base de datos ".red+"{url}".yellow+"\n\n{error}\n".bgRed,
		'disconnect-ok':"Base de datos desconectada".yellow,
		'disconnect-error':"Error al desconectar la base de datos".red+"\n\n{error}\n".bgRed

	},
	'textualization':{
		'langs':function(){
			if(langs && langs.length>0){
				return "Lenguajes de textualización habilitados: ".cyan+langs.join(',').yellow;
			} else {
				return "No existen lenguajes habilitados para textualización".cyan;
			}
		},
		'load-ok':"Hoja de textualización cargada ".cyan+"({count} nodos)".yellow+": ".cyan+"'{path}'".yellow+", lenguaje: ".cyan+"{lang}".yellow,
		'load-error':"Error al carga la hoja de textualización: ".red+"'{path}'".yellow+", lenguaje: ".red+"{lang}".yellow+"\n\n{error}\n".bgRed,
		'heap-rewrite':"Nodo de textualización sobrescrito ".red+"'{element}'".yellow+": ".red+"'{path}'".yellow+", lenguaje: ".red+"{lang}".yellow,
		'i18n-error':function(){return "Error en i18n, nodo: ".red+node.yellow+(", parametros:["+Object.keys(params).join(',')+"]").red+"\n\n{error}\n".bgRed;}
	},
	'renderer':{
		'ok':"Plantilla ".cyan+"'{path}'".yellow+" cargada".cyan,
		'compile-error':"Error al cargar la plantilla ".red+"'{path}'".yellow+"\n\n{error}\n".bgRed,
		'unknow-engine':"Template engine desconocida".red+" '{path}'".yellow,
		'render':{
			'compile-error':"Error al cargar la plantilla"+"\n\n{error}\n".bgRed,
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
			'unlink-ok':"Archivo temporal {file}' borrado".green.inverse.white,
			'unlink-error':"Error al borrar el archivo temporal '{file}'".red.inverse.white,
			'directories':{
				'uploads':{
					'ok':"Directorio 'uploads' ubicado correctamente en ".cyan+"'{path}'".yellow,
					'error':"Error al ubicar el directorio 'uploads' en ".cyan+"'{path}'".yellow
				},
				'temp':{
					'ok':"Directorio 'temp' ubicado correctamente en ".cyan+"'{path}'".yellow,
					'error':"Error al ubicar el directorio 'temp' en ".cyan+"'{path}'".yellow
				}
			}
		}
	},
	'gangway':{
		'open':"<- {method}:".magenta+" {host}:{port}{req.url}".white,
		'close':"-> {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey,
		'error':"Gangway error".red+"\n\n{error}\n".bgRed,
		'error-h1':"Error {code} {explain}, disculpe las molestias"
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
		'title': "Listando directorio {path}",
		'h1': "{path}"
	},
	'directories':{
		'uploads':{
			'alert':'Directorio de subida de archivos sin definir'.yellow.reverse,
			'error':'No existe el directorio para subida de archivos: '.red+'{path}'.magenta,
			'ok':'Directorio de subida de archivos correcto en: '.green+'{path}'.yellow
		},
		'temp':{
			'alert':'Directorio temporal sin definir'.yellow.reverse,
			'error':'No existe el directorio temporal: '.red+'{path}'.magenta,
			'ok':'Directorio temporal correcto en '.green+'{path}'.yellow
		}
	},
	'mail':{
		'no-transport':"Servicio para envio de mails desconocido, es necesario especificar estos valores en Pillars.smtp"
	}
};