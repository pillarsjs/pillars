
var jade = require('jade');
var fs = require('fs');

var tiles = new Tiles();
module.exports = tiles;
function Tiles(){
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

	this.load = function(_path){
		try {
			var source = fs.readFileSync(_path,'utf8');
			var timetag = ('TilesCache['+_path+']').cyan;console.time(timetag);
			cache[_path]=jade.compile(source);
			console.timeEnd(timetag);
			delete source;
			return true;
		} catch(error){
			console.log(('Can not read tile from:'+_path).red,error);
			return false;
		}
	}

	this.render = function(_path,locals){
		if(cache[_path] || this.load(path)){
			return cache[_path](locals);
		} else {
			return "";
		}
	}
}