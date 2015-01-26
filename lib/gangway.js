var textualization = require('./textualization');
var renderer = require('./renderer');

var util = require("util");
var EventEmitter = require("events").EventEmitter;

var paths = require('path');
var fs = require('fs');
var zlib = require("zlib");
var mime = require('mime');
var querystring = require('querystring');

var logger = global.logger.pillars.addGroup('gangway');

var errorsTemplate;
Object.defineProperty(ENV.templates,"error",{
	enumerable : true,
	get : function(){return errorsTemplate;},
	set : function(set){
		if(renderer.preload(set)){
			errorsTemplate = set;
		}
	}
});
ENV.templates.error = ENV.resolve('templates/error.jade');

util.inherits(Gangway, EventEmitter);
module.exports = Gangway;
function Gangway(req,res){
	EventEmitter.call(this);
	var gw = this;

	// ###################################
	// Initialization properties & methods
	// ###################################

	gw.timer = Date.now();
	gw.id = gw.timer.toString(36)+Math.round(Math.random()*10).toString(36);

	gw.closed = false; // closed controller.



	// #######################################
	// Properties & methods alias from req/res
	// #######################################

	Object.defineProperty(gw, "req", {
		enumerable : true,
		get : function(){return req;}
	});
	Object.defineProperty(gw, "res", {
		enumerable : true,
		get : function(){return res;}
	});
	Object.defineProperty(gw, "socket", {
		enumerable : true,
		get : function(){return req.socket;}
	});
	Object.defineProperty(gw,"statusCode",{
		enumerable : true,
		get : function(){return res.statusCode;},
		set : function(set){res.statusCode = set;}
	});
	Object.defineProperty(gw,"headersSent",{
		enumerable : true,
		get : function(){return res.headersSent;},
	});

	gw.setTimeout = function(msecs,callback){return res.setTimeout(msecs, callback);}
	gw.writeContinue = function(){return res.writeContinue.call(res);}
	gw.writeHead = function(statuscode,phrase,headers){if(!gw.headersSent){return res.writeHead.call(res,statuscode,phrase,headers);}}
	gw.setHeader = function(name,value){if(!gw.headersSent){return res.setHeader.call(res,name,value);}}
	gw.getHeader = function(name){return res.getHeader.call(res,name);}
	gw.removeHeader = function(name){return res.removeHeader.call(res,name);}
	gw.addTrailers = function(headers){return res.addTrailers.call(res,headers);}
	gw.write = function(chunk,encoding){return res.write.call(res,chunk,encoding);}
	gw.end = function(data,encoding){return res.end.call(res,data,encoding);}






	// ##############
	// Events control
	// ##############

	res
		.on('timeout',function(){gw.error(408);})
		.on('close',function(){gw.close();})
		.on('finish',function(){gw.close();});
	




	// #########################
	// Request parsed properties
	// #########################

	gw.accepts = acceptsParser(req);
	/* {
		types:[],				// priority sort array of content-types accepts
		languages:[],		// priority sort array of languages accepts
		encodings:[]		// priority sort array of encodings accepts
	} */	
	gw.content = contentParser(req);
	/* {
		type:'',			// contet-type string
		length:'',		// ontent-length
		boundary:'',	// boundary for multipart
		params:{}			// parsed contents params object
	}; */
	gw.ranges = rangesParser(req);
	/* {
		check: true,	// if-range header or true, for entity check control
		unit: '',			// range units string.
		start: 0,			// range start byte/unit
		end: 0				// range end byte/unit
	} */
	gw.cookie = cookieParser((req.headers['cookie'] || '')); // parsed request cookies vars object
	
	gw.auth = authParser(req); // {user:'',pass:''} For http authetication control.
	gw.ua = uaParser(req);
	/* {
		mobile: false,	// Boolean, if 'mobi' string exist.
		os:'',					// OS string or 'unknow'
		engine:'',			// 'Gecko', 'WebKit', 'Presto', 'Trident', 'Blink' or 'unknow'
		browser:''			// 'Firefox', 'Seamonkey', 'Chrome', 'Chromium', 'Safari', 'Opera', 'MSIE' or 'unknow'.
	} */

	gw.origin = req.headers['origin'] || false;
	gw.ip = req.socket.remoteAddress;
	gw.httpVersion = req.httpVersion;
	gw.https = ENV.https || false;
	gw.host = (req.headers['host'] || '').replace(/\:.*$/,'');
	gw.port = parseInt((req.headers['host'] || '80').replace(/^.*\:/,''));
	gw.method = req.method || 'unknow';
	gw.path = req.url.replace(/\?.*$/i,'').replace(/\/*$/i,'');
	gw.originalPath = gw.path;
	gw.query = ((req.url.indexOf("?")>=0 && querystring.parse(req.url.substr(req.url.indexOf("?")+1))) || {});
	gw.referer = req.headers['referer'] || false;
	gw.connection = req.headers['connection'] || false;
	gw.cache = {
		control: req.headers['cache-control'] || false,
		nonematch: req.headers['if-none-match'] || false,
		modsince: req.headers['if-modified-since'] || false
	}






	// ########################
	// Gangway added properties
	// ########################

	gw.files = {}; // Files descriptors from multipart upload.
	gw.pathParams = {}; // Only path params parsed.
	gw.params = queryHeap(gw.query);
	gw.queryHeap = queryHeap;
	
	/*
		All params grouped, query params + post params + path params.
		- only query on: gw.query
		- only post on: gw.content.params
	*/
	gw.data = {}; // Best place for save temp data on gangway.







	// ###############################
	// Response and control properties
	// ###############################

	gw.encoding = getEncoding(gw.accepts.encodings || false); // automatic encoding for response, based on request accepts. deflate,gzip,identity,false.
	gw.language = false; // Language for response.
	gw.responseCookies = []; // parsed cookies packed for send on response.
	gw.cors = { // CORS headers for response.
		origin:false,
		credentials:false,
		methods:false,
		headers:false
	};
	gw.size = 0; // response content-length
	gw.lastmod = new Date(); // response date.
	gw.etag = false; // etag header for response.
}

Gangway.prototype.close = function(){
	// Finish the ganway
	var gw = this;
	if(!gw.closed){
		gw.closed = true;
		gw.emit('close',gw);
		logger.info('close',{
			gw:gw,
			id:gw.id,
			method:gw.method,
			host:gw.host,
			port:gw.port,
			path:gw.originalPath,
			code:gw.statusCode,
			size:gw.size,
			timer:parseInt((Date.now()-gw.timer)*100)/100
		});
		gw.emit('closed',gw);
	}
}

Gangway.prototype.setCookie = function(name,value,config){
	// Save new cookie for send on response.
	var gw = this;
	var config = config || {}; // domain, path, expires, maxAge, secure, httpOnly;
	gw.responseCookies.push(cookieComposer(name,value,config));
}

Gangway.prototype.i18n = function(text,params){
	// Return i18n alias with language preset
	var gw = this;
	return textualization.i18n(text,params,gw.language);
}

Gangway.prototype.file = function(file,clientname,download){
	// Send file, can send with selected name (clientname:'name') and force download (download:true).
	// Automatic byte-range negotiation (allow broken donwloads and streaming), compression (if size<maxZipSize) and cache control.
	var gw = this;
	var path;
	if(typeof file === 'string'){
		path = file;
	} else if(file.path) {
		path = file.path;
	} else {
		return false;
	}
	var filename = path.replace(/^.*[\\\/]/,'');
	var filepath = path.replace(/[^\\\/]*$/,'');
	var filecname = false;
	var clientname = clientname || filename;
	var download = download?'attachment':'inline';
	var stats;

	if(typeof file === 'string'){
		fs.stat(path, function(error, _stats){
			if(error){
				gw.error(404,error);
			} else {
				fileCheck(_stats);
			}
		});
	} else if(file.path) {
		fileCheck(file);
	}

	function fileCheck(_stats){
		if(!gw.cacheck(_stats.mtime)) {
			stats = _stats;
			if(stats.size>ENV.server.maxZipSize){gw.encoding='identity';}
			if(gw.encoding=='deflate' || gw.encoding=='gzip'){
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
	}

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
			})
		;
		source.pipe(compressor).pipe(compressed);
	}

	function fileStream(_path,_stats){
		var _stats = _stats || stats;
		var _path = _path || path;
		var size = _stats.size;
		var start,end,ranges=false;
		var etag = '"'+path+':'+stats.mtime.getTime()+'"';
		if(gw.ranges && ((new Date(gw.ranges.check)).getTime() === stats.mtime.getTime() || gw.ranges.check===etag || gw.ranges.check===true)){
			ranges = true;
			start = gw.ranges.start;
			end = gw.ranges.end;
		}
		var stream = fs.createReadStream(_path,{start: start,end: end})
			.on('open',function(fd){
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
				stream.pipe(gw.res);
				/* Slow pipe *
				stream.on('data',function(chunk){
					gw.write(chunk);
					if(!stream._readableState.ended){
						stream.pause();
						setTimeout(function(){stream.resume();},2*1000);
					}
				}).on('end',function(){
					gw.end();
				});
				/* */
			})
			.on('error',function(error){
				gw.error(500,error);
			})
		;
	}
}

