
var http = require('http');
var Gangway = require('./Gangway');
var textualization = require('./textualization');
var MongoClient = require('mongodb').MongoClient;

module.exports = formwork;
function formwork(port,hostname){
	var port = port || 3000;
	var hostname = hostname || undefined;
	var server = http.createServer()
	.on('error',function(error){
		console.log(server.t12n('server.error',{hostname:server.hostname,port:server.port}),error);
	})
	.on('listening',function(){
		server.timer=Date.now();console.log(server.t12n('server.listening',{hostname:server.hostname,port:server.port}));
	})
	.on('close',function(){
		console.log(server.t12n('server.closed',{
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
			console.log(server.t12n('server.socket-closed',{
				had_error:had_error,
				poolid:socket.poolid,
				timer:parseInt((Date.now()-socket.timer)/1000/60*100)/100
			}));
			delete server.pool[socket.poolid];
		});
		console.log(server.t12n('server.socket-open',{poolid:socket.poolid}));
	})
	.on('request',function(req,res){
		router(new Gangway(server,req,res));
	})
	.listen(port, hostname);

	server.pool = {};
	server.gangways = {};
	server.port = port;
	server.hostname = hostname || '*';
	server.timeout = 20*1000;
	server.textualization = textualization;
	server.t12n = function(text,params){return server.textualization.t12n(text,params);};
	server.pillars = {};


	process.on('SIGINT', function() {
		server.close(function() {process.exit(0);});
	});

	server.mongodb = function(dbname,url,port){
		var url = url || 'localhost';
		var port = port || 27017;
		if(!server.database){
			MongoClient.connect(
				"mongodb://"+url+":"+port+"/"+dbname,{
					db:{native_parser:false},
					server: {
						socketOptions: {connectTimeoutMS: 500,auto_reconnect: true}
					},
					replSet: {},
					mongos: {}
				},function(error, db) {
					if(error) {
						console.log(server.t12n('server.database.connection-error',{dbname:dbname,url:url,port:port}),error);
					} else {
						server.database = db;
						console.log(server.t12n('server.database.connection-ok',{dbname:dbname,url:url,port:port}));
					}
				}
			);
		}
		return server;
	}

	server.addPillar = function(pillar){
		pillar.server = server;
		return server;
	}

	server.removePillar = function(pillarid){
		if(server.pillars[pillarid]){server.pillars[pillarid].server=false;}
		return server;
	}

	server.getPillar = function(pillarid){
		if(server.pillars[pillarid]){return server.pillars[pillarid];}
		return false;
	}

	return server;
}


function router(gw){
	if(!gw.encoding){
		gw.encoding = "identity";
		gw.error(406);
	}	else if(!gw.language && gw.textualization.langs.length>0){
		gw.error(404);
	} else {
		if(!checkRoutes(gw)){gw.error(404);}
	}
}

function checkRoutes(gw){
	for(var pillarid in gw.server.pillars){
		var pillar = gw.server.pillars[pillarid];
		var regexp = pillar.regexp;
		if(regexp.test(gw.route)){
			var regexps = pillar.regexps;
			for(var beamid in regexps){
				if(regexps[beamid].test(gw.route)){
					gw.pillar = pillar;
					gw.beam = pillar.beams[beamid];
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
		gw.beam.pathparams(gw);
		gw.beam.launch(gw);
	}
}

