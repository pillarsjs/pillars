
module.exports = Beam;
function Beam(config){
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
	});

	var args = [];
	Object.defineProperty(beam,"args",{
		enumerable : true,
		get : function(){return args;}
	});

	var regexp = new RegExp();
	Object.defineProperty(beam,"regexp",{
		enumerable : true,
		get : function(){return regexp;},
	});

	var path = config.path || '';
	Object.defineProperty(beam,"path",{
		enumerable : true,
		get : function(){return path;},
		set : function(set){
			path = set.replace(/\/+/gi,'/').replace(/^\/|\/$/,'');
			var parts = path.split('/');
			var compose = [];
			var newargs = [];
			for(var i in parts){
				if(/^:/.test(parts[i])){
					var arg = parts[i].replace(/^:/,'');
					args.push(arg);
					compose.push("(?'"+arg+"'[^\\/]+)");
				} else if(/^\*:/.test(parts[i])){
					var arg = parts[i].replace(/^\*:/,'');
					args.push(arg);
					compose.push("(?:'"+arg+"'.*)");
				} else {
					compose.push(parts[i]);
				}
			}
			args = newargs;
			regexp = new RegExp('^'+compose.join('\\/')+'\\/?$','i');
		}
	});

	var method = new RegExp(config.method || 'get');
	Object.defineProperty(beam,"method",{
		enumerable : true,
		get : function(){return method;},
		set : function(set){
			method = new RegExp(set);
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

Beam.prototype.pathparams = function(gw){
	var beam = this;
	var matches = beam.pillar.regexps[beam.id].exec(gw.route).slice(1);
	var repoint = matches.length-beam.args.length;
	for(var i in beam.args){
		gw.params[beam.args[i]] = decodeURIComponent(matches[parseInt(i)+repoint] || '');
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