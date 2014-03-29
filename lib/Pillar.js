
var router = require('./router');
var templates = require('./template');

module.exports = Pillar;
function Pillar(config){
	var pillar = this;

	var id;
	Object.defineProperty(pillar,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(router.pillars[id]){delete router.pillars[id];}
			id = set;
			router.pillars[id]=pillar;
		}
	});
	pillar.id=config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);

	var title = config.title || 'untitled';
	Object.defineProperty(pillar,"title",{
		enumerable : true,
		get : function(){return title;},
		set : function(set){title = set;}
	});

	var path = config.path || '/';
	Object.defineProperty(pillar,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = "/"+set.replace(/(^\/|\/$)/,'');
			regexpsRefresh();
		}
	});

	var prot = config.prot || 'http';
	Object.defineProperty(pillar,"prot",{
		enumerable : true,
		get : function(){return prot;},
		set : function(set){
			prot = set;
			regexpsRefresh();
		}
	});

	var host = config.host || '([^\\/]+?)';
	Object.defineProperty(pillar,"host",{
		enumerable : true,
		get : function(){return host;},
		set : function(set){
			host = set;
			regexpsRefresh();
		}
	});

	var regexps = [];
	Object.defineProperty(pillar,"regexps",{
		enumerable : true,
		get : function(){return regexps;},
	});

	var template;
	Object.defineProperty(pillar,"template",{
		enumerable : true,
		get : function(){return template;},
		set : function(set){
			if(set){
				templates.preload(set);
				template = set;
			}
		}
	});
	pillar.template = config.template || false;

	var beams = {};
	Object.defineProperty(pillar,"beams",{
		enumerable : true,
		get : function(){return beams;}
	});
	
	function regexpsRefresh(){
		for(var i in beams){
			regexps[i] = beams[i].regexp;
		}
	}

	this.link = function(beamid){
		if(beams[beamid]){
			var link = beams[beamid].path;
			var params = Array.prototype.slice.call(arguments).slice(1);
			for(var i in params){
				link = link.replace(/\/:[^\/]+/i,'/'+params[i]);
			}
			return pillar.path+link;
		} else {
			return "#unknow";
		}
	}
	this.addBeam = function(beam){
		beam.pillar = pillar;
		return pillar;
	}
	this.removeBeam = function(beamid){
		if(beams[beamid]){beams[beamid].pillar=false;}
		return pillar;
	}
	this.getBeam = function(beamid){
		if(beams[beamid]){return beams[beamid];}
		return false;
	}
}