/* jslint node: true */
"use strict";

var util = require('util');
var jshint = require('jshint').JSHINT;
var fs = require('fs');
var format = require('./format');
var logger = require('./Logger').addGroup('pillars').addGroup('textualization');

function Textualization(){ // <--- Translate

	this.heap = {}; // $heap?
	this.cache = {}; // $cache?

	var langs = ['en'];
	Object.defineProperty(this,"langs",{ // <-- languages
		enumerable : true,
		get : function(){return langs;},
		set : function(set){
			logger.info('langs',{langs:set});
			langs = set;
			this.reload();
		}
	});

	this.i18n = this.translate.bind(this); // <---- out!
}
	Textualization.prototype.reload = function reload(){
		this.heap = {};
		this.refresh();
	};
	Textualization.prototype.refresh = function refresh(){
		for(var i=0,k=Object.keys(this.cache),l=k.length;i<l;i++){
			this.load(k[i],this.cache[k[i]]);
		}
		return this;
	};
	Textualization.prototype.load = function load(path,source){ // <-- Callback, async | formats=> loadObject('id',{...}) || loadDir("pathToDir",callback)
		var lang,i,l;
		if(!source || source===path){
			for(i=0,l=this.langs.length;i<l;i++){
				lang = this.langs[i];
				try {
					source = fs.readFileSync(path+'/'+lang+'.js','utf8');
					source = "(function(){var textualization = {};"+source+"return textualization;})();";
					if(!jshint(source)){
						var checkfail = jshint.data().errors;
						var error = new Error("Sheet sintax error");
						error.stack = [];
						for(var e in checkfail){
							error.stack.push((checkfail[e].reason+" in line "+checkfail[e].line));
						}
						throw error;
					}
					source = eval(source);
					source = source || {};
				} catch (error){
					logger.error('load-error',{path:path,lang:lang,error:e});
				} finally {
					if(!this.heap[lang]){this.heap[lang]={};}
					this.updateHeap(path,lang,source);
				}
			}
			this.cache[path] = path;
		} else {
			for(i=0,l=this.langs.length;i<l;i++){
				lang = this.langs[i];
				if(source[lang]){
					this.updateHeap(path,lang,source[lang]);
				}
			}
			this.cache[path] = source;
		}
		return this;
	};
	Textualization.prototype.updateHeap = function updateHeap(path,lang,source){
		if(!this.heap[lang]){this.heap[lang]={};}
		for(var i=0,k=Object.keys(source),l=k.length;i<l;i++){
			if(this.heap[lang][k[i]]){logger.info('heap-rewrite',{path:path,lang:lang,element:k[i]});}
			this.heap[lang][k[i]]=source[k[i]];
		}
		logger.info('load-ok',{path:path,lang:lang,count:Object.keys(source).length});
	};
	Textualization.prototype.translate = function translate(text,params,lang) { // <--- i18n (for bind)
		if(!/^[a-z0-9\$\_]+(\.[a-z0-9\-\_]+)+$/i.test(text)){return text;}
		lang = lang || this.langs[0];
		text = text || "";
		var original = text;
		var sheet = {};
		if(this.heap[lang]){
			sheet = this.heap[lang];
		}
		
		var match;
		try {
			match = eval("sheet"+'["'+text.split('.').join('"]["')+'"]');
		} catch(error) {
			return text;
		}

		var func,i,k,l;
		try {
			if(typeof match==="string"){ // Simple printf translation
				return format(match,params);

			} else if(Array.isArray(match)){ // Grammatical number translation
				var num;
				if(typeof match!=="object"){
					params = {$num:params};
					num = params[0];
				}
				num = params.$num;

				if(num>=0){
					if(match.length==2){
						return (num==1)?format(match[0],params):format(match[1],params);
					} else {
						return (num>=match.length-1)?format(match[match.length-1],params):format(match[num],params);
					}
				} else {
					throw new Error("Invalid params for gramatical number translation");
				}

			} else if(typeof match==="function"){ // Function handled translation
					func = functionBody(match);
					func = "function("+Object.keys(params).join(',')+"){\n"+func+"\n}";
					eval("func = "+func+";");
					var funcparams = [];
					for(i=0,k=Object.keys(params),l=k.length;i<l;i++){
						funcparams.push(params[k[i]]);
					}
					match = func.apply(params,funcparams);
					return format(match,params);

			}
			// !=String & !=Array & !=Function => Invalid translation value.
			console.log(typeof match);
			throw new Error("Invalid translation format");

		} catch(error){
			logger.warn('i18n-error',{node:original,params:params,error:error});
			return original;
		}
	};

module.exports = new Textualization();


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
