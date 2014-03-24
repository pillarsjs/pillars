
var jade = require('jade');
var util = require('util');
var fs = require('fs');

var http = require('http');
var url = require('url');
var util = require('util');
var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var zlib = require("zlib");
var formidable = require('formidable');
var cookie = require('cookie');
var mime = require('mime'); 


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

var template = new Template('./pillars.jade');
module.exports.Fields = new Fields();
module.exports.Pillars = new Pillars();
module.exports.Template = Template;
module.exports.template = template;
module.exports.Render = Render;
module.exports.formwork = formwork;
module.exports.Gangway = Gangway;

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

function Fields(){

	var PF = this;

	/*
	function fieldNmr(id){
		if(!name){return "";}
		var name = name.replace('][','_');
		name = name.replace('[','_');
		name = name.replace(']','');
		return name;
	}
	*/

	function fieldIdr(id){
		if(!name){return "";}
		var name = name.replace('][','_');
		name = name.replace('[','_');
		name = name.replace(']','');
		return name;
	}

	this.Fieldset = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.title = setup.title || '';
		this.details = setup.details || '';
		this.fields = setup.fields || {};
		this.template = 'fieldset';
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getName = function(){
			fieldIdr(this.id);
		}

		this.getter = function(data){
			var data = data || {};
			var result = {};
			for(var name in this.fields){
				result[name] = this.fields[name].getter(data[name]);
			}
			return result;
		};
		this.setter = function(data){
			var data = data || {};
			var result = {};
			for(var name in this.fields){
				result[name] = this.fields[name].setter(data[name]);
			}
			return result;
		};
		this.validate = function(data){
			var data = data || {};
			var result = [];
			for(var name in this.fields){
				var errors = this.fields[name].validate(data[name]);
				if(errors.length>0){
					result.push(new validation(this.fields[name],errors,data[name]));
				}
			}
			return result;
		};
	}

	this.Field = function(setup){
		var setup = setup || {};
		this.id = setup.id || '';
		this.label = setup.label || '';
		this.details = setup.details || '';
		this.template = setup.template || '';
		this.i18n = setup.i18n || false;
		//this.need = setup.need || {};

		this.getId = function(){
			fieldIdr(this.id);
		}

		this.getter = function(data){
			return data;
		};
		this.setter = function(data){
			var data = data || "";
			if(this.i18n){
				var langdata = {};
				for(var l in langlist){
					l = langlist[l];
					langdata[l]=(data[l] || "").toString();
				}
				return langdata;
			} else {
				return data.toString();
			}
		};
		this.validate = function(data){
			var result = [];
			return result;
		};
	}

	this.Fields = {
		Subset:function(setup){
			PF.Field.call(this, setup);
			this.fields = setup.fields || {};
			this.template = 'subset';
			this.getter = function(data){
				var data = data || {};
				var result = {};
				for(var name in this.fields){
					result[name] = this.fields[name].getter(data[name]);
				}
				return result;
			};
			this.setter = function(data){
				var data = data || {};
				var result = {};
				for(var name in this.fields){
					result[name] = this.fields[name].setter(data[name]);
				}
				return result;
			};
			this.validate = function(data){
				var data = data || {};
				var result = [];
				for(var name in this.fields){
					var errors = this.fields[name].validate(data[name]);
					if(errors.length>0){
						result.push(new validation(this.fields[name],errors,data[name]));
					}
				}
				return result;
			};
		},
		Text:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
		},
		Textarea:function(setup){
			PF.Field.call(this, setup);
			this.template = 'textarea';
		},
		Reverse:function(setup){
			PF.Field.call(this, setup);
			this.template = 'text';
			this.getter = function(data){
				var data = data || "";
				return data.split("").slice().reverse().join("");
			};
			this.setter = function(data){
				var data = data || "";
				data = data.toString();
				return data.split("").slice().reverse().join("");
			};
			this.validate = function(data){
				var result = [];
				if(data.length<5){result.push("Debe ser mas largo de 5 caracteres!");}
				return result;
			};
		},
		Select:function(setup){
			PF.Field.call(this, setup);
			this.template = 'select';
			this.values = setup.values || [];
		}

	}
	for(var i in this.Fields){
		this.Fields[i].prototype = new PF.Field();
	}
}

