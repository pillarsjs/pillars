
var jade = require('jade');
var fs = require('fs');
var colors = require('colors');
var textualization = require('./textualization');

var cache = {};

module.exports.cacheList = cacheList;
function cacheList(){
	return Object.keys(cache);
}

module.exports.refresh = refresh;
function refresh(){
	var reloads = cacheList();
	cache = {};
	for(var t in reloads){
		load(reloads[t]);
	}
	return module.exports;
}

module.exports.load = load;
function load(path){
	try {
		var source = fs.readFileSync(path,'utf8');
		cache[path]=jade.compile(source,{filename:'./',pretty:true,debug:false,compileDebug:false});
		console.log(textualization.t12n('templates.cache-ok',{path:path},'pillars').magenta);
		delete source;
		return true;
	} catch(error){
		console.log(textualization.t12n('templates.cache-error',{path:path},'pillars').red,error);
		return false;
	}
}

module.exports.preload = preload;
function preload(path){
	if(!cache[path]){
		load(path);
	}
	return module.exports;
}

module.exports.render = render;
function render(path,locals){
	if(cache[path] || load(path)){
		return cache[path](locals);
	} else {
		return "";
	}
}
