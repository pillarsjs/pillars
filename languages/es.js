
'statusCodes':function(){
	switch(code){
		case 400:
			return 'Solicitud erronea';
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
	'error':"Error en el servidor ".red+"%(hostname)s:%(port)s".yellow,
	'listening':"Servidor escuchando en ".green+"%(hostname)s:%(port)s".yellow,
	'closed':"Servidor detenido ".red+"%(hostname)s:%(port)s".yellow+" %(timer)sm".grey,
	'socket-closed': "%(poolid)s".magenta+" Socket cerrado".red+" %(timer)sm".grey,
	'socket-open': "%(poolid)s".magenta+" Socket abierto".green,
	'database':{
		'connection-ok':"Base de datos ".green+"'%(dbname)s'".yellow+" connectada en ".green+"%(url)s:%(port)s".yellow,
		'connection-error':"Error en la base de datos ".red+"'%(dbname)s'".yellow+" en ".red+"%(url)s:%(port)s".yellow
	}
},
'textualization':{
	'langs':function(){
		if(langs && langs.length>0){
			return "Lenguajes de textualización habilitados: ".cyan+langs.join(',').yellow;
		} else {
			return "No existen lenguajes habilitados para textualización".cyan;
		}
	},
	'load-ok':"Hoja de textualización cargada ".cyan+"(%(count)s nodos)".yellow+" para el dominio: ".cyan+"%(domain)s".yellow+", ruta: ".cyan+"'%(path)s'".yellow+", lenguaje: ".cyan+"%(lang)s".yellow,
	'load-error':"Error al carga la hoja de textualización para el dominio: ".red+"%(domain)s".yellow+" , ruta: ".red+"'%(path)s'".yellow+", lenguaje: ".red+"%(lang)s".yellow,
	'heap-rewrite':"Nodo de textualización sobrescrito ".red+"'%(element)s'".yellow+" en el dominio: ".red+"%(domain)s".yellow+", languaje: ".red+"%(lang)s".yellow
},
'templates':{
	'cache-ok':"Plantilla ".cyan+"'%(path)s'".yellow+" cargada".cyan,
	'cache-error':"Error al cargar la plantilla ".red+"'%(path)s'".yellow
},
'gangway':{
	'session':{
		'database-error':"No es posible acceder al almacén de sesiones",
		'insert-error':"No ha sido posible crear la sesión",
		'update-error':"No ha sido posible actualizar los datos de sesión"
	},
	'unlinktemp':{
		'ok':"Archivo temporal %(file)s' borrado".green.inverse.white,
		'error':"Error al borrar el archivo temporal '%(file)s'".red.inverse.white
	},
	'close':"%(poolid)s %(id)s".magenta+" %(method)s:".cyan+" %(path)s".white+" [%(code)s]".cyan+"  %(size)sbytes %(timer)sms".grey,
	'error':{
		'h1':"Error %(code)s %(explain)s, disculpe las molestias"
	}
}




