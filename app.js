
var http = require('http');
var url = require('url');
var util = require('util');
var fs = require('fs');
var jade = require('jade');
var zlib = require("zlib");
var pillars = require('./pillars');
var template = new pillars.Template('./pillars.jade');
var duc = decodeURIComponent;

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function dbInit(dbName,url,port){
	var url = url || 'localhost';
	var port = port || 27017;
	if(!database){
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect(
			"mongodb://"+url+":"+port+"/"+dbName,{
				db:{native_parser:false},
				server: {
					socketOptions: {connectTimeoutMS: 500,auto_reconnect: true}
				},
				replSet: {},
				mongos: {}
			},function(error, db) {
				if(error) {
					console.log('Database "'+dbName+'" Error to connect on "'+url+':'+port+'"!',error);
				} else {
					database = db;
					console.log('Database "'+dbName+'" Connected on "'+url+':'+port+'"');
				}
			}
		);
	}
}
var database = null;
dbInit('primera');

function serverInit(port,hostname){
	var port = port || 3000;
	var hostname = hostname || undefined;
	var server = http.createServer()
		.on('error',serverError)
		.on('listening',serverListen)
		//.on('clientError',serverClientError)
		//.on('connection',serverConn)
		.on('request',serverReq)
		.on('close',serverClose)
		.listen(port, hostname);

	server.port = port;
	server.hostname = hostname || '*';
	server.timeout = 10*1000;

	process.on('SIGINT', function() {
		server.close(function() {process.exit(0);});
	});	
}
serverInit();




function serverError(error){var server = this;console.log('HTTP Server error:');console.log(error);}
function serverListen(){var server = this;server.timer=Date.now();console.log('HTTP Server listening on "'+server.hostname+':'+server.port+'"');}
function serverClose(){var server = this;console.log('HTTP Server closed! '+(Date.now()-server.timer)/1000+'s');}
function serverReq(req,res){
	console.log('New request');
	var server = this;
	var socket = req.connection;
	var req = req;
	var res = res;

	req.res = res;
	req.timer=Date.now();

	res.req = req;
	res.send = resSend;
	res.setCookie = setCookie;
	res.timer=Date.now();
	
	console.log(' + Parse headers...');
	req.info = headersParser(req);

	console.log(' + Mount events...');

	req.contents = [];
	req.boundary = new RegExp(req.info.datatype.boundary);
	req.isBoundary = false;
	req.isHeader = false;
	req.lasRest = new Buffer(0);

	req.lastWritable = false;

	req
		.on('error',resSend)
		//.on('aborted',reqAborted)
		//.on('close',reqClose)
		.on('data',reqData)
		.on('end',reqEnd);
	res
		.on('error',resSend)
		.on('timeout',resTimeout)
		.on('close',resClose)
		.on('finish',resEnd);
}

/// Error control
function resTimeout(){var res = this;console.log(' + Response timeout!');resSend.call(res,new Error('Response timeout!'));}
//function reqAborted(){var req = this;console.log('Request aborted!');}
//function reqClose(){var req = this;console.log('Request broken!');}
function resClose(){var res = this;console.log(' + Response broken!');resSend.call(res,new Error('Response broken!'));}

