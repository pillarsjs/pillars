
var util = require("util");
var EventEmitter = require("events").EventEmitter;

module.exports = Beam;
util.inherits(Beam, EventEmitter);
function Beam(config){
	EventEmitter.call(this);
	var beam = this;
	var noconfig = (typeof config === 'function');
	beam.worklist = Array.prototype.slice.call(arguments).slice(noconfig?0:1);
	beam.midleware = beam.worklist.slice(0,-1);
	beam.handler = beam.worklist.slice(-1);

	var config = noconfig?{}:(config || {});
	beam.config = config;

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(beam,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			pillar.emit("idUpdate",id,set);
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

	var origin = config.origin || false;
	Object.defineProperty(beam,"origin",{
		enumerable : true,
		get : function(){return origin;},
		set : function(set){origin = set;}
	});
}

Beam.prototype.launch = function(gw,callback){
	var beam = this;
	var nexting = new Nexting(gw,beam.worklist,callback);
}

Beam.prototype.single = function(gw,callback){
	var beam = this;
	try {
		beam.handler.call(gw,gw,callback);
	} catch(error){
		gw.error(500,error);
	}
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
