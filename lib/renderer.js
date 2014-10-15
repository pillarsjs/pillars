
var t12n = require('./textualization').t12n;
var fs = require('fs');

module.exports = new Renderer();
function Renderer(){
	var renderer = this;
	var cache = {};
	var engines = {};

	renderer.addEngine = function(ext,compiler){
		engines[ext]=compiler;
	}
	renderer.removeEngine = function(ext){
		if(engines[ext]){delete engines[ext];}
	}

	renderer.refresh = function(){
		var reloads = Object.keys(cache);
		cache = {};
		for(var t in reloads){
			renderer.load(reloads[t]);
		}
		return module.exports;
	}
	renderer.load = function(path){
		var ext = path.replace(/^.*\./,'');
		var engine = engines[ext] || false;
		if(engine){
			try {
				var source = fs.readFileSync(path,'utf8');
				cache[path]=engine(source,path);
				console.log(t12n('templates.ok',{path:path}));
				delete source;
				return true;
			} catch(error){
				console.log(t12n('templates.error',{path:path}));
				return false;
			}
		} else {
			console.log(t12n('templates.unknow-engine',{path:path}));
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

	renderer.addEngine('jade',function compiler(source,path){ // return funtion for render by -> function(locals).
		var jade = require('jade');
		return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
	})
}