/*
var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({});
Gangway.prototype.proxy = function(target){
	// dirty proxy solution.
	var gw = this;
	var target = target || {};
	target.host = target.host || gw.host;
	target.port = target.port || gw.port;
	target.path = (target.path || '').replace(/^\/|\/$/,'');
	gw.req.url = target.path+((gw.req.url.indexOf("?")>=0 && gw.req.url.substr(gw.req.url.indexOf("?"))) || '');
	gw.req.gw = gw;
	proxy.web(gw.req, gw.res, { target: gw.https?'https':'http'+'://'+target.host+':'+target.port });
}
*/

Gangway.prototype.cacheck = function(lastmod){
	// cache control, set the last modification time of content and check client cache, return true and send 304 or false.
	var gw = this;
	gw.lastmod = lastmod || gw.lastmod;
	if(gw.cache.modsince && (new Date(gw.cache.modsince)).getTime() === gw.lastmod.getTime()){
		gw.writeHead(304, 'Not Modified');
		gw.end();
		return true;
	}
	return false;
	/* Posible option: etag-sessions. control(If-None-Match).setting(eTag).as(Cookietag); */
}

Gangway.prototype.authenticate = function(msg){
	// Send http basic authetication with 'msg' message.
	// Save credentials on gangway.auth
	var gw = this;
	var msg = msg || 'Restricted area, insert your credentials.';
	gw.writeHead (401, 'Not Authorized',{'WWW-Authenticate': 'Basic realm="'+msg+'"'});
	gw.end();
}

