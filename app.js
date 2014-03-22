
var http = require('http');
var url = require('url');
var util = require('util');
var fs = require('fs');
var jade = require('jade');
var zlib = require("zlib");
var formidable = require('formidable');
var cookie = require('cookie');
var mime = require('mime'); 

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
		var server = this;console.log('Server error:');console.log(error);
	})
	.on('listening',function(){
		var server = this;server.timer=Date.now();console.log('Server listening on "'+server.hostname+':'+server.port+'"');
	})
	.on('close',function(){
		var server = this;console.log('Server closed '+parseInt((Date.now()-server.timer)/1000/60*100)/100+'m');
	})
	.on('connection',function(socket){
		var server = this;
		var socket = socket;
		server.pool.push(socket);
		socket.poolid = server.pool.length-1;
		socket.timer = Date.now();
		socket.on('close',function(had_error){
			server.pool.splice(this.poolid,1);
			console.log('Connection close ['+this.poolid+'] '+parseInt((Date.now()-this.timer)/1000/60*100)/100+'m');
		});
		console.log('New connection ['+socket.poolid+']');
	})
	.on('request',serverReq)
	.listen(port, hostname);

	server.pool = [];
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


function serverReq(req,res){
	var server = this;
	reqSetup(req,res);
}

function reqSetup(req,res){
	req.res = res;
	req.timer=Date.now();

	res.req = req;
	res.resSend = resSend;
	res.resError = resError;
	res.resFile = resFile;
	res.resHeaders = resHeaders;
	res.res304 = res304;
	res.resRedirect = resRedirect;
	res.resAuth = resAuth;

	req.info = requestInfo(req);
	res.encoding = req.info.getEncoding();

	res
	.on('timeout',function(){console.log(' + Response timeout!');res.resError(408,'Request Timeout');})
	.on('close',function(){console.log(' + Response fail');})
	.on('finish',function(){console.log(' + Response end in '+parseInt((Date.now()-req.timer)*100)/100+'ms');});

	reqRouter(req,res);
}

function reqRouter(req,res){
	try { // In this point all error can trace to response.

		if(!res.encoding){
			console.log(' Encoding not aceptable');
			res.encoding = "identity";
			res.resError(406,'Not Acceptable');
		} else if(/^\/contenido\/?$/.test(req.info.path)){

			console.log(' + Pillar HTTP handler at '+(Date.now()-req.timer)+'ms...');
			var body = template.view('form',{
				trace: util.format(req.info),
				title:'Method test',
				h1:'Method testing:'
			});
			res.resSend(body);	

		} else if(/^\/yalotengo\/?$/.test(req.info.path)){
			if(!res.res304(new Date(false))){
				res.resSend('Este contenido es fijo y se cachea');
			}
		} else if(/^\/espera\/?$/.test(req.info.path)){
			// Force timeout!
		} else if(/^\/redirecciona\/?$/.test(req.info.path)){
			res.resRedirect('http://localhost:3000/yalotengo');
		} else if(/^\/auth\/?$/.test(req.info.path)){
			res.resAuth();
		} else if(/^\/malapeticion\/?$/.test(req.info.path)){
			res.resError(400,'Bad Request');// 405 Method not allowed 	Allow: GET, HEAD
		} else if(/^\/archivo\/?$/.test(req.info.path)){
			res.resFile('./uploads/exquisite0002.png','prueba.txt',false);
		} else if(/^\/error\/?$/.test(req.info.path)){
			throw new Error("Crashhh!");
		} else {
			res.resError(404,'Page not found');
		}

	} catch(error){
		res.resError(500,'Internal Server Error',error);
	}
}

