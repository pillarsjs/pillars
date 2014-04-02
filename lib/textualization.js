
var util = require('util');
var jshint = require('jshint').JSHINT;
var fs = require('fs');
var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;
var colors = require('colors');

// t12n\([\'\"]([a-zA-Z_$][0-9a-zA-Z_$\.-]*[0-9a-zA-Z_$]*)[\'\"](?:,(\{.*\}))[,\)]

function Textualization(){
	this.cache = {};
	this.paths = {};
	this.langs = ['en'];
	this.load('pillars','languages');
	console.log(this.t12n('textualization.langs',{langs:this.langs},'pillars').cyan);
}

Textualization.prototype.languages = function(langs){
	this.langs = langs;
	this.refresh();
	console.log(this.t12n('textualization.langs',{langs:this.langs},'pillars').cyan);
	return this;
}

Textualization.prototype.cacheList = function(){
	return Object.keys(this.cache);
}

Textualization.prototype.refresh = function(){
	var reloads = this.cacheList();
	this.cache = {};
	for(var i in reloads){
		if(this.paths[reloads[i]]){
			this.load(reloads[i],this.paths[reloads[i]]);
		}
	}
	return this;
}

Textualization.prototype.load = function(domain,path){
	this.cache[domain]={};
	this.paths[domain]=path;
	for(var l in this.langs){
		var locale = this.langs[l];
		try {
			var source = fs.readFileSync(path+'/'+locale+'.js','utf8');
			source = "this.cache[domain][locale] = {"+source+"};";
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
			console.log(this.t12n('textualization.load-ok',{domain:domain,path:path,locale:locale},'pillars').magenta);
		} catch(error){
			console.log(this.t12n('textualization.load-error',{domain:domain,path:path,locale:locale},'pillars').red,error.stack);
		}
	}
	return this;
}

Textualization.prototype.t12nc = function(text,params,domain,locale) {
	var locale = locale || this.langs[0];
	var sheet = {};
	var params = params || [];
	var text = text || "";
	var match = false;
	if(this.cache[domain] && this.cache[domain][locale]){
		var sheet = this.cache[domain][locale];
	}
	if(typeof params!=="object"){params = [params];}
	if(typeof text!=="object"){text = [text];}

	if(sheet[text[0]]){text = sheet[text[0]];}
	if(typeof text === "string"){text=[text];}

	if(text.length==1){
		match = text[0];
	} else if(params.length>=1 && params[0]>=0) {
		// Parse prurals
		if(text.length==2){
			match = (params[0]==1)?text[0]:text[1];
		} else {
			match = (params[0]>=text.length-1)?text[text.length-1]:text[params[0]];
		}
	}

	if(match){
		try {
			return sformat(match,params);
		} catch(error){
			return '['+JSON.stringify(text)+' '+JSON.stringify(params)+']['+error+']';
		}
	} else {
		return '['+JSON.stringify(text)+' '+JSON.stringify(params)+']';
	}
}

Textualization.prototype.t12n = function(text,params,domain,locale) {
	var locale = locale || this.langs[0];
	var sheet = {};
	var params = params;
	var text = text || "";
	if(this.cache[domain] && this.cache[domain][locale]){
		var sheet = this.cache[domain][locale];
	}

	if(typeof params!=="object"){params = [params];}
	
  text = text.split(".");
  var match = sheet;
	for(var i in text){
		if(!match[text[i]]){
			return '['+text.join('.')+' '+JSON.stringify(params)+']';
		}
		match = match[text[i]];
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
			throw new Error('Invalid params "'+match+'"');

		} else if(typeof match==="function"){
				var func = functionparts(match);
				func = "function("+Object.keys(params).join(',')+"){\n"+func.body+"\n}";
				eval("func = "+func+";");
				var funcparams = [];
				for(var p in params){funcparams.push(params[p]);}
				func = func.apply(this,funcparams);
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
						func = func.apply(this,funcparams);
						if(func===true){ok=i;break;}
					} catch(error){
						// Condition fail === false, continue.
					}
				} else {
					throw new Error('Invalid condition format "'+condition+'"');
				}
			}
			if(ok>=0){
				return sformat(match[conditions[ok]],params);
			}
			throw new Error('No coincidences for conditions "'+conditions.join('", "')+'"');
		}
		throw new Error('Invalid format "'+match+'"');

	} catch(error){
		return '['+text.join('.')+'('+JSON.stringify(params)+') - '+error+']';
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

function functionparts(func){
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

module.exports = new Textualization();
