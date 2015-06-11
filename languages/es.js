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
	'httpService':{
		'error':"Error en servidor '{service.id}' ".red+"{service.hostname}:{service.port}".yellow,
		'listening':"Servidor '{service.id}' inciado ".green+"{service.hostname}:{service.port}".yellow,
		'closed':"Servidor '{service.id}' detenido ".red+"{service.hostname}:{service.port}".yellow+" {time}m".grey
	},
	'mongoService':{
		'error':"Error en base de datos mongo '{service.id}' ".red+"{service.hostname}:{service.port}".yellow,
		'connect':"Base de datos mongo '{service.id}' conectada ".green+"{service.hostname}:{service.port}".yellow,
		'disconnect':"Base de datos mongo '{service.id}' desconectada ".red+"{service.hostname}:{service.port}".yellow
	},
	'shutdown':{
		'ok': "Pillars detenido correctamente".green,
		'errors': "Errores al detener Pillars: ".red+"\n\n{errors}\n".bgRed
	},
	'forced-shuttingdown': "Detención del sistema forzada.".yellow,
	'shuttingdown':"Deteniendo el sistema...".cyan,
	'logfile':{
		'ok': "Logfile ".green+"'{path}'".yellow+" iniciado correctamente".green,
		'error': "Error al iniciar logfile ".red+"'{path}'".yellow+": ".red,
		'dir':{
			'ok':"Directorio 'logs' ubicado correctamente en ".cyan+"'{path}'".yellow,
			'error':"Error al ubicar el directorio 'logs' en ".red+"'{path}'".yellow,
			'exists':"Error al ubicar el directorio 'logs' en ".red+"'{path}'".yellow+", la ruta existe pero no es un directorio.".red
		}
	},
	'plugins':{
		'loaded': "Plugins cargados: ".cyan+"{list}".yellow,
		'BodyReader':{
			'unlink-ok':"Archivo temporal {file}' borrado".green.inverse.white,
			'unlink-error':"Error al borrar el archivo temporal '{file}'".red.inverse.white,
			'temp':{
				'ok':"Directorio 'temp' ubicado correctamente en ".cyan+"'{path}'".yellow,
				'error':"Error al ubicar el directorio 'temp' en ".red+"'{path}'".yellow,
				'exists':"Error al ubicar el directorio 'temp' en ".red+"'{path}'".yellow+", la ruta existe pero no es un directorio.".red
			}
		}
	},
	'gangway':{
		'open':"<< {method}:".cyan+" {host}:{port}{req.url}".white,
		'close':">> {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey+" ·{!params.finished?'cancelada':''}·".red,
		'error':"Gangway error".red,
		'error-h1':"Error {code} {explain}, disculpe las molestias",
		'cacheCleaned': "Cache de archivos Gangway revisada".cyan,
	},
	'mail':{
		'no-transport':"Servicio para envio de mails desconocido, es necesario especificar estos valores en Pillars.smtp"
	}
};