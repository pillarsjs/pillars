
var util = require('util');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var zlib = require("zlib");
var cookie = require('cookie');
var mime = require('mime');
var querystring = require('querystring');
var formidable = require('formidable');

var templates = require('./templates').preload('templates/error.jade');

module.exports = Gangway;
function Gangway(server,req,res){
	var gw = this;
	gw.timer = Date.now();
	gw.id = gw.timer.toString(36)+Math.round(Math.random()*10).toString(36);
	server.gangways[gw.id] = gw;

	Object.defineProperty(gw,"poolid",{
		enumerable : true,
		get : function(){return req.socket.poolid;}
	});
	Object.defineProperty(gw, "server", {
		enumerable : true,
		get : function(){return server;}
	});
	Object.defineProperty(gw, "textualization", {
		enumerable : true,
		get : function(){return server.textualization;}
	});
	Object.defineProperty(gw, "socket", {
		enumerable : true,
		get : function(){return req.socket;}
	});
	Object.defineProperty(gw, "req", {
		enumerable : true,
		get : function(){return req;}
	});
	Object.defineProperty(gw, "res", {
		enumerable : true,
		get : function(){return res;}
	});

	gw.res
	.on('timeout',function(){gw.error(408);})
	.on('close',function(){gw.close();})
	.on('finish',function(){gw.close();});

	gw.writeContinue = function(){return res.writeContinue.call(res);}
	gw.writeHead = function(statuscode,phrase,headers){if(!gw.headersSent){return res.writeHead.call(res,statuscode,phrase,headers);}}
	gw.setHeader = function(name,value){if(!gw.headersSent){return res.setHeader.call(res,name,value);}}
	gw.getHeader = function(name){return res.getHeader.call(res,name);}
	gw.removeHeader = function(name){return res.removeHeader.call(res,name);}
	gw.addTrailers = function(headers){return res.addTrailers.call(res,headers);}
	gw.write = function(chunk,encoding){return res.write.call(res,chunk,encoding);}
	gw.end = function(data,encoding){return res.end.call(res,data,encoding);}
	//res.setTimeout(msecs, callback);
	//res.sendDate
	Object.defineProperty(gw,"statusCode",{
		enumerable : true,
		get : function(){return res.statusCode;},
		set : function(set){res.statusCode = set;}
	});
	Object.defineProperty(gw,"headersSent",{
		enumerable : true,
		get : function(){return res.headersSent;},
	});

	gw.accepts = acceptsParser(req);
	gw.content = contentParser(req);
	gw.ranges = rangesParser(req);
	gw.cookie = cookie.parse((req.headers['cookie'] || ''));
	gw.auth = authParser(req);
	gw.ua = uaParser(req);

	gw.ip = req.socket.remoteAddress;
	gw.port = req.socket.remotePort;
	gw.prot = req.httpVersion;
	gw.host = req.headers['host'] || '';
	gw.method = req.method || 'unknow';
	gw.path = req.url.replace(/\?.*$/i,'');
	gw.originalPath = gw.path;
	gw.query = ((req.url.indexOf("?")>=0 && querystring.parse(req.url.substr(req.url.indexOf("?")+1))) || {});
	gw.params = queryHeap(gw.query);
	gw.files = {};
	gw.msgs = [];
	gw.validations = {};
	gw.session = false;
	gw.user = false;
	gw.keys = [];

	Object.defineProperty(gw,"route",{
		enumerable : true,
		get : function(){return gw.method+'+'+'http://'+gw.host+gw.path;},
	});

	gw.size = 0;
	gw.language = gw.getLanguage();
	gw.t12n = function(text,params){return gw.textualization.t12n(text,params,gw.language);}
	gw.t12nc = function(text,params){return gw.textualization.t12nc(text,params,gw.language);}
	gw.encoding = getEncoding(gw.accepts.encodings || false);
	gw.location = false;
	gw.referer = req.headers['referer'] || false;
	gw.connection = req.headers['connection'] || false;
	gw.lastmod = new Date();
	gw.etag = false;
	gw.cache = {
		control: req.headers['cache-control'] || false,
		nonematch: req.headers['if-none-match'] || false,
		modsince: req.headers['if-modified-since'] || false
	}
}





