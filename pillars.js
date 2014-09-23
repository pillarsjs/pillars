
var paths = require('path');
var fs = require('fs');
var pillarsPackage = require('./package');
global.PILLARS = {
	package : pillarsPackage,
	version : pillarsPackage.version,
	path : function(path){
		var path = path || '';
		return paths.resolve(__dirname,path);
	},
	maxUploadSize : 10*1024*1024,
	maxGzipSize : 5*1024*1024,
	htmlErrors : true,
	requestIds : false,
	templatesCache : true,
	timeout: 10*1000
};

var textualization = require('./lib/textualization');
var t12n = textualization.t12n;
textualization.load(PILLARS.path('languages/pillars'));

var Pillar = require('./lib/Pillar');
var Beam = require('./lib/Beam');
var Gangway = require('./lib/Gangway');
var App = require('./lib/App');

var modelator = require('./lib/modelator');
var renderer = require('./lib/renderer');
var precasts = require('./lib/precasts');

renderer
	.preload(PILLARS.path('templates/crud.jade'))
	.preload(PILLARS.path('templates/login.jade'))
;

var errorsTemplate;
Object.defineProperty(PILLARS,"errorsTemplate",{
	enumerable : true,
	get : function(){return errorsTemplate;},
	set : function(set){
		errorsTemplate = set;
		renderer.preload(PILLARS.errorsTemplate);
	}
});
PILLARS.errorsTemplate = paths.resolve(__dirname,'templates/error.jade');

var staticTemplate;
Object.defineProperty(PILLARS,"staticTemplate",{
	enumerable : true,
	get : function(){return staticTemplate;},
	set : function(set){
		staticTemplate = set;
		renderer.preload(PILLARS.staticTemplate);
	}
});
PILLARS.staticTemplate = paths.resolve(__dirname,'templates/static.jade');

var uploadsDirectory;
Object.defineProperty(PILLARS,"uploadsDirectory",{
	enumerable : true,
	get : function(){return uploadsDirectory;},
	set : function(set){
		fs.stat(set, function(error, stats){
			if(error){
				console.log(t12n('env.uploadsDirectory.error',{path:set}));
			} else {
				uploadsDirectory = set;
				console.log(t12n('env.uploadsDirectory.ok',{path:set}));
			}
		});
	}
});

var tempDirectory;
Object.defineProperty(PILLARS,"tempDirectory",{
	enumerable : true,
	get : function(){return tempDirectory;},
	set : function(set){
		fs.stat(set, function(error, stats){
			if(error){
				console.log(t12n('env.tempDirectory.error',{path:set}));
			} else {
				tempDirectory = set;
				console.log(t12n('env.tempDirectory.ok',{path:set}));
			}
		});
	}
});

module.exports = new Pillars();
function Pillars(){
	var pillars = this;

	pillars.App = App;
	pillars.Pillar = Pillar;
	pillars.Beam = Beam;
	pillars.Gangway = Gangway;

	pillars.textualization = textualization;
	pillars.t12n = t12n;
	pillars.modelator = modelator;
	pillars.renderer = renderer;
	pillars.precasts = precasts;

	pillars.global = function(){
		global.App = App;
		global.Pillar = Pillar;
		global.Beam = Beam;
		global.Gangway = Gangway;

		global.textualization = textualization;
		global.t12n = t12n;
		global.modelator = modelator;
		global.renderer = renderer;
		global.precasts = precasts;

		return pillars;
	}

	pillars.configure = function(config){
		var values = ['uploadsDirectory','tempDirectory','maxUploadSize','maxGzipSize','htmlErrors','templatesCache','errorsTemplate','staticTemplate','timeout'];
		var config = config || {};
		for(var i in config){
			if(values.indexOf(i)>=0){
				PILLARS[i] = config[i];
				console.log(t12n('config.ok',{prop:i,value:config[i]}));
			} else {
				console.log(t12n('config.unknow',{prop:i,value:config[i]}));
			}
		}
		return pillars;
	}

}