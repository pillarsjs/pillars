
var textualization = require('./textualization');
var t12n = textualization.t12n;

var Gangway = require('./Gangway');
var precasts = require('./precasts');

var http = require('http');
var MongoClient = require('mongodb').MongoClient;

var util = require("util");
var EventEmitter = require("events").EventEmitter;

module.exports = App;
util.inherits(App, EventEmitter);
function App(){
	EventEmitter.call(this);
	var app = this;

	var running = false;
	Object.defineProperty(app,"running",{
		enumerable : true,
		get : function(){return running;},
	});

	Object.defineProperty(app,"languages",{
		enumerable : true,
		get : function(){return textualization.langs;},
		set : function(set){
			app.emit("languages",textualization.langs,set);
			textualization.langs = set;
		}
	});

	var database = false;
	Object.defineProperty(app,"database",{
		enumerable : true,
		get : function(){return database;},
		set : function(set){
			var name = false;
			if(typeof set === "string"){
				name = set;
			} else if(set.name) {
				name = set.name;
			}
			if(name){
				var url = set.url || 'localhost';
				var port = set.port || 27017;
				if(database){
					// shutdown;
				}
				MongoClient.connect(
					"mongodb://"+url+":"+port+"/"+name,{
						db:{native_parser:false},
						server: {
							socketOptions: {connectTimeoutMS: 500,auto_reconnect: true}
						},
						replSet: {},
						mongos: {}
					},function(error, db) {
						if(error) {
							console.log(t12n('server.database.connection-error',{name:name,url:url,port:port}),error);
						} else {
							database = db;
							app.emit("database");
							console.log(t12n('server.database.connection-ok',{name:name,url:url,port:port}));
						}
					}
				);
			}
		}
	});


	var server = http.createServer();
	Object.defineProperty(app,"server",{
		enumerable : true,
		get : function(){return server;}
	});
	server.pool = {};
	server.gangways = {};
	server.port;
	server.hostname;
	server.timeout = PILLARS.timeout;

	process.on('SIGINT', function() {
		server.close(function() {
			running = false;
			process.exit(0);
		});
	});

	server
	.on('error',function(error){
		running = false;
		console.log(t12n('server.error',{hostname:server.hostname,port:server.port}),error);
	})
	.on('listening',function(){
		server.timer=Date.now();
		app.emit("start");
		console.log(t12n('server.listening',{hostname:server.hostname,port:server.port}));
	})
	.on('close',function(){
		running = false;
		app.emit("stop");
		console.log(t12n('server.closed',{
			hostname:server.hostname,
			port:server.port,
			timer:parseInt((Date.now()-server.timer)/1000/60*100)/100
		}));
	})
	.on('connection',function(socket){
		socket.poolid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
		server.pool[socket.poolid] = socket;
		socket.timer = Date.now();
		socket.on('close',function(had_error){
			if(PILLARS.requestIds){
				console.log(t12n('server.socket-closed',{
					had_error:had_error,
					poolid:socket.poolid,
					timer:parseInt((Date.now()-socket.timer)/1000/60*100)/100
				}));
			}
			delete server.pool[socket.poolid];
		});
		if(PILLARS.requestIds){
			console.log(t12n('server.socket-open',{poolid:socket.poolid}));
		}
	})
	.on('request',function(req,res){
		router(new Gangway(app,req,res));
	})

	app.start = function(port,hostname){
		if(running){
			app.stop(starter);
		} else {
			starter();
		}
		function starter(){
			running = true;
			server.port = port || 3000;
			server.hostname = hostname || undefined;
			server.listen(server.port, server.hostname);
		}
		return app;
	};

	app.stop = function(callback){
		if(running){
			server.close(function() {
				server.port = undefined;
				server.hostname = undefined;
				if(callback){callback();}
			});
		}
		return app;
	}

	var pillars = {};
	Object.defineProperty(app,"pillars",{
		enumerable : true,
		get : function(){return pillarsOrdered;}
	});

	var pillarsOrdered = [];
	function pillarsOrder(){
		var pillarsArray = [];
		for(var i in pillars){pillarsArray.push(pillars[i]);}
		pillarsOrdered = pillarsArray.sort(function(a,b){
			return a.priority - b.priority || 0;
		});
	}

	app.add = function(pillar){
		if(pillars[pillar.id]){
			app.remove(pillar.id);
		}
		pillar.on('priorityUpdate',pillarsOrder);
		pillar.on('idUpdate',pillarIdChange);
		pillars[pillar.id] = pillar;
		pillarsOrder();
		return app;
	}

	app.get = function(pillarid){
		return pillars[pillarid] || false;
	}

	app.remove = function(pillarid){
		if(pillars[pillarid]){
			pillars[pillarid].removeListener('priorityUpdate', pillarsOrder);
			pillars[pillarid].removeListener('idUpdate',pillarIdChange);
			delete pillars[pillarid];
			pillarsOrder();
		}
		return app;
	}

	function pillarIdChange(oldid,newid){
		if(pillars[oldid] && oldid != newid){
			if(pillars[newid]){
				app.remove(newid);
			}
			pillars[newid] = pillars[oldid];
			delete pillars[oldid];
		}
	}

	Object.defineProperty(app,"routes",{
		enumerable : true,
		get : function(){
			var routes = [];
			for(var ip in app.pillars){
				var pillar = app.pillars[ip];
				routes[ip]={
					pillar:pillar.id,
					host: pillar.config.host,
					path: pillar.config.path,
					beams:[]
				};
				var beams = pillar.beams;
				for(var ib in beams){
					var beam = beams[ib];
					routes[ip].beams.push({
						beam: beam.id,
						method: beam.config.method,
						path: beam.config.path,
						priority: beam.priority
					});
				}
			}
			return routes;
		}
	});

	app
		.add(precasts.pillarsLogin)
		.add(precasts.pillarsStatic)
	;

	var pillarsUsersSchema = new modelator.Schema('users',{
		app : app,
		collection : 'users',
		limit : 5,
		filter : ['_id','user','firstname','lastname'], 
		headers : ['_id','user','firstname','lastname','password']
	})
		.addField('Text','user')
		.addField('Text','firstname')
		.addField('Text','lastname')
		.addField('Text','password')
		.addField('Text','keys')

	var pillarsUsersBackend = new Pillar({
		id:'users',
		path:'/users'
	});
	
	precasts.crudBeams(pillarsUsersBackend,pillarsUsersSchema);

	app.add(pillarsUsersBackend);

}




