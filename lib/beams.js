var fs = require('fs');

module.exports.directory = directory;
function directory(){
	var gw = this;
	var path = gw.beam.config.directory+(gw.params.path || '');
	fs.stat(path, function(error, stats){
		if(error || (!stats.isFile() && !stats.isDirectory())){
			gw.error(404,'Not Found',error);
		} else if(stats.isDirectory()) {
			fs.readdir(path, function(error,files){
				if(error){
					gw.error(404,'Not Found',error);
				} else {
					gw.render({
						h1:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
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

module.exports.apiTemplate = apiTemplate;
function apiTemplate(){
	var gw = this;
	gw.render({
		h1:gw.pillar.title,
		schema:gw.pillar.schema
	});
}

module.exports.apiList = apiList;
function apiList(){
	var gw = this;
	gw.pillar.schema.list(gw,function(result){
		gw.send({
			msgs:gw.msgs,
			validations:gw.validations,
			data:result
		});
	});
}

module.exports.apiGet = apiGet;
function apiGet(){
	var gw = this;
	gw.pillar.schema.one(gw,function(result){
		gw.send({
			msgs:gw.msgs,
			validations:gw.validations,
			data:result
		});
	});
}

module.exports.apiUpdate = apiUpdate;
function apiUpdate(){
	var gw = this;
	gw.pillar.schema.update(gw,function(result){
		gw.send({
			msgs:gw.msgs,
			validations:gw.validations,
			data:result
		});
	});
}

module.exports.apiInsert = apiInsert;
function apiInsert(){
	var gw = this;
	gw.pillar.schema.insert(gw,function(result){
		gw.send({
			msgs:gw.msgs,
			validations:gw.validations,
			data:result
		});
	});
}

module.exports.apiRemove = apiRemove;
function apiRemove(){
	var gw = this;
	gw.pillar.schema.remove(gw,function(result){
		gw.send({
			msgs:gw.msgs,
			validations:gw.validations,
			data:result
		});
	});
}