Gangway.prototype.redirect = function(location){
	// HTTP Header redirection
	var gw = this;
	var location = location || 'http://'+gw.host+'/';
	gw.writeHead (301, 'Moved Permanently',{'Location': location});
	gw.end();
}

Gangway.prototype.head = function(){
	// Header composer for all responses.
	// Set contet-length, last-modified, cookies, language, cors, server.
	var gw = this;
	gw.emit('head',gw);

	gw.setHeader("Content-Length", gw.size);

	gw.setHeader("Last-Modified", (gw.lastmod || new Date()).toUTCString());
	gw.setHeader("Cache-Control", 'private, max-age=0'); // Expires + Cache-Control, 	private, max-age=0 | no-cache, private
	gw.setHeader("Expires", '-1');

	if(gw.responseCookies.length>0){
		gw.setHeader("Set-Cookie", gw.responseCookies);
	}

	if(gw.language){
		gw.setHeader("Content-Language", gw.language);
	}

	if(gw.encoding!='identity'){
		gw.setHeader("Vary", "Accept-Encoding");
		gw.setHeader("Content-Encoding", gw.encoding);
	}

	//gw.setHeader("Transfer-Encoding", 'chunked');
	//gw.setHeader("Pragma", 'no-cache');

	if(gw.cors.origin){
		gw.setHeader('Access-Control-Allow-Origin',gw.cors.origin);
	}

	if(gw.cors.methods){
		gw.setHeader('Access-Control-Allow-Methods',gw.cors.methods);
	}

	if(gw.cors.headers){
		gw.setHeader('Access-Control-Allow-Headers',gw.cors.headers);
	}

	if(gw.cors.credentials){
		gw.setHeader('Access-Control-Allow-Credentials',gw.cors.credentials);
	}

	gw.setHeader("Server", 'Pillars/'+ENV.version);

	gw.emit('headed',gw);
}

