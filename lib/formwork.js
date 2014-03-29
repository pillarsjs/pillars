
var http = require('http');
var router = require('./router');
var Gangway = require('./Gangway');
var MongoClient = require('mongodb').MongoClient;
var colors = require('colors');

module.exports = formwork;
function formwork(port,hostname){
	var port = port || 3000;
	var hostname = hostname || undefined;
	var server = http.createServer()
	.on('error',function(error){
		console.log('Server error:'.red,error);
	})
	.on('listening',function(){
		server.timer=Date.now();console.log(('Server listening on "'+server.hostname+':'+server.port+'"').green);
	})
	.on('close',function(){
		console.log(('Server closed '+parseInt((Date.now()-server.timer)/1000/60*100)/100+'m').red);
	})
	.on('connection',function(socket){
		socket.poolid = Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
		server.pool[socket.poolid] = socket;
		socket.timer = Date.now();
		socket.on('close',function(had_error){
			console.log((socket.poolid+' Closed ').red+(parseInt((Date.now()-socket.timer)/1000/60*100)/100+'m').grey);
			delete server.pool[socket.poolid];
		});
		console.log((socket.poolid+' Open').green);
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
						console.log(('Database "'+dbName+'" connection Error "'+url+':'+port+'"').red,error);
					} else {
						server.database = db;
						console.log(('Database "'+dbName+'" connected "'+url+':'+port+'"').green);
					}
				}
			);
		}
		return server;
	}

	return server;
}