({
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
	'shutdown':{
		'ok': "Pillars detenido correctamente".green,
		'errors': "Errores al detener Pillars: ".red+"\n\n{errors}\n".bgRed,
		'forced': "Detención del sistema forzada.".yellow,
		'shuttingdown': "Deteniendo el sistema...".green,
	},
	'logfile':{
		'ok': "Logfile ".green+"'{path}'".yellow+" iniciado correctamente".green,
		'error': "Error al iniciar logfile ".red+"'{path}'".yellow+": ".red,
		'dir':{
			'ok':"Directorio 'logs' ubicado correctamente en ".cyan+"'{path}'".yellow,
			'error':"Error al ubicar el directorio 'logs' en ".red+"'{path}'".yellow,
			'exists':"Error al ubicar el directorio 'logs' en ".red+"'{path}'".yellow+", la ruta existe pero no es un directorio.".red
		}
	},
	'middleware':{
		'loaded': "Middleware cargado: ".cyan+"{list}".yellow,
		'BodyReader':{
			'unlink-ok':"Archivo temporal {file}' borrado".bgGreen,
			'unlink-error':"Error al borrar el archivo temporal '{file}'".bgRed,
			'temp':{
				'ok':"Directorio 'temp' ubicado correctamente en ".cyan+"'{path}'".yellow,
				'error':"Error al ubicar el directorio 'temp' en ".red+"'{path}'".yellow,
				'exists':"Error al ubicar el directorio 'temp' en ".red+"'{path}'".yellow+", la ruta existe pero no es un directorio.".red
			}
		}
	},
	'fileCache':{
		'cacheCleaned': "Cache de archivos revisada.".cyan
	},
	'gangway':{
		'start':"<< {gw.method}:".cyan+" {gw.host}:{gw.port}{gw.req.url}".white,
		'finish':">> {gw.method}:".green+" {gw.host}:{gw.port}{gw.req.url}".white+" [{gw.statusCode}]".cyan+"  {gw.size}bytes {gw.responseTime}ms".grey,
		'close':"x>> {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Solicitud cancelada.".red,
		'broken':"<<x {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Error en la comunicación:".red,
		'error':"!>> {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Error:".red,
	}
})