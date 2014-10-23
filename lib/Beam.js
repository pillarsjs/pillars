
var util = require("util");
var EventEmitter = require("events").EventEmitter;

module.exports = Beam;
util.inherits(Beam, EventEmitter);
function Beam(config){
	EventEmitter.call(this);
	var beam = this;
	var noconfig = (typeof config === 'function');
	var worklist = Array.prototype.slice.call(arguments).slice(noconfig?0:1);

	var config = noconfig?{}:(config || {});
	beam.config = config;

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(beam,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			beam.emit("idUpdate",id,set);
			id = set;
		}
	});

	var priority = config.priority || 1000;
	Object.defineProperty(beam,"priority",{
		enumerable : true,
		get : function(){return priority;},
		set : function(set){
			beam.emit("priorityUpdate",priority,set);
			config.priority = set;
			priority = parseInt(set) || 1000;
		}
	});

	var params;
	Object.defineProperty(beam,"params",{
		enumerable : true,
		get : function(){return params.slice();}
	});

	var path;
	Object.defineProperty(beam,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			config.path = set.replace(/\/+/gi,'/').replace(/^\/|\/$/gi,'');
			var parts = config.path.split('/');
			var compose = [];
			var newparams = [];
			for(var i in parts){
				if(/^:/.test(parts[i])){
					var arg = parts[i].replace(/^:/,'');
					newparams.push(arg);
					compose.push("([^\\/]+)");
				} else if(/^\*:/.test(parts[i])){
					var arg = parts[i].replace(/^\*:/,'');
					newparams.push(arg);
					compose.push("(.*)");
				} else {
					compose.push(parts[i]);
				}
			}
			params = newparams;
			path = new RegExp('^'+compose.join('\\/')+'\\/?$','i');
		}
	});
	beam.path = config.path || '';

	var method;
	Object.defineProperty(beam,"method",{
		enumerable : true,
		get : function(){return method;},
		set : function(set){
			if(!Array.isArray(set)){set = [set];}
			set = set.map(function(e,i){return e.toUpperCase();});
			config.method = set;
			method = set;
		}
	});
	beam.method = config.method || 'get';

	Object.defineProperty(beam,"midleware",{
		enumerable : true,
		get : function(){return worklist.slice(0,-1);},
		set : function(set){
			if(Array.isArray(set)){
				worklist = set.concat(worklist.slice(-1));
			} else {
				worklist = worklist.slice(-1);
			}
		}
	});
	Object.defineProperty(beam,"handler",{
		enumerable : true,
		get : function(){return worklist.slice(-1).shift();},
		set : function(set){
			worklist = worklist.slice(0,-1).concat([set]);
		}
	});
	Object.defineProperty(beam,"worklist",{
		enumerable : true,
		get : function(){return worklist;},
		set : function(set){
			if(Array.isArray(set)){
				worklist = set;
			} else {
				worklist = [];
			}
		}
	});

	var session = config.session || false;
	Object.defineProperty(beam,"session",{
		enumerable : true,
		get : function(){return session;},
		set : function(set){session = set;}
	});

	var upload = config.upload || false;
	Object.defineProperty(beam,"upload",{
		enumerable : true,
		get : function(){return upload;},
		set : function(set){upload = set;}
	});

	var maxlength = config.maxlength || PILLARS.maxUploadSize;
	Object.defineProperty(beam,"maxlength",{
		enumerable : true,
		get : function(){return maxlength;},
		set : function(set){maxlength = set;}
	});

	var account = config.account || false;
	Object.defineProperty(beam,"account",{
		enumerable : true,
		get : function(){return account;},
		set : function(set){account = set;}
	});

	var cors = config.cors || false;
	Object.defineProperty(beam,"cors",{
		enumerable : true,
		get : function(){return cors;},
		set : function(set){cors = set;}
	});
}

Beam.prototype.launch = function(gw,callback){
	var beam = this;
	var nexting = new Nexting(gw,beam.worklist,callback);
}

function Nexting(gw,worklist,callback){
	var worklist = worklist.slice();
	var callback = callback || false;
	var launch = function nexting(){
		var next = worklist.shift();
		try {
			if(next){
				next.call(gw,gw,launch);
			} else if(callback) {
				callback.call(gw,gw);
			}
		} catch(error){
			gw.error(500,error);
		}
	}
	launch();
}
