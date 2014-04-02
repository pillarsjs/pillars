
var templates = require('./template');

module.exports = Pillar;
function Pillar(config){
	var pillar = this;

	var id;
	Object.defineProperty(pillar,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(server){
				server.removePillar(id);
				id = set;
				server.addPillar(id);
			} else {
				id = set;
			}
		}
	});
	pillar.id=config.id || Date.now().toString(36)+Math.round(Math.random()*10).toString(36);

	var server = false;
	Object.defineProperty(pillar,"server",{
		enumerable : true,
		get : function(){return server;},
		set : function(set){
			if(!set){
				if(server && server.pillars[id]){delete server.pillars[id];}
				server = false;
			} else {
				server = set;
				server.pillars[id] = pillar;
			}
		}
	});

	var title = config.title || 'untitled';
	Object.defineProperty(pillar,"title",{
		enumerable : true,
		get : function(){return title;},
		set : function(set){title = set;}
	});

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
	pillar.regexp = false;
	pillar.regexps = [];
	pillar.path = config.path || '';

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
}

Pillar.prototype.regexpsRefresh = function(){
	var pillar = this;
	pillar.regexp = new RegExp(
		'^(get|post)\\+('+pillar.prot+'):\\/\\/'
		+pillar.host
		+pillar.path.split('/').join('\\/')
		+'\\/?','i');
	for(var i in pillar.beams){
		pillar.regexps[i] = pillar.beams[i].regexp;
	}
}

Pillar.prototype.addBeam = function(beam){
	var pillar = this;
	beam.pillar = pillar;
	return pillar;
}

Pillar.prototype.removeBeam = function(beamid){
	var pillar = this;
	if(pillar.beams[beamid]){pillar.beams[beamid].pillar=false;}
	return pillar;
}

Pillar.prototype.getBeam = function(beamid){
	var pillar = this;
	if(pillar.beams[beamid]){return pillar.beams[beamid];}
	return false;
}

Pillar.prototype.link = function(beamid){ // Transfer method for gw
	var gw = this;
	var pillar = gw.pillar;
	if(pillar.beams[beamid]){
		var link = pillar.beams[beamid].path;
		var params = Array.prototype.slice.call(arguments).slice(1);
		for(var i in params){
			link = link.replace(/(:[^\/]+|\*:[^\/]+)/i,params[i]);
		}
		if(gw.language && gw.language!=gw.textualization.langs[0]){
			return '/'+gw.language+pillar.path+link;
		}
		return pillar.path+link;
	} else {
		return "#unknow";
	}
}
