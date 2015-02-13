var childManager = require('./childManager');
var decycler = require('./decycler');

var EventEmitter = require("events").EventEmitter;
var logger = Logger.pillars;
var ENV = module.exports = new EventEmitter();

// Configure method
ENV.configure = function(config){
	for(var i in config){
		ENV[i]=config[i];
	}
	return ENV;
};

// Package & version
var pillarsPackage = require('../package');
Object.defineProperty(ENV,"package",{
	enumerable : true,
	get : function(){return pillarsPackage;}
});
Object.defineProperty(ENV,"version",{
	enumerable : true,
	get : function(){return pillarsPackage.version;}
});

// Path & resolve
var resolve = require('path').resolve;
ENV.path = resolve(__dirname,'../');
ENV.resolve = function(path){return resolve(ENV.path,path);};

// Debug
ENV.debug = true;

// Administrator
ENV.administrator=false; //{email,firstname,lastname}

// Languages
textualization.load(ENV.resolve('languages/pillars'));
Object.defineProperty(ENV,"languages",{
	enumerable : true,
	get : function(){return textualization.langs;},
	set : function(set){
		ENV.emit("languages",textualization.langs,set);
		textualization.langs = set;
	}
});

// Directories
var fs = require('fs');
var directories = {};
Object.defineProperty(ENV,"directories",{
	enumerable : true,
	get : function(){return directories;},
	set : function(set){
		for(var i in set){
			directories[i]=set[i];
		}
	}
});

// Templates
var templates = {cache:true};
Object.defineProperty(ENV,"templates",{
	enumerable : true,
	get : function(){return templates;},
	set : function(set){
		for(var i in set){
			templates[i]=set[i];
		}
	}
});

// Crypt
var crypto = require('crypto');
var crypt = {
	crypto:crypto,
	algorithm:'aes-256-ctr',
	password:'pillars'
};
Object.defineProperty(ENV,"crypt",{
	enumerable : true,
	get : function(){return crypt;},
	set : function(set){
		for(var i in set){
			crypt[i]=set[i];
		}
	}
});
crypt.encrypt = function(data,password){
	password = password || crypt.password;
	try {
		data = JSON.stringify(decycler(data));
	} catch(error){
		return false;
	}
	var cipher = crypto.createCipher(crypt.algorithm,password);
	try {
		data = cipher.update(data,'utf8','hex');
		data += cipher.final('hex');
	} catch(error){
		return false;
	}
	return data;
};
crypt.decrypt = function(data,password){
	data = data || '';
	password = password || crypt.password;
	var decipher = crypto.createDecipher(crypt.algorithm,password);
	try {
		data = decipher.update(data,'hex','utf8');
		data += decipher.final('utf8');
	} catch(e){
		return false;
	}
	try {
		data = JSON.parse(data);
	} catch(error){
		return false;
	}
	return data;
};

// SERVER
var http = require('http');
var https = require('https');

global.SERVER = http.createServer();
global.HTTPS = false;

var server = { // SERVER config
	hostname:undefined,
	port:3000,
	timeout:30*1000,
	maxUploadSize:1*1024*1024,
	maxZipSize:5*1024*1024,
	https:false,
	autoreferencia:ENV
};

Object.defineProperty(ENV,"server",{
	enumerable : true,
	get : function(){return server;},
	set : function(set){
		if(set){
			for(var i in set){
				server[i]=set[i];
			}
			ENV.start();
		} else {
			ENV.stop();
		}
	}
});

SERVER.timeout = server.timeout;
SERVER.running = false;

SERVER // SERVER events
.on('error',function(error){
	SERVER.running = false;
	logger.error('server.error',{params:server,error:error});
})
.on('listening',function(){
	SERVER.timer=Date.now();
	ENV.emit("start");
	logger.info('server.listening',{params:server});
})
.on('close',function(){
	SERVER.running = false;
	ENV.emit("stop");
	logger.warn('server.closed',{params:server,timer:parseInt((Date.now()-SERVER.timer)/1000/60*100)/100});
})
.on('request',function(req,res){
	var gw = new Gangway(req,res);
	ENV.emit('gangway',gw);
})

ENV.start = function(params,callback){
	if(typeof params === 'function'){
		var callback = params;
		var params = {};
	}
	if(typeof params === 'string' || typeof params === 'number'){
		var params = {port:parseInt(params)};
	}
	var params = params || {};
	for(var param in server){
		if(typeof params[param] === 'undefined'){params[param]=server[param];}
	}
	if(!params.port){
		var error = new Error('Missing port parameter');
		params.port = undefined;
		logger.error('server.error',{params:params,error:error});
		if(callback){callback(error);}
	} else {
		ENV.stop(function(stopError){
			if(!stopError){
				SERVER.running = true;
				server = params;
				SERVER.timeout = server.timeout;
				SERVER.listen(server.port, server.hostname, function(error){
					if(callback){callback(error);}
				});

				if(params.https){
					params.https.port = params.https.port || 443;
					var optionsHttps = {
						key: params.https.key?fs.readFileSync(params.https.key):undefined,
						cert: params.https.cert?fs.readFileSync(params.https.cert):undefined
					};
					HTTPS = https.createServer(optionsHttps).listen(params.https.port || 443, server.hostname);
					HTTPS.timeout = server.timeout;
					HTTPS.running = false;
					HTTPS
					.on('error',function(error){
						HTTPS.running = false;
						logger.error('https.error',{params:params,error:error});
					})
					.on('listening',function(){
						HTTPS.timer=Date.now();
						ENV.emit("starthttps");
						logger.info('https.listening',{params:params});
					})
					.on('close',function(){
						HTTPS.running = false;
						ENV.emit("stophttps");
						logger.warn('https.closed',{params:params,timer:parseInt((Date.now()-HTTPS.timer)/1000/60*100)/100});
					})
					.on('request',function(req,res){
						var gw = new Gangway(req,res);
						gw.https = true;
						ENV.emit('gangway',gw);
					})

				}

			} else {
				logger.error('server.error',{params:params,error:disconnectError});
				if(callback){callback(disconnectError);}
			}
		});
	}
	return ENV;
};