function Pillars(){

	var P = this;

	var beams = {};

	this.Beam = function(_id){
		if(id){var id=_id.toString();} else {var id=Date.now().toString(36);}
		beams[id]=this;
		var beam = this;
		var title = "untitled";
		var database = null;
		var path = '';
		var paths = [];
		var fieldset = null;
		var extensions = {};
		var template = null;
		var t12n = false;
		var t12nSheet = null;
		var t12nLangs = ['en','es'];
		var t12nDefault = ['es'];
		var actions = {};
		
		this.status = function(){
			console.log('Id:',id);
			console.log('Title:',title);
			if(database){console.log('Database:',database.toString())};
			console.log('Path:',path);
			if(fieldset)console.log('Fielset:',fieldset.getId());
			console.log('Extensions:',Object.keys(extensions));
			if(template){
				console.log('Template blocks:',template.blockList());
				console.log('Template cache:',template.cacheList());
			}
			console.log('T12n:',t12n);
			console.log('Actions:',Object.keys(actions));
			console.log('Beams:',Object.keys(beams));
		}
		this.setId = function(_id){
			var _id = _id.toString();
			delete beams[id];
			id = _id;
			beams[id]=beam;
			return beam;
		}
		this.getId = function(){
			return id;
		}
		this.setTitle = function(_title){
			var _title = _title.toString();
			title = _title;
			return beam;
		}
		this.getTitle = function(){
			return title;
		}
		this.setDatabase = function(_database){
			database = _database;
			return beam;
		}
		this.unsetDatabase = function(){
			database = null;
			return beam;
		}
		this.db = function(){
			return database;
		}
		this.setPath = function(_path){
			var _path = _path.toString();
			path = _path;
			return beam;
		}
		this.getPath = function(){
			return path;
		}
		this.pathsRefresh = function(){
			paths = [];
			for(var a in actions){
				paths.push(actions[a].regExp());
			}
		}
		this.setFieldset = function(_fieldset){
			// parse and check etc.
			fieldset = _fieldset;
			return beam;
		}
		this.removeFieldset = function(){
			fieldset = null;
			return beam;
		}
		this.addExtension = function(_extension){
			// parse and check etc.
			extensions[_extension.getId()] = _extension;
			return beam;
		}
		this.removeExtension = function(_id){
			var _id = _id.toString();
			if(extensions[_id]){delete extensions[_id]};
			return beam;
		}
		this.setTemplate = function(_path){
			template = new Template(_path);
			template.view = function(block,req,res,locals){
				var body = render(block,{
					data:locals || {},
					msgs:res.msgs,
					// manejador de rutas
					fieldidr:fieldIdr,
					beam:beam,
					util:util,
					langlist:langlist,
					defaultlang:defaultlang,
					trace:'',//util.format(GLOBAL)
					req:req,
					res:res
				});
				res.send(body);
			}
			return beam;
		}
		this.view = function(_block,_req,_res,_locals){
			if(template.view){return template.view(_block,_req,_res,_locals);}
			return "";
		}
		this.refreshTemplate = function(){
			if(template.refresh){template.refresh();}
			return beam;
		}
		this.setT12n = function(_path){
			// here t12n loading etc...
			t12n = true;
			t12nSheet = _path;
			return beam;
		}
		this.unsetT12n = function(){
			t12n = false;
			t12nSheet = null;
			return beam;
		}
		this.addAction = function(_action){
			actions[_action.getId()]=_action.setBeam(beam);
			return beam;
		}
		this.removeAction = function(_id){
			var _id = _id.toString();
			if(actions[_id]){delete actions[_id];}
			return beam;
		}
	}

	this.Validation = function(field,errors,data){
		this.field = field;
		this.errors = errors;
		this.data = data;
		this.toString = function(){
			return this.field.label+": "+this.errors.join(", ");
		}
	}

	this.Msg = function(msg,type,details,params){
		this.msg = msg;
		this.type = type || "info";
		this.details = details || "";
		this.params = params || {};
		this.toString = function(){
			return '['+this.type+']'+this.msg+': '+this.details;
		}
	}

	this.Action = function(id,router){
		var action = this;
		var beam = null;
		var id = id.toString();
		var methods = [];
		var path = '';
		if(typeof router === "string"){
			methods.push('get');
			path = router;
		} else {
			path = router.pop();
			methods = router;
		}
		var midleware = [];
		for(var a in arguments){midleware.push(arguments[a]);}
		midleware.splice(0,2);
		var handler = midleware.pop();
		var allcalls = midleware.concat(handler);
		this.regExp = function(){

			//"method:path"

			var path = new RegExp("^[a-zA-Z_][a-zA-Z_0-9]*$");
			return action;// a especial format for regular exp check on routes. include method and route.
		}
		this.all = function(req,res,callback){
			var nexting = new Nexting(beam,req,res,allcalls,callback);
			nexting.ini();
		}
		this.single = function(req,res,callback){
			handler.call(beam,req,res,callback);
		}
		this.getId = function(){return id;}
		this.setBeam = function(_beam){beam = _beam;console.log('Action beamed!');return action;}
		this.status = function(){
			console.log('Id:',id);
			console.log('Methods:',methods);
			console.log('Path:',path);
			if(beam)console.log('Beam:',beam.getId());
			console.log('Handler:',handler);
			console.log('Midleware:',midleware);
		}
	}

	this.ActionIds = function(req,res,next){
		var _id = req.params._id || "";
		var checkhexid = /^[a-f0-9]{24}$/;
		if(checkhexid.test(_id)){req.params._id = new ObjectID.createFromHexString(_id);}
		next();
	}

	function Nexting(beam,req,res,midleware,callback){
		var midleware = midleware.slice();
		var callback = callback || false;
		var launch = function(){
			var next = midleware.shift();
			if(next){
				next.call(beam,req,res,launch);
			} else if(callback) {
				callback.call(beam,req,res);
			}
		}
		this.ini = launch;
	}
}

