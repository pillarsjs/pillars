
var util = require('util');

module.exports = Beam;
function Beam(id,path,config){
	var beam = this;
	var pillar = null;
	var id = id.toString();
	var regexp = '';
	var args = [];
	var path = path || '/';

	var config = config || {};
	config.method = config.method || 'get';
	config.session = config.session || false;
	config.upload = config.upload || false;
	config.maxlength = config.maxlength || 10*1024*1024;
	config.template = config.template || '';

	var midleware = [];
	var midleware = Array.prototype.slice.call(arguments).slice(3);
	var handler = midleware.pop();
	var allcalls = midleware.concat(handler);

	this.getConfig = function(){
		return config;
	}
	this.getPath = function(){
		if(path=="/"){return "";}
		return "/"+path.replace(/(^\/|\/$)/,'');
	}
	this.makeLink = function(params){
		var link = this.getPath();
		for(var i in params){
			link = link.replace(/\/:[^\/]+/i,'/'+params[i]);
		}
		return link;
	}
	this.getRegexp = function(){
		var pillarpath = pillar.getPath().split('/').join('\\/');
		var beampath = this.getPath().slice(1).split('/');
		if(this.getPath()==''){
			regexp = "";
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
		regexp = '^('+config.method+')\\+('+pillar.getProt()+'):\\/\\/'+pillar.getHost()+pillarpath+regexp+'\\/?$';
		regexp = new RegExp(regexp,'i');
		console.log("New regexp path: "+regexp);
		return regexp;
	}
	this.parseArgs = function(gw){
		var repoint = gw.pathMatchs.length-args.length;
		for(var i in args){
			gw.params[args[i]] = gw.pathMatchs[parseInt(i)+repoint] || undefined;
		}
	}

	this.launch = function(gw,callback){
		try {
			var nexting = new Nexting(gw,allcalls,callback);
			nexting.ini();
		} catch(error){
			gw.error(500,'Internal Server Error',error);
		}
	}

	this.single = function(gw,callback){
		try {
			handler.call(gw,callback);
		} catch(error){
			gw.error(500,'Internal Server Error',error);
		}
	}

	this.getId = function(){return id;}
	this.setPillar = function(_pillar){pillar = _pillar;console.log('Beam up to pillar!');return beam;}
	this.getPillar = function(){return pillar;}
	this.status = function(){
		return {
			id:id,
			path:path,
			regexp:regexp,
			args:args,
			pillar:pillar,
			handler:handler,
			midleware:midleware,
			config:config
		};
	}
}

function Nexting(gw,midleware,callback){
	var midleware = midleware.slice();
	var callback = callback || false;
	var launch = function nexting(){
		var next = midleware.shift();
		if(next){
			next.call(gw,launch);
		} else if(callback) {
			callback.call(gw);
		}
	}
	this.ini = launch;
}