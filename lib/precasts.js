
var Pillar = require('./Pillar');
var Beam = require('./Beam');

var textualization = require('./textualization')
	.load(PILLARS.path('languages/crud'))
;
var renderer = require('./renderer');

var paths = require('path');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;

module.exports.directory = directory;
function directory(gw){
	var path = paths.join(gw.beam.config.directory,(gw.params.path || ''));
	fs.stat(path, function(error, stats){
		if(error || (!stats.isFile() && !stats.isDirectory())){
			gw.error(404,error);
		} else if(stats.isDirectory()) {
			fs.readdir(path, function(error,files){
				if(error){
					gw.error(404,error);
				} else {
					gw.render(PILLARS.path('templates/static.jade'),{
						path:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
						data:files
					});
				}
			});
		} else if(stats.isFile()) {
			gw.file(path);
		}
	});
}

module.exports.crudBeams = crudBeams;
function crudBeams(pillar,schema){
	pillar
	.add(new Beam({id:'template',account:true,schema:schema},apiTemplate))
	.add(new Beam({id:'search',path:'/api',account:true,schema:schema},apiList))
	.add(new Beam({id:'get',path:'/api/:_id',account:true,schema:schema},apiGet))
	.add(new Beam({id:'update',path:'/api/:_id',method:'put',upload:true,account:true,schema:schema},apiUpdate))
	.add(new Beam({id:'insert',path:'/api',method:'post',account:true,schema:schema},apiInsert))
	.add(new Beam({id:'remove',path:'/api/:_id',method:'delete',account:true,schema:schema},apiRemove))
	.add(new Beam({id:'files',path:'/files/*:path',method:'get',account:true,schema:schema},apiFiles))
}

module.exports.apiTemplate = apiTemplate;
function apiTemplate(gw){
	gw.render(PILLARS.path('templates/crud.jade'),{schema:gw.beam.config.schema});
}

module.exports.apiList = apiList;
function apiList(gw){
	gw.beam.config.schema.list(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiGet = apiGet;
function apiGet(gw){
	gw.beam.config.schema.one(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiUpdate = apiUpdate;
function apiUpdate(){
	gw.beam.config.schema.update(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiInsert = apiInsert;
function apiInsert(gw){
	gw.beam.config.schema.insert(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiRemove = apiRemove;
function apiRemove(gw){
	gw.beam.config.schema.remove(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiFiles = apiFiles;
function apiFiles(gw){
	var path = gw.params.path || '';
	var schema = gw.beam.config.schema;
	var pathfs = paths.join(PILLARS.uploadsDirectory,schema.id,path);
	var _id = path.split('/').slice(1,2).shift();
	if(/^[a-f0-9]{24}$/i.test(_id)){_id = new ObjectID.createFromHexString(_id);}
	var field = path.split('/').pop();
	var cols = {};
	cols[field]=1;
	var db = gw.app.database.collection(schema.id);
	db.findOne({_id:_id},cols,function(error, result) {
		if(error){
			gw.error(500,error);
		} else if(!result) {
			gw.error(404);
		} else {
			var search = result;
			var dots = field.split('.');
			var last = dots.pop();
			while(dots.length>0){
				var i = dots.shift();
				if(search[i]){
					search = search[i];
				} else {
					search = false;
					break;
				}
			}
			if(search[last]){
				var file = search[last];
				fs.stat(pathfs, function(error, stats){
					if(error || !stats.isFile()){
						gw.error(404,error);
					} else {
						gw.file(pathfs,file.name);
					}
				});
			} else {
				gw.error(404);
			}
		}
	});
}

module.exports.pillarsLogin = new Pillar({id:'pillarsLogin'})
	.add(new Beam({id:'login',path:'/login',method:'(get|post)',session:true},function(){
		var gw = this;
		var redirect = gw.params.redirect;
		if(typeof gw.params.redirect === 'undefined' && gw.referer){
			redirect = gw.referer;
		}
		console.log(redirect);
		if(typeof gw.params.user === "string" && typeof gw.params.password === "string"){
			var login = {
				user : gw.params.user,
				password : gw.params.password
			};
			var users = gw.app.database.collection('users');
			users.findOne({user:login.user,password:login.password},function(error, result) {
				console.log('login check');
				if(!error && result){
					console.log('login ok');
					gw.session.user = result._id.toString();
					//gw.redirect(redirect);
					gw.render(PILLARS.path('templates/login.jade'),{redirect:redirect,msg:'login.ok'});
				} else {
					gw.render(PILLARS.path('templates/login.jade'),{redirect:redirect,msg:'login.fail'});
				}
			});
		} else {
			gw.render(PILLARS.path('templates/login.jade'),{redirect:redirect});
		}
	}));

module.exports.pillarsStatic = new Pillar({id:'pillarsStatic',path:'/pillars'})
	.add(new Beam({id:'static',path:'/*:path',directory:PILLARS.path('static')},directory))
;