function router(gw){

	if(textualization.langs.length>0){
		// Language based on request path.
		var locale = textualization.langs[0];
		if(textualization.langs.length>1){
			var langpath = new RegExp('^\\/('+textualization.langs.slice(1).join('|')+')','i');
			if(langpath.test(gw.path)){
				locale = langpath.exec(gw.path).slice(1).shift();
				gw.path = gw.path.replace("/"+locale,"");
			}
		}
		gw.language = locale;
	}

	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406);
	} else {
		if(!checkRoutes(gw)){gw.error(404);}
	}
	function checkRoutes(){
		for(var ip in gw.app.pillars){
			var pillar = gw.app.pillars[ip];
			if(pillar.host.test(gw.host) && pillar.path.test(gw.path)){
				var beams = pillar.beams;
				var beamPath = gw.path.replace(pillar.path,'');
				for(var ib in beams){
					var beam = beams[ib];
					if(beam.method.concat(['OPTIONS','HEAD']).indexOf(gw.method)>=0 && beam.path.test(beamPath)){
						if(gw.method=='OPTIONS' || gw.method=='HEAD'){
							gw.setHeader("Allow", beam.method.concat(['OPTIONS','HEAD']));
							if(beam.origin){
								gw.cors.origin = beam.origin;
								gw.cors.methods = beam.method.concat(['OPTIONS','HEAD']);
							}
							gw.send();
						} else {
							gw.pillar = pillar;
							gw.beam = beam;
							gw.pillarPath = gw.path.match(pillar.path).shift();
							gw.beamPath = beamPath;
							if((gw.beam.session || gw.beam.account) && !gw.session){
								gw.getSession(function(error){
									if(error){
										gw.error(500,error);
									} else {
										beamPrepare();
									}
								});
							} else {
								beamPrepare();
							}
						}
						return true;
					}
				}
			}
		}
		return false;
		function beamPrepare(){
			if(gw.beam.account && !gw.user) {
					gw.error(403);
			} else if(gw.content.length>gw.beam.maxlength){
				gw.error(413);
			} else if(!gw.contentReady) {
				gw.readContents(beamLauncher,gw.beam.upload);
			} else {
				beamLauncher();
			}
		}
		function beamLauncher(){
			var params = gw.beam.params;
			var matches = gw.beamPath.match(gw.beam.path).slice(1);
			for(var i in params){
				var param = params[i];
				gw.pathParams[param] = gw.params[param] = decodeURIComponent(matches[i] || '');
			}
			gw.beam.launch(gw);
		}
	}
}


