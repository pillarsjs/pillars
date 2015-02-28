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
		'error':"Server error ".red+"{server.config.hostname}:{server.config.port}".yellow,
		'listening':"Server listening on ".green+"{server.config.hostname}:{server.config.port}".yellow,
		'closed':"Server closed ".red+"{server.config.hostname}:{server.config.port}".yellow+" {time}m".grey
	},
	'mongo':{
		'error':"Mongo error ".red+"{params.hostname}:{params.port}".yellow,
		'connect':"Mongo connect ".green+"{params.hostname}:{params.port}".yellow,
		'disconnect':"Mongo disconnect ".red+"{params.hostname}:{params.port}".yellow
	},
	'shutdown':{
		'ok': "Pillars stop succesfully".green,
		'errors': "Pillars stop errors: ".red+"\n\n{errors}\n".bgRed
	},
	'logfile':{
		'ok': "Logfile setup ok".green,
		'errors': "Logfile setup error: ".red,
	},
	'plugins':{
		'loaded': "Loaded Plugins: ".cyan+"{list}".yellow,
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
		'close':"-> {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey+" [finished:{finished}]".grey,
		'error':"Gangway error".red,
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