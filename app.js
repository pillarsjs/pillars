
var http = require('http');
var url = require('url');
var util = require('util');
var fs = require('fs');
var jade = require('jade');
var zlib = require("zlib");
var formidable = require('formidable');
var cookie = require('cookie');
var mime = require('mime'); 

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var pillars = require('./pillars');
var template = new pillars.Template('./pillars.jade');



function isUndefined(arg) {
  return arg === void 0;
}

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

//var filepath = path.replace(/[^\\\/]*$/,'');
//var filename = path.replace(/^.*[\\\/]/,'').replace(/\..*$/,'');
//var fileext = path.replace(/^.*[\.]/,'');

/* Emitter-mod *
var EventEmitter = require('events').EventEmitter;
EventEmitter.prototype.__emit = EventEmitter.prototype.emit;
EventEmitter.prototype.__onAll = function(type){console.log('{Event}--'+this.constructor.name+'('+type+')');}
EventEmitter.prototype.emit = function(){
	this.__onAll.apply(this,arguments);
	return this.__emit.apply(this,arguments);
}
/* */

function mongoInit(dbName,url,port){
	var server = this;
	var url = url || 'localhost';
	var port = port || 27017;
	if(!server.database){
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
					console.log('Database "'+dbName+'" connection Error "'+url+':'+port+'"',error);
				} else {
					server.database = db;
					console.log('Database "'+dbName+'" connected "'+url+':'+port+'"');
				}
			}
		);
	}
}
function serverInit(port,hostname){
	var port = port || 3000;
	var hostname = hostname || undefined;
	var server = http.createServer()
	.on('error',function(error){
		console.log('Server error:');console.log(error);
	})
	.on('listening',function(){
		server.timer=Date.now();console.log('Server listening on "'+server.hostname+':'+server.port+'"');
	})
	.on('close',function(){
		console.log('Server closed '+parseInt((Date.now()-server.timer)/1000/60*100)/100+'m');
	})
	.on('connection',function(socket){
		socket.poolid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
		server.pool[socket.poolid] = socket;
		socket.timer = Date.now();
		socket.on('close',function(had_error){
			console.log('Connection close ['+socket.poolid+'] '+parseInt((Date.now()-socket.timer)/1000/60*100)/100+'m');
			delete server.pool[socket.poolid];
		});
		console.log('New connection ['+socket.poolid+']');
	})
	.on('request',function(req,res){
		new passage(server,req,res,router);
	})
	.listen(port, hostname);

	server.pool = {};
	server.passages = {};
	server.port = port;
	server.hostname = hostname || '*';
	server.timeout = 120*1000;
	server.mongodb = mongoInit;

	process.on('SIGINT', function() {
		server.close(function() {process.exit(0);});
	});

	return server;
}

var server = serverInit().mongodb('primera');



function router(){
	var pssg = this;
	try { // In this point all error can trace to response.

		if(!pssg.encoding){
			console.log(' Encoding not aceptable');
			pssg.encoding = "identity";
			pssg.error(406,'Not Acceptable');
		} else if(/^\/contenido\/?$/.test(pssg.path)){

			if(!pssg.session.counter){pssg.session.counter=0;}
			pssg.session.counter++;

			var body = template.view('form',{
				trace: util.format(pssg),
				title:'Method test',
				h1:'Method testing:'
			});
			pssg.send(body);	

		} else if(/^\/yalotengo\/?$/.test(pssg.path)){
			if(!pssg.cacheck(new Date(false))){
				pssg.send('Este contenido es fijo y se cachea');
			}
		} else if(/^\/espera\/?$/.test(pssg.path)){
			// Force timeout!
		} else if(/^\/redirecciona\/?$/.test(pssg.path)){
			pssg.redirect('http://localhost:3000/yalotengo');
		} else if(/^\/auth\/?$/.test(pssg.path)){
			pssg.authenticate();
		} else if(/^\/malapeticion\/?$/.test(pssg.path)){
			pssg.error(400,'Bad Request');// 405 Method not allowed 	Allow: GET, HEAD
		} else if(/^\/archivo\/?$/.test(pssg.path)){
			pssg.file('./uploads/exquisite0002.png','prueba.txt',false);
		} else if(/^\/error\/?$/.test(pssg.path)){
			throw new Error("Crashhh!");
		} else {
			pssg.error(404,'Page not found');
		}

	} catch(error){
		pssg.error(500,'Internal Server Error',error);
	}
}












