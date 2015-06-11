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
	'httpService':{
		'error':"Server '{service.id}' error ".red+"{service.hostname}:{service.port}".yellow,
		'listening':"Server '{service.id}' listening on ".green+"{service.hostname}:{service.port}".yellow,
		'closed':"Server '{service.id}' closed ".red+"{service.hostname}:{service.port}".yellow+" {time}m".grey
	},
	'mongoService':{
		'error':"Mongo '{service.id}' error ".red+"{service.hostname}:{service.port}".yellow,
		'connect':"Mongo '{service.id}' connect ".green+"{service.hostname}:{service.port}".yellow,
		'disconnect':"Mongo '{service.id}' disconnect ".red+"{service.hostname}:{service.port}".yellow
	},
	'shutdown':{
		'ok': "Pillars stop succesfully".green,
		'errors': "Pillars stop errors: ".red+"\n\n{errors}\n".bgRed
	},
	'forced-shuttingdown': "Forced shutting down.".yellow,
	'shuttingdown':"Shutting down...".cyan,
	'logfile':{
		'ok': "Logfile ".green+"'{path}'".yellow+" setup ok.".green,
		'error': "Logfile ".red+"'{path}'".yellow+" setup error: ".red,
		'dir':{
			'ok':"Directory 'logs' setted at ".cyan+"'{path}'".yellow,
			'error':"Error on set 'logs' directory at ".red+"'{path}'".yellow,
			'exists':"Error on set 'logs' directory at ".red+"'{path}'".yellow+", path exists but is not a directory".red
		}
	},
	'plugins':{
		'loaded': "Loaded Plugins: ".cyan+"{list}".yellow,
		'BodyReader':{
			'unlink-ok':"Temp file {file}' deleted".green,
			'unlink-error':"Delete temp file error '{file}'".red,
			'temp':{
				'ok':"Directory 'temp' setted at ".cyan+"'{path}'".yellow,
				'error':"Error on set 'temp' directory at ".red+"'{path}'".yellow,
				'exists':"Error on set 'temp' directory at ".red+"'{path}'".yellow+", path exists but is not a directory".red
			}
		}
	},
	'gangway':{
		'open':"<< {method}:".cyan+" {host}:{port}{req.url}".white,
		'close':">> {method}:".green+" {host}:{port}{req.url}".white+" [{statusCode}]".cyan+"  {size}bytes {responseTime}ms".grey+" ·{!params.finished?'broken':''}·".red,
		'error':"Gangway error".red,
		'error-h1':"Error {code} {explain}",
		'cacheCleaned': "Gangway file cache cleaned".cyan,
	},
	'mail':{
		'no-transport':"Unknow transport for mail send. Please set Pillars.smtp values"
	}
};