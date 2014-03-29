
module.exports = Beam;
function Beam(id,config){
	var beam = this;
	var worklist = Array.prototype.slice.call(arguments).slice(2);
	var midleware = worklist.slice(0,-1);
	var handler = worklist.slice(-1);

	var id = id;
	Object.defineProperty(beam,"id",{
		enumerable : true,
		get : function(){return id;},
		set : function(set){
			if(pillar){
				pillar.removeBeam(id);
				id = set;
				pillar.addBeam(id);
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
				if(pillar.beams[id]){delete pillar.beams[id];}
				if(pillar.regexps[id]){delete pillar.regexps[id];}
				pillar = false;
				console.log('Beam down of pillar!');
			} else {
				pillar = set;
				pillar.beams[id] = beam;
				pillar.regexps[id] = beam.regexp;
				console.log('Beam up to pillar!');
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
			var pillarpath = pillar.path.split('/').join('\\/');
			var beampath = beam.path.slice(1).split('/');
			if(beampath==''){
				regexp = '';
			} else {
				regexp = [];
				args = [];
				for(var i in beampath){
					if(/^:/.test(beampath[i])){
						args.push(beampath[i].replace(/^:/,''));
						regexp.push("([^\\/]+?)");
					} else {
						regexp.push(beampath[i]);
					}
				}
				regexp = "\\/"+regexp.join('\\/');
			}
			regexp = '^('+beam.method+')\\+('+pillar.prot+'):\\/\\/'+pillar.host+pillarpath+regexp+'\\/?$';
			regexp = new RegExp(regexp,'i');
			console.log("New regexp path: "+regexp);
			return regexp;
		}
	});	

	var path = config.path || '';
	Object.defineProperty(beam,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			if(path=="/"){
				path = "";
			} else {
				path = "/"+set.replace(/(^\/|\/$)/,'');
			}
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

	var template = config.template || false;
	Object.defineProperty(beam,"template",{
		enumerable : true,
		get : function(){return template;},
		set : function(set){template = set;}
	});

	this.launch = function(gw,callback){
		var nexting = new Nexting(gw,worklist,callback);
	}

	this.single = function(gw,callback){
		try {
			handler.call(gw,callback);
		} catch(error){
			gw.error(500,'Internal Server Error',error);
		}
	}
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
			gw.error(500,'Internal Server Error',error);
		}
	}
	launch();
}