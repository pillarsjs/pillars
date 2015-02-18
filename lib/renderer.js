
var i18n = require('./textualization').i18n;
var fs = require('fs');
var logger = Logger.pillars.addGroup('renderer');

var renderer = module.exports = new Renderer();
function Renderer(){
	var renderer = this;
	var cache = {}; // $cache ?
	var errors = {};

	var engines = {};
	Object.defineProperty(renderer,"engines",{ // renderer,engines (public, no only names)
		enumerable : true,
		get : function(){return Object.keys(engines);},
	});

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
		return renderer;
	}
	renderer.load = function(path){ // <---- Async, force or cache?
		var ext = path.replace(/^.*\./,'');
		var engine = engines[ext] || false;
		if(engine){
			try {
				var source = fs.readFileSync(path,'utf8');
				cache[path]=engine(source,path);
				logger.info('ok',{path:path});
				delete errors[path];
				delete source;
				return true;
			} catch(error){
				logger.error('compile-error',{path:path,error:error});
				errors[path]={msg:'compile-error',error:error};
				return false;
			}
		} else {
			logger.alert('unknow-engine',{path:path});
			errors[path]={msg:'unknow-engine'};
			return false;
		}
	}
	renderer.preload = function(path){ // <---- necessary?
		if(!cache[path]){
			return renderer.load(path);
		}
		return true;
	}
	renderer.render = function(path,locals){ // <---- locals.gw??? noooop / ENV.templates.error??? noooop
		if(!ENV.templates.cache){delete cache[path];}
		if(cache[path] || renderer.load(path)){
			return cache[path](locals);
		} else if(ENV.templates.error && (cache[ENV.templates.error] || renderer.load(ENV.templates.error))){
			locals.title = locals.gw.i18n('pillars.statusCodes',{code:500});
			locals.h1 = locals.gw.i18n('pillars.renderer.render.'+errors[path].msg);
			locals.stack = errors[path].error;
			return cache[ENV.templates.error](locals);
		} else {
			return locals.gw.i18n('pillars.renderer.render.'+errors[path].msg);
		}
	}
}








var jade = require('jade');
var marked = require('marked');
var hljs = require('highlight.js');
function hljsFix(str,lang){
	var result;
	if(lang){
		result = hljs.highlight(lang,str,true).value;
	} else {
		result = hljs.highlightAuto(str).value;
	}
	
	result = result.replace(/^((<[^>]+>|\s{4}|\t)+)/gm, function(match, r) {
		return r.replace(/\s{4}|\t/g, '  ');
	});
	result = result.replace(/\n/g, '<br>');
	return '<pre class="highlight"><code>'+result+'</pre></code>';
}

jade.filters.highlight = function(str,opts){return hljsFix(str,opts.lang);}
marked.setOptions({highlight: function (code,lang) {return hljsFix(code,lang);}});







renderer.addEngine('jade',function compiler(source,path){ // return funtion for render by -> function(locals).
	return jade.compile(source,{filename:path,pretty:true,debug:false,compileDebug:true});
})