/// Normal process
function reqData(chunk) {
	var req = this;

	var size = chunk.length;
	var timer = Date.now();

	var search = '\n'.charCodeAt();
	var chunk = Buffer.concat([req.lasRest,chunk]);
	req.lasRest = new Buffer(0);

	var lines = [];
	var line = 0;
	for (var i = 0 ; i < chunk.length ; i++) {
		if(!lines[line]){lines[line]=[];}
		lines[line].push(chunk[i]);
		if(chunk[i] == search){lines[line] = new Buffer(lines[line]);line++;}
	}
	if(lines[line] && !isBuffer(lines[line])){req.lasRest = new Buffer(lines[line]);lines[line] = new Buffer(0);}

	for(var i = 0; i < lines.length; i++){
		var sline = lines[i].toString('utf8');
		var done = false;

		if(req.isHeader && !done){
			done = true;
			req.isHeader = false;
			if(/Content-Type:/.test(sline)){
				sline = sline.trim().split(';');
				for(var n in sline){
					var pair = sline[n].split(/(?::|=)/);
					req.contents[req.contents.length-1][pair[0].trim()]=duc(pair[1].trim().replace(/"/g,''));
				}
				if(req.contents[req.contents.length-1]['filename']){
					if(req.lastWritable){req.lastWritable.end(req.lasRest);}
					req.lastWritable = fs.createWriteStream('./uploads/'+req.contents[req.contents.length-1]['filename']);
				}
			}
		}
		if(req.isBoundary && !done){
			done = true;
			req.isBoundary = false;
			req.isHeader = true;

			req.contents.push({});
			sline = sline.trim().split(';');
			for(var n in sline){
				var pair = sline[n].split(/(?::|=)/);
				req.contents[req.contents.length-1][pair[0].trim()]=duc(pair[1].trim().replace(/"/g,''));
			}
		}
		if(req.boundary.test(sline) && !done){done = true;req.isBoundary = true;}

		if(!done && sline.replace(/[\r\n]/gm,'')==""){done = true;}

		if(!done){
			if(req.lastWritable){req.lastWritable.write(lines[i]);}
		}

	}

	var timeend = Date.now()-timer;
	var prod = 1000*size/timeend;
	prod = prod/1048576;
	console.log(" + Parsed at "+prod+"MB/sec.");

}
function reqEnd(){
	var req = this;
	if(req.lastWritable){req.lastWritable.end(req.lasRest);}
	console.log(' + Request end '+(Date.now()-req.timer)+'ms');	
	reqRoute(req);
}
function reqRoute(req){
	var req = req;
	var res = req.res;
	try {

		console.log(' + Pillar HTTP handler at '+(Date.now()-res.timer)+'ms...');

		var body = template.view('form',{
			trace: util.format(req.contents),
			title:'Method test',
			h1:'Method testing:'
		});
		res.send(body);
		
	} catch(error){
		console.log(' + Pillar HTTP handler error!:',error);
		resSend.call(res,error);
	}
}
function resSend(data){
	var res = this;
	var body = "";
	console.log(' + Ready to send at '+(Date.now()-res.timer)+'ms');
	// Pre format
	if(util.isError(data)){ // Error
		console.log(' + Sending response Error...');
		console.log(data);
		res.statusCode = 500;
		res.setHeader("Content-Type", "text/html");
		body = template.view('error',{
			error:util.format(data),
			stack:data.stack.toString(),
			title:'Internal Server Error',
			h1:'Error 500 - Internal Server Error'
		});
	} else if(isString(data) || isBuffer(data)) {
		res.setHeader("Content-Type", "text/html"); // "text/javascript" // "text/css"
		body = data;
	} else { // to Json
		res.setHeader("Content-Type", "application/json");
		body = JSON.stringify(data);
	}
	body = isBuffer(body) ? body : new Buffer(body || "");

	// Enconding
	if(res.req.info.gzip){
		zlib.gzip(body, function (err, body) {
			res.setHeader("Content-Encoding", "gzip");
			res.gzip = true;
			end(body);
		});
	} else {
		end(body);
	}

	function end(body){
		res.setHeader("Content-Length", body.length);
		//res.setHeader("Set-Cookie", ["type=ninja", "language=javascript"]);
		console.log(' + Sending '+body.length+'bytes at '+(Date.now()-res.timer)+'ms...');
		res.end(body);
	}
}
function resEnd(){var res = this;console.log(' + Response end in '+(Date.now()-res.timer)+'ms');}





function setCookie(name,value,path,domain,days,httpOnly){
	function expireParse(days){return (new Date(Date.now()+days*24*60*60*1000)).toGMTString();}
	var cookie = [];
	var euc = encodeURIComponent;
	cookie.push(euc(name)+"="+euc(value));
	if(path){cookie.push('path='+encodeURI(path));}
	if(domain){cookie.push('domain='+encodeURI(domain));}
	if(days){cookie.push('expires='+encodeURI(expireParse(days)));}
	if(httpOnly){cookie.push('httpOnly');}
	cookie = cookie.join('; ');
	this.setHeader("Set-Cookie", cookie);
}

function headersParser(req){
	var headers = req.headers || {};
	var urlparsed = url.parse(req.url,true,true);
	return {
		auth: authParser(headers['authorization'] || false),
		host : headers['host'] || '',
		ua : uaParser(headers['user-agent'] || ''),
		accept : acceptsParser(headers['accept'] || ''),
		languages : acceptsParser(headers['accept-language'] || ''),
		encodings : (headers['accept-encoding'] || '').split(','),
		gzip : (headers['accept-encoding'] || '').indexOf("gzip")>-1,
		cache: headers['cache-control'] || false,
		referer: headers['referer'] || false,
		connection : headers['connection'] || '',
		path : urlparsed.pathname || '/',
		query : urlparsed.query || {},
		cookie : cookieParser((headers['cookie'] || '')),
		method : req.method || 'unknow',
		datatype: datatypeParser(headers['content-type'] || false),
		datalength: headers['content-length'] || 0
	};

	function datatypeParser(datatype){
		if(datatype){
			var parts = datatype.split(';');
			datatype = {type:parts[0]};
			if(parts[1]){datatype.boundary=parts[1].replace(' boundary=','');}
		}
		return datatype;
	}

	function acceptsParser(accepts){
		var accepts = accepts || '';
		var parsed = [];
		accepts = accepts.split(',');
		for(var a in accepts){
			if(accepts[a] && accepts[a].length>0){
				var q = 1;
				var accept = accepts[a].split(';q=');
				if(accept.length>1){q = accept[1];}
				accept = accept[0];
				parsed[accept]=parseFloat(q);
			}
		}
		return parsed;
	}

	function uaParser(ua){
		var ua = ua || '';
		var mobile = /mobi/.test(ua);
		var os = /\(([^\(\)]+)\)/.exec(ua);
		if(os){os=os[1];} else {os='unknow';}
		var engine = 'unknow';
		var engines = {
			'Gecko': /Gecko/,
			'WebKit': /AppleWebKit/,
			'Presto': /Opera/,
			'Trident': /Trident/,
			'Blink': /Chrome/,
		}
		for(e in engines){
			if(engines[e].test(ua)){engine=e;}
		}
		var browser = 'unknow';
		var browsers = {
			'Firefox' : [/Firefox\/([a-z0-9\.]*)/,/Seamonkey/],
			'Seamonkey' : [/Seamonkey\/([a-z0-9\.]*)/],
			'Chrome' : [/Chrome\/([a-z0-9\.]*)/,/Chromium/],
			'Chromium' : [/Chromium\/([a-z0-9\.]*)/],
			'Safari' : [/Safari\/([a-z0-9\.]*)/,/Chrome|Chromium/],
			'Opera' : [/Opera\/([a-z0-9\.]*)|OPR\/([a-z0-9\.]*)/],
			'MSIE' : [/MSIE ([a-z0-9\.]*)/]
		};
		for(b in browsers){
			if(browsers[b][0].test(ua) && (browsers[b].length==1|| !browsers[b][1].test(ua))){browser=b;}
		}
		return {mobile:mobile,os:os,engine:engine,browser:browser};
	}

	function authParser(auth){
		if(auth){
			auth = (new Buffer(auth.split(' ').pop(), 'base64')).toString().split(':');
			auth = {
				user:auth[0] || '',
				pass:auth[1] || ''
			};
		}
		return auth;
	}

	function cookieParser(cookie){
		var cookie = cookie || '';
		// ([\w-]+)[:=][ \t]?\"?(.*?)\"?(?:$|[;\n])
		var parser = new RegExp('([^ =;]+)=([^; ]+)','gm');
		var parsed = {};
		var match;
		while(match = parser.exec(cookie)){
			if(match.length==3){parsed[duc(match[1])]=duc(match[2]);}
		}
		return parsed;	
	}
}

function requireAuth(req,res,next){
	var auth = req.info.auth;
	if(!auth) { 
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
		res.setHeader("Content-Type", "text/html");
		res.end('<html><body>Need some creds son</body></html>');
	} else if(auth.user=='user' && auth.pass=='pass') {
		res.statusCode = 200;
		res.setHeader("Content-Type", "text/html");
		res.end('<html><body>Congratulations you just hax0rd teh Gibson!</body></html>');	
	} else {
		res.statusCode = 401; // 401 Unauthorized // 403 Forbidden
		res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
		res.setHeader("Content-Type", "text/html");
		res.end('<html><body>You shall not pass</body></html>');
	}
}