function resError(code,explain,data){
	var res = this;
	var req = this.req;
	console.log(' + Sending response Error'+code+' '+explain+'!');
	res.statusCode = code;
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
	this.resSend(body);
}
function resFile(path,clientname,download){
	var res = this;
	var req = this.req;
	var filename = clientname || path.replace(/^.*[\\\/]/,'');
	var download = download?'attachment':'inline';
	var stats;

	fs.stat(path, function(error, _stats){
		if(error){
			res.resError(404,'Not Found',error);
		} else if(!res.res304(_stats.mtime)) {
			stats = _stats;
			if(stats.size>20*1024*1024){res.encoding='identity';}
			if(res.encoding!='identity'){
				filecname = path+((res.encoding=='deflate')?".zz":".gz");
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
		var errormsg = "Error on encoding response by "+res.encoding+" => ";
		var source = fs.createReadStream(path);
		var compressor = (res.encoding=='deflate')?zlib.createDeflate():zlib.createGzip();
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
		if(((new Date(req.info.ifrange)).getTime() === stats.mtime.getTime() || req.info.ifrange===etag) && req.info.ranges && req.info.ranges.unit=='bytes'){
			ranges = true;
			start = req.info.ranges.start;
			end = req.info.ranges.end;
		}
		var file = fs.createReadStream(_path,{start: start,end: end}).
		on('open',function(fd){
			res.resHeaders();
			res.setHeader("ETag", etag);
			res.setHeader("Accept-Ranges", 'bytes');
			res.setHeader("Content-Location", '"'+path+'"');
			res.setHeader('Content-Disposition', download+'; filename="'+clientname+'"');
			res.setHeader("Content-Length", (end+1 || size)-(start || 0));
			res.setHeader('Content-type',mime.lookup(path));
			if(ranges){
				res.setHeader("Content-Range", "bytes "+(start || '0')+"-"+(end || size-1)+"/"+size);
				res.writeHead(206, 'Partial Content');
			}
			//file.pipe(res);
			/* Slow pipe */
			file.on('data',function(chunk){
				res.write(chunk);
				if(!file._readableState.ended){
					file.pause();
					setTimeout(function(){file.resume();},2*1000);
				}
			}).on('end',function(){
				res.end();
			});
			/* */
		}).on('error',function(error){
			var errormsg = "Error on file stream => ";
			error.message=errormsg+error.message;throw error;
		});
	}
}

function res304(lastmod){
	var res = this;
	var req = this.req;
	res.lastmod = lastmod || res.lastmod;
	if(req.info.modsince && (new Date(req.info.modsince)).getTime() === res.lastmod.getTime()){
		res.writeHead(304, 'Not Modified'); res.end();
		return true;
	}
	return false;
	//If-None-Match + eTag
	//var eTag = "Cookietag";
	//res.setHeader("Etag", '"'+eTag+'"');
}

function resAuth(msg){
	var msg = msg || 'Restricted area, insert your credentials.';
	var res = this;
	res.writeHead (401, 'Not Authorized',{'WWW-Authenticate': 'Basic realm="'+msg+'"'});
	res.end();
}

function resRedirect(location){
	var res = this;
	res.writeHead (301, 'Moved Permanently',{'Location': location});
	res.end();
}

function resHeaders(){
	var res = this;
	var req = this.req;
	/* 
	Expires Gives the date/time after which the response is considered stale 	Expires: Thu, 01 Dec 1994 16:00:00 GMT 	Permanent: standard
	Cache-Control: max-age=3600 seconds
	*/
	/*
	res.setCookie = function(name,value){
		this.setHeader("Set-Cookie", cookie.parse(name,value,{
			path:'/',
			expires: new Date(Date.now()+days*24*60*60*1000),
			//maxAge:60, // seconds
			//domain:'',
			secure: false, // true
			httpOnly: true // false
		}));
	};
	*/
	if(res.encoding!='identity'){
		//res.setHeader("Vary", "Accept-Encoding");
		res.setHeader("Content-Encoding", res.encoding);
	}
	if(!res.lastmod){res.lastmod = new Date();}
	res.setHeader("Last-Modified", res.lastmod.toUTCString());
	res.setHeader("Server", 'Node-JS');
	res.setHeader("X-CPID", req.socket.poolid);
	res.setHeader("Transfer-Encoding", 'chunked');
	res.setHeader("X-Powered-By", 'Pillars-JS');
	res.setHeader("Pragma", 'no-cache');
}
function resSend(data){
	var res = this;
	var req = this.req;
	var body = "";
	// Pre format
	if(isString(data) || isBuffer(data)) {
		res.setHeader("Content-Type", "text/html"); // "text/javascript" // "text/css"
		body = data;
	} else {
		res.setHeader("Content-Type", "application/json");
		body = JSON.stringify(data);
	}
	body = isBuffer(body) ? body : new Buffer(body || "");

	// Enconding
	if(res.encoding!='identity'){
		zlib[res.encoding](body, function (error, body) {
			if(error){
				var errormsg = "Error on encoding response by "+res.encoding+" => ";
				error.message=errormsg+error.message;throw error;
			} else {
				end(body);
			}
		});
	} else {
		end(body);
	}

	function end(body){
		res.resHeaders();
		res.setHeader("Content-Language", 'es_ES');
		res.setHeader("Content-Length", body.length);
		res.end(body);
	}
}







function requestInfo(req){
	var headers = req.headers || {};
	var urlparsed = url.parse(req.url,true,true);
	var info = {
		http: req.httpVersion,
		auth: authParser(headers['authorization'] || false),
		host : headers['host'] || '',
		ua : uaParser(headers['user-agent'] || false),
		accept : acceptsParser(headers['accept'] || false),
		languages : acceptsParser(headers['accept-language'] || false),
		encodings : acceptsParser(headers['accept-encoding'] || false),
		cache: headers['cache-control'] || false,
		referer: headers['referer'] || false,
		connection : headers['connection'] || '',
		path : urlparsed.pathname || '/',
		query : urlparsed.query || {},
		cookie : cookie.parse((headers['cookie'] || '')),
		method : req.method || 'unknow',
		datatype: datatypeParser(headers['content-type'] || false),
		datalength: headers['content-length'] || 0,
		nonematch: headers['if-none-match'] || false,
		modsince: headers['if-modified-since'] || false,
		ranges: rangeParser(headers['range'] || false),
		ifrange: headers['if-range'] || false,
		reqip: req.socket.remoteAddress,
		reqport: req.socket.remotePort,
		poolid: req.socket.poolid,
		getEncoding:getEncoding
	};
	return info;

	function rangeParser(ranges){
		if(!ranges){return false;}
		var ranges = ranges.split('=');
		var unit = ranges[0];
		var start;
		var end;
		if(ranges[1]){
			ranges[1]=ranges[1].split('-');
			if(ranges[1][0]===''){
				return false;
			} else {
				if(ranges[1][0]!=='' && ranges[1][0]>=0){start=parseInt(ranges[1][0]);}
				if(ranges[1][1]!=='' && ranges[1][1]>0){end=parseInt(ranges[1][1]);}
			}
		}
		return {
			unit:unit,
			start:start,
			end:end
		}
	}

	function getEncoding(){
		var all = (this.encodings['*'] && this.encodings['*']>0) || this.encodings == '';
	
		if(
			(all && (!req.info.encodings.deflate || req.info.encodings.deflate>0)) // all valids & no except deflate
			|| (!all && req.info.encodings.deflate && req.info.encodings.deflate>0 // not all valids but deflate is ok & best than gzip
				&& (
					!req.info.encodings.gzip
			 		|| req.info.encodings.deflate>req.info.encodings.gzip
				)
			)
		){
			return 'deflate';
		} else if(
			(all && (!req.info.encodings.gzip || req.info.encodings.gzip>0)) // all valids & no except gzip
			|| (!all && req.info.encodings.gzip && req.info.encodings.gzip>0 // not all valids but gzip is ok & best than identity
				&& (
					!req.info.encodings.identity
			 		|| req.info.encodings.gzip>req.info.encodings.identity
				)
			)
		){
			return 'gzip';
		} else if(all && (!req.info.encodings.identity || req.info.encodings.identity>0)){ // all valids & no except identity
			return 'identity';
		} else {
			return false;
		}
	}

	function datatypeParser(datatype){
		if(datatype){
			var parts = datatype.split(';');
			datatype = {type:parts[0]};
			if(parts[1]){datatype.boundary=parts[1].replace(' boundary=','');}
		}
		return datatype;
	}

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

	function uaParser(ua){
		if(!ua){return false;}
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

	function authParser(auth){
		if(auth){
			auth = (new Buffer(auth.split(' ').pop(), 'base64')).toString().split(':');
			auth = {user:auth[0] || '',pass:auth[1] || ''};
		}
		return auth;
	}
}


