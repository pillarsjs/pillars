var EventEmitter = require("events").EventEmitter;
var logger = global.logger.pillars;
var ENV = module.exports = new EventEmitter;

// Configure method
ENV.configure = function(config){
	for(var i in config){
		ENV[i]=config[i];
	}
	return ENV;
}

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
ENV.debug = false;

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
var crypt = {algorithm:'aes-256-ctr',password:'pillars'};
Object.defineProperty(ENV,"crypt",{
	enumerable : true,
	get : function(){return crypt;},
	set : function(set){
		for(var i in set){
			crypt[i]=set[i];
		}
	}
});
crypt.encrypt = function(text){
	var cipher = crypto.createCipher(crypt.algorithm,crypt.password);
	var crypted = cipher.update(text,'utf8','hex');
	crypted += cipher.final('hex');
	return crypted;
};
crypt.decrypt = function(text){
	var decipher = crypto.createDecipher(crypt.algorithm,crypt.password);
	var dec = decipher.update(text,'hex','utf8');
	dec += decipher.final('utf8');
	return dec;
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
	https:false
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
var plugins = {};
Object.defineProperty(ENV,"plugins",{
	enumerable : true,
	get : function(){return pluginsOrdered;}
});

var pluginsOrdered = [];
function pluginsOrder(){
	var list = [];
	for(var i in plugins){list.push(plugins[i]);}
	pluginsOrdered = list.sort(function(a,b){
		return a.priority - b.priority || 0;
	});
}

function pluginsIdChange(oldid,newid){
	if(plugins[oldid] && oldid != newid){
		ENV.removePlugin(newid);
		plugins[newid] = plugins[oldid];
		delete plugins[oldid];
	}
}

ENV.addPlugin = function(child){
	if(child.constructor !== Plugin){
		function Dummy(){};
		Dummy.prototype = Plugin.prototype;
		var d = new Dummy();
		Plugin.apply(d, arguments);
		child = d;
	}
	ENV.removePlugin(child.id);
	child.on('priorityUpdate',pluginsOrder);
	child.on('idUpdate',pluginsIdChange);
	plugins[child.id] = child;
	pluginsOrder();
	return ENV;
}

ENV.getPlugin = function(childId){
	return plugins[childId] || false;
}

ENV.removePlugin = function(childId){
	if(plugins[childId]){
		plugins[childId].removeListener('priorityUpdate', pluginsOrder);
		plugins[childId].removeListener('idUpdate', pluginsIdChange);
		delete plugins[childId];
		pluginsOrder();
	}
	return ENV;
}

// Routes & Status
var routes = {};
Object.defineProperty(ENV,"routes",{
	enumerable : true,
	get : function(){return routesOrdered;}
});

var routesOrdered = [];
function routesOrder(){
	var list = [];
	for(var i in routes){list.push(routes[i]);}
	routesOrdered = list.sort(function(a,b){
		return a.priority - b.priority || 0;
	});
}
function routesIdChange(oldid,newid){
	if(routes[oldid] && oldid != newid){
		ENV.removeRoute(newid);
		routes[newid] = routes[oldid];
		delete routes[oldid];
	}
}

ENV.addRoute = function(child){
	if(child.constructor !== Route){
		function Dummy(){};
		Dummy.prototype = Route.prototype;
		var d = new Dummy();
		Route.apply(d, arguments);
		child = d;
	}
	ENV.removeRoute(child.id);
	child.on('priorityUpdate',routesOrder);
	child.on('idUpdate',routesIdChange);
	routes[child.id] = child;
	routesOrder();
	return ENV;
}

ENV.getRoute = function(childId){
	return routes[childId] || false;
}

ENV.removeRoute = function(childId){
	if(routes[childId]){
		routes[childId].removeListener('priorityUpdate', routesOrder);
		routes[childId].removeListener('idUpdate', routesIdChange);
		delete routes[childId];
		routesOrder();
	}
	return ENV;
}

Object.defineProperty(ENV,"status",{
	enumerable : true,
	get : function(){
		
		var routes = [];
		for(var p in ENV.routes){
			routes.push(routesWalker(ENV.routes[p]));
		}

		var plugins = [];
		for(var p in ENV.plugins){
			plugins.push(pluginsWalker(ENV.plugins[p]));
		}

		function routesWalker(route){
			var result = {
				id: route.id,
				path: '/'+route.path,
				regex: route.pathRegex.toString(),
				params: route.params,
				method: route.method,
				priority: route.priority,
				https: route.https,
				active: route.active
			};
			if(route.routes.length>0){
				result.routes = [];
				for(var p in route.routes){
					result.routes.push(routesWalker(route.routes[p]));
				}
			}
			return result;
		}
		function pluginsWalker(plugin){
			var result = {
				id: plugin.id,
				priority: plugin.priority,
				active: plugin.active
			};
			return result;
		}

		var status = {};
		var ignore = ['routes','plugins','status'];
		for(var param in ENV){
			if(ignore.indexOf(param)<0){
				status[param]=ENV.param;
			}
		}
		status.plugins = plugins;
		status.routes = routes;

		return status;
	}
});

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
}

// Shutdown event
process.on('SIGINT', function() {
	ENV.emit('shutdown');
});

// Gangway event
ENV.on('gangway',function(gw){
	var pluginChain = new Nexting(gw,pluginsOrdered.map(function(e,i){return e.handler;}),function(){
		if(gw.routing && gw.routing.handlers){
			var routeHandlersChain = new Nexting(gw,gw.routing.handlers);
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



