var fs = require('fs');
var Pillar = require('./Pillar');
var Beam = require('./Beam');
var ObjectID = require('mongodb').ObjectID;
var textualization = require('./textualization')
	.load('languages/crud')
;
var renderer = require('./renderer')
	.preload('templates/static.jade')
	.preload('templates/crud.jade')
;

module.exports.directory = directory;
function directory(){
	var gw = this;
	var path = gw.beam.config.directory+(gw.params.path || '');
	fs.stat(path, function(error, stats){
		if(error || (!stats.isFile() && !stats.isDirectory())){
			gw.error(404,error);
		} else if(stats.isDirectory()) {
			fs.readdir(path, function(error,files){
				if(error){
					gw.error(404,error);
				} else {
					gw.render('templates/static.jade',{
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
function apiTemplate(){
	var gw = this;
	gw.render('templates/crud.jade',{schema:gw.beam.config.schema});
}

module.exports.apiList = apiList;
function apiList(){
	var gw = this;
	gw.beam.config.schema.list(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiGet = apiGet;
function apiGet(){
	var gw = this;
	gw.beam.config.schema.one(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiUpdate = apiUpdate;
function apiUpdate(){
	var gw = this;
	gw.beam.config.schema.update(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiInsert = apiInsert;
function apiInsert(){
	var gw = this;
	gw.beam.config.schema.insert(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiRemove = apiRemove;
function apiRemove(){
	var gw = this;
	gw.beam.config.schema.remove(gw,gw.params,function(result){
		gw.send(result);
	});
}

module.exports.apiFiles = apiFiles;
function apiFiles(){
	var gw = this;
	var path = gw.params.path || '';
	var schema = gw.beam.config.schema;
	var pathfs = './uploads/'+schema.id+path;
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