/* Methods */

Gangway.prototype.getLanguage = function(){
	var gw = this;
	if(gw.textualization && gw.textualization.langs.length>0){
		var locale = gw.textualization.langs[0];
		if(gw.textualization.langs.length>1){
			var langpath = new RegExp('^\\/('+gw.textualization.langs.slice(1).join('|')+')','i');
			if(langpath.test(gw.path)){
				locale = langpath.exec(gw.path).slice(1).shift();
				gw.path = gw.path.replace("/"+locale,"");
				return locale;
			}
		}
		return locale;
	}
	return false;
}

Gangway.prototype.close = function(){
	var gw = this;
	gw.saveSession();
	gw.cleanTemp();
	console.log(gw.t12n('gangway.close',{
		poolid:gw.poolid,
		id:gw.id,
		method:gw.method,
		path:gw.originalPath,
		code:gw.statusCode,
		size:gw.size,
		timer:parseInt((Date.now()-gw.timer)*100)/100}
	));
	delete gw.server.gangways[gw.id];
}

Gangway.prototype.cleanTemp = function(){
	var gw = this;
	for(var f in gw.files){
		if(isArray(gw.files[f])){
			for(var sf in gw.files[f]){
				if(gw.files[f][sf].path){
					unlinktemp(gw.files[f][sf]);
					delete gw.files[f][sf];
				}
			}
		} else {
			if(gw.files[f].path){
				unlinktemp(gw.files[f]);
				delete gw.files[f];
			}
		}			
	}
	function unlinktemp(file){
		if(!file.moved){
			fs.unlink(file.path, function(error){
				if(error){
					console.log(gw.t12n('gangway.unlinktemp.error',{file:file.path}));
				} else {
					console.log(gw.t12n('gangway.unlinktemp.ok',{file:file.path}));
				}
			});
		}
	}
}

Gangway.prototype.newSession = function(callback){
	var gw = this;
	var sessions = gw.server.database.collection('sessions');
	var key = gw.timer.toString(36)+Math.round(Math.random()*10).toString(36);
	sessions.insert({timestamp:(new Date()),lastaccess:(new Date()),key:key},function(error, result) {
		if(!error && result[0]){
			gw.cookie.sid = result[0]._id.toString();
			gw.cookie.key = key;
			gw.session = {};
			callback();
		} else {
			callback(new Error(gw.t12n('gangway.session.insert-error')));
		}
	});
}

Gangway.prototype.saveSession = function(){
	var gw = this;
	var sid = gw.cookie.sid || false;
	if(sid && gw.session){
		var sessions = gw.server.database.collection('sessions');
		if(/^[a-f0-9]{24}$/i.test(sid)){sid = new ObjectID.createFromHexString(sid);}
		sessions.update({_id:sid},{$set:{session:gw.session,lastaccess:(new Date())}},function(error, result) {
			if(!error && result>0){
				// Ok
			} else {
				// Save lost session in memory if error on save?
				console.log(gw.t12n('gangway.session.update-error'),error);
			}
		});
	}
}

Gangway.prototype.getSession = function(callback){
	var gw = this;
	if(!gw.server.database) {
		callback(new Error(gw.t12n('gangway.session.database-error')));
	} else {
		var sid = gw.cookie.sid || false;
		var key = gw.cookie.key || false;
		if(!sid || !key){
			gw.newSession(callback);
		} else {
			var sessions = gw.server.database.collection('sessions');
			if(/^[a-f0-9]{24}$/i.test(sid)){sid = new ObjectID.createFromHexString(sid);}
			sessions.findOne({_id:sid,key:key},function(error, result) {
				if(!error && result){
					gw.session = result.session;
					if(gw.session.user){
						gw.setUser(gw.session.user,function(user){
							if(!user){delete gw.session.user;}
							callback();
						});
					} else {
						callback();
					}
				} else {
					gw.newSession(callback);
				}
			});
		}
	}
}

