
var http = require('http');
var Gangway = require('./Gangway');
var textualization = require('./t12n');
var MongoClient = require('mongodb').MongoClient;
var colors = require('colors');

module.exports = formwork;
function formwork(port,hostname){
	var port = port || 3000;
	var hostname = hostname || undefined;
	var server = http.createServer()
	.on('error',function(error){
		console.log(server.t12n('server.error',{hostname:server.hostname,port:server.port}).red,error);
	})
	.on('listening',function(){
		server.timer=Date.now();console.log(server.t12n('server.listening',{hostname:server.hostname,port:server.port}).green);
	})
	.on('close',function(){
		console.log(server.t12n('server.closed',{hostname:server.hostname,port:server.port}).red
			+' '+(parseInt((Date.now()-server.timer)/1000/60*100)/100+'m').grey
		);
	})
	.on('connection',function(socket){
		socket.poolid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
		server.pool[socket.poolid] = socket;
		socket.timer = Date.now();
		socket.on('close',function(had_error){
			console.log(server.t12n('server.socket-closed',{had_error:had_error,poolid:socket.poolid}).red
				+' '+(parseInt((Date.now()-socket.timer)/1000/60*100)/100+'m').grey
			);
			delete server.pool[socket.poolid];
		});
		console.log(server.t12n('server.socket-open',{poolid:socket.poolid}).green);
	})
	.on('request',function(req,res){
		router(new Gangway(server,req,res));
	})
	.listen(port, hostname);

	server.pool = {};
	server.gangways = {};
	server.port = port;
	server.hostname = hostname || '*';
	server.timeout = 120*1000;
	server.textualization = textualization;
	server.t12n = function(text,params){
		return server.textualization.t12n(text,params,'pillars');
	}
	server.pillars = {};

	process.on('SIGINT', function() {
		server.close(function() {process.exit(0);});
	});
	return server;
}

http.Server.prototype.mongodb = function(dbname,url,port){
	var server = this;
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
					console.log(server.t12n('server.database.connection-error',{dbname:dbname,url:url,port:port}).red,error);
				} else {
					server.database = db;
					console.log(server.t12n('server.database.connection-ok',{dbname:dbname,url:url,port:port}).green);
				}
			}
		);
	}
	return server;
}

http.Server.prototype.addPillar = function(pillar){
	var server = this;
	pillar.server = server;
	return server;
}

http.Server.prototype.removePillar = function(pillarid){
	var server = this;
	if(server.pillars[pillarid]){server.pillars[pillarid].server=false;}
	return server;
}

http.Server.prototype.getPillar = function(pillarid){
	var server = this;
	if(server.pillars[pillarid]){return server.pillars[pillarid];}
	return false;
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
					gw.beam = pillar.getBeam(beamid);
					gw.render = gw.beam.render;
					gw.link = gw.pillar.link;
					if(gw.content.length>gw.beam.maxlength){
						gw.error(413);
					} else {
						gw.readContents(function(){
							gw.beam.pathparams(gw);
							if(gw.beam.session){
								gw.getSession(function(error){
									if(error){
										gw.error(500,error);
									} else {
										gw.beam.launch(gw);
									}
								});
							} else {
								gw.beam.launch(gw);
							}
						},gw.beam.upload);
					}
					return true;
				}
			}
		}
	}
	return false;
}