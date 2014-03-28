
var url = require('url');
var util = require('util');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var zlib = require("zlib");
var cookie = require('cookie');
var mime = require('mime');
var colors = require('colors');

var templates = require('./template');
templates.preload('lib/error.jade');

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isArray(ar) {
  return Array.isArray(ar);
}

module.exports = Gangway;
function Gangway(server,req,res){
	var gw = this;
	var headers = req.headers || {};
	var server = server;
	var req = req;
	var res = res;

	gw.timer=Date.now();
	gw.poolid = req.socket.poolid;
	gw.id = gw.timer.toString(36)+Math.round(Math.random()*10).toString(36);
	server.gangways[gw.id] = gw;

	Object.defineProperty(gw, "server", {enumerable: false,configurable: false,writable: false,value:server});
	Object.defineProperty(gw, "socket", {enumerable: false,configurable: false,writable: false,value:req.socket});
	Object.defineProperty(gw, "req", {enumerable: false,configurable: false,writable: false,value:req});
	Object.defineProperty(gw, "res", {enumerable: false,configurable: false,writable: false,value:res});
	gw.res
	.on('timeout',function(){gw.error(408,'Request Timeout');})
	.on('close',close)
	.on('finish',close);

	gw.statusCode = function(code){if(arguments.length==0){return res.statusCode;};res.statusCode=code;}
	gw.setHeader = function(){res.setHeader.apply(res,arguments);};
	gw.writeHead = function(){res.writeHead.apply(res,arguments);};
	gw.write = function(){res.write.apply(res,arguments);};
	gw.end = function(){res.end.apply(res,arguments);};

	gw.prot = req.httpVersion;
	gw.auth = authParser();
	gw.host = headers['host'] || '';
	gw.ua = uaParser();
	gw.accepts = {
		types: acceptsParser(headers['accept'] || false),
		languages: acceptsParser(headers['accept-language'] || false),
		encodings: acceptsParser(headers['accept-encoding'] || false),
	};
	gw.ranges = rangesParser();
	gw.referer = headers['referer'] || false;
	gw.connection = headers['connection'] || '';

	var parsedurl = url.parse(req.url,true,true);
	gw.path = parsedurl.pathname || '/';
	gw.pathMatchs = [];
	gw.query = parsedurl.query || {};
	gw.params = {};
	gw.files = {};
	gw.msgs = [];
	gw.cookie = cookie.parse((headers['cookie'] || ''));
	gw.method = req.method || 'unknow';
	gw.content = contentParser();
	gw.cache = {
		control: headers['cache-control'] || false,
		nonematch: headers['if-none-match'] || false,
		modsince: headers['if-modified-since'] || false
	}
	gw.ip = req.socket.remoteAddress;
	gw.port = req.socket.remotePort;

	gw.encoding = getEncoding();
	//gw.language = getLanguage();
	gw.lastmod = new Date();
	gw.session = false;
	gw.location = false;
	gw.etag = false;
	gw.size = 0;

	function close(){
		saveSession();
		cleanTemp();
		console.log(
			(gw.poolid+' ').grey
			+(gw.method+':').cyan
			+gw.path
			+(' ['+gw.statusCode()+'] ').magenta
			+(gw.size+'bytes ').yellow
			+(parseInt((Date.now()-gw.timer)*100)/100+'ms').yellow
		);
		delete server.gangways[gw.id];
	}

	function cleanTemp(){
		for(var f in gw.files){
			if(isArray(gw.files[f])){
				for(var sf in gw.files[f]){
					if(gw.files[f][sf].path){
						unlinktemp(gw.files[f][sf].path);
						delete gw.files[f][sf];
					}
				}
			} else {
				if(gw.files[f].path){
					unlinktemp(gw.files[f].path);
					delete gw.files[f];
				}
			}			
		}
		function unlinktemp(file){
			fs.unlink(file, function(error){
				if(error){
					console.log((" Fail on delete file ["+file+"]. ").red.inverse.white);
				} else {
					console.log((" Temp file ["+file+"] deleted. ").red.inverse.white);
				}
			});
		}
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

	function contentParser(){
		var type = (headers['content-type'] || false);
		var length = headers['content-length'] || 0;
		var boundary = false;
		if(type){
			var parts = type.split(';');
			type = parts[0];
			if(parts[1]){boundary = parts[1].replace(' boundary=','');}
		}
		return {type:type,length:length,boundary:boundary,params:false};
	}

	function getEncoding(){
		var encodings = gw.accepts.encodings || false;
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
				gw.error(404,'Not Found',error);
			} else if(!gw.cacheck(_stats.mtime)) {
				stats = _stats;
				if(stats.size>20*1024*1024){gw.encoding='identity';}
				if(gw.encoding!='identity'){
					filecname = path+((gw.encoding=='deflate')?".zz":".gz");
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
			var errormsg = "Error on encoding response by "+gw.encoding+" => ";
			var source = fs.createReadStream(path);
			var compressor = (gw.encoding=='deflate')?zlib.createDeflate():zlib.createGzip();
			var compressed = fs.createWriteStream(filecname)
			.on('close',function(){
				fs.stat(filecname, function(error, _cstats){
					if(error){
						error.message=errormsg+error.message;
						gw.error(500,'Internal Server Error',error);
					} else {
						fileStream(filecname,_cstats);
					}
				});
			})
			.on('error',function(error){
				error.message=errormsg+error.message;
				gw.error(500,'Internal Server Error',error);
			});
			source.pipe(compressor).pipe(compressed);
		}

		function fileStream(_path,_stats){
			var _stats = _stats || stats;
			var _path = _path || path;
			var size = _stats.size;
			var start,end,ranges=false;
			var etag = '"'+path+':'+stats.mtime.getTime()+'"';
			if(gw.ranges && ((new Date(gw.ranges.check)).getTime() === stats.mtime.getTime() || gw.ranges.check===etag)){
				ranges = true;
				start = gw.ranges.start;
				end = gw.ranges.end;
			}
			var file = fs.createReadStream(_path,{start: start,end: end}).
			on('open',function(fd){
				gw.size = (end+1 || size)-(start || 0);
				gw.head();
				gw.setHeader("ETag", etag);
				gw.setHeader("Accept-Ranges", 'bytes');
				gw.setHeader("Content-Location", '"'+path+'"');
				gw.setHeader('Content-Disposition', download+'; filename="'+clientname+'"');
				gw.setHeader('Content-type',mime.lookup(path));
				if(ranges){
					gw.setHeader("Content-Range", "bytes "+(start || '0')+"-"+(end || size-1)+"/"+size);
					gw.writeHead(206, 'Partial Content');
				}
				//file.pipe(gw.res);
				/* Slow pipe */
				file.on('data',function(chunk){
					gw.write(chunk);
					if(!file._readableState.ended){
						file.pause();
						setTimeout(function(){file.resume();},2*1000);
					}
				}).on('end',function(){
					gw.end();
				});
				/* */
			}).on('error',function(error){
				var errormsg = "Error on file stream => ";
				error.message=errormsg+error.message;
				gw.error(500,'Internal Server Error',error);
			});
		}
	}

	function newSession(callback){
		var sessions = server.database.collection('sessions');
		sessions.insert({timestamp:Date.now()},function(error, result) {
			if(!error && result[0]){
				gw.cookie.sid = result[0]._id;
				gw.session = result[0];
				callback();
			} else {
				callback(new Error("Error on create new session."));
			}
		});
	}

	function saveSession(){
		var sid = gw.cookie.sid || false;
		if(sid && gw.session){
			var sessions = server.database.collection('sessions');
			sid = new ObjectID.createFromHexString(sid);
			sessions.update({_id:sid},gw.session,function(error, result) {
				if(!error && result>0){
					// Ok
				} else {
					console.log("Error on session save.");
				}
			});
		}
	}

	this.getSession = function(callback){
		if(!server.database) {
			callback(new Error("Not database for session"));
		} else {
			var sid = gw.cookie.sid || false;
			if(!sid){
				newSession(callback);
			} else {
				var sessions = server.database.collection('sessions');
				sid = new ObjectID.createFromHexString(sid);
				sessions.findOne({_id:sid},function(error, result) {
					if(!error && result){
						gw.session = result;
						callback();
					} else {
						callback(new Error("Error on get session."));
					}
				});
			}
		}
	}

	this.cacheck = function(lastmod){
		gw.lastmod = lastmod || gw.lastmod;
		if(gw.cache.modsince && (new Date(gw.cache.modsince)).getTime() === gw.lastmod.getTime()){
			gw.writeHead(304, 'Not Modified'); gw.end();
			return true;
		}
		return false;
		//If-None-Match + eTag
		//var eTag = "Cookietag";
		//res.setHeader("Etag", '"'+eTag+'"');
	}

	this.authenticate = function(msg){
		var msg = msg || 'Restricted area, insert your credentials.';
		gw.writeHead (401, 'Not Authorized',{'WWW-Authenticate': 'Basic realm="'+msg+'"'});
		gw.end();
	}

	this.redirect = function(location){
		var location = location || 'http://'+gw.server.hostname+'/';
		gw.writeHead (301, 'Moved Permanently',{'Location': location});
		gw.end();
	}

	this.head = function(){
		if(gw.session){
			gw.setHeader("Set-Cookie", cookie.serialize('sid',gw.cookie.sid,{
				path:'/',
				expires: new Date(Date.now()+2*24*60*60*1000),
				//maxAge:60, // seconds
				//domain:'',
				secure: false, // true
				httpOnly: true // false
			}));
		}
		if(gw.encoding!='identity'){
			gw.setHeader("Vary", "Accept-Encoding");
			gw.setHeader("Content-Encoding", gw.encoding);
		}
		gw.setHeader("Content-Length", gw.size);
		if(!gw.lastmod){gw.lastmod = new Date();}
		gw.setHeader("Last-Modified", gw.lastmod.toUTCString());
		// Expires + Cache-Control
		gw.setHeader("Server", 'Node-JS');
		gw.setHeader("X-CPID", gw.socket.poolid);
		gw.setHeader("Transfer-Encoding", 'chunked');
		gw.setHeader("X-Powered-By", 'Pillars-JS');
		gw.setHeader("Pragma", 'no-cache');
	}


	this.render = function(_locals){ 
		var locals = {
			title: gw.pillar.getTitle()+" - "+(_locals.h1 || 'unknow'),
			template: gw.beam.getConfig().template,
			msgs:gw.msgs,
			pillar:gw.pillar,
			beam:gw.beam,
			fieldidr:fieldIdr,
			util:util
		};
		for(var v in _locals){locals[v] = _locals[v];}
		var body = templates.render(gw.pillar.getTemplate(),locals);
		gw.send(body);
	}
	this.send = function(data){
		var body = "";
		// Pre format
		if(isString(data) || isBuffer(data)) {
			gw.setHeader("Content-Type", "text/html"); // "text/javascript" // "text/css"
			body = data;
		} else {
			gw.setHeader("Content-Type", "application/json");
			body = JSON.stringify(data);
		}
		body = isBuffer(body) ? body : new Buffer(body || "");

		// Enconding
		if(gw.encoding!='identity'){
			zlib[gw.encoding](body, function (error, body) {
				if(error){
					var errormsg = "Error on encoding response by "+gw.encoding+" => ";
					error.message=errormsg+error.message;
					gw.encoding='identity';
					gw.error(500,'Internal Server Error',error);
				} else {
					end(body);
				}
			});
		} else {
			end(body);
		}

		function end(body){
			gw.size = body.length;
			gw.head();
			gw.setHeader("Content-Language", 'es_ES');
			gw.end(body);
		}
	}

	this.error = function(code,explain,data){
		gw.statusCode(code);
		if(util.isError(data)){
			body = templates.render('./lib/error.jade',{
				title:explain,
				h1:'Error '+code+' '+explain,
				error:util.format(data),
				stack:data.stack.toString()
			});	
		} else {
			body = templates.render('./lib/error.jade',{
				title:explain,
				h1:'Error '+code+' '+explain
			});		
		}
		gw.send(body);
	}
}

function fieldIdr(id){
	if(!name){return "";}
	var name = name.replace('][','_');
	name = name.replace('[','_');
	name = name.replace(']','');
	return name;
}