Gangway.prototype.setUser = function(_id,callback){
	var gw = this;
	var users = gw.server.database.collection('users');
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	users.findOne({_id:_id},function(error, result) {
		if(!error && result){
			gw.user = result;
			gw.getKeys();
		}
		callback(gw.user);
	});			
}

Gangway.prototype.getKeys = function(){
	var gw = this;
	if(typeof gw.user.keys === "string"){gw.keys = gw.user.keys.split(',');}
}

Gangway.prototype.can = function(keys){
	var gw = this;
	if(!isString(keys)){var keys = [keys];}
	for(var i in keys){
		if(gw.keys.indexOf(keys[i])>=0){
			return true;
		}
	}
	return false;
}

Gangway.prototype.readContents = function(callback,upload){
	var gw = this;
	if(gw.content.type=='application/x-www-form-urlencoded'){
		gw.content.params = '';
		gw.req.on('readable', function() {
			var chunk;
			var readlength = 0;
			while (null !== (chunk = gw.req.read())) {
				readlength+=chunk.length;
				if(readlength>gw.content.length){
					gw.error(400);
					return;
				} else {
					gw.content.params += chunk.toString('ascii');
				}
			}
			gw.content.params = queryHeap(querystring.parse(gw.content.params, '&', '=')); //,{ maxKeys: 1000 } // default
			for(var v in gw.content.params){gw.params[v] = gw.content.params[v];}
			callback(gw);
		});

	} else if(gw.content.type=='multipart/form-data' && gw.content.boundary){
		if(!upload){
			gw.error(400);
		} else {
			var upload = new formidable.IncomingForm();
			var files = {};
			var fields = {};

			upload.uploadDir = "temp";
			upload.keepExtensions = true;
			upload.onPart = function(part) {
				if (part.filename!="") {
					upload.handlePart(part);
				}
			}
			upload
			/*
			.on('progress', function(bytesReceived, bytesExpected) {
				var percent_complete = (bytesReceived / bytesExpected) * 100;
				console.log(Math.round(percent_complete));
			})
			*/
			.on('error', function(error) {gw.error(500,error);})
			.on('field', function(field, value) {
				if(fields[field]){
					if(!isArray(fields[field])){fields[field]=[fields[field]];}
					fields[field].push(value);
				} else {
					fields[field]=value;
				}
			})
			.on('file', function(field, file) {
				if(fields[field]){
					if(!isArray(fields[field])){fields[field]=[fields[field]];}
					fields[field].push(file);
				} else {
					fields[field]=file;
				}
				if(files[field]){
					if(!isArray(files[field])){files[field]=[files[field]];}
					files[field].push(file);
				} else {
					files[field]=file;
				}
			})
			.on('end', function() {
				fields = queryHeap(fields);
				for(var v in fields){gw.params[v] = fields[v];}
				gw.files = files;
				callback(gw);
			});
			upload.parse(gw.req);
		}
	} else {
		callback(gw);
	}

}