function Template(_path){
	var _path = _path || "";
	var cache = {};
	var blocks = {};

	function load(){
		try {
			var templatefile = fs.readFileSync(_path,'utf8');
			templatefile = templatefile.trim().split("//-//");
			for(var b in templatefile){
				var block = templatefile[b];
				if(block.trim()!=""){
					var head = block.indexOf("\n");
					var name = block.slice(0,head).trim();
					var body = block.slice(head).trim();
					blocks[name] = body;
					console.log('TemplateBlocks['+name+'] from:'+_path);
				}
			}
			caching();
			delete templatefile;
		} catch(error){
			console.log('Can not read template blocks from:'+_path,error);
		}
	}

	this.view = render;
	function render(block,locals,cacheid){
		return Render(cache,blocks,block,locals,cacheid);
	}

	this.blockList = function(){
		return Object.keys(blocks);
	}
	this.cacheList = function(){
		return Object.keys(cache);
	}

	this.refresh = function(){
		cache = {};
		blocks = {};
		load();
	}
	var caching = this.caching = function(){
		for(var b in Object.keys(blocks)){render(Object.keys(blocks)[b]);}
	}

	load();
}

function Render(cache,blocks,block,locals,cacheid){
	var cacheid = cacheid || block;
	if(!locals || !cache[cacheid]){
		if(!blocks[block]){console.log("TemplateBlock["+cacheid+"] no exist");return "";}
		var timetag = 'TemplateCache['+cacheid+']';
		console.time(timetag);
		//return (blocks['includes'] || "")+"\n"+(blocks[block] || "");
		cache[cacheid]=jade.compile((blocks['includes'] || "")+"\n"+(blocks[block] || ""));
		console.timeEnd(timetag);
	}
	if(locals){return cache[cacheid](locals);}
}

function formwork(routes,port,hostname){
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
		new Gangway(server,req,res,routes);
	})
	.listen(port, hostname);

	server.pool = {};
	server.gangways = {};
	server.port = port;
	server.hostname = hostname || '*';
	server.timeout = 120*1000;

	process.on('SIGINT', function() {
		server.close(function() {process.exit(0);});
	});

	server.mongodb = function(dbName,url,port){
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

	return server;
}

