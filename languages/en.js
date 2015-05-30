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
		'error':"Server error ".red+"{service.hostname}:{service.port}".yellow,
		'listening':"Server listening on ".green+"{service.hostname}:{service.port}".yellow,
		'closed':"Server closed ".red+"{service.hostname}:{service.port}".yellow+" {time}m".grey
	},
	'mongoService':{
		'error':"Mongo error ".red+"{service.hostname}:{service.port}".yellow,
		'connect':"Mongo connect ".green+"{service.hostname}:{service.port}".yellow,
		'disconnect':"Mongo disconnect ".red+"{service.hostname}:{service.port}".yellow
	},
	'shutdown':{
		'ok': "Pillars stop succesfully".green,
		'errors': "Pillars stop errors: ".red+"\n\n{errors}\n".bgRed
	},
	'forced-shuttingdown': "Forced shutting down.".yellow,
	'shuttingdown':"Shutting down...".cyan,
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