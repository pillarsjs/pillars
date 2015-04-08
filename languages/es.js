textualization = {
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
		'error':"Error en servidor http ".red+"{config.hostname}:{config.port}".yellow,
		'listening':"Servidor inciado ".green+"{config.hostname}:{config.port}".yellow,
		'closed':"Servidor detenido ".red+"{config.hostname}:{config.port}".yellow+" {time}m".grey
	},
	'mongo':{
		'error':"Error en base de datos mongo ".red+"{params.hostname}:{params.port}".yellow,
		'connect':"Base de datos mongo conectada ".green+"{params.hostname}:{params.port}".yellow,
		'disconnect':"Base de datos mongo desconectada ".red+"{params.hostname}:{params.port}".yellow
	},
	'shutdown':{
		'ok': "Pillars detenido correctamente".green,
		'errors': "Errores al detener Pillars: ".red+"\n\n{errors}\n".bgRed
	},
	'shuttingdown':"Apagando...",
	'logfile':{
		'ok': "Logfile iniciado correctamente".green,
		'errors': "Error al iniciar logfile: ".red,
	},
	'plugins':{
		'loaded': "Plugins cargados: ".cyan+"{list}".yellow,
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
		'open':"↩ {method}:".cyan+" {host}:{port}{req.url}".white,
		'close':"↪ {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey+" ·{!params.finished?'cancelada':''}·".red,
		'error':"Gangway error".red,
		'error-h1':"Error {code} {explain}, disculpe las molestias",
		'cacheCleaned': "Cache de archivos Gangway revisada".cyan,
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