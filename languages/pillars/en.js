
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
	'error':"Server error ".red+"%(hostname)s:%(port)s".yellow,
	'listening':"Server listening on ".green+"%(hostname)s:%(port)s".yellow,
	'closed':"Server closed ".red+"%(hostname)s:%(port)s".yellow+" %(timer)sm".grey,
	'socket-closed': "%(poolid)s".magenta+" Socket closed".red+" %(timer)sm".grey,
	'socket-open': "%(poolid)s".magenta+" Socket open".green,
	'database':{
		'connection-ok':"Database ".green+"'%(name)s'".yellow+" connected on ".green+"%(url)s:%(port)s".yellow,
		'connection-error':"Error on database ".red+"'%(name)s'".yellow+" on ".red+"%(url)s:%(port)s".yellow
	}
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
	'heap-rewrite':"Textualization node overwrite ".red+"'%(element)s'".yellow+": ".red+"'%(path)s'".yellow+", language: ".red+"%(lang)s".yellow
},
'templates':{
	'cache-ok':"Template ".cyan+"'%(path)s'".yellow+" loaded".cyan,
	'cache-error':"Template load error ".red+"'%(path)s'".yellow
},
'gangway':{
	'session':{
		'database-error':"Unable to access the session store",
		'insert-error':"Unable to create session",
		'update-error':"Unable to update session data"
	},
	'unlinktemp':{
		'ok':"Temp file %(file)s' deleted".green,
		'error':"Delete temp file error '%(file)s'".red
	},
	'close':"%(poolid)s %(id)s".magenta+" %(method)s:".cyan+" %(path)s".white+" [%(code)s]".cyan+"  %(size)sbytes %(timer)sms".grey,
	'error':{
		'h1':"Error %(code)s %(explain)s"
	}
},
'config':{
	'unknow': "Unknow enviroment var".red+" %(prop)s =".cyan+" %(value)s".yellow,
	'ok': "Enviroment var setted".green+" %(prop)s =".cyan+" %(value)s".yellow
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
}