function passage(server,req,res,router){
	var pssg = this;
	var headers = req.headers || {};
	var server = server;
	var req = req;
	var res = res;
	var router = router;

	pssg.id = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	server.passages[pssg.id] = pssg;

	pssg.timer=Date.now();
	pssg.server = server;
	pssg.socket = req.socket;
	pssg.poolid = pssg.socket.poolid;
	pssg.headers = headers;
	pssg.router = router;
	pssg.req = req;
	pssg.res = res;
	pssg.res
	.on('timeout',function(){console.log(' + Response['+pssg.poolid+':'+pssg.id+'] timeout!');pssg.error(408,'Request Timeout');})
	.on('close',function(){saveSession();console.log(' + Response['+pssg.poolid+':'+pssg.id+'] fail');delete server.passages[pssg.id];})
	.on('finish',function(){saveSession();console.log(' + Response['+pssg.poolid+':'+pssg.id+'] end in '+parseInt((Date.now()-pssg.timer)*100)/100+'ms');delete server.passages[pssg.id];});

	pssg.statusCode = function(code){if(arguments.length==0){return res.statusCode;};res.statusCode=code;}
	pssg.setHeader = function(){res.setHeader.apply(res,arguments);};
	pssg.writeHead = function(){res.writeHead.apply(res,arguments);};
	pssg.write = function(){res.write.apply(res,arguments);};
	pssg.end = function(){res.end.apply(res,arguments);};

	pssg.prot = req.httpVersion;
	pssg.auth = authParser();
	pssg.host = headers['host'] || '';
	pssg.ua = uaParser();
	pssg.accepts = {
		types: acceptsParser(headers['accept'] || false),
		languages: acceptsParser(headers['accept-language'] || false),
		encodings: acceptsParser(headers['accept-encoding'] || false),
	};
	pssg.ranges = rangesParser();
	pssg.referer = headers['referer'] || false;
	pssg.connection = headers['connection'] || '';

	pssg.url = url.parse(req.url,true,true);
	pssg.path = pssg.url.pathname || '/';
	pssg.query = pssg.url.query || {};
	pssg.cookie = cookie.parse((headers['cookie'] || ''));
	pssg.method = req.method || 'unknow';
	pssg.content = contentParser();
	pssg.cache = {
		control: headers['cache-control'] || false,
		nonematch: headers['if-none-match'] || false,
		modsince: headers['if-modified-since'] || false
	}
	pssg.ip = req.socket.remoteAddress;
	pssg.port = req.socket.remotePort;

	pssg.encoding = getEncoding();
	//pssg.language = getLanguage();
	pssg.lastmod = new Date();
	pssg.session = false;
	pssg.location = false;
	pssg.etag = false;
	pssg.size = 0;

	function acceptsParser(accepts){
		if(!accepts){return false;}
		var accepts = accepts || '';
		if(accepts=='*'){return '*';}
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

	function contentParser(){
		var type = (headers['content-type'] || false);
		var length = headers['content-length'] || 0;
		var boundary = false;
		if(type){
			var parts = datatype.split(';');
			datatype = {type:parts[0]};
			if(parts[1]){boundary = parts[1].replace(' boundary=','');}
		}
		return {type:type,length:length,boundary:boundary};
	}

	function newSession(callback){
		var sessions = server.database.collection('sessions');
		sessions.insert({timestamp:Date.now()},function(error, result) {
			if(!error && result[0]){
				pssg.cookie.sid = result[0]._id;
				pssg.session = result[0];	
			} else {
				console.log("Error on create new session.");
			}
			callback();
		});
	}

	function getSession(callback){
		var sid = pssg.cookie.sid || false;
		var sessions = server.database.collection('sessions');
		if(!sid){
			newSession(callback);
		} else {
			sid = new ObjectID.createFromHexString(sid);
			sessions.findOne({_id:sid},function(error, result) {
				if(!error && result){
					pssg.session = result;
				} else {
					console.log("Error on get session.");
				}
				callback();
			});
		}
	}

	function saveSession(){
		var sid = pssg.cookie.sid || false;
		var sessions = server.database.collection('sessions');
		if(sid){
			sid = new ObjectID.createFromHexString(sid);
			sessions.update({_id:sid},pssg.session,function(error, result) {
				if(!error && result>0){
					// Ok
				} else {
					console.log("Error on session save.");
				}
			});
		}
	}

	function getEncoding(){
		var encodings = pssg.accepts.encodings || false;
		if(!encodings){return false;}
		var all = (encodings['*'] && encodings['*']>0) || encodings == '';
	
		if(
			(all && (!encodings.deflate || encodings.deflate>0)) // all valids & no except deflate
			|| (!all && encodings.deflate && encodings.deflate>0 // not all valids but deflate is ok & best than gzip
				&& (
					!encodings.gzip
			 		|| encodings.deflate>encodings.gzip
				)
			)
		){
			return 'deflate';
		} else if(
			(all && (!encodings.gzip || encodings.gzip>0)) // all valids & no except gzip
			|| (!all && encodings.gzip && encodings.gzip>0 // not all valids but gzip is ok & best than identity
				&& (
					!encodings.identity
			 		|| encodings.gzip>encodings.identity
				)
			)
		){
			return 'gzip';
		} else if(all && (!encodings.identity || encodings.identity>0)){ // all valids & no except identity
			return 'identity';
		} else {
			return false;
		}
	}
	function rangesParser(){
		var range = headers['range'] || false;
		if(!range){return false;}
		var range = range.split('=');
		var unit = range[0];
		if(unit!='bytes'){return false;}
		var start;
		var end;
		if(range[1]){
			range[1]=range[1].split('-');
			if(range[1][0]===''){
				return false;
			} else {
				if(range[1][0]!=='' && range[1][0]>=0){start=parseInt(range[1][0]);}
				if(range[1][1]!=='' && range[1][1]>0){end=parseInt(range[1][1]);}
			}
		}
		return {
			check: headers['if-range'] || false,
			unit:unit,
			start:start,
			end:end
		}
	}
	function authParser(){
		var auth = headers['authorization'] || false;
		if(auth){
			auth = (new Buffer(auth.split(' ').pop(), 'base64')).toString().split(':');
			auth = {user:auth[0] || '',pass:auth[1] || ''};
		}
		return auth;
	}
	function uaParser(ua){
		var ua  = headers['user-agent'] || false;
		if(!ua){return false;}
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
		for(var e in engines){
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
		for(var b in browsers){
			if(browsers[b][0].test(ua) && (browsers[b].length==1|| !browsers[b][1].test(ua))){browser=b;}
		}
		return {mobile:mobile,os:os,engine:engine,browser:browser};
	}

	this.file = function(path,clientname,download){
		var filename = clientname || path.replace(/^.*[\\\/]/,'');
		var download = download?'attachment':'inline';
		var stats;

		fs.stat(path, function(error, _stats){
			if(error){
				pssg.error(404,'Not Found',error);
			} else if(!pssg.cacheck(_stats.mtime)) {
				stats = _stats;
				if(stats.size>20*1024*1024){pssg.encoding='identity';}
				if(pssg.encoding!='identity'){
					filecname = path+((pssg.encoding=='deflate')?".zz":".gz");
					fs.stat(filecname, function(error, _cstats){
						if(error || stats.mtime.getTime()>_cstats.mtime.getTime()){
							fileCompress(filecname);
						} else {
							fileStream(filecname,_cstats);
						}
					});
				} else {
					fileStream();
				}
			}
		});

		function fileCompress(filecname){
			var errormsg = "Error on encoding response by "+pssg.encoding+" => ";
			var source = fs.createReadStream(path);
			var compressor = (pssg.encoding=='deflate')?zlib.createDeflate():zlib.createGzip();
			var compressed = fs.createWriteStream(filecname)
			.on('close',function(){
				fs.stat(filecname, function(error, _cstats){
					if(error){
						error.message=errormsg+error.message;throw error;
					} else {
						fileStream(filecname,_cstats);
					}
				});
			})
			.on('error',function(error){
				error.message=errormsg+error.message;throw error;
			});
			source.pipe(compressor).pipe(compressed);
		}

		function fileStream(_path,_stats){
			var _stats = _stats || stats;
			var _path = _path || path;
			var size = _stats.size;
			var start,end,ranges=false;
			var etag = '"'+path+':'+stats.mtime.getTime()+'"';
			if(pssg.ranges && ((new Date(pssg.ranges.check)).getTime() === stats.mtime.getTime() || pssg.ranges.check===etag)){
				ranges = true;
				start = pssg.ranges.start;
				end = pssg.ranges.end;
			}
			var file = fs.createReadStream(_path,{start: start,end: end}).
			on('open',function(fd){
				pssg.head();
				pssg.setHeader("ETag", etag);
				pssg.setHeader("Accept-Ranges", 'bytes');
				pssg.setHeader("Content-Location", '"'+path+'"');
				pssg.setHeader('Content-Disposition', download+'; filename="'+clientname+'"');
				pssg.setHeader("Content-Length", (end+1 || size)-(start || 0));
				pssg.setHeader('Content-type',mime.lookup(path));
				if(ranges){
					pssg.setHeader("Content-Range", "bytes "+(start || '0')+"-"+(end || size-1)+"/"+size);
					pssg.writeHead(206, 'Partial Content');
				}
				//file.pipe(pssg.res);
				/* Slow pipe */
				file.on('data',function(chunk){
					pssg.write(chunk);
					if(!file._readableState.ended){
						file.pause();
						setTimeout(function(){file.resume();},2*1000);
					}
				}).on('end',function(){
					pssg.end();
				});
				/* */
			}).on('error',function(error){
				var errormsg = "Error on file stream => ";
				error.message=errormsg+error.message;throw error;
			});
		}
	}

	this.cacheck = function(lastmod){
		pssg.lastmod = lastmod || pssg.lastmod;
		if(pssg.cache.modsince && (new Date(pssg.cache.modsince)).getTime() === pssg.lastmod.getTime()){
			pssg.writeHead(304, 'Not Modified'); pssg.end();
			return true;
		}
		return false;
		//If-None-Match + eTag
		//var eTag = "Cookietag";
		//res.setHeader("Etag", '"'+eTag+'"');
	}

	this.authenticate = function(msg){
		var msg = msg || 'Restricted area, insert your credentials.';
		pssg.writeHead (401, 'Not Authorized',{'WWW-Authenticate': 'Basic realm="'+msg+'"'});
		pssg.end();
	}

	this.redirect = function(location){
		var location = location || 'http://'+pssg.server.hostname+'/';
		pssg.writeHead (301, 'Moved Permanently',{'Location': location});
		pssg.end();
	}

	this.head = function(){
		/* 
		Expires Gives the date/time after which the response is considered stale 	Expires: Thu, 01 Dec 1994 16:00:00 GMT 	Permanent: standard
		Cache-Control: max-age=3600 seconds
		*/
		if(pssg.session){
			pssg.setHeader("Set-Cookie", cookie.serialize('sid',pssg.cookie.sid,{
				path:'/',
				expires: new Date(Date.now()+2*24*60*60*1000),
				//maxAge:60, // seconds
				//domain:'',
				secure: false, // true
				httpOnly: true // false
			}));
		}

		if(pssg.encoding!='identity'){
			pssg.setHeader("Vary", "Accept-Encoding");
			pssg.setHeader("Content-Encoding", pssg.encoding);
		}
		if(!pssg.lastmod){pssg.lastmod = new Date();}
		pssg.setHeader("Last-Modified", pssg.lastmod.toUTCString());
		pssg.setHeader("Server", 'Node-JS');
		pssg.setHeader("X-CPID", pssg.socket.poolid);
		pssg.setHeader("Transfer-Encoding", 'chunked');
		pssg.setHeader("X-Powered-By", 'Pillars-JS');
		pssg.setHeader("Pragma", 'no-cache');
	}

	this.send = function(data){
		var body = "";
		// Pre format
		if(isString(data) || isBuffer(data)) {
			pssg.setHeader("Content-Type", "text/html"); // "text/javascript" // "text/css"
			body = data;
		} else {
			pssg.setHeader("Content-Type", "application/json");
			body = JSON.stringify(data);
		}
		body = isBuffer(body) ? body : new Buffer(body || "");

		// Enconding
		if(pssg.encoding!='identity'){
			zlib[pssg.encoding](body, function (error, body) {
				if(error){
					var errormsg = "Error on encoding response by "+pssg.encoding+" => ";
					error.message=errormsg+error.message;throw error;
				} else {
					end(body);
				}
			});
		} else {
			end(body);
		}

		function end(body){
			pssg.head();
			pssg.setHeader("Content-Language", 'es_ES');
			pssg.setHeader("Content-Length", body.length);
			pssg.end(body);
		}
	}

	this.error = function(code,explain,data){
		console.log(' + Sending response Error'+code+' '+explain+'!');
		pssg.statusCode(code);
		if(util.isError(data)){
			body = template.view('error',{
				error:util.format(data),
				stack:data.stack.toString(),
				title:explain,
				h1:'Error '+code+' '+explain
			});	
		} else {
			body = template.view('error',{
				title:explain,
				h1:'Error '+code+' '+explain
			});		
		}
		pssg.send(body);
	}

	getSession(function(){
		pssg.router();
	});
}

/*
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
memwatch.on('stats', function(stats) {
	stats.diff = hd.end();
	console.log(util.inspect(stats, { depth: 7, colors: true }));
	hd = new memwatch.HeapDiff();
});
memwatch.on('leak', function(info) {
	console.log(util.inspect(info, { depth: 7, colors: true }));
});
*/