ENV.stop = function(callback){
	if(SERVER.running){
		SERVER.close(function(error){
			if(callback){callback(error);}
		});
	} else if(callback){
		callback();
	}
	return ENV;
}

ENV.on('shutdown',function(){ // SERVER shutdown
	ENV.stop(function() {
		process.exit(0);
	});
});

// DB
var MongoClient = require('mongodb').MongoClient;
global.DB = false;

var database = { // DB config
	store:'pillars',
	hostname:'localhost',
	port:27017,
	user:false,
	password:false
};

Object.defineProperty(ENV,"database",{
	enumerable : true,
	get : function(){return database;},
	set : function(set){
		for(var i in set){
			database[i]=set[i];
		}
		ENV.connect();
	}
});

ENV.connect = function(params,callback){
	if(typeof params === 'function'){
		var callback = params;
		var params = {};
	}
	if(typeof params === 'string'){
		var params = {store:params};
	}
	var params = params || {};
	for(var param in database){
		if(typeof params[param] === 'undefined'){params[param]=database[param];}
	}
	if(!params.store){
		var error = new Error('Missing store parameter');
		logger.error('db.connect-error',{error:error});
		if(callback){callback(error);}
	} else {
		ENV.disconnect(function(disconnectError){
			if(!disconnectError){
				var url = 'mongodb://';
				if(params.user){
					url+=params.user;
					if(params.password){
						url+=':'+params.password;
					}
					url+='@';
				}
				url+=params.hostname || 'localhost';
				url+= ':'+(params.port || 27017);
				url+='/'+params.store;
				MongoClient.connect(url, function(error, db) {
					if(error) {
						logger.error('db.connect-error',{params:params,url:url,error:error});
					} else {
						database = params;
						DB = db;
						ENV.emit("DB");
						logger.info('db.connect-ok',{params:params,url:url});
					}
					if(callback){callback(error);}
				});
			} else {
				logger.error('db.connect-error',{params:params,error:disconnectError});
				if(callback){callback(disconnectError);}
			}
		});
	}
	return ENV;
}

ENV.disconnect = function(callback){
	if(DB){
		DB.close(function(error) {
			if(!error){
				DB = undefined;
				logger.info('db.disconnect-ok');
			} else {
				logger.error('db.disconnect-error',{error:error});
			}
			if(callback){callback(error);}
		});
	} else if(callback) {
		callback();
	}
	return ENV;
}

// Plugins
ENV.plugins = [];
	ENV.getPlugin = childManager.getChild('plugins');
	ENV.getPluginPosition = childManager.getChildPosition('plugins');
	ENV.addPlugin = childManager.addChild('plugins');
	ENV.removePlugin = childManager.removeChild('plugins');
	ENV.movePlugin = childManager.moveChild('plugins');

// Routes & Status
ENV.routes = [];
	ENV.getRoute = childManager.getChild('routes');
	ENV.getRoutePosition = childManager.getChildPosition('routes');
	ENV.addRoute = childManager.addChild('routes');
	ENV.add = childManager.addChild('routes');
	ENV.removeRoute = childManager.removeChild('routes');
	ENV.moveRoute = childManager.moveChild('routes');

// Add method
ENV.add = function(child){
	if(child.constructor === Route){
		return ENV.addRoute(child);
	} else if(child.constructor === Plugin){
		return ENV.addPlugin(child);
	} else {
		// Incompatible item to add.
	}
	return ENV;
};



Object.defineProperty(ENV,"status",{
	enumerable : false, // [RangeError: Maximum call stack size exceeded] XD
	get : function(){
		return JSON.parse(JSON.stringify(decycler(ENV,10)));
	}
});

// Shutdown event
process.on('SIGINT', function() {
	ENV.emit('shutdown');
});

// Gangway event
ENV.on('gangway',function(gw){
	var pluginChain = new Nexting(gw,ENV.plugins.map(function(e,i){return e.handler;}),function(){
		if(gw.routing && gw.routing.handlers && gw.routing.handlers.length>0){
			var routeHandlersChain = new Nexting(gw,gw.routing.handlers);
		} else {
			gw.error(404);
		}
	});
});

function Nexting(gw,handlers,callback){
	var chain = new Chain();
	for(var i in handlers){
		chain.add(function(handler){
			try {
				handler(gw,chain.next);
			} catch(error){
				gw.error(500,error);
			}
		},handlers[i]);
	}
	if(callback){chain.add(callback);}
	chain.pull();
	return chain;
}



