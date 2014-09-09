
var textualization = require('./textualization');
var t12n = textualization.t12n;

var Gangway = require('./Gangway');
var precasts = require('./precasts');

var http = require('http');
var MongoClient = require('mongodb').MongoClient;

module.exports = App;
function App(){
	var app = this;

	Object.defineProperty(app,"languages",{
		enumerable : true,
		get : function(){return textualization.langs;},
		set : function(set){
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
							console.log(t12n('server.database.connection-ok',{name:name,url:url,port:port}));
						}
					}
				);
			}
		}
	});

	var server = false;
	Object.defineProperty(app,"server",{
		enumerable : true,
		get : function(){return server;}
	});

	app.start = function(port,hostname){
		var port = port || 3000;
		var hostname = hostname || undefined;
		server = http.createServer();
		server.pool = {};
		server.gangways = {};
		server.port = port;
		server.hostname = hostname || '*';
		server.timeout = 20*1000;

		process.on('SIGINT', function() {
			server.close(function() {process.exit(0);});
		});

		server
		.on('error',function(error){
			console.log(t12n('server.error',{hostname:server.hostname,port:server.port}),error);
		})
		.on('listening',function(){
			server.timer=Date.now();console.log(t12n('server.listening',{hostname:server.hostname,port:server.port}));
		})
		.on('close',function(){
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
				console.log(t12n('server.socket-closed',{
					had_error:had_error,
					poolid:socket.poolid,
					timer:parseInt((Date.now()-socket.timer)/1000/60*100)/100
				}));
				delete server.pool[socket.poolid];
			});
			console.log(t12n('server.socket-open',{poolid:socket.poolid}));
		})
		.on('request',function(req,res){
			router(new Gangway(app,req,res));
		})
		.listen(port, hostname);
	};

	app.stop = function(){
		server.close(function() {server = false;});
	}

	var pillars = {};
	Object.defineProperty(app,"pillars",{
		enumerable : true,
		get : function(){return pillars;}
	});

	app.add = function(pillar){
		pillars[pillar.id] = pillar;
		return app;
	}

	app.remove = function(pillarid){
		if(pillars[pillarid]){delete pillars[pillarid]}
		return app;
	}

	app
		.add(precasts.pillarsLogin)
		.add(precasts.pillarsStatic)
	;

}




function router(gw){
	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406);
	}	else if(gw.textualization.langs.length>0 && !gw.language){
		gw.error(404);
	} else {
		if(!checkRoutes(gw)){gw.error(404);}
	}
	function checkRoutes(){
		for(var pillarid in gw.app.pillars){
			var pillar = gw.app.pillars[pillarid];

			console.log('pillarRoute',{
				gw : {
					host : gw.host,
					path : gw.path
				},
				pillar : {
					host : pillar.host,
					path : pillar.path,
					regexp : pillar.regexp
				},
				compare : {
					host : pillar.host.test(gw.host),
					path : pillar.regexp.test(gw.path)
				}
			});

			if(pillar.host.test(gw.host) && pillar.regexp.test(gw.path)){
				var beams = pillar.beams;
				for(var beamid in beams){
					var beam = beams[beamid];

					console.log('beamRoute',{
						gw : {
							host : gw.method,
							path : gw.path
						},
						pillar : {
							method : beam.method,
							path : beam.path,
							regexp : beam.regexp
						},
						compare : {
							method : beam.method.test(gw.method),
							path : beam.regexp.test(gw.path)
						}
					});

					if(beam.method.test(gw.method) && beam.regexp(gw.path)){
						gw.pillar = pillar;
						gw.beam = beam;
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
			//gw.beam.pathparams(gw);
			gw.beam.launch(gw);
		}
	}
}





