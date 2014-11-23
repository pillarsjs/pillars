'pillars':{
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
		'error':"Server error ".red+"%(params.hostname)s:%(params.port)s".yellow,
		'listening':"Server listening on ".green+"%(params.hostname)s:%(params.port)s".yellow,
		'closed':"Server closed ".red+"%(params.hostname)s:%(params.port)s".yellow+" %(timer)sm".grey
	},
	'database':{
		'connect-ok':"Database connected on ".green+"%(url)s".yellow,
		'connect-error':"Database error on ".red+"%(url)s".yellow,
		'disconnect-ok':"Database disconnect ok".yellow,
		'disconnect-error':"Error on database disconnect".red
	},
	'textualization':{
		'langs':function(){
			if(langs && langs.length>0){
				return "Avaliable textualization languages: ".cyan+langs.join(',').yellow;
			} else {
				return "No exist textualization languages".cyan;
			}
		},
		'load-ok':"Textualization sheet loaded ".cyan+"(%(count)s nodes)".yellow+": ".cyan+"'%(path)s'".yellow+", lenguage: ".cyan+"%(lang)s".yellow,
		'load-error':"Textualization sheet load error: ".red+"'%(path)s'".yellow+", lenguage: ".red+"%(lang)s".yellow,
		'heap-rewrite':"Textualization node overwrite ".red+"'%(element)s'".yellow+": ".red+"'%(path)s'".yellow+", language: ".red+"%(lang)s".yellow,
		'i18n-error':function(){return "Error on i18n translation, node: "+node+", params:["+Object.keys(params).join(',')+"]";}
	},
	'renderer':{
		'ok':"Template ".cyan+"'%(path)s'".yellow+" loaded".cyan,
		'error':"Template load error ".red+"'%(path)s'".yellow,
		'unknow-engine':"Unknow template engine".red+" '%(path)s'".yellow,
		'template-noexist':"Template '%(path)s' no exist.".red
	},
	'plugins':{
		'loaded':function(){return "Loaded Plugins: ".cyan+("["+list.map(function(e){return e.id;}).join(',')+"]").yellow;},
		'Sessions':{
			'store-error':"Unable to access the session store",
			'insert-error':"Unable to create session",
			'update-error':"Unable to update session data"
		},
		'BodyReader':{
			'unlink-ok':"Temp file %(file)s' deleted".green,
			'unlink-error':"Delete temp file error '%(file)s'".red
		}
	},
	'gangway':{
		'close':"%(method)s:".cyan+" %(host)s:%(port)s%(path)s".white+" [%(code)s]".cyan+"  %(size)sbytes %(timer)sms".grey,
		'error':"Gangway error",
		'error.h1':"Error %(code)s %(explain)s"
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
		'title': "Directory listing %(path)s",
		'h1': "%(path)s"
	},
	'directories':{
		'uploads':{
			'alert':'Uploads directory undefined'.yellow.reverse,
			'error':'Uploads directory no exist,'.red+' path: %(path)s'.magenta,
			'ok':'Uploads directory set on'.green+' path: %(path)s'.yellow
		},
		'temp':{
			'alert':'Temp directory undefined'.yellow.reverse,
			'error':'Temp directory no exist,'.red+' path: %(path)s'.magenta,
			'ok':'Temp directory set on'.green+' path: %(path)s'.yellow
		}
	},
	'mail':{
		'no-transport':"Unknow transport for mail send. Please set Pillars.smtp values"
	}
}