function Gangway(server,req,res,router){
	var gw = this;
	var headers = req.headers || {};
	var server = server;
	var req = req;
	var res = res;
	var router = router;

	gw.id = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	server.gangways[gw.id] = gw;

	gw.timer=Date.now();
	gw.server = server;
	gw.socket = req.socket;
	gw.poolid = gw.socket.poolid;
	gw.headers = headers;
	gw.router = router;
	gw.req = req;
	gw.res = res;
	gw.res
	.on('timeout',function(){console.log(' + Response['+gw.poolid+':'+gw.id+'] timeout!');gw.error(408,'Request Timeout');})
	.on('close',function(){saveSession();console.log(' + Response['+gw.poolid+':'+gw.id+'] fail');delete server.gangways[gw.id];})
	.on('finish',function(){saveSession();console.log(' + Response['+gw.poolid+':'+gw.id+'] end in '+parseInt((Date.now()-gw.timer)*100)/100+'ms');delete server.gangways[gw.id];});

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

	gw.url = url.parse(req.url,true,true);
	gw.path = gw.url.pathname || '/';
	gw.query = gw.url.query || {};
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
		return {type:type,length:length,boundary:boundary};
	}

	function newSession(callback){
		var sessions = server.database.collection('sessions');
		sessions.insert({timestamp:Date.now()},function(error, result) {
			if(!error && result[0]){
				gw.cookie.sid = result[0]._id;
				gw.session = result[0];	
			} else {
				console.log("Error on create new session.");
			}
			callback();
		});
	}

	function getSession(callback){
		var sid = gw.cookie.sid || false;
		var sessions = server.database.collection('sessions');
		if(!sid){
			newSession(callback);
		} else {
			sid = new ObjectID.createFromHexString(sid);
			sessions.findOne({_id:sid},function(error, result) {
				if(!error && result){
					gw.session = result;
				} else {
					console.log("Error on get session.");
				}
				callback();
			});
		}
	}

	function saveSession(){
		var sid = gw.cookie.sid || false;
		var sessions = server.database.collection('sessions');
		if(sid){
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
			if(gw.ranges && ((new Date(gw.ranges.check)).getTime() === stats.mtime.getTime() || gw.ranges.check===etag)){
				ranges = true;
				start = gw.ranges.start;
				end = gw.ranges.end;
			}
			var file = fs.createReadStream(_path,{start: start,end: end}).
			on('open',function(fd){
				gw.head();
				gw.setHeader("ETag", etag);
				gw.setHeader("Accept-Ranges", 'bytes');
				gw.setHeader("Content-Location", '"'+path+'"');
				gw.setHeader('Content-Disposition', download+'; filename="'+clientname+'"');
				gw.setHeader("Content-Length", (end+1 || size)-(start || 0));
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
				error.message=errormsg+error.message;throw error;
			});
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
		if(!gw.lastmod){gw.lastmod = new Date();}
		gw.setHeader("Last-Modified", gw.lastmod.toUTCString());
		// Expires + Cache-Control
		gw.setHeader("Server", 'Node-JS');
		gw.setHeader("X-CPID", gw.socket.poolid);
		gw.setHeader("Transfer-Encoding", 'chunked');
		gw.setHeader("X-Powered-By", 'Pillars-JS');
		gw.setHeader("Pragma", 'no-cache');
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
					error.message=errormsg+error.message;throw error;
				} else {
					end(body);
				}
			});
		} else {
			end(body);
		}

		function end(body){
			gw.head();
			gw.setHeader("Content-Language", 'es_ES');
			gw.setHeader("Content-Length", body.length);
			gw.end(body);
		}
	}

	this.error = function(code,explain,data){
		console.log(' + Sending response Error'+code+' '+explain+'!');
		gw.statusCode(code);
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
		gw.send(body);
	}

	function stepup(){
		if(!gw.encoding){
			console.log(' Encoding not aceptable');
			gw.encoding = "identity";
			gw.error(406,'Not Acceptable');
		} else {
			getSession(function(){
				try {
					if(!gw.router()){gw.error(404,'Page not found');}
				} catch(error){
					gw.error(500,'Internal Server Error',error);
				}
			});
		}
	}
	stepup();
}