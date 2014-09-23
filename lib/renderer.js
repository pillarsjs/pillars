
var t12n = require('./textualization').t12n;
var jade = require('jade');
var fs = require('fs');

module.exports = new Renderer();
function Renderer(){
	var renderer = this;
	var cache = {};

	renderer.refresh = function(){
		var reloads = Object.keys(cache);
		cache = {};
		for(var t in reloads){
			renderer.load(reloads[t]);
		}
		return module.exports;
	}
	renderer.load = function(path){
		try {
			var source = fs.readFileSync(path,'utf8');
			cache[path]=jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
			console.log(t12n('templates.ok',{path:path}));
			delete source;
			return true;
		} catch(error){
			console.log(t12n('templates.error',{path:path}));
			return false;
		}
	}
	renderer.preload = function(path){
		if(!cache[path]){
			renderer.load(path);
		}
		return module.exports;
	}
	renderer.render = function(path,locals){
		if(!PILLARS.templatesCache){delete cache[path];}
		if(cache[path] || renderer.load(path)){
			return cache[path](locals);
		} else if(PILLARS.errorsTemplate && cache[PILLARS.errorsTemplate]){
			locals.h1 = t12n('templates.msg',{path:path});
			return cache[PILLARS.errorsTemplate](locals);
		} else {
			return t12n('templates.msg',{path:path});
		}
	}
}