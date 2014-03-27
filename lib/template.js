
var jade = require('jade');
var fs = require('fs');

var template = new Template();
module.exports = template;
function Template(){
	var cache = {};

	this.cacheList = function(){
		return Object.keys(cache);
	}

	this.refresh = function(){
		var reloads = this.cacheList();
		cache = {};
		for(var t in reloads){
			this.load(reloads[t]);
		}
	}

	this.load = function(path){
		try {
			var source = fs.readFileSync(path,'utf8');
			var timetag = ('TilesCache['+path+']').cyan;console.time(timetag);
			cache[path]=jade.compile(source,{filename:'./'});
			console.timeEnd(timetag);
			delete source;
			return true;
		} catch(error){
			console.log(('Can not read tile from:'+path).red,error);
			return false;
		}
	}

	this.preload = function(path){
		if(!cache[path]){
			this.load(path);
		}
	}

	this.render = function(path,locals){
		if(cache[path] || this.load(path)){
			return cache[path](locals);
		} else {
			return "";
		}
	}
}