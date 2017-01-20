({
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
	'httpService':{
		'error':"Server '{service.id}' error ".red+"{service.hostname}:{service.port}".yellow,
		'listening':"Server '{service.id}' listening on ".green+"{service.hostname}:{service.port}".yellow,
		'closed':"Server '{service.id}' closed ".red+"{service.hostname}:{service.port}".yellow+" {time}m".grey
	},
	'shutdown':{
		'ok': "Pillars stop succesfully".green,
		'errors': "Pillars stop errors: ".red+"\n\n{errors}\n".bgRed,
		'forced': "Forced shutting down.".yellow,
		'shuttingdown':"Shutting down...".green,
	},
	'logfile':{
		'ok': "Logfile ".green+"'{path}'".yellow+" setup ok.".green,
		'error': "Logfile ".red+"'{path}'".yellow+" setup error: ".red,
		'dir':{
			'ok':"Directory 'logs' setted at ".cyan+"'{path}'".yellow,
			'error':"Error on set 'logs' directory at ".red+"'{path}'".yellow,
			'exists':"Error on set 'logs' directory at ".red+"'{path}'".yellow+", path exists but is not a directory".red
		}
	},
	'middleware':{
		'loaded': "Loaded Middleware: ".cyan+"{list}".yellow,
		'BodyReader':{
			'unlink-ok':"Temp file {file}' deleted".bgGreen,
			'unlink-error':"Delete temp file error '{file}'".bgRed,
			'temp':{
				'ok':"Directory 'temp' setted at ".cyan+"'{path}'".yellow,
				'error':"Error on set 'temp' directory at ".red+"'{path}'".yellow,
				'exists':"Error on set 'temp' directory at ".red+"'{path}'".yellow+", path exists but is not a directory".red
			}
		}
	},
	'fileCache':{
		'cacheCleaned': "File cache cleaned".cyan
	},
	'gangway':{
		'start':"<< {gw.method}:".cyan+" {gw.host}:{gw.port}{gw.req.url}".white,
		'finish':">> {gw.method}:".green+" {gw.host}:{gw.port}{gw.req.url}".white+" [{gw.statusCode}]".cyan+"  {gw.size}bytes {gw.responseTime}ms".grey,
		'close':"x>> {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Request canceled".red,
		'broken':"<<x {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Communication stream Error:".red,
		'error':"!>> {gw.method}:".red+" {gw.host}:{gw.port}{gw.req.url}".white+", Error:".red
	}
})