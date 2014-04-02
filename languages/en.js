
'statusCodes':function(){
	switch(code){
		case 400:
			return 'Bad Request';
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
	'error':"Server error on %(hostname)s:%(port)s",
	'listening':"Server listening on %(hostname)s:%(port)s",
	'closed':"Server closed on %(hostname)s:%(port)s",
	'socket-closed': "%(poolid)s Socket closed",
	'socket-open': "%(poolid)s Socket open",
	'database':{
		'connection-ok':"Database '%(dbname)s' connected on %(url)s:%(port)s",
		'connection-error':"Database '%(dbname)s' error on %(url)s:%(port)s"
	}
},
'textualization':{
	'langs':function(){
		if(langs && langs.length>0){
			return "Textualization languages: "+langs.join(',');
		} else {
			return "Textualization languages empty";
		}
	},
	'load-ok':"Textualization sheet loaded for domain:'%(domain)s', path:'%(path)s', locale:'%(locale)s'",
	'load-error':"Textualization sheet fail load for domain:'%(domain)s', path:'%(path)s', locale:'%(locale)s'"
},
'templates':{
	'cache-ok':"Template '%(path)s' loaded",
	'cache-error':"Fail on load template '%(path)s'"
},
'gangway':{
	'unlinktemp':{
		'ok':"Temp 'file %(file)s' deleted",
		'error':"Fail on delete temp file '%(file)s'"
	},
	'error':{
		'h1':"Error %(code)s %(explain)s"
	}
}