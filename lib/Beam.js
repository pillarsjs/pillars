
var util = require('util');
var templates = require('./templates');

module.exports = Beam;
function Beam(id,config){
	var beam = this;

	beam.worklist = Array.prototype.slice.call(arguments).slice(2);
	beam.midleware = beam.worklist.slice(0,-1);
	beam.handler = beam.worklist.slice(-1);

	beam.config = config || {};

	var id = id;
	Object.defineProperty(beam,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(pillar){
				pillar.removeBeam(id);
				id = set;
				pillar.addBeam(beam);
			} else {
				id = set;
			}
		}
	});

	var pillar = false;
	Object.defineProperty(beam,"pillar",{
		enumerable : true,
		get : function(){return pillar;},
		set : function(set){
			if(!set){
				if(pillar && pillar.beams[id]){delete pillar.beams[id];}
				if(pillar && pillar.regexps[id]){delete pillar.regexps[id];}
				pillar = false;
			} else {
				pillar = set;
				pillar.beams[id] = beam;
				pillar.regexps[id] = beam.regexp;
			}
		}
	});

	var args = [];
	Object.defineProperty(beam,"args",{
		enumerable : true,
		get : function(){return args;}
	});

	var regexp = false;
	Object.defineProperty(beam,"regexp",{
		enumerable : true,
		get : function(){
			var beampath = beam.path;
			if(beampath==''){
				regexp = '';
			} else {
				beampath = (!/^\//.test(beampath))?beampath.split('/'):beampath.slice(1).split('/');
				regexp = [];
				args = [];
				for(var i in beampath){
					if(/^:/.test(beampath[i])){
						args.push(beampath[i].replace(/^:/,''));
						regexp.push('\\/'+'([^\\/]+)');
					} else if(/^\*:/.test(beampath[i])){
						args.push(beampath[i].replace(/^\*:/,''));
						regexp.push('((?:\\/(?:[^\\/]+))*)');
					} else {
						regexp.push('\\/'+beampath[i]);
					}
				}
				regexp = regexp.join('');
			}
			var pillarpath = pillar.path.split('/').join('\\/');
			regexp = '^('+beam.method+')\\+('+pillar.prot+'):\\/\\/'+pillar.host+pillarpath+regexp+'\\/?$';
			regexp = new RegExp(regexp,'i');
			return regexp;
		}
	});	

	var path = config.path || '';
	Object.defineProperty(beam,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = set.replace(/\/$/,'');
			pillar.regexps[id] = beam.regexp;
		}
	});

	var method = config.method || 'get';
	Object.defineProperty(beam,"method",{
		enumerable : true,
		get : function(){return method;},
		set : function(set){
			method = set;
			pillar.regexps[id] = beam.regexp;
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

	var maxlength = config.maxlength || 10*1024*1024;
	Object.defineProperty(beam,"maxlength",{
		enumerable : true,
		get : function(){return maxlength;},
		set : function(set){maxlength = set;}
	});
}

Beam.prototype.launch = function(gw,callback){
	var beam = this;
	var nexting = new Nexting(gw,beam.worklist,callback);
}

Beam.prototype.single = function(gw,callback){
	var beam = this;
	try {
		beam.handler.call(gw,callback);
	} catch(error){
		gw.error(500,error);
	}
}

Beam.prototype.pathparams = function(gw){
	var beam = this;
	var matches = beam.pillar.regexps[beam.id].exec(gw.route).slice(1);
	var repoint = matches.length-beam.args.length;
	for(var i in beam.args){
		gw.params[beam.args[i]] = decodeURIComponent(matches[parseInt(i)+repoint] || '');
	}
}

Beam.prototype.render = function(locals){ // Transfer method for gw
	var gw = this;
	var beam = gw.beam;
	locals.title = locals.title || beam.pillar.title+" - "+(locals.h1 || 'unknow');
	locals.msgs = gw.msgs;
	locals.pillar = beam.pillar;
	locals.beam = beam;
	locals.gw = gw;
	locals.link = function(){return gw.link.apply(gw,arguments)};
	locals.t12n = function(){return gw.t12n.apply(gw,arguments)};
	locals.t12nc = function(){return gw.t12nc.apply(gw,arguments)};
	locals.fieldIdr = fieldIdr;
	locals.fieldNmr = fieldNmr;
	locals.util = util;

	var body = templates.render(beam.pillar.template,locals);
	gw.send(body);
}

function Nexting(gw,worklist,callback){
	var worklist = worklist.slice();
	var callback = callback || false;
	var launch = function nexting(){
		var next = worklist.shift();
		try {
			if(next){
				next.call(gw,launch);
			} else if(callback) {
				callback.call(gw);
			}
		} catch(error){
			gw.error(500,error);
		}
	}
	launch();
}

function fieldIdr(id){
	if(!name){return "";}
	var name = name.replace('][','_');
	name = name.replace('[','_');
	name = name.replace(']','');
	return name;
}

function fieldNmr(id){
	if(!name){return "";}
	var name = name.replace('][','_');
	name = name.replace('[','_');
	name = name.replace(']','');
	return name;
}