
var util = require("util");
var EventEmitter = require("events").EventEmitter;

module.exports = Pillar;
util.inherits(Pillar, EventEmitter);
function Pillar(config){
	EventEmitter.call(this);
	var pillar = this;
	var config = config || {};
	pillar.config = config;

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(pillar,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(){
			pillar.emit("idUpdate",id,set);
			id = set;
		}
	});

	var priority = 1000;
	Object.defineProperty(pillar,"priority",{
		enumerable : true,
		get : function(){return priority;},
		set : function(set){
			config.priority = set;
			priority = parseInt(set) || 1000;
			pillar.emit("priorityUpdate");
		}
	});

	var host;
	Object.defineProperty(pillar,"host",{
		enumerable : true,
		get : function(){return host;},
		set : function(set){
			config.host = set;
			host = new RegExp(set,'i');
		}
	});
	pillar.host = config.host || '.*';

	var path;
	Object.defineProperty(pillar,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			config.path = '/'+set.replace(/\/+/gi,'/').replace(/^\/|\/$/gi,'');
			path = new RegExp('^'+config.path.replace('/','\\/')+'\\/?','i');
		}
	});
	pillar.path = config.path || '/';

	var beams = {};
	Object.defineProperty(pillar,"beams",{
		enumerable : true,
		get : function(){return beamsOrdered;}
	});

	var beamsOrdered = [];
	function beamsOrder(){
		var beamsArray = [];
		for(var i in beams){beamsArray.push(beams[i]);}
		beamsOrdered = beamsArray.sort(function(a,b){
			return a.priority - b.priority || 0;
		});
	}

	pillar.add = function(beam){
		beam.on('priorityUpdate',beamsOrder);
		beam.on('idUpdate',beamIdChange);
		beams[beam.id] = beam;
		beamsOrder();
		return pillar;
	}

	pillar.get = function(beamid){
		return beams[beamid] || false;
	}

	pillar.remove = function(beamid){
		if(beams[beamid]){
			beams[beamid].removeListener('priorityUpdate', beamsOrder);
			beams[beamid].removeListener('idUpdate', beamIdChange);
			delete beams[beamid];
			beamsOrder();
		}
		return pillar;
	}

	function beamIdChange(oldid,newid){
		if(beams[oldid] && oldid != newid){
			if(beams[newid]){
				app.remove(newid);
			}
			beams[newid] = beams[oldid];
			delete beams[oldid];
		}
	}
}