Gangway.prototype.file = function(path,clientname,download){
	var gw = this;
	if(gw.res.finished){return false;}
	var filename = path.replace(/^.*[\\\/]/,'');
	var filepath = path.replace(/[^\\\/]*$/,'');
	var filecname = false;
	var clientname = clientname || filename;
	var download = download?'attachment':'inline';
	var stats;

	fs.stat(path, function(error, _stats){
		if(error){
			gw.error(404,error);
		} else if(!gw.cacheck(_stats.mtime)) {
			stats = _stats;
			if(stats.size>20*1024*1024){gw.encoding='identity';}
			if(gw.encoding!='identity'){
				//filecname = path+((gw.encoding=='deflate')?".zz":".gz");
				filecname = filepath+'.'+filename+((gw.encoding=='deflate')?".zz":".gz");
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
		var source = fs.createReadStream(path);
		var compressor = (gw.encoding=='deflate')?zlib.createDeflate():zlib.createGzip();
		var compressed = fs.createWriteStream(filecname)
		.on('close',function(){
			fs.stat(filecname, function(error, _cstats){
				if(error){
					gw.error(500,error);
				} else {
					fileStream(filecname,_cstats);
				}
			});
		})
		.on('error',function(error){
			gw.error(500,error);
		});
		source.pipe(compressor).pipe(compressed);
	}

	function fileStream(_path,_stats){
		if(gw.res.finished){return false;}
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
			gw.setHeader('Content-type',mime.lookup(clientname));
			if(ranges){
				gw.setHeader("Content-Range", "bytes "+(start || '0')+"-"+(end || size-1)+"/"+size);
				gw.writeHead(206, 'Partial Content');
			}
			file.pipe(gw.res);
			/* Slow pipe *
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
			gw.error(500,error);
		});
	}
}

Gangway.prototype.cacheck = function(lastmod){
	var gw = this;
	gw.lastmod = lastmod || gw.lastmod;
	if(gw.cache.modsince && (new Date(gw.cache.modsince)).getTime() === gw.lastmod.getTime()){
		gw.writeHead(304, 'Not Modified');gw.end();
		return true;
	}
	return false;
	//If-None-Match + eTag
	//var eTag = "Cookietag";
	//res.setHeader("Etag", '"'+eTag+'"');
}

Gangway.prototype.authenticate = function(msg){
	var gw = this;
	var msg = msg || 'Restricted area, insert your credentials.';
	gw.writeHead (401, 'Not Authorized',{'WWW-Authenticate': 'Basic realm="'+msg+'"'});
	gw.end();
}

Gangway.prototype.redirect = function(location){
	var gw = this;
	var location = location || 'http://'+gw.server.hostname+'/';
	gw.writeHead (301, 'Moved Permanently',{'Location': location});
	gw.end();
}

Gangway.prototype.head = function(){

/*  res.setHeader(
                'Access-Control-Allow-Origin',
                options.accessControl.allowOrigin
            );
            res.setHeader(
                'Access-Control-Allow-Methods',
                options.accessControl.allowMethods
            );
            res.setHeader(
                'Access-Control-Allow-Headers',
                options.accessControl.allowHeaders
            ); */

	var gw = this;
	var sessionCookies = ['sid','key'];
	var cookiesSeconds = 365*24*60*60;
	var cookieSet = [];
	for(var i in sessionCookies){
		var cookievar = sessionCookies[i];
		if(gw.cookie[cookievar]){
			cookieSet.push(cookie.serialize(cookievar,gw.cookie[cookievar],{
				path:'/',
				expires: new Date(Date.now()+cookiesSeconds*1000),
				maxAge: cookiesSeconds,
				domain: gw.host.replace(/:.*$/,''),
				secure: false, // true if https.
				httpOnly: true
			}));
		}
	}
	if(cookieSet.length>0){gw.setHeader("Set-Cookie", cookieSet);}
	if(gw.encoding!='identity'){
		gw.setHeader("Vary", "Accept-Encoding");
		gw.setHeader("Content-Encoding", gw.encoding);
	}
	gw.setHeader("Content-Length", gw.size);
	if(!gw.lastmod){gw.lastmod = new Date();}
	gw.setHeader("Last-Modified", gw.lastmod.toUTCString());
	// Expires + Cache-Control
	if(gw.language){
		gw.setHeader("Content-Language", gw.language);
	}
	gw.setHeader("Server", 'Node-JS');
	gw.setHeader("X-CPID", gw.socket.poolid);
	if(gw.user){gw.setHeader("X-UID", gw.user._id);}
	gw.setHeader("Transfer-Encoding", 'chunked');
	gw.setHeader("X-Powered-By", 'Pillars-JS');
	gw.setHeader("Pragma", 'no-cache');
}

Gangway.prototype.send = function(data){
	var gw = this;
	if(gw.res.finished){return false;}
	var body = "";

	if(isString(data) || isBuffer(data)) {
		gw.setHeader("Content-Type", "text/html");
		body = data;
	} else {
		gw.setHeader("Content-Type", "application/json");
		body = JSON.stringify(data);
	}
	body = isBuffer(body) ? body : new Buffer(body || "");

	if(gw.encoding!='identity'){
		zlib[gw.encoding](body, function (error, body) {
			if(error){
				gw.encoding='identity';
				gw.error(500,error);
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
		gw.end(body);
	}
}

Gangway.prototype.render = function(template,locals){
	var gw = this;
	var locals = locals || {};
	locals.gw = gw;
	locals.t12n = function(){return gw.t12n.apply(gw,arguments);};
	locals.t12nc = function(){return gw.t12nc.apply(gw,arguments);};
	locals.util = util;

	var body = templates.render(template,locals);
	gw.send(body);
}

Gangway.prototype.error = function(code,data){
	var gw = this;
	gw.statusCode = code;
	var explain = gw.t12n('statusCodes',{code:code});
	var h1 = gw.t12n('gangway.error.h1',{code:code,explain:explain});
	if(data){console.log(data,data.stack);}
	if(util.isError(data)){
		gw.render('templates/error.jade',{
			title:explain,
			h1:h1,
			error:util.format(data),
			stack:data.stack.toString()
		});
	} else {
		gw.render('templates/error.jade',{
			title:explain,
			h1:h1
		});		
	}
}





/* Parsers */

function acceptsParser(req){
	return {
		types: parser(req.headers['accept'] || false),
		languages: parser(req.headers['accept-language'] || false),
		encodings: parser(req.headers['accept-encoding'] || false)	
	}
	function parser(accepts){
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
}

function contentParser(req){
	var type = req.headers['content-type'] || false;
	var length = req.headers['content-length'] || 0;
	var boundary = false;
	if(type){
		var parts = type.split(';');
		type = parts[0];
		if(parts[1]){boundary = parts[1].replace(' boundary=','');}
	}
	return {type:type,length:length,boundary:boundary,params:false};
}

function rangesParser(req){
	var range = req.headers['range'] || false;
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
		check: req.headers['if-range'] || false,
		unit:unit,
		start:start,
		end:end
	}
}

function authParser(req){
	var auth = req.headers['authorization'] || false;
	if(auth){
		auth = (new Buffer(auth.split(' ').pop(), 'base64')).toString().split(':');
		auth = {user:auth[0] || '',pass:auth[1] || ''};
	}
	return auth;
}

function uaParser(req){
	var ua  = req.headers['user-agent'] || false;
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

function getEncoding(encodings){
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

function queryHeap(query){
	var result = {};
	for(var i in query){
		if(/^[^\[\]]+(\[[^\[\]]*\])+$/i.test(i)){
			result = merge(result,i.split(/\[|\]\[|\]/ig).slice(0,-1),query[i]);
		} else {
			result[i]=query[i];
		}
	}
	function merge(o,m,v){
		if(m.length>1){
			var im = m.splice(0,1).toString();
			if(im==''){im=Object.keys(o).length;}
			if(!o[im]){
				o[im]={};
			}
			merge(o[im],m,v);
		} else {
			o[m[0]]=v;
		}
		return o;
	}
	return result;
}





/* Util */

function isString(arg) {
	return typeof arg === 'string';
}
function isBuffer(arg) {
	return arg instanceof Buffer;
}
function isArray(ar) {
	return Array.isArray(ar);
}