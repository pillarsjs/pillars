
var util = require('util');
var jshint = require('jshint').JSHINT;
var fs = require('fs');
var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;
var logger = Logger.pillars.addGroup('textualization');
var colors = require('colors');

module.exports = new Textualization();

logger.stores.console = function(groups,lvl,msg,meta,callback){
	if(!global.ENV || ENV.debug){
		var node = groups.reverse().concat([msg]).join('.');
		var format = i18n(node,meta);
		var error = (meta.error)?meta.error.stack:false;
		var header = lvl.toUpperCase();
		var color = logger.getColor(lvl);
		if(color){header = header[color];}
		header+=' '+node.grey+'\n';
		header = '';
		ending = '\n';
		ending = '';

		if(format===node){
			if(error){
				console.log(header+node,meta,'\n',error,'\n');
			} else {
				console.log(header+node,meta,ending);
			}
		} else {
			if(error){
				console.log(header+format,'\n',error,'\n');
			} else {
				console.log(header+format,ending);
			}
		}
	}
};

function Textualization(){
	var T12n = this;
	var heap = {};
	var cache = {};
	T12n.heap = heap;
	T12n.cache = cache;

	var langs = ['en'];
	Object.defineProperty(T12n,"langs",{
		enumerable : true,
		get : function(){return langs;},
		set : function(set){
			langs = set;
			refresh();
			logger.info('langs',{langs:langs});
		}
	});

	T12n.refresh = refresh;
	function refresh(){
		heap = {};
		T12n.heap = heap;
		for(var i in cache){
			load(i,cache[i]);
		}
		return T12n;
	}

	T12n.load = load;
	function load(path,source){
		if(!source || source===path){
			cache[path]={};
			for(var l in langs){
				var lang = langs[l];
				try {
					var source = fs.readFileSync(path+'/'+lang+'.js','utf8');
					source = "cache[path][lang] = {"+source+"};";
					if(!jshint(source)){
						var checkfail = jshint.data().errors;
						var error = new Error("Sheet sintax error");
						error.stack = [];
						for(var e in checkfail){
							error.stack.push((checkfail[e].reason+" in line "+checkfail[e].line));
						}
						throw error;
					}
					eval(source);
					if(cache[path][lang]){
						if(!heap[lang]){heap[lang]={};}
						for(var i in cache[path][lang]){
							if(heap[lang][i]){logger.info('heap-rewrite',{path:path,lang:lang,element:i});}
							heap[lang][i]=cache[path][lang][i];
						}
					}
					logger.info('load-ok',{path:path,lang:lang,count:Object.keys(cache[path][lang]).length});
				} catch(error){
					logger.error('load-error',{path:path,lang:lang,error:error});
				}
			}
			cache[path]=path;
		} else {
			var path = arguments[0];
			var source = arguments[1];
			for(var l in langs){
				var lang = langs[l];
				if(source[lang]){
					if(!heap[lang]){heap[lang]={};}
					if(heap[lang][path]){logger.info('heap-rewrite',{path:path,lang:lang,element:i});}
					heap[lang][path]=source[lang];
					logger.log('load-ok',{path:path,lang:lang,count:Object.keys(source[lang]).length});
				}
			}
			cache[path] = source;
		}
		return T12n;
	}

	T12n.i18n = i18n;
	function i18n(text,params,lang) {
		var lang = lang || langs[0];
		var sheet = {};
		var params = params;
		var original = text;
		var text = text || "";
		if(heap[lang]){
			var sheet = heap[lang];
		}

		if(typeof params!=="object"){params = [params];}
		
		text = text.split(".");
		var match = sheet;
		for(var i=0;i<text.length;i++){
			if(i+1<text.length && typeof match[text[i]+"."+text[i+1]] !== "undefined"){
				match = match[text[i]+"."+text[i+1]];
				i++;
			} else if(typeof match[text[i]] !== "undefined"){
				match = match[text[i]];
			} else {
				if(typeof params._default !== "undefined"){return params._default;}
				return original;
				//return text.slice(-2).join('.');
			}
		}
		try {
			if(typeof match==="string"){
				return sformat(match,params);
			} else if(Array.isArray(match) && match.length>=2 && match.length<=3 && params.length>=1 && params[0]>=0){
				if(match.length==2){
					return sformat((params[0]==1)?match[0]:match[1],params);
				} else {
					return sformat((params[0]>=match.length-1)?match[match.length-1]:match[params[0]],params);
				}
				throw new Error("Invalid params");

			} else if(typeof match==="function"){
					var func = functionBody(match);
					func = "function("+Object.keys(params).join(',')+"){\n"+func+"\n}";
					eval("func = "+func+";");
					var funcparams = [];
					for(var p in params){funcparams.push(params[p]);}
					func = func.apply(T12n,funcparams);
					return sformat(func,params);

			} else if(typeof match==="object") {
				var conditions = Object.keys(match);
				var ok;
				for(var i in conditions){
					condition = conditions[i];
					if(condition==="default"){
						ok=i;break;
					} else if(!/([{}]|[0-9a-zA-Z_$]\()/i.test(condition)){
						var func = "function("+Object.keys(params).join(',')+"){if("+condition+"){return true;} else {return false;}}";
						try {
							eval("func = "+func+";");
							var funcparams = [];
							for(var p in params){funcparams.push(params[p]);}
							func = func.apply(T12n,funcparams);
							if(func===true){ok=i;break;}
						} catch(error){
							// Condition fail === false, continue.
						}
					} else {
						throw new Error('Condition invalid format: "'+condition+'"');
					}
				}
				if(ok>=0){
					return sformat(match[conditions[ok]],params);
				}
				throw new Error("No condition matches");
			}
			throw new Error("Invalid format");

		} catch(error){
			logger.warn('i18n-error',{node:text.join('.'),params:params,error:error});
			return original;
		}
	}
}

function sformat(string,params){
	params = stringZeros(params);
	var format = (!params)?string:(params.slice)?vsprintf(string,params):sprintf(string,params);
	return format;
	function stringZeros(o){
		for(var i in o){if(o[i]===0){o[i]="0";}}
		return o;
	}
}

function functionBody(func){
	var source = func.toString();
	var ini = /^\W*function[^{]*{/;
	var end = /\}$/;
	ini = ini.exec(source);
	if(ini){ini = ini.index+ini[0].length;} else {ini = 0;}
	end = end.exec(source);
	if(end){end = end.index;} else {end = source.length;}
	return source.substring(ini,end);
}
