
var util = require("util");
var EventEmitter = require("events").EventEmitter;

util.inherits(Plugin, EventEmitter);
module.exports = Plugin;
function Plugin(_config,_handler){
	EventEmitter.call(this);
	var plugin = this;
	var config = (_config && typeof _config!=='function')?_config:{};

	plugin.configure = function(config){
		for(var i in config){plugin[i]=config[i];}
		return plugin;
	};
	plugin.configure(config);

	plugin.handler = _handler;

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(plugin,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(set && set!==id){
				plugin.emit("idUpdate",id,set);
				id = set;
			}
		}
	});

	var priority = (typeof config.priority !=='undefined')?config.priority:1000;
	Object.defineProperty(plugin,"priority",{
		enumerable : true,
		get : function(){return priority;},
		set : function(set){
			set = parseInt(set,10) || 1000;
			if(set!==priority){
				plugin.emit("priorityUpdate",priority,set);
				priority = set;
			}
		}
	});

	var active = (typeof config.active !=='undefined')?config.active:true;
	Object.defineProperty(plugin,"active",{
		enumerable : true,
		get : function(){return active;},
		set : function(set){
			if(set){active=true;}
		}
	});
}
