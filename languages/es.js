
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
	'error':"Error en el servidor %(hostname)s:%(port)s",
	'listening':"Servidor escuchando en %(hostname)s:%(port)s",
	'closed':"Servidor detenido %(hostname)s:%(port)s",
	'socket-closed': "%(poolid)s Socket cerrado",
	'socket-open': "%(poolid)s Socket abierto",
	'database':{
		'connection-ok':"Base de datos '%(dbname)s' connectada en %(url)s:%(port)s",
		'connection-error':"Error en la base de datos '%(dbname)s' en %(url)s:%(port)s"
	}
},
'textualization':{
	'langs':function(){
		if(langs && langs.length>0){
			return "Lenguajes de textualización habilitados: "+langs.join(',');
		} else {
			return "No existen lenguajes habilitados para textualización";
		}
	},
	'load-ok':"Hoja de textualización cargada para el dominio:'%(domain)s', ruta:'%(path)s', lenguaje:'%(locale)s'",
	'load-error':"Error al carga la hoja de textualización para el dominio:'%(domain)s', ruta:'%(path)s', lenguaje:'%(locale)s'"
},
'templates':{
	'cache-ok':"Plantilla '%(path)s' cargada",
	'cache-error':"Error al cargar la plantilla '%(path)s'"
},
'gangway':{
	'unlinktemp':{
		'ok':"Archivo temporal %(file)s' borrado",
		'error':"Error al borrar el archivo temporal '%(file)s'"
	},
	'error':{
		'h1':"Error %(code)s %(explain)s, disculpe las molestias"
	}
},
general:{
	welcome:{ // genre, num
		'genre=="female" && num==1':'Bienvenida',
		'genre=="female"':'Bienvenidas todas vosotras que sois %(num)s',
		'num>1':'Bienvenidos',
		'default':'Bienvenido'
	},
	goobye:{ // genre, num
		'genre=="female" && num==1':'Chao chica',
		'genre=="female"':'Chao %(num)s chicas',
		'num>1':'chao tios',
		'default':'chao tio'
	},
	logout:"Salir y cerrar sesión",
	error:"Ha ocurrido un error: %(error)s",
	you_have_new_messages:["Tienes un mensaje nuevo","Tienes %s mensajes nuevos"],
	actionbutton:function(){ // context, action, num
		if(context=="post"){
			if(action=="new"){
				if(num==1){
					return "Crear un Post";
				} else if(num>1){
					return "Crear %(num)s Posts";
				}
			}
		}
		return "Unknow context";
	}
},
"clasical basic":"Formato clasico",
"clasical %s here %s ...":"%s clasica aqui %s ...",
"You have 1 message":["Tienes un mensaje","Tienes %s mensajes"],
"You no have messages":["No tienes mensajes","Tienes un mensaje","Tienes %s mensajes"]
