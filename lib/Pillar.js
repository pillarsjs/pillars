
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

	pillar.regexp = false;
	pillar.regexps = [];
	pillar.regexpsRefresh = function(){
		pillar.regexp = new RegExp(
			'^(get|post|put|head|delete)\\+('+pillar.prot+'):\\/\\/'
			+pillar.host
			+pillar.path.split('/').join('\\/')
			+'\\/?','i');
		for(var i in pillar.beams){
			pillar.regexps[i] = pillar.beams[i].regexp;
		}
	}

	var prot = config.prot || 'http';
	Object.defineProperty(pillar,"prot",{
		enumerable : true,
		get : function(){return prot;},
		set : function(set){
			prot = set;
			pillar.regexpsRefresh();
		}
	});

	var host = config.host || '([^\\/]+?)';
	Object.defineProperty(pillar,"host",{
		enumerable : true,
		get : function(){return host;},
		set : function(set){
			host = set;
			pillar.regexpsRefresh();
		}
	});

	var path;
	Object.defineProperty(pillar,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = set.replace(/\/$/,'');
			pillar.regexpsRefresh();
		}
	});
	pillar.path = config.path || '';

	var beams = {};
	Object.defineProperty(pillar,"beams",{
		enumerable : true,
		get : function(){return beams;}
	});

	pillar.add = function(beam){
		beams[beam.id] = beam;
		beam.pillar = pillar;
		return pillar;
	}

	pillar.remove = function(beamid){
		if(beams[beamid]){
			beams[beamid].pillar = false;
			delete beams[beamid];
		}
		return pillar;
	}

}
