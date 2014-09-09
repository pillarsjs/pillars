
module.exports = Pillar;
function Pillar(config){
	var pillar = this;
	var config = config || {};
	pillar.config = config;

	var id = config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);
	Object.defineProperty(pillar,"id",{
		enumerable : true,
		get : function(){return id;},
	});

	var host = new RegExp(config.host || '.*');
	Object.defineProperty(pillar,"host",{
		enumerable : true,
		get : function(){return host;},
		set : function(set){
			host = new RegExp(set);
		}
	});

	var regexp = new RegExp();
	Object.defineProperty(pillar,"regexp",{
		enumerable : true,
		get : function(){return regexp;},
	});

	var path = config.path || '';
	Object.defineProperty(pillar,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = '/'+set.replace(/\/+/gi,'/').replace(/^\/|\/$/,'');
			regexp = new RegExp('^'+path.replace('/','\\/')+'\\/?','i');
		}
	});

	var beams = {};
	Object.defineProperty(pillar,"beams",{
		enumerable : true,
		get : function(){return beams;}
	});

	pillar.add = function(beam){
		beams[beam.id] = beam;
		return pillar;
	}

	pillar.remove = function(beamid){
		if(beams[beamid]){
			delete beams[beamid];
		}
		return pillar;
	}

}