Gangway.prototype.send = function(data,type){
	// Send response, if data is string send as text/html else send as application/json parsed object.
	var gw = this;
	var type = type || "text/html; charset=utf-8;";
	var body;
	if(!data){
		body = '';
	} else if(typeof data === 'string' || data instanceof Buffer) {
		gw.setHeader("Content-Type", type);
		body = data;
	} else {
		gw.setHeader("Content-Type", "application/json");
		body = JSON.stringify(data);
	}
	if(body){body = body instanceof Buffer ? body : new Buffer(body || "");}

	if(body && gw.encoding!='identity'){
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

Gangway.prototype.json = function(data){
	// forced application/json response
	var gw = this;
	gw.send(JSON.stringify(data),"application/json");
}

Gangway.prototype.text = function(data){
	// forced text/plain response
	var gw = this;
	gw.send(data.toString(),"text/plain");
}

Gangway.prototype.html = function(data){
	// forced text/html response
	var gw = this;
	gw.send(data.toString());
}

Gangway.prototype.render = function(template,locals){
	// Set default locals (gw,i18n,util) and render template by Renderer.
	var gw = this;
	var locals = locals || {};
	locals.gw = gw;
	locals.i18n = function(){return gw.i18n.apply(gw,arguments);};
	/*
	locals.paths = paths;
	locals.link = function(path){
		var link = 'http://'+gw.host+':'+gw.port+gw.originalPath+'/';
		return paths.join(link,path);
	}
	*/
	locals.util = util;

	var body = renderer.render(template,locals);
	gw.send(body);
}

Gangway.prototype.error = function(code,error){
	// Compose a generic HTTP error page by code, optional argument Error object for details.
	var gw = this;
	gw.statusCode = code;
	var explain = gw.i18n('pillars.statusCodes',{code:code});
	var h1 = gw.i18n('pillars.gangway.error.h1',{code:code,explain:explain});
	if(util.isError(error)){
		logger.error('error',{gw:gw,error:error});
		gw.render(ENV.templates.error,{
			title:explain,
			h1:h1,
			error:error.toString(),
			stack:error.stack.toString()
		});
	} else {
		gw.render(ENV.templates.error,{
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
	var params = false;
	if(type){
		var parts = type.split(';');
		type = parts[0];
		if(parts[1]){boundary = parts[1].replace(' boundary=','');}
	}

	return {type:type,length:length,boundary:boundary,params:params};
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
		check: req.headers['if-range'] || true,
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
	if(!encodings){return 'identity';}
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

function cookieParser(cookieHeader) {
	var result = {}
	var pairs = cookieHeader.split(/; */);

	for(var p in pairs){
		var pair = pairs[p];
		var i = pair.indexOf('=');
		if(i < 0){ break; }
		var key = pair.substr(0, i).trim()
		var val = pair.substr(++i, pair.length).trim();
		if('"' == val[0]){ val = val.slice(1, -1); }

		if(typeof result[key] === 'undefined'){
			try {
				result[key] = decodeURIComponent(val);
			} catch (e) {
				result[key] = val;
			}
		}
	}
	return result;
}

function cookieComposer(name, value, config){
	var config = config || {};
	var pairs = [name+'='+encodeURIComponent(value)];

	if(config.domain && config.domain!='localhost'){
		pairs.push('Domain=' + config.domain);
	}

	if(typeof config.path === 'undefined'){config.path = '/';}
	if(config.path){
		pairs.push('Path=' + config.path);
	}

	if(config.maxAge && parseInt(config.maxAge)==config.maxAge && (!config.expires || !config.expires.toUTCString)){
		config.expires = new Date(Date.now()+config.maxAge*1000);
	}
	if(config.expires && config.expires.getTime && (!config.maxAge || parseInt(config.maxAge)!=config.maxAge)){
		config.maxAge = (Date.now()-config.expires.getTime())/1000;
	}

	if(config.expires && config.expires.toUTCString){
		pairs.push('Expires=' + config.expires.toUTCString());
	}
	if(config.maxAge && parseInt(config.maxAge)==config.maxAge) {
		pairs.push('Max-Age='+config.maxAge);
	}

	if(config.httpOnly){
		pairs.push('HttpOnly');
	}
	if(config.secure){
		pairs.push('Secure');
	}
	return pairs.join('; ');
}
