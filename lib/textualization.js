
var util = require('util');
var jshint = require('jshint').JSHINT;
var fs = require('fs');
var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;
var colors = require('colors');

// t12n\([\'\"]([a-zA-Z_$][0-9a-zA-Z_$\.-]*[0-9a-zA-Z_$]*)[\'\"](?:,(\{.*\}))[,\)]

function Textualization(){
	var T12n = this;
	T12n.heap = {};
	T12n.cache = {};
	T12n.langs = ['en'];

	Object.defineProperty(T12n,"languages",{
		enumerable : true,
		get : function(){return T12n.langs;},
		set : function(set){
			T12n.langs = set;
			T12n.refresh();
			console.log(T12n.t12n('textualization.langs',{langs:T12n.langs}));
		}
	});

	T12n.refresh = function(){
		T12n.heap = {};
		for(var i in T12n.cache){
			T12n.load(i,T12n.cache[i]);
		}
		return T12n;
	}

	T12n.load = function(path){
		T12n.cache[path]={};
		for(var l in T12n.langs){
			var lang = T12n.langs[l];
			try {
				var source = fs.readFileSync(path+'/'+lang+'.js','utf8');
				source = "T12n.cache[path][lang] = {"+source+"};";
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
				if(T12n.cache[path][lang]){
					if(!T12n.heap[lang]){T12n.heap[lang]={};}
					for(var i in T12n.cache[path][lang]){
						if(T12n.heap[lang][i]){console.log(T12n.t12n('textualization.heap-rewrite',{path:path,lang:lang,element:i}));}
						T12n.heap[lang][i]=T12n.cache[path][lang][i];
					}
				}
				console.log(T12n.t12n('textualization.load-ok',{path:path,lang:lang,count:Object.keys(T12n.cache[path][lang]).length}));
			} catch(error){
				console.log(T12n.t12n('textualization.load-error',{path:path,lang:lang}),error.stack);
			}
		}
		T12n.cache[path]=path;
		return T12n;
	}

	T12n.t12n = function(text,params,lang) {
		var lang = lang || T12n.langs[0];
		var sheet = {};
		var params = params;
		var text = text || "";
		if(T12n.heap[lang]){
			var sheet = T12n.heap[lang];
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
				return text.slice(-2).join('.');
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
			console.log("Textualization error:\n\tId:",text.join('.'),"\n\tParams:",params,"\n\tError:",error);
			return "Error:"+text.slice(-2).join('.');
		}
	}

	T12n.load('languages/pillars');
	console.log(T12n.t12n('textualization.langs',{langs:T12n.langs}));

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

/*
Textualization.prototype.languages = function(langs){
	T12n.langs = langs;
	T12n.refresh();
	console.log(T12n.t12n('textualization.langs',{langs:T12n.langs}));
	return T12n;
}
*/

/*
function functionExplode(func){
	var source = func.toString();
	var ini = /^\W*function[^{]*{/;
	var end = /\}$/;
	ini = ini.exec(source);
	if(ini){ini = ini.index+ini[0].length;} else {ini = 0;}
	end = end.exec(source);
	if(end){end = end.index;} else {end = source.length;}

	var args = [];
	var argsmatch = source.match(/^\W*function\s*\((.*?)\)\s*{/);
	if (argsmatch === null) {
		argsmatch = source.match(/^\W*function\s*[a-zA-Z_$][0-9a-zA-Z_$]*\s*\((.*?)\)\s*{/);
	}
	if (argsmatch !== null) {
		if (typeof argsmatch[1] !== "undefined" && argsmatch[1] !== "") {
			argsmatch = argsmatch[1];
			args = argsmatch.split(',').map(function(val){return val.trim()});	
		}
	}
	return {
		body:source.substring(ini,end),
		args:args
	};
}
*/

module.exports = new Textualization();
