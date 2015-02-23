textualization = {
	'statusCodes':function(){
		switch(code){
			case 400:
				return 'Bad Request';
			case 403:
				return 'Forbidden';
			case 404:
				return 'Not Found';
			case 406:
				return 'Not Acceptable';
			case 408:
				return 'Request Timeout';
			case 413:
				return 'Request Entity Too Large';
			case 500:
				return 'Internal Server Error';
			default:
				return 'Unknow code';
		}
	},
	'server':{
		'error':"Server error ".red+"{params.hostname}:{params.port}".yellow+"\n\n{error}\n".bgRed,
		'listening':"Server listening on ".green+"{params.hostname}:{params.port}".yellow,
		'closed':"Server closed ".red+"{params.hostname}:{params.port}".yellow+" {timer}m".grey
	},
	'https':{
		'error':"Server (SSL) error ".red+"{params.hostname}:{params.https.port}".yellow+"\n\n{error}\n".bgRed,
		'listening':"Server (SSL) listening on ".green+"{params.hostname}:{params.https.port}".yellow,
		'closed':"Server (SSL) closed ".red+"{params.hostname}:{params.https.port}".yellow+" {timer}m".grey
	},
	'database':{
		'connect-ok':"Database connected on ".green+"{url}".yellow,
		'connect-error':"Database error on ".red+"{url}".yellow+"\n\n{error}\n".bgRed,
		'disconnect-ok':"Database disconnect ok".yellow,
		'disconnect-error':"Error on database disconnect".red+"\n\n{error}\n".bgRed
	},
	'textualization':{
		'langs':function(){
			if(langs && langs.length>0){
				return "Avaliable textualization languages: ".cyan+langs.join(',').yellow;
			} else {
				return "No exist textualization languages".cyan;
			}
		},
		'load-ok':"Textualization sheet loaded ".cyan+"({count} nodes)".yellow+": ".cyan+"'{path}'".yellow+", language: ".cyan+"{lang}".yellow,
		'load-error':"Textualization sheet load error: ".red+"'{path}'".yellow+", language: ".red+"{lang}".yellow+"\n\n{error}\n".bgRed,
		'heap-rewrite':"Textualization node overwrite ".red+"'{element}'".yellow+": ".red+"'{path}'".yellow+", language: ".red+"{lang}".yellow,
		'i18n-error':function(){return "Error on i18n translation, node: ".red+node.yellow+(", params:["+Object.keys(params).join(',')+"]").red+"\n\n{error}\n".bgRed;}
	},
	'renderer':{
		'ok':"Template ".cyan+"'{path}'".yellow+" loaded".cyan,
		'compile-error':"Template load error ".red+"'{path}'".yellow+"\n\n{error}\n".bgRed,
		'unknow-engine':"Unknow template engine".red+" '{path}'".yellow
	},
	'plugins':{
		'loaded':function(){return "Loaded Plugins: ".cyan+("["+list.map(function(e){return e.id;}).join(',')+"]").yellow;},
		'Sessions':{
			'store-error':"Unable to access the session store",
			'insert-error':"Unable to create session",
			'update-error':"Unable to update session data"
		},
		'BodyReader':{
			'unlink-ok':"Temp file {file}' deleted".green,
			'unlink-error':"Delete temp file error '{file}'".red,
			'directories':{
				'uploads':{
					'ok':"Directory 'uploads' setted at ".cyan+"'{path}'".yellow,
					'error':"Error on set 'uploads' directory at ".cyan+"'{path}'".yellow
				},
				'temp':{
					'ok':"Directory 'temp' setted at ".cyan+"'{path}'".yellow,
					'error':"Error on set 'temp' directory at ".cyan+"'{path}'".yellow
				}
			}
		}
	},
	'gangway':{
		'open':"<- {method}:".magenta+" {host}:{port}{req.url}".white,
		'close':"-> {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey,
		'error':"Gangway error".red+"\n\n{error}\n".bgRed,
		'error-h1':"Error {code} {explain}"
	},
	'login':{
		'title':"Login",
		'h1':"Enter your user name and password",
		'ok':"Login ok, you are logged",
		'fail':"User name or/and password incorrect, try again",
		'user':{
			'label':"User",
			'placeholder':"User name"
		},
		'password':{
			'label':"Password",
			'placeholder':"Your super secure password"
		},
		'redirect':{
			'label':"Redirect",
			'placeholder':"URL for success automatic redirection, yes seriusly"
		},
		'submit':"Send",
	},
	'static':{
		'title': "Directory listing {path}",
		'h1': "{path}"
	},
	'directories':{
		'uploads':{
			'alert':'Uploads directory undefined'.yellow.reverse,
			'error':'Uploads directory no exist,'.red+' path: {path}'.magenta,
			'ok':'Uploads directory set on'.green+' path: {path}'.yellow
		},
		'temp':{
			'alert':'Temp directory undefined'.yellow.reverse,
			'error':'Temp directory no exist,'.red+' path: {path}'.magenta,
			'ok':'Temp directory set on'.green+' path: {path}'.yellow
		}
	},
	'mail':{
		'no-transport':"Unknow transport for mail send. Please set Pillars.smtp